use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use serde::{Deserialize, Serialize};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};

mod native;
mod notifications;
mod updater;

// -------------------------------------------------------------
// Data Structures
// -------------------------------------------------------------

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemMetrics {
    pub cpu: f32,
    pub ram: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MediaInfo {
    pub name: String,
    pub artist: String,
    pub album: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artwork_url: Option<String>,
    pub state: String,
    pub source: String,
    pub position: f64,
    pub duration: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClipboardItem {
    pub id: String,
    pub text: String,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JarvisResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JarvisConfig {
    pub enabled: bool,
    pub endpoint: String,
    pub timeout_seconds: u32,
    pub auto_speak: bool,
    pub auto_collapse: bool,
    pub collapse_delay: u32,
    pub auto_start_server: bool,
}

impl Default for JarvisConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            endpoint: "http://127.0.0.1:8765/api/process".into(),
            timeout_seconds: 45,
            auto_speak: true,
            auto_collapse: true,
            collapse_delay: 8,
            auto_start_server: false,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ObstructionPayload {
    #[serde(rename = "isObstructed")]
    pub is_obstructed: bool,
    pub obstructed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BluetoothStatus {
    pub connected: bool,
    pub devices: Vec<String>,
}

// -------------------------------------------------------------
// State Management
// -------------------------------------------------------------

pub struct AppState {
    pub sysinfo: Mutex<sysinfo::System>,
    pub clipboard_history: Mutex<Vec<ClipboardItem>>,
    pub jarvis_config: Mutex<JarvisConfig>,
    pub hitbox_width: std::sync::atomic::AtomicI32,
    pub hitbox_height: std::sync::atomic::AtomicI32,
    /// Horizontal anchor of the notch inside the window (CSS pixels).
    pub hitbox_anchor_x: Mutex<Option<f64>>,
    /// Persisted settings shared between the notch and the settings window.
    pub settings: Mutex<serde_json::Value>,
    pub audio: native::AudioHelper,
    pub updater: updater::Updater,
    pub notifications: notifications::NotificationEngine,
    pub launcher_catalog: Mutex<Vec<native::AppEntry>>,
    /// Last clipboard text the app itself has written (dedupe for the watcher).
    pub last_clipboard_text: Mutex<String>,
}

// -------------------------------------------------------------
// Settings store (shared between the notch + settings window)
// -------------------------------------------------------------

fn settings_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("quick-pill-settings.json"))
}

fn load_settings(app: &tauri::AppHandle) -> serde_json::Value {
    let Some(path) = settings_path(app) else {
        return serde_json::json!({});
    };
    std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_else(|| serde_json::json!({}))
}

fn save_settings(app: &tauri::AppHandle, value: &serde_json::Value) {
    let Some(path) = settings_path(app) else {
        return;
    };
    if let Ok(raw) = serde_json::to_string_pretty(value) {
        let _ = std::fs::write(path, raw);
    }
}

// -------------------------------------------------------------
// Native Hitbox & Window Mouse Pass-Through Commands
// -------------------------------------------------------------

#[tauri::command]
fn set_notch_hitbox(
    state: tauri::State<AppState>,
    width: i32,
    height: i32,
    _expanded: Option<bool>,
    anchor_x: Option<f64>,
) -> Result<(), String> {
    state.hitbox_width.store(width, std::sync::atomic::Ordering::Relaxed);
    state.hitbox_height.store(height, std::sync::atomic::Ordering::Relaxed);
    *state.hitbox_anchor_x.lock().unwrap() = anchor_x;
    Ok(())
}

#[tauri::command]
fn set_ignore_mouse_events(
    window: tauri::WebviewWindow,
    ignore: bool,
    _forward: Option<bool>,
) -> Result<(), String> {
    window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_window_position(
    window: tauri::WebviewWindow,
    x_perc: f64,
    y_px: f64,
) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let win_size = window
            .outer_size()
            .unwrap_or(tauri::PhysicalSize::new((520.0 * scale) as u32, (165.0 * scale) as u32));
        let x = ((size.width as f64 - win_size.width as f64) * (x_perc / 100.0)) as i32;
        let y = (y_px * scale) as i32;
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
    }
    Ok(())
}

// -------------------------------------------------------------
// Memory trimming
// -------------------------------------------------------------

#[tauri::command]
fn trim_memory() {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::System::ProcessStatus::EmptyWorkingSet;
        use windows::Win32::System::Threading::{GetCurrentProcess, SetProcessWorkingSetSize};
        let handle = GetCurrentProcess();
        let _ = EmptyWorkingSet(handle);
        let _ = SetProcessWorkingSetSize(handle, usize::MAX, usize::MAX);
    }
}

// -------------------------------------------------------------
// System stats & battery
// -------------------------------------------------------------

#[tauri::command]
fn get_system_metrics(state: tauri::State<AppState>) -> SystemMetrics {
    let mut sys = state.sysinfo.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu = sys.global_cpu_usage();
    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let ram = if total_mem > 0 {
        ((used_mem as f64 / total_mem as f64) * 100.0) as u32
    } else {
        0
    };

    SystemMetrics { cpu, ram }
}

#[tauri::command]
fn get_battery_status() -> serde_json::Value {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};
        let mut sps = SYSTEM_POWER_STATUS::default();
        if GetSystemPowerStatus(&mut sps).is_ok() {
            let percent = if sps.BatteryLifePercent != 255 {
                sps.BatteryLifePercent as u32
            } else {
                100
            };
            let charging = sps.ACLineStatus == 1;
            return serde_json::json!({
                "percent": percent,
                "charging": charging,
                "hasBattery": sps.BatteryLifePercent != 255
            });
        }
    }
    serde_json::json!({ "percent": 100, "charging": true, "hasBattery": false })
}

// -------------------------------------------------------------
// Media session (GSMTC) - album art included
// -------------------------------------------------------------

fn media_script_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    let path = dir.join("get-media.ps1");
    if !path.exists() {
        std::fs::write(&path, include_str!("../scripts/get-media.ps1")).ok()?;
    }
    Some(path)
}

#[tauri::command]
async fn get_system_media(app: tauri::AppHandle) -> Option<MediaInfo> {
    // The PowerShell WinRT bridge returns the album art as a base64 data URI,
    // which the Rust GSMTC implementation cannot provide.
    if let Some(script) = media_script_path(&app) {
        if let Ok(output) = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                &script.to_string_lossy(),
            ])
            .creation_flags(0x08000000)
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            let trimmed = text.trim();
            if !trimmed.is_empty() && trimmed != "null" && trimmed != "'null'" {
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                    let title = value
                        .get("Title")
                        .and_then(|v| v.as_str())
                        .unwrap_or_default();
                    let artist = value
                        .get("Artist")
                        .and_then(|v| v.as_str())
                        .unwrap_or_default();
                    if !title.is_empty() || !artist.is_empty() {
                        return Some(MediaInfo {
                            name: if title.is_empty() {
                                "Unknown Title".into()
                            } else {
                                title.into()
                            },
                            artist: if artist.is_empty() {
                                "Unknown Artist".into()
                            } else {
                                artist.into()
                            },
                            album: value
                                .get("Album")
                                .and_then(|v| v.as_str())
                                .unwrap_or_default()
                                .into(),
                            artwork_url: value
                                .get("Artwork")
                                .and_then(|v| v.as_str())
                                .filter(|s| !s.is_empty())
                                .map(|s| s.to_string()),
                            state: match value.get("Status").and_then(|v| v.as_str()) {
                                Some("playing") => "playing".into(),
                                Some("paused") => "paused".into(),
                                _ => "stopped".into(),
                            },
                            source: value
                                .get("Source")
                                .and_then(|v| v.as_str())
                                .unwrap_or("System")
                                .into(),
                            position: value
                                .get("Position")
                                .and_then(|v| v.as_f64())
                                .unwrap_or(0.0),
                            duration: value
                                .get("Duration")
                                .and_then(|v| v.as_f64())
                                .unwrap_or(0.0),
                        });
                    }
                }
            }
        }
    }

    // Fallback: plain GSMTC through WinRT (no artwork).
    tokio::task::spawn_blocking(|| gsmtc_media_info())
        .await
        .unwrap_or(None)
}

fn gsmtc_media_info() -> Option<MediaInfo> {
    #[cfg(windows)]
    {
        use windows::Media::Control::{
            GlobalSystemMediaTransportControlsSessionManager,
            GlobalSystemMediaTransportControlsSessionPlaybackStatus,
        };

        let manager_op = GlobalSystemMediaTransportControlsSessionManager::RequestAsync().ok()?;
        let manager = manager_op.get().ok()?;
        let session = manager.GetCurrentSession().ok()?;
        let props_op = session.TryGetMediaPropertiesAsync().ok()?;
        let media_props = props_op.get().ok()?;
        let timeline = session.GetTimelineProperties().ok();
        let playback_info = session.GetPlaybackInfo().ok();

        let title = media_props.Title().ok()?.to_string();
        if title.is_empty() {
            return None;
        }
        let artist = media_props
            .Artist()
            .ok()
            .map(|s| s.to_string())
            .unwrap_or_default();
        let album = media_props
            .AlbumTitle()
            .ok()
            .map(|s| s.to_string())
            .unwrap_or_default();

        let state = match playback_info.and_then(|p| p.PlaybackStatus().ok()) {
            Some(GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing) => "playing",
            Some(GlobalSystemMediaTransportControlsSessionPlaybackStatus::Paused) => "paused",
            _ => "stopped",
        };

        let source = session
            .SourceAppUserModelId()
            .ok()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Media".into());

        let position = timeline
            .as_ref()
            .and_then(|t| t.Position().ok())
            .map(|p| p.Duration as f64 / 10_000_000.0)
            .unwrap_or(0.0);
        let duration = timeline
            .as_ref()
            .and_then(|t| t.EndTime().ok())
            .map(|p| p.Duration as f64 / 10_000_000.0)
            .unwrap_or(0.0);

        Some(MediaInfo {
            name: title,
            artist,
            album,
            artwork_url: None,
            state: state.to_string(),
            source,
            position,
            duration,
        })
    }
    #[cfg(not(windows))]
    {
        None
    }
}

#[tauri::command]
fn control_system_media(command: String, seek_sec: Option<f64>) -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

        let cmd = command.as_str();

        if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
            if let Ok(manager) = manager_op.get() {
                if let Ok(session) = manager.GetCurrentSession() {
                    match cmd {
                        "playPause" => {
                            let _ = session.TryTogglePlayPauseAsync();
                            return Ok(());
                        }
                        "play" => {
                            let _ = session.TryPlayAsync();
                            return Ok(());
                        }
                        "pause" => {
                            let _ = session.TryPauseAsync();
                            return Ok(());
                        }
                        "next" => {
                            let _ = session.TrySkipNextAsync();
                            return Ok(());
                        }
                        "previous" => {
                            let _ = session.TrySkipPreviousAsync();
                            return Ok(());
                        }
                        "seek" => {
                            if let Some(sec) = seek_sec {
                                let ticks = (sec * 10_000_000.0) as i64;
                                let _ = session.TryChangePlaybackPositionAsync(ticks);
                                return Ok(());
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        // Win32 keyboard fallback
        unsafe {
            use windows::Win32::UI::Input::KeyboardAndMouse::{
                keybd_event, KEYEVENTF_KEYUP, VK_MEDIA_NEXT_TRACK, VK_MEDIA_PLAY_PAUSE,
                VK_MEDIA_PREV_TRACK,
            };
            match cmd {
                "playPause" | "play" | "pause" => {
                    keybd_event(VK_MEDIA_PLAY_PAUSE.0 as u8, 0, Default::default(), 0);
                    keybd_event(VK_MEDIA_PLAY_PAUSE.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                }
                "next" => {
                    keybd_event(VK_MEDIA_NEXT_TRACK.0 as u8, 0, Default::default(), 0);
                    keybd_event(VK_MEDIA_NEXT_TRACK.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                }
                "previous" => {
                    keybd_event(VK_MEDIA_PREV_TRACK.0 as u8, 0, Default::default(), 0);
                    keybd_event(VK_MEDIA_PREV_TRACK.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                }
                _ => {}
            }
        }
    }
    Ok(())
}

// -------------------------------------------------------------
// JARVIS Local API Bridge
// -------------------------------------------------------------

fn jarvis_config_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("jarvis-config.json"))
}

#[tauri::command]
async fn ask_jarvis(
    state: tauri::State<'_, AppState>,
    endpoint: Option<String>,
    text: String,
) -> Result<JarvisResponse, String> {
    if text.trim().is_empty() {
        return Ok(JarvisResponse {
            success: false,
            response: None,
            raw: None,
            error: Some("Empty prompt provided.".into()),
        });
    }

    let config = { state.jarvis_config.lock().unwrap().clone() };

    if !config.enabled {
        return Ok(JarvisResponse {
            success: false,
            response: None,
            raw: None,
            error: Some("JARVIS integration is currently disabled in Settings.".into()),
        });
    }

    let target_endpoint = endpoint.unwrap_or(config.endpoint);
    let timeout = Duration::from_secs(config.timeout_seconds as u64);

    let client = match reqwest::Client::builder().timeout(timeout).build() {
        Ok(c) => c,
        Err(e) => {
            return Ok(JarvisResponse {
                success: false,
                response: None,
                raw: None,
                error: Some(format!("Failed to build HTTP client: {}", e)),
            })
        }
    };

    let payload = serde_json::json!({
        "text": text.trim(),
        "prompt": text.trim(),
        "audio_target": "laptop"
    });

    match client
        .post(&target_endpoint)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json, text/plain, */*")
        .json(&payload)
        .send()
        .await
    {
        Ok(res) => {
            if !res.status().is_success() {
                let status = res.status();
                let err_text = res.text().await.unwrap_or_default();
                return Ok(JarvisResponse {
                    success: false,
                    response: None,
                    raw: None,
                    error: Some(format!("JARVIS error {}: {}", status, err_text)),
                });
            }

            if let Ok(json) = res.json::<serde_json::Value>().await {
                let reply = json
                    .get("reply")
                    .or_else(|| json.get("response"))
                    .or_else(|| json.get("text"))
                    .or_else(|| json.get("message"))
                    .or_else(|| json.get("answer"))
                    .or_else(|| json.get("output"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| json.to_string());

                Ok(JarvisResponse {
                    success: true,
                    response: Some(reply),
                    raw: Some(json),
                    error: None,
                })
            } else {
                Ok(JarvisResponse {
                    success: true,
                    response: Some("Request completed.".into()),
                    raw: None,
                    error: None,
                })
            }
        }
        Err(e) => Ok(JarvisResponse {
            success: false,
            response: None,
            raw: None,
            error: Some(format!("JARVIS query failed: {}", e)),
        }),
    }
}

#[tauri::command]
fn get_jarvis_config(state: tauri::State<AppState>) -> JarvisConfig {
    state.jarvis_config.lock().unwrap().clone()
}

#[tauri::command]
fn set_jarvis_config(
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
    config: JarvisConfig,
) -> bool {
    {
        let mut guard = state.jarvis_config.lock().unwrap();
        *guard = config.clone();
    }
    // Persist so the settings window and the notch always agree.
    if let Some(path) = jarvis_config_path(&app) {
        if let Ok(raw) = serde_json::to_string_pretty(&config) {
            let _ = std::fs::write(path, raw);
        }
    }
    let _ = app.emit("jarvis:configUpdated", &config);
    true
}

#[tauri::command]
async fn test_jarvis_connection(endpoint: String) -> serde_json::Value {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build();

    if let Ok(client) = client {
        let res = client.get(&endpoint).send().await;
        match res {
            Ok(r) => serde_json::json!({ "success": r.status().is_success(), "status": r.status().as_u16() }),
            Err(e) => serde_json::json!({ "success": false, "error": e.to_string() }),
        }
    } else {
        serde_json::json!({ "success": false, "error": "Client build error" })
    }
}

/// Start the local JARVIS server (D:/JARVIS) when it is not running yet.
#[tauri::command]
fn launch_jarvis_server() -> serde_json::Value {
    let jarvis_dir = std::path::Path::new("D:/JARVIS");
    if !jarvis_dir.exists() {
        return serde_json::json!({
            "success": false,
            "message": "JARVIS was not found at D:/JARVIS"
        });
    }

    // Already running?
    if std::net::TcpStream::connect("127.0.0.1:8765").is_ok() {
        return serde_json::json!({
            "success": true,
            "message": "JARVIS server is already running"
        });
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let detached = 0x0000_0008u32 | 0x0800_0000u32; // DETACHED_PROCESS | CREATE_NO_WINDOW
        let candidates = [
            ("python", vec!["-m", "uvicorn", "main:app", "--port", "8765"]),
            ("py", vec!["-m", "uvicorn", "main:app", "--port", "8765"]),
        ];
        for (program, args) in candidates {
            let spawned = std::process::Command::new(program)
                .args(&args)
                .current_dir(jarvis_dir)
                .creation_flags(detached)
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn();
            if spawned.is_ok() {
                return serde_json::json!({
                    "success": true,
                    "message": "JARVIS server is starting"
                });
            }
        }
    }

    serde_json::json!({
        "success": false,
        "message": "Could not start the JARVIS server - start it manually on port 8765"
    })
}

#[tauri::command]
fn stop_jarvis_server() -> bool {
    // The JARVIS server owns its own lifecycle; we only report the state.
    let running = std::net::TcpStream::connect("127.0.0.1:8765").is_ok();
    if running {
        return false;
    }
    true
}

// -------------------------------------------------------------
// Settings window
// -------------------------------------------------------------

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }

    tauri::WebviewWindowBuilder::new(
        &app,
        "settings",
        tauri::WebviewUrl::App("index.html#settings".into()),
    )
    .title("Quick Pill Settings")
    .inner_size(800.0, 600.0)
    .min_inner_size(600.0, 450.0)
    .resizable(true)
    .decorations(true)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn close_settings_window(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.close();
    }
}

#[tauri::command]
fn minimize_settings_window(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.minimize();
    }
}

// -------------------------------------------------------------
// Clipboard (native arboard)
// -------------------------------------------------------------

#[tauri::command]
fn get_clipboard_text() -> String {
    if let Ok(mut cb) = arboard::Clipboard::new() {
        cb.get_text().unwrap_or_default()
    } else {
        String::new()
    }
}

#[tauri::command]
fn write_clipboard_text(state: tauri::State<AppState>, text: String) -> bool {
    if let Ok(mut cb) = arboard::Clipboard::new() {
        let ok = cb.set_text(text.clone()).is_ok();
        if ok {
            // Keep the watcher in sync so the entry is not duplicated.
            *state.last_clipboard_text.lock().unwrap() = text.trim().to_string();
        }
        ok
    } else {
        false
    }
}

#[tauri::command]
fn clear_clipboard(state: tauri::State<AppState>) -> bool {
    if let Ok(mut cb) = arboard::Clipboard::new() {
        let ok = cb.clear().is_ok();
        if ok {
            *state.last_clipboard_text.lock().unwrap() = String::new();
        }
        ok
    } else {
        false
    }
}

#[tauri::command]
fn get_clipboard_history(state: tauri::State<AppState>) -> Vec<ClipboardItem> {
    state.clipboard_history.lock().unwrap().clone()
}

// -------------------------------------------------------------
// Shell helpers
// -------------------------------------------------------------

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows::core::PCWSTR;
        use windows::Win32::UI::Shell::ShellExecuteW;
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

        let wide_url: Vec<u16> = OsStr::new(&url).encode_wide().chain(std::iter::once(0)).collect();
        let wide_op: Vec<u16> = OsStr::new("open").encode_wide().chain(std::iter::once(0)).collect();

        unsafe {
            let res = ShellExecuteW(
                None,
                PCWSTR(wide_op.as_ptr()),
                PCWSTR(wide_url.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SW_SHOWNORMAL,
            );
            if res.0 as usize <= 32 {
                return Err("Failed to open URL".into());
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn get_camera_status() -> bool {
    let output = std::process::Command::new("reg")
        .args([
            "query",
            "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam",
            "/s",
        ])
        .creation_flags(0x08000000)
        .output();

    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        text.contains("LastUsedTimeStop") && text.contains("0x0")
    } else {
        false
    }
}

#[tauri::command]
fn get_microphone_status() -> bool {
    let output = std::process::Command::new("reg")
        .args([
            "query",
            "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone",
            "/s",
        ])
        .creation_flags(0x08000000)
        .output();

    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        text.contains("LastUsedTimeStop") && text.contains("0x0")
    } else {
        false
    }
}

#[tauri::command]
fn get_bluetooth_status() -> BluetoothStatus {
    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "Get-PnpDevice -Class Bluetooth -Status OK -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FriendlyName",
        ])
        .creation_flags(0x08000000)
        .output();

    let devices = match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout)
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect::<Vec<String>>(),
        Err(_) => Vec::new(),
    };

    BluetoothStatus {
        connected: !devices.is_empty(),
        devices,
    }
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

// -------------------------------------------------------------
// Auto launch
// -------------------------------------------------------------

#[tauri::command]
fn set_auto_launch(enable: bool) -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_str = exe.to_string_lossy().to_string();
    if enable {
        let _ = std::process::Command::new("reg")
            .args([
                "add",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "QuickPill",
                "/t",
                "REG_SZ",
                "/d",
                &format!("\"{}\"", exe_str),
                "/f",
            ])
            .creation_flags(0x08000000)
            .output();
    } else {
        let _ = std::process::Command::new("reg")
            .args([
                "delete",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "QuickPill",
                "/f",
            ])
            .creation_flags(0x08000000)
            .output();
    }
    Ok(())
}

#[tauri::command]
fn get_auto_launch() -> bool {
    let output = std::process::Command::new("reg")
        .args([
            "query",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            "/v",
            "QuickPill",
        ])
        .creation_flags(0x08000000)
        .output();

    if let Ok(o) = output {
        o.status.success()
    } else {
        false
    }
}

// -------------------------------------------------------------
// Persisted settings (mascot mode, minimal notch, tabs, …)
// -------------------------------------------------------------

#[tauri::command]
fn get_app_settings(state: tauri::State<AppState>) -> serde_json::Value {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn get_app_setting(state: tauri::State<AppState>, key: String) -> serde_json::Value {
    state
        .settings
        .lock()
        .unwrap()
        .get(&key)
        .cloned()
        .unwrap_or(serde_json::Value::Null)
}

#[tauri::command]
fn set_app_setting(
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
    key: String,
    value: serde_json::Value,
) -> bool {
    {
        let mut settings = state.settings.lock().unwrap();
        if !settings.is_object() {
            *settings = serde_json::json!({});
        }
        settings[key.clone()] = value.clone();
        let snapshot = settings.clone();
        save_settings(&app, &snapshot);
    }
    let _ = app.emit(&format!("settings:{}:changed", key), &value);
    true
}

/// Flip a boolean setting and persist it (used by the tray menu).
fn toggle_setting(app: tauri::AppHandle, key: &str) -> bool {
    let Some(state) = app.try_state::<AppState>() else {
        return false;
    };
    let current = state
        .settings
        .lock()
        .unwrap()
        .get(key)
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let next = !current;
    {
        let mut settings = state.settings.lock().unwrap();
        settings[key.to_string()] = serde_json::Value::Bool(next);
        let snapshot = settings.clone();
        save_settings(&app, &snapshot);
    }
    next
}

// -------------------------------------------------------------
// Always on top
// -------------------------------------------------------------

#[tauri::command]
fn get_always_on_top(state: tauri::State<AppState>) -> bool {
    state
        .settings
        .lock()
        .unwrap()
        .get("alwaysOnTop")
        .and_then(|v| v.as_bool())
        .unwrap_or(true)
}

#[tauri::command]
fn set_always_on_top(
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
    enable: bool,
) -> bool {
    {
        let mut settings = state.settings.lock().unwrap();
        settings["alwaysOnTop"] = serde_json::Value::Bool(enable);
        let snapshot = settings.clone();
        save_settings(&app, &snapshot);
    }
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.set_always_on_top(enable);
    }
    let _ = app.emit("always-on-top-changed", enable);
    true
}

// -------------------------------------------------------------
// Displays
// -------------------------------------------------------------

#[tauri::command]
fn get_displays() -> serde_json::Value {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::{BOOL, LPARAM, RECT};
        use windows::Win32::Graphics::Gdi::{
            EnumDisplayMonitors, GetDC, GetMonitorInfoW, ReleaseDC, HMONITOR, MONITORINFO,
            MONITORINFOEXW,
        };

        let mut displays: Vec<serde_json::Value> = Vec::new();
        unsafe extern "system" fn callback(
            hmonitor: HMONITOR,
            _dc: windows::Win32::Graphics::Gdi::HDC,
            _rect: *mut RECT,
            data: LPARAM,
        ) -> BOOL {
            if data.0 == 0 {
                return BOOL(0);
            }
            let out = &mut *(data.0 as *mut Vec<serde_json::Value>);
            let mut info = MONITORINFOEXW::default();
            info.monitorInfo.cbSize = std::mem::size_of::<MONITORINFOEXW>() as u32;
            if GetMonitorInfoW(
                hmonitor,
                &mut info as *mut MONITORINFOEXW as *mut MONITORINFO,
            )
            .as_bool()
            {
                out.push(serde_json::json!({
                    "id": String::from_utf16_lossy(
                        &info.szDevice[..info.szDevice.iter().position(|c| *c == 0).unwrap_or(32)],
                    ),
                    "bounds": {
                        "x": info.monitorInfo.rcMonitor.left,
                        "y": info.monitorInfo.rcMonitor.top,
                        "width": info.monitorInfo.rcMonitor.right - info.monitorInfo.rcMonitor.left,
                        "height": info.monitorInfo.rcMonitor.bottom - info.monitorInfo.rcMonitor.top
                    }
                }));
            }
            BOOL(1)
        }

        unsafe {
            let dc = GetDC(None);
            let _ = EnumDisplayMonitors(
                dc,
                None,
                Some(callback),
                LPARAM(&mut displays as *mut Vec<serde_json::Value> as isize),
            );
            let _ = ReleaseDC(None, dc);
        }
        return serde_json::json!(displays);
    }
    #[cfg(not(windows))]
    {
        serde_json::json!([{ "id": "primary", "bounds": { "x": 0, "y": 0, "width": 1920, "height": 1080 } }])
    }
}

// -------------------------------------------------------------
// Audio mixer (native audio-helper.exe)
// -------------------------------------------------------------

#[tauri::command]
fn audio_mixer_get_devices(state: tauri::State<AppState>) -> serde_json::Value {
    match state.audio.send("listDevices", serde_json::json!({})) {
        Ok(value) => value,
        Err(error) => serde_json::json!({ "devices": [], "defaultDeviceId": "", "error": error }),
    }
}

#[tauri::command]
fn audio_mixer_get_sessions(
    state: tauri::State<AppState>,
    device_id: Option<String>,
) -> serde_json::Value {
    let params = serde_json::json!({ "deviceId": device_id.unwrap_or_default() });
    match state.audio.send("listSessions", params) {
        Ok(value) => value,
        Err(error) => serde_json::json!({ "sessions": [], "error": error }),
    }
}

#[tauri::command]
fn audio_mixer_set_volume(state: tauri::State<AppState>, payload: serde_json::Value) -> bool {
    state
        .audio
        .send("setSessionVolume", payload)
        .map(|value| {
            value
                .get("success")
                .and_then(|v| v.as_bool())
                .unwrap_or(true)
        })
        .unwrap_or(false)
}

#[tauri::command]
fn audio_mixer_set_mute(state: tauri::State<AppState>, payload: serde_json::Value) -> bool {
    state
        .audio
        .send("setSessionMute", payload)
        .map(|value| {
            value
                .get("success")
                .and_then(|v| v.as_bool())
                .unwrap_or(true)
        })
        .unwrap_or(false)
}

#[tauri::command]
fn audio_mixer_set_master_volume(state: tauri::State<AppState>, payload: serde_json::Value) -> bool {
    state
        .audio
        .send("setMasterVolume", payload)
        .map(|value| {
            value
                .get("success")
                .and_then(|v| v.as_bool())
                .unwrap_or(true)
        })
        .unwrap_or(false)
}

#[tauri::command]
fn audio_mixer_set_master_mute(state: tauri::State<AppState>, payload: serde_json::Value) -> bool {
    state
        .audio
        .send("setMasterMute", payload)
        .map(|value| {
            value
                .get("success")
                .and_then(|v| v.as_bool())
                .unwrap_or(true)
        })
        .unwrap_or(false)
}

// -------------------------------------------------------------
// App launcher
// -------------------------------------------------------------

#[tauri::command]
fn launcher_search_apps(state: tauri::State<AppState>, query: Option<String>) -> serde_json::Value {
    let catalog = state.launcher_catalog.lock().unwrap();
    if catalog.is_empty() {
        drop(catalog);
        let scanned = native::scan_app_catalog();
        let mut catalog = state.launcher_catalog.lock().unwrap();
        *catalog = scanned;
    }
    let catalog = state.launcher_catalog.lock().unwrap();
    let results = native::filter_apps(&catalog, query.as_deref().unwrap_or_default());
    serde_json::to_value(results).unwrap_or(serde_json::json!([]))
}

#[tauri::command]
fn launcher_get_catalog(state: tauri::State<AppState>) -> serde_json::Value {
    let catalog = state.launcher_catalog.lock().unwrap();
    if catalog.is_empty() {
        drop(catalog);
        let scanned = native::scan_app_catalog();
        let mut catalog = state.launcher_catalog.lock().unwrap();
        *catalog = scanned;
    }
    let catalog = state.launcher_catalog.lock().unwrap();
    serde_json::to_value(&*catalog).unwrap_or(serde_json::json!([]))
}

#[tauri::command]
fn launcher_reindex_catalog(state: tauri::State<AppState>) -> serde_json::Value {
    let scanned = native::scan_app_catalog();
    let mut catalog = state.launcher_catalog.lock().unwrap();
    *catalog = scanned;
    serde_json::to_value(&*catalog).unwrap_or(serde_json::json!([]))
}

#[tauri::command]
fn launcher_get_running_windows() -> serde_json::Value {
    serde_json::to_value(native::list_running_windows()).unwrap_or(serde_json::json!([]))
}

#[tauri::command]
fn launcher_activate_window(hwnd: isize) -> bool {
    native::activate_window(hwnd)
}

#[tauri::command]
fn launcher_select_file() -> serde_json::Value {
    match native::pick_file("Select Application or Shortcut", &["exe", "lnk", "bat", "cmd"]) {
        Some(path) => {
            let name = std::path::Path::new(&path)
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            serde_json::json!({ "canceled": false, "filePath": path, "name": name })
        }
        None => serde_json::json!({ "canceled": true }),
    }
}

#[tauri::command]
fn launcher_launch_app(target: String) -> Result<(), String> {
    open_external(target)
}

#[tauri::command]
fn launcher_open_app(target_path: String) -> Result<(), String> {
    open_external(target_path)
}

#[tauri::command]
fn launcher_open_url(url: String) -> Result<(), String> {
    open_external(url)
}

// -------------------------------------------------------------
// File shelf
// -------------------------------------------------------------

#[tauri::command]
fn shelf_start_drag(file_path: String) -> bool {
    // Windows has no native "drag out of a webview" in Tauri, so the file is
    // placed on the clipboard as CF_HDROP - it can be pasted into Explorer,
    // WhatsApp Desktop, Word, …
    native::copy_files_to_clipboard(&[file_path])
}

#[tauri::command]
fn shelf_cache_icon(file_path: String) -> Option<String> {
    native::file_icon_data_url(&file_path)
}

/// Metadata for a dropped file (the WebView cannot stat files itself).
#[tauri::command]
fn get_file_info(file_path: String) -> serde_json::Value {
    let path = std::path::Path::new(&file_path);
    let metadata = std::fs::metadata(path).ok();
    serde_json::json!({
        "name": path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
        "path": file_path,
        "size": metadata.as_ref().map(|m| m.len()).unwrap_or(0),
        "type": path.extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default(),
        "exists": metadata.is_some()
    })
}

// -------------------------------------------------------------
// Notifications (Windows toast listener)
// -------------------------------------------------------------

#[tauri::command]
fn notification_get_snapshot(state: tauri::State<AppState>) -> serde_json::Value {
    state.notifications.snapshot()
}

#[tauri::command]
fn notification_sync_now(state: tauri::State<AppState>) -> serde_json::Value {
    state.notifications.snapshot()
}

#[tauri::command]
fn notification_dismiss(state: tauri::State<AppState>, notification_id: String) -> bool {
    state.notifications.dismiss(&notification_id)
}

#[tauri::command]
fn notification_dismiss_group(state: tauri::State<AppState>, group_id: String) -> bool {
    state.notifications.dismiss_group(&group_id)
}

#[tauri::command]
fn notification_clear_all(state: tauri::State<AppState>) -> bool {
    state.notifications.clear_all()
}

#[tauri::command]
fn notification_undo_dismiss(state: tauri::State<AppState>, notification_id: String) -> bool {
    state.notifications.undo_dismiss(&notification_id)
}

#[tauri::command]
fn notification_mark_reviewed(state: tauri::State<AppState>, notification_id: String) -> bool {
    state.notifications.mark_reviewed(&notification_id)
}

#[tauri::command]
fn notification_mark_all_reviewed(state: tauri::State<AppState>) -> bool {
    state.notifications.mark_all_reviewed()
}

#[tauri::command]
fn notification_set_hide_previews(state: tauri::State<AppState>, hide: bool) -> bool {
    state.notifications.set_hide_previews(hide)
}

#[tauri::command]
fn notification_set_app_excluded(
    state: tauri::State<AppState>,
    app_name: String,
    excluded: bool,
) -> bool {
    state.notifications.set_app_excluded(&app_name, excluded)
}

#[tauri::command]
fn notification_snooze(
    state: tauri::State<AppState>,
    notification_id: String,
    duration_ms: u64,
    until_timestamp: Option<u64>,
) -> bool {
    state
        .notifications
        .snooze(&notification_id, duration_ms, until_timestamp)
}

#[tauri::command]
fn notification_cancel_snooze(state: tauri::State<AppState>, notification_id: String) -> bool {
    state.notifications.cancel_snooze(&notification_id)
}

#[tauri::command]
fn notification_clear_history(state: tauri::State<AppState>) -> bool {
    state.notifications.clear_history()
}

#[tauri::command]
fn notification_execute_action(
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
    notification_id: String,
    action_type: String,
) -> serde_json::Value {
    let notification = state.notifications.get(&notification_id);
    match action_type.as_str() {
        "dismiss" => {
            state.notifications.dismiss(&notification_id);
            serde_json::json!({ "success": true })
        }
        "activate" | "open" => {
            if let Some(item) = notification {
                let url = item.url.clone();
                if !url.is_empty() {
                    let _ = open_external(url);
                } else {
                    let _ = open_external(item.application_id.clone());
                }
                state.notifications.mark_reviewed(&notification_id);
            }
            let _ = app.emit("launcher:window-activated", &serde_json::json!({}));
            serde_json::json!({ "success": true })
        }
        _ => serde_json::json!({ "success": false, "error": "unknown action" }),
    }
}

#[tauri::command]
fn focus_notification_app(app_id: String, app_name: String) -> bool {
    if app_id.is_empty() && app_name.is_empty() {
        return false;
    }
    if app_id.contains('!') {
        let target = format!("shell:AppsFolder\\{}", app_id);
        let _ = open_external(target);
        return true;
    }
    let _ = open_external(if app_id.is_empty() {
        app_name
    } else {
        app_id
    });
    true
}

#[tauri::command]
fn open_notification_target(payload: serde_json::Value) -> bool {
    let url = payload
        .get("url")
        .and_then(|v| v.as_str())
        .unwrap_or_default()
        .to_string();
    if !url.is_empty() {
        return open_external(url).is_ok();
    }
    let app_id = payload
        .get("appId")
        .and_then(|v| v.as_str())
        .unwrap_or_default()
        .to_string();
    let app_name = payload
        .get("appName")
        .and_then(|v| v.as_str())
        .unwrap_or_default()
        .to_string();
    focus_notification_app(app_id, app_name)
}

#[tauri::command]
fn dismiss_latest_notification(app: tauri::AppHandle, state: tauri::State<AppState>) -> bool {
    // Mirrors the Electron "swipe up the newest notification" shortcut.
    let snapshot = state.notifications.snapshot();
    if let Some(active) = snapshot.get("active").and_then(|v| v.as_array()) {
        if let Some(newest) = active.last() {
            if let Some(id) = newest.get("id").and_then(|v| v.as_str()) {
                state.notifications.dismiss(id);
                let _ = app.emit("notification:update", state.notifications.snapshot());
                return true;
            }
        }
    }
    false
}

// -------------------------------------------------------------
// Logging (Electron parity - the renderer writes into a log file)
// -------------------------------------------------------------

fn log_file_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_data_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("quick-pill.log"))
}

fn write_log(app: &tauri::AppHandle, line: &str) {
    let Some(path) = log_file_path(app) else {
        return;
    };
    use std::io::Write;
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
    {
        let _ = writeln!(file, "{}", line);
    }
}

#[tauri::command]
fn log_message(app: tauri::AppHandle, level: String, msg: String, details: Option<String>) {
    let stamp = chrono_stamp();
    let extra = details.unwrap_or_default();
    write_log(
        &app,
        &format!("[{}] [{}] {} {}", stamp, level, msg, extra),
    );
}

#[tauri::command]
fn log_renderer_error(app: tauri::AppHandle, error_data: serde_json::Value) {
    let stamp = chrono_stamp();
    write_log(
        &app,
        &format!("[{}] [RENDERER ERROR] {}", stamp, error_data),
    );
}

/// A tiny ISO-ish timestamp without pulling in the chrono crate.
fn chrono_stamp() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let total = now.as_secs();
    let millis = now.subsec_millis();
    let days = total / 86_400;
    let secs_of_day = total % 86_400;
    let (year, month, day) = civil_from_days(days as i64);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        year,
        month,
        day,
        secs_of_day / 3600,
        (secs_of_day % 3600) / 60,
        secs_of_day % 60,
        millis
    )
}

/// Convert days since the Unix epoch into a calendar date.
fn civil_from_days(days: i64) -> (i64, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}

// -------------------------------------------------------------
// Updater
// -------------------------------------------------------------

#[tauri::command]
async fn check_for_updates(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let version = get_app_version(app.clone());
    match state.updater.check(&version).await {
        Ok(Some(manifest)) => Ok(serde_json::json!({
            "updateAvailable": true,
            "version": manifest.version,
            "name": manifest.name,
            "changelog": manifest.changelog,
            "mandatory": manifest.mandatory
        })),
        Ok(None) => Ok(serde_json::json!({ "updateAvailable": false })),
        Err(error) => Ok(serde_json::json!({ "updateAvailable": false, "error": error })),
    }
}

#[tauri::command]
async fn start_update_download(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let snapshot = state.updater.snapshot();
    let Some(manifest) = snapshot.update_info.clone() else {
        return Ok(serde_json::json!({ "success": false, "error": "no update available" }));
    };

    let updater = state.updater.clone();
    let result = updater.download(&manifest).await;

    match result {
        Ok(path) => {
            let _ = app.emit("update-event", serde_json::json!({ "status": "downloaded" }));
            Ok(serde_json::json!({ "success": true, "path": path.to_string_lossy() }))
        }
        Err(error) => Ok(serde_json::json!({ "success": false, "error": error })),
    }
}

#[tauri::command]
fn cancel_update_download(state: tauri::State<AppState>) -> bool {
    state.updater.cancel_download();
    true
}

#[tauri::command]
fn install_update(app: tauri::AppHandle, state: tauri::State<AppState>) -> bool {
    match state.updater.install() {
        Ok(()) => {
            // Give the installer a moment, then close the app.
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(900));
                app.exit(0);
            });
            true
        }
        Err(_) => false,
    }
}

#[tauri::command]
fn get_updater_state(state: tauri::State<AppState>) -> serde_json::Value {
    serde_json::to_value(state.updater.snapshot()).unwrap_or(serde_json::json!({}))
}

#[tauri::command]
fn get_auto_download_install(state: tauri::State<AppState>) -> bool {
    state
        .settings
        .lock()
        .unwrap()
        .get("autoDownloadInstall")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

#[tauri::command]
fn set_auto_download_install(
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
    enable: bool,
) -> bool {
    {
        let mut settings = state.settings.lock().unwrap();
        settings["autoDownloadInstall"] = serde_json::Value::Bool(enable);
        let snapshot = settings.clone();
        save_settings(&app, &snapshot);
    }
    true
}

// -------------------------------------------------------------
// Global shortcuts
// -------------------------------------------------------------

/// The default global hotkeys (Electron parity).
fn default_tab_shortcuts() -> serde_json::Value {
    serde_json::json!({
        "0": "Alt+B",
        "1": "Alt+W",
        "2": "Alt+O",
        "3": "Alt+M",
        "4": "Alt+C",
        "5": "Alt+N",
        "6": "Alt+G",
        "7": "Alt+V",
        "8": "Alt+T",
        "10": "Alt+R",
        "11": "Alt+H",
        "12": "Alt+A",
        "13": "Alt+P",
        "14": "Alt+L",
        "15": "Alt+Q",
        "16": "Alt+I",
        "minimal-notch": "Alt+Shift+M",
        "dismiss-notification": "Alt+Shift+D"
    })
}

/// The stored shortcuts merged with the defaults.
fn merged_tab_shortcuts(state: &AppState) -> serde_json::Value {
    let defaults = default_tab_shortcuts();
    let mut map = defaults.as_object().cloned().unwrap_or_default();
    if let Some(stored) = state
        .settings
        .lock()
        .unwrap()
        .get("tabShortcuts")
        .and_then(|v| v.as_object())
    {
        for (key, value) in stored {
            if let Some(accel) = value.as_str() {
                if !accel.trim().is_empty() {
                    map.insert(key.clone(), serde_json::Value::String(accel.trim().to_string()));
                }
            }
        }
    }
    serde_json::Value::Object(map)
}

#[tauri::command]
fn get_tab_shortcuts(state: tauri::State<AppState>) -> serde_json::Value {
    merged_tab_shortcuts(&state)
}

#[tauri::command]
fn set_tab_shortcuts(
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
    shortcuts: serde_json::Value,
) -> serde_json::Value {
    // Ctrl stays reserved for the click-through mode.
    let mut sanitized = serde_json::Map::new();
    if let Some(object) = shortcuts.as_object() {
        for (key, value) in object {
            if let Some(accel) = value.as_str() {
                let upper = accel.to_ascii_uppercase();
                if upper.contains("CTRL") || upper.contains("CONTROL") {
                    continue;
                }
                sanitized.insert(key.clone(), serde_json::Value::String(accel.trim().to_string()));
            }
        }
    }

    {
        let mut settings = state.settings.lock().unwrap();
        settings["tabShortcuts"] = serde_json::Value::Object(sanitized.clone());
        let snapshot = settings.clone();
        save_settings(&app, &snapshot);
    }

    // Register the hotkeys natively.
    let map: HashMap<String, String> = sanitized
        .iter()
        .filter_map(|(key, value)| {
            value
                .as_str()
                .map(|accel| (key.clone(), accel.to_string()))
        })
        .collect();
    let emit_app = app.clone();
    let handler = Arc::new(move |key: String| {
        if let Some((event, payload)) = shortcut_event_for(&key) {
            let _ = emit_app.emit(&event, payload);
        }
    });
    native::spawn_hotkey_thread(map, handler);

    let merged = merged_tab_shortcuts(&state);
    let _ = app.emit("shortcuts:updated", &merged);
    merged
}

#[tauri::command]
fn reset_tab_shortcuts(app: tauri::AppHandle, state: tauri::State<AppState>) -> serde_json::Value {
    {
        let mut settings = state.settings.lock().unwrap();
        settings["tabShortcuts"] = serde_json::json!({});
        let snapshot = settings.clone();
        save_settings(&app, &snapshot);
    }
    let merged = merged_tab_shortcuts(&state);
    let _ = app.emit("shortcuts:updated", &merged);
    merged
}

fn shortcut_event_for(key: &str) -> Option<(String, serde_json::Value)> {
    if let Ok(tab_id) = key.parse::<i64>() {
        return Some(("open-tab-instant".to_string(), serde_json::json!(tab_id)));
    }
    match key {
        "minimal-notch" => Some(("toggle-minimal-notch-hotkey".to_string(), serde_json::json!(null))),
        "dismiss-notification" => Some((
            "dismiss-latest-notification".to_string(),
            serde_json::json!(null),
        )),
        _ => None,
    }
}

#[tauri::command]
fn register_global_shortcuts(app: tauri::AppHandle, shortcuts: serde_json::Value) -> bool {
    let mut map: HashMap<String, String> = HashMap::new();
    if let Some(object) = shortcuts.as_object() {
        for (key, value) in object {
            if let Some(accel) = value.as_str() {
                if !accel.trim().is_empty() {
                    map.insert(key.clone(), accel.trim().to_string());
                }
            }
        }
    }

    let emit_app = app.clone();
    let handler = Arc::new(move |key: String| {
        if let Some((event, payload)) = shortcut_event_for(&key) {
            let _ = emit_app.emit(&event, payload);
        }
    });

    native::spawn_hotkey_thread(map, handler);
    true
}

// -------------------------------------------------------------
// Background watchers
// -------------------------------------------------------------

fn start_obstruction_watcher(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        #[cfg(windows)]
        {
            use windows::Win32::Foundation::RECT;
            use windows::Win32::UI::WindowsAndMessaging::{
                GetClassNameW, GetForegroundWindow, GetSystemMetrics, GetWindowRect, IsZoomed,
                SM_CXSCREEN, SM_CYSCREEN,
            };

            let mut last_obstructed = false;

            // Emit initial status once startup settles
            std::thread::sleep(Duration::from_millis(300));
            let initial_payload = ObstructionPayload {
                is_obstructed: false,
                obstructed: false,
            };
            let _ = app_handle.emit("obstruction-changed", &initial_payload);
            let _ = app_handle.emit("desktop:obstruction-status", &initial_payload);

            loop {
                std::thread::sleep(Duration::from_millis(200));

                let fg_hwnd = unsafe { GetForegroundWindow() };
                if fg_hwnd.0 as usize == 0 {
                    continue;
                }

                // Check class name
                let mut buf = [0u16; 256];
                let len = unsafe { GetClassNameW(fg_hwnd, &mut buf) };
                let cls = String::from_utf16_lossy(&buf[..len as usize]);

                let is_desktop = cls == "Progman"
                    || cls == "WorkerW"
                    || cls == "Shell_TrayWnd"
                    || cls == "Shell_SecondaryTrayWnd";

                let is_own_window = if let Some(main_win) = app_handle.get_webview_window("main") {
                    if let Ok(hwnd) = main_win.hwnd() {
                        hwnd.0 == fg_hwnd.0
                    } else {
                        false
                    }
                } else {
                    false
                };

                let mut is_obstructed = false;

                if !is_desktop && !is_own_window {
                    let mut rect = RECT::default();
                    let _ = unsafe { GetWindowRect(fg_hwnd, &mut rect) };
                    let is_zoomed = unsafe { IsZoomed(fg_hwnd) }.as_bool();

                    let screen_w = unsafe { GetSystemMetrics(SM_CXSCREEN) };
                    let screen_h = unsafe { GetSystemMetrics(SM_CYSCREEN) };
                    let center_x = screen_w / 2;

                    // Check horizontal overlap with center notch area (+/- 160px from center)
                    let overlaps_center = rect.left < (center_x + 160) && rect.right > (center_x - 160);

                    // 1. Fullscreen apps
                    if rect.left <= 0
                        && rect.top <= 0
                        && rect.right >= screen_w
                        && rect.bottom >= screen_h
                        && !is_zoomed
                    {
                        is_obstructed = true;
                    }
                    // 2. Maximized window
                    else if is_zoomed {
                        is_obstructed = true;
                    }
                    // 3. Normal window that horizontally overlaps center notch and top <= 42
                    else if overlaps_center && rect.top <= 42 && rect.bottom > 42 {
                        is_obstructed = true;
                    }
                }

                if is_obstructed != last_obstructed {
                    last_obstructed = is_obstructed;
                    let payload = ObstructionPayload {
                        is_obstructed,
                        obstructed: is_obstructed,
                    };
                    let _ = app_handle.emit("obstruction-changed", &payload);
                    let _ = app_handle.emit("desktop:obstruction-status", &payload);
                }
            }
        }
    });
}

fn start_cursor_hit_test_watcher(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        #[cfg(windows)]
        {
            use std::sync::atomic::Ordering;
            use windows::Win32::Foundation::POINT;
            use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

            let mut is_hovering = false;

            // Wait briefly for main window to stabilize
            std::thread::sleep(Duration::from_millis(500));

            loop {
                std::thread::sleep(Duration::from_millis(50));

                let Some(main_win) = app_handle.get_webview_window("main") else {
                    continue;
                };

                let state = match app_handle.try_state::<AppState>() {
                    Some(s) => s,
                    None => continue,
                };

                let mut pt = POINT::default();
                if unsafe { GetCursorPos(&mut pt) }.is_err() {
                    continue;
                }

                let scale = main_win.scale_factor().unwrap_or(1.0);
                let win_pos = match main_win.outer_position() {
                    Ok(p) => p,
                    Err(_) => continue,
                };
                let win_size = match main_win.outer_size() {
                    Ok(s) => s,
                    Err(_) => continue,
                };

                let hitbox_w_logical = state.hitbox_width.load(Ordering::Relaxed) as f64;
                let hitbox_h_logical = state.hitbox_height.load(Ordering::Relaxed) as f64;

                // A hitbox that was never reported must not lock the user out.
                let hitbox_w_phys = ((hitbox_w_logical * scale).round() as i32).max(110);
                let hitbox_h_phys = ((hitbox_h_logical * scale).round() as i32).max(14);

                // The renderer reports the horizontal centre of the notch so the
                // hit-box also works for the corner positions.
                let anchor = *state.hitbox_anchor_x.lock().unwrap();
                let center_x = match anchor {
                    Some(anchor_x) => win_pos.x + (anchor_x * scale).round() as i32,
                    None => win_pos.x + (win_size.width as i32 / 2),
                };
                let top_y = win_pos.y;

                let x_min = center_x - hitbox_w_phys / 2;
                let x_max = center_x + hitbox_w_phys / 2;
                let y_min = top_y;
                let y_max = top_y + hitbox_h_phys;

                // The window procedure uses these coordinates to decide whether
                // a click belongs to the island or to the app underneath.
                native::set_hitbox(x_min, y_min, x_max, y_max);

                let inside = pt.x >= x_min && pt.x <= x_max && pt.y >= y_min && pt.y <= y_max;

                if inside && !is_hovering {
                    is_hovering = true;
                    let _ = main_win.emit("notch:cursor-enter", ());
                } else if !inside && is_hovering {
                    is_hovering = false;
                    let _ = main_win.emit("notch:cursor-leave", ());
                }
            }
        }
    });
}

fn start_clipboard_watcher(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut last_text = String::new();

        if let Ok(mut cb) = arboard::Clipboard::new() {
            if let Ok(initial) = cb.get_text() {
                let text = initial.trim().to_string();
                if !text.is_empty() {
                    last_text = text.clone();
                    if let Some(state) = app_handle.try_state::<AppState>() {
                        *state.last_clipboard_text.lock().unwrap() = text.clone();
                        let mut hist = state.clipboard_history.lock().unwrap();
                        hist.push(ClipboardItem {
                            id: format!("clip-{}", now_millis()),
                            text,
                            timestamp: now_millis(),
                        });
                        // Push the initial state so the UI is in sync right away.
                        let _ = app_handle.emit("clipboard:update", hist.clone());
                    }
                }
            }
        }

        loop {
            std::thread::sleep(Duration::from_millis(500));
            if let Ok(mut cb) = arboard::Clipboard::new() {
                if let Ok(current) = cb.get_text() {
                    let text = current.trim().to_string();
                    // The app itself may have written to the clipboard.
                    if let Some(state) = app_handle.try_state::<AppState>() {
                        let known = state.last_clipboard_text.lock().unwrap().clone();
                        if !known.is_empty() && known == text {
                            last_text = text;
                            continue;
                        }
                    }
                    if !text.is_empty() && text != last_text {
                        last_text = text.clone();
                        let new_item = ClipboardItem {
                            id: format!("clip-{}", now_millis()),
                            text: text.clone(),
                            timestamp: now_millis(),
                        };

                        if let Some(state) = app_handle.try_state::<AppState>() {
                            *state.last_clipboard_text.lock().unwrap() = text.clone();
                            let mut hist = state.clipboard_history.lock().unwrap();
                            hist.retain(|i| i.text != text);
                            hist.insert(0, new_item);
                            if hist.len() > 15 {
                                hist.truncate(15);
                            }
                            let _ = app_handle.emit("clipboard:update", hist.clone());
                        }
                    }
                }
            }
        }
    });
}

/// Watch for USB drives being plugged in / removed.
fn start_usb_watcher(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut known: Vec<String> = native::list_usb_drives()
            .into_iter()
            .map(|(letter, _)| letter)
            .collect();

        loop {
            std::thread::sleep(Duration::from_millis(1500));
            let current = native::list_usb_drives();
            let current_letters: Vec<String> = current.iter().map(|(l, _)| l.clone()).collect();

            for (letter, label) in &current {
                if !known.contains(letter) {
                    let _ = app_handle.emit(
                        "usb-change",
                        serde_json::json!({
                            "action": "connected",
                            "drive": letter,
                            "name": if label.is_empty() { "USB Drive".to_string() } else { label.clone() }
                        }),
                    );
                }
            }
            for letter in &known {
                if !current_letters.contains(letter) {
                    let _ = app_handle.emit(
                        "usb-change",
                        serde_json::json!({
                            "action": "disconnected",
                            "drive": letter,
                            "name": "USB Drive"
                        }),
                    );
                }
            }
            known = current_letters;
        }
    });
}

pub fn now_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// -------------------------------------------------------------
// Application Entry Point
// -------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sysinfo: Mutex::new(sysinfo::System::new_all()),
            clipboard_history: Mutex::new(Vec::new()),
            jarvis_config: Mutex::new(JarvisConfig::default()),
            hitbox_width: std::sync::atomic::AtomicI32::new(175),
            hitbox_height: std::sync::atomic::AtomicI32::new(36),
            hitbox_anchor_x: Mutex::new(None),
            settings: Mutex::new(serde_json::json!({})),
            audio: native::AudioHelper::new(),
            updater: updater::Updater::new(),
            notifications: notifications::NotificationEngine::new(),
            launcher_catalog: Mutex::new(Vec::new()),
            last_clipboard_text: Mutex::new(String::new()),
        })
        .invoke_handler(tauri::generate_handler![
            set_notch_hitbox,
            set_ignore_mouse_events,
            update_window_position,
            trim_memory,
            get_system_metrics,
            get_battery_status,
            get_system_media,
            control_system_media,
            ask_jarvis,
            get_jarvis_config,
            set_jarvis_config,
            test_jarvis_connection,
            launch_jarvis_server,
            stop_jarvis_server,
            open_settings_window,
            close_settings_window,
            minimize_settings_window,
            get_clipboard_text,
            write_clipboard_text,
            clear_clipboard,
            get_clipboard_history,
            open_external,
            get_camera_status,
            get_microphone_status,
            get_bluetooth_status,
            get_app_version,
            set_auto_launch,
            get_auto_launch,
            get_app_settings,
            get_app_setting,
            set_app_setting,
            get_always_on_top,
            set_always_on_top,
            get_displays,
            audio_mixer_get_devices,
            audio_mixer_get_sessions,
            audio_mixer_set_volume,
            audio_mixer_set_mute,
            audio_mixer_set_master_volume,
            audio_mixer_set_master_mute,
            launcher_search_apps,
            launcher_get_catalog,
            launcher_reindex_catalog,
            launcher_get_running_windows,
            launcher_activate_window,
            launcher_select_file,
            launcher_launch_app,
            launcher_open_app,
            launcher_open_url,
            shelf_start_drag,
            shelf_cache_icon,
            get_file_info,
            notification_get_snapshot,
            notification_sync_now,
            notification_dismiss,
            notification_dismiss_group,
            notification_clear_all,
            notification_undo_dismiss,
            notification_mark_reviewed,
            notification_mark_all_reviewed,
            notification_set_hide_previews,
            notification_set_app_excluded,
            notification_snooze,
            notification_cancel_snooze,
            notification_clear_history,
            notification_execute_action,
            focus_notification_app,
            open_notification_target,
            dismiss_latest_notification,
            check_for_updates,
            start_update_download,
            cancel_update_download,
            install_update,
            get_updater_state,
            get_auto_download_install,
            set_auto_download_install,
            register_global_shortcuts,
            get_tab_shortcuts,
            set_tab_shortcuts,
            reset_tab_shortcuts,
            log_message,
            log_renderer_error,
        ])
        .setup(|app| {
            // Position notch centered horizontally at y: 0
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let screen_size = monitor.size();
                    let scale_factor = monitor.scale_factor();
                    let win_w = (520.0 * scale_factor) as i32;
                    let x = (screen_size.width as i32 - win_w) / 2;
                    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, 0)));
                }

                // Click-through without WS_EX_LAYERED (a layered window cannot
                // be composited by WebView2 and the notch would vanish).
                #[cfg(windows)]
                if let Ok(hwnd) = window.hwnd() {
                    // Tauri links a different `windows` version, so the handle
                    // is passed on as a raw pointer.
                    let raw = windows::Win32::Foundation::HWND(hwnd.0 as *mut std::ffi::c_void);
                    native::install_click_through(raw);
                }
            }

            let handle = app.handle().clone();

            // Restore the persisted settings + JARVIS config.
            let settings = load_settings(&handle);
            if let Some(state) = handle.try_state::<AppState>() {
                *state.settings.lock().unwrap() = settings.clone();
                if let Some(always_on_top) = settings.get("alwaysOnTop").and_then(|v| v.as_bool()) {
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.set_always_on_top(always_on_top);
                    }
                }
            }
            if let Some(path) = jarvis_config_path(&handle) {
                if let Ok(raw) = std::fs::read_to_string(path) {
                    if let Ok(config) = serde_json::from_str::<JarvisConfig>(&raw) {
                        if let Some(state) = handle.try_state::<AppState>() {
                            *state.jarvis_config.lock().unwrap() = config;
                        }
                    }
                }
            }

            // Register the global hotkeys configured by the user.
            if let Some(state) = handle.try_state::<AppState>() {
                let shortcuts = merged_tab_shortcuts(&state);
                let mut map: HashMap<String, String> = HashMap::new();
                if let Some(object) = shortcuts.as_object() {
                    for (key, value) in object {
                        if let Some(accel) = value.as_str() {
                            map.insert(key.clone(), accel.trim().to_string());
                        }
                    }
                }
                let emit_app = handle.clone();
                let handler = Arc::new(move |key: String| {
                    if let Some((event, payload)) = shortcut_event_for(&key) {
                        let _ = emit_app.emit(&event, payload);
                    }
                });
                native::spawn_hotkey_thread(map, handler);
            }

            let app_handle_hit = handle.clone();
            start_cursor_hit_test_watcher(app_handle_hit);

            let app_handle_obs = handle.clone();
            start_obstruction_watcher(app_handle_obs);

            let app_handle_clip = handle.clone();
            start_clipboard_watcher(app_handle_clip);

            let app_handle_usb = handle.clone();
            start_usb_watcher(app_handle_usb);

            let app_handle_notif = handle.clone();
            notifications::start_notification_watcher(app_handle_notif);

            // Updater events -> renderer
            if let Some(state) = handle.try_state::<AppState>() {
                let emit_app = handle.clone();
                state.updater.on_update(Box::new(move |snapshot| {
                    let _ = emit_app.emit("update-event", serde_json::to_value(&snapshot).unwrap_or_default());
                }));
            }

            // System tray icon
            let show_item = MenuItem::with_id(app, "show", "Show Quick Pill", true, None::<&str>)?;
            let autostart_state = get_auto_launch();
            let autostart_item = CheckMenuItem::with_id(
                app,
                "autostart",
                "Start with Windows",
                true,
                autostart_state,
                None::<&str>,
            )?;
            let mascot_state = handle
                .try_state::<AppState>()
                .and_then(|state| {
                    state
                        .settings
                        .lock()
                        .unwrap()
                        .get("mascotMode")
                        .and_then(|v| v.as_bool())
                })
                .unwrap_or(false);
            let mascot_item = CheckMenuItem::with_id(
                app,
                "mascot",
                "Mascot Mode",
                true,
                mascot_state,
                None::<&str>,
            )?;
            let minimal_state = handle
                .try_state::<AppState>()
                .and_then(|state| {
                    state
                        .settings
                        .lock()
                        .unwrap()
                        .get("minimalNotch")
                        .and_then(|v| v.as_bool())
                })
                .unwrap_or(false);
            let minimal_item = CheckMenuItem::with_id(
                app,
                "minimal",
                "Minimal Notch",
                true,
                minimal_state,
                None::<&str>,
            )?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &show_item,
                    &autostart_item,
                    &mascot_item,
                    &minimal_item,
                    &sep1,
                    &settings_item,
                    &sep2,
                    &quit_item,
                ],
            )?;

            let mut tray_builder = TrayIconBuilder::new()
                .tooltip("Quick Pill")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.unminimize();
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        "autostart" => {
                            let enabled = !get_auto_launch();
                            let _ = set_auto_launch(enabled);
                            let _ = app.emit("settings:auto-launch-changed", enabled);
                        }
                        "mascot" => {
                            let next = toggle_setting(app.clone(), "mascotMode");
                            let _ = app.emit("settings:mascot-mode-changed", next);
                        }
                        "minimal" => {
                            let next = toggle_setting(app.clone(), "minimalNotch");
                            let _ = app.emit("settings:minimal-notch-changed", next);
                        }
                        "settings" => {
                            let _ = open_settings_window(app.clone());
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.unminimize();
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon().cloned() {
                tray_builder = tray_builder.icon(icon);
            }

            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
