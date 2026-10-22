//! Windows toast notifications for the Tauri build.
//!
//! The Electron build talks to the `UserNotificationListener` WinRT API
//! through a small PowerShell bridge. We reuse the very same script here and
//! keep the resulting notifications in a native registry that mirrors the
//! Electron notification engine (active / snoozed / history / dismissed).

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Mutex;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use tauri::{Emitter, Manager};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct Notification {
    pub id: String,
    pub application_name: String,
    pub application_id: String,
    pub title: String,
    pub body: String,
    pub icon: String,
    pub timestamp: u64,
    pub url: String,
    pub group_id: String,
    pub priority: String,
    pub reviewed: bool,
    pub is_call: bool,
}

#[derive(Default)]
struct Registry {
    active: Vec<Notification>,
    history: Vec<Notification>,
    snoozed: Vec<(Notification, u64)>,
    recent_dismissals: Vec<Notification>,
    dismissed_ids: HashSet<String>,
    hide_previews: bool,
    excluded_apps: Vec<String>,
}

pub struct NotificationEngine {
    registry: Mutex<Registry>,
}

impl Default for NotificationEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl NotificationEngine {
    pub fn new() -> Self {
        Self {
            registry: Mutex::new(Registry::default()),
        }
    }

    fn now() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }

    /// Replace the active list with a freshly polled one.
    pub fn ingest(&self, incoming: Vec<Notification>) {
        let mut registry = self.registry.lock().unwrap();
        let mut known: HashSet<String> = HashSet::new();
        let mut next: Vec<Notification> = Vec::new();

        for mut item in incoming {
            if registry.excluded_apps
                .iter()
                .any(|excluded| excluded.eq_ignore_ascii_case(&item.application_name))
            {
                continue;
            }
            known.insert(item.id.clone());
            // Keep the reviewed flag of an already known notification.
            if let Some(existing) = registry.active.iter().find(|n| n.id == item.id) {
                item.reviewed = existing.reviewed;
            }
            next.push(item);
        }

        // Notifications that vanished from the system move into the history.
        let previous: Vec<Notification> = registry.active.drain(..).collect();
        for old in previous {
            if !known.contains(&old.id) && !registry.dismissed_ids.contains(&old.id) {
                registry.history.insert(0, old);
            }
        }
        if registry.history.len() > 50 {
            registry.history.truncate(50);
        }

        registry.active = next;
    }

    pub fn get(&self, id: &str) -> Option<Notification> {
        let registry = self.registry.lock().unwrap();
        registry
            .active
            .iter()
            .find(|n| n.id == id)
            .cloned()
            .or_else(|| {
                registry
                    .history
                    .iter()
                    .find(|n| n.id == id)
                    .cloned()
            })
    }

    pub fn dismiss(&self, id: &str) -> bool {
        let mut registry = self.registry.lock().unwrap();
        let position = registry.active.iter().position(|n| n.id == id);
        let Some(position) = position else {
            return false;
        };
        let item = registry.active.remove(position);
        registry.recent_dismissals.insert(0, item);
        if registry.recent_dismissals.len() > 10 {
            registry.recent_dismissals.truncate(10);
        }
        registry.dismissed_ids.insert(id.to_string());
        true
    }

    pub fn dismiss_group(&self, group_id: &str) -> bool {
        let mut registry = self.registry.lock().unwrap();
        let ids: Vec<String> = registry
            .active
            .iter()
            .filter(|n| n.group_id == group_id)
            .map(|n| n.id.clone())
            .collect();
        let mut changed = false;
        for id in ids {
            if let Some(position) = registry.active.iter().position(|n| n.id == id) {
                let item = registry.active.remove(position);
                registry.recent_dismissals.insert(0, item);
                registry.dismissed_ids.insert(id);
                changed = true;
            }
        }
        changed
    }

    pub fn clear_all(&self) -> bool {
        let mut registry = self.registry.lock().unwrap();
        let count = registry.active.len();
        let items: Vec<Notification> = registry.active.drain(..).collect();
        for item in items {
            registry.dismissed_ids.insert(item.id.clone());
            registry.recent_dismissals.insert(0, item);
        }
        if registry.recent_dismissals.len() > 10 {
            registry.recent_dismissals.truncate(10);
        }
        count > 0
    }

    pub fn undo_dismiss(&self, id: &str) -> bool {
        let mut registry = self.registry.lock().unwrap();
        let position = registry.recent_dismissals.iter().position(|n| n.id == id);
        let Some(position) = position else {
            return false;
        };
        let item = registry.recent_dismissals.remove(position);
        registry.dismissed_ids.remove(id);
        registry.active.insert(0, item);
        true
    }

    pub fn mark_reviewed(&self, id: &str) -> bool {
        let mut registry = self.registry.lock().unwrap();
        for item in registry.active.iter_mut() {
            if item.id == id {
                item.reviewed = true;
                return true;
            }
        }
        false
    }

    pub fn mark_all_reviewed(&self) -> bool {
        let mut registry = self.registry.lock().unwrap();
        for item in registry.active.iter_mut() {
            item.reviewed = true;
        }
        true
    }

    pub fn set_hide_previews(&self, hide: bool) -> bool {
        let mut registry = self.registry.lock().unwrap();
        registry.hide_previews = hide;
        true
    }

    pub fn set_app_excluded(&self, app_name: &str, excluded: bool) -> bool {
        let mut registry = self.registry.lock().unwrap();
        if excluded {
            if !registry
                .excluded_apps
                .iter()
                .any(|name| name.eq_ignore_ascii_case(app_name))
            {
                registry.excluded_apps.push(app_name.to_string());
            }
        } else {
            registry
                .excluded_apps
                .retain(|name| !name.eq_ignore_ascii_case(app_name));
        }
        // Drop everything from a now excluded app.
        registry
            .active
            .retain(|item| !item.application_name.eq_ignore_ascii_case(app_name));
        true
    }

    pub fn snooze(&self, id: &str, duration_ms: u64, until_timestamp: Option<u64>) -> bool {
        let mut registry = self.registry.lock().unwrap();
        let position = registry.active.iter().position(|n| n.id == id);
        if let Some(position) = position {
            let item = registry.active.remove(position);
            let until = until_timestamp.unwrap_or_else(|| Self::now() + duration_ms);
            registry.snoozed.insert(0, (item, until));
            return true;
        }
        false
    }

    pub fn cancel_snooze(&self, id: &str) -> bool {
        let mut registry = self.registry.lock().unwrap();
        let position = registry.snoozed.iter().position(|(n, _)| n.id == id);
        if let Some(position) = position {
            let (item, _) = registry.snoozed.remove(position);
            registry.active.insert(0, item);
            return true;
        }
        false
    }

    pub fn clear_history(&self) -> bool {
        let mut registry = self.registry.lock().unwrap();
        registry.history.clear();
        true
    }

    /// The snapshot shape the React UI expects (Electron parity).
    pub fn snapshot(&self) -> serde_json::Value {
        let mut registry = self.registry.lock().unwrap();

        // Wake up snoozed notifications whose timer expired.
        let now = Self::now();
        let mut woken: Vec<Notification> = Vec::new();
        registry.snoozed.retain(|(item, until)| {
            if *until <= now {
                woken.push(item.clone());
                false
            } else {
                true
            }
        });
        for item in woken {
            registry.active.insert(0, item);
        }

        let hide_previews = registry.hide_previews;
        let excluded_apps = registry.excluded_apps.clone();

        let decorate = |item: &Notification| {
            serde_json::json!({
                "id": item.id,
                "sourceNotificationId": item.id,
                "applicationName": item.application_name,
                "applicationId": item.application_id,
                "title": if hide_previews { String::new() } else { item.title.clone() },
                "body": if hide_previews {
                    String::from("Notification hidden")
                } else {
                    item.body.clone()
                },
                "applicationIcon": item.icon,
                "icon": item.icon,
                "timestamp": item.timestamp,
                "url": item.url,
                "groupId": item.group_id,
                "priority": item.priority,
                "reviewed": item.reviewed,
                "isCall": item.is_call
            })
        };

        let active: Vec<serde_json::Value> = registry.active.iter().map(decorate).collect();
        let history: Vec<serde_json::Value> = registry.history.iter().map(decorate).collect();
        let snoozed: Vec<serde_json::Value> = registry
            .snoozed
            .iter()
            .map(|(item, until)| {
                let mut value = decorate(item);
                if let Some(map) = value.as_object_mut() {
                    map.insert("untilTimestamp".into(), serde_json::json!(until));
                }
                value
            })
            .collect();
        let recent_dismissals: Vec<serde_json::Value> = registry
            .recent_dismissals
            .iter()
            .map(decorate)
            .collect();

        // Group notifications by application.
        let mut groups: Vec<serde_json::Value> = Vec::new();
        for item in &registry.active {
            let group_id = if item.group_id.is_empty() {
                item.application_id.clone()
            } else {
                item.group_id.clone()
            };
            match groups
                .iter_mut()
                .find(|g| g.get("id").and_then(|v| v.as_str()) == Some(group_id.as_str()))
            {
                Some(group) => {
                    if let Some(items) = group.get_mut("items").and_then(|v| v.as_array_mut()) {
                        items.push(decorate(item));
                    }
                    if let Some(count) = group.get("count").and_then(|v| v.as_u64()) {
                        group["count"] = serde_json::json!(count + 1);
                    }
                }
                None => {
                    groups.push(serde_json::json!({
                        "id": group_id,
                        "applicationName": item.application_name,
                        "applicationId": item.application_id,
                        "count": 1,
                        "items": [decorate(item)]
                    }));
                }
            }
        }

        let total_active = registry.active.len();
        let unreviewed = registry.active.iter().filter(|n| !n.reviewed).count();
        let critical = registry
            .active
            .iter()
            .filter(|n| n.priority.eq_ignore_ascii_case("critical"))
            .count();

        serde_json::json!({
            "active": active,
            "standalone": [],
            "groups": groups,
            "snoozed": snoozed,
            "history": history,
            "recentDismissals": recent_dismissals,
            "lowPrioritySummary": { "count": 0, "items": [] },
            "incomingCall": serde_json::Value::Null,
            "settings": { "hidePreviews": hide_previews, "excludedApps": excluded_apps },
            "stats": {
                "totalActive": total_active,
                "unreviewedCount": unreviewed,
                "snoozedCount": registry.snoozed.len(),
                "criticalCount": critical,
                "historyCount": registry.history.len(),
                "hasUndo": !registry.recent_dismissals.is_empty()
            }
        })
    }
}

// -------------------------------------------------------------
// Listener (PowerShell WinRT bridge)
// -------------------------------------------------------------

fn script_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    let path = dir.join("list-notifications.ps1");
    if !path.exists() {
        std::fs::write(&path, include_str!("../scripts/list-notifications.ps1")).ok()?;
    }
    Some(path)
}

/// Poll the Windows notification listener and keep the registry up to date.
pub fn start_notification_watcher(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(1500));

        loop {
            let Some(script) = script_path(&app) else {
                std::thread::sleep(std::time::Duration::from_secs(5));
                continue;
            };

            let output = std::process::Command::new("powershell")
                .args([
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    &script.to_string_lossy(),
                ])
                .creation_flags(0x08000000)
                .output();

            if let Ok(output) = output {
                let text = String::from_utf8_lossy(&output.stdout);
                let trimmed = text.trim();
                if !trimmed.is_empty() && trimmed != "[]" {
                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                        let items = match value {
                            serde_json::Value::Array(items) => items,
                            other => vec![other],
                        };
                        let mut parsed: Vec<Notification> = Vec::new();
                        for item in items {
                            let Some(object) = item.as_object() else {
                                continue;
                            };
                            let get = |key: &str| {
                                object
                                    .get(key)
                                    .and_then(|v| v.as_str())
                                    .unwrap_or_default()
                                    .to_string()
                            };
                            let id = get("Id");
                            if id.is_empty() {
                                continue;
                            }
                            let application_name = get("AppName");
                            let title = get("Title");
                            let body = get("Body");
                            let is_call = detect_call(&application_name, &title, &body);
                            parsed.push(Notification {
                                id: format!("windows-notification-listener-{}", id),
                                application_name,
                                application_id: get("AppId"),
                                title,
                                body,
                                icon: get("Icon"),
                                timestamp: std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .map(|d| d.as_millis() as u64)
                                    .unwrap_or(0),
                                url: String::new(),
                                group_id: String::new(),
                                priority: if is_call { "high".into() } else { "normal".into() },
                                reviewed: false,
                                is_call,
                            });
                        }

                        if let Some(state) = app.try_state::<crate::AppState>() {
                            state.notifications.ingest(parsed);
                            let snapshot = state.notifications.snapshot();
                            let _ = app.emit("notification:update", snapshot);
                        }
                    }
                }
            }

            std::thread::sleep(std::time::Duration::from_millis(2500));
        }
    });
}

/// Very small call detection (WhatsApp / Telegram / Discord …).
fn detect_call(app_name: &str, title: &str, body: &str) -> bool {
    let combined = format!("{} {} {}", app_name, title, body).to_ascii_lowercase();
    for needle in ["whatsapp", "telegram", "discord", "signal", "messenger", "teams", "zoom"] {
        if combined.contains(needle) {
            return true;
        }
    }
    let lowered = title.to_ascii_lowercase();
    ["incoming call", "missed call", "calling", "ringing"].iter().any(|n| lowered.contains(n))
}
