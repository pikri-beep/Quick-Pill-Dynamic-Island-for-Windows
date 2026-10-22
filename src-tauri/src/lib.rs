use std::os::windows::process::CommandExt;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use serde::{Deserialize, Serialize};

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
) -> Result<(), String> {
    state.hitbox_width.store(width, std::sync::atomic::Ordering::Relaxed);
    state.hitbox_height.store(height, std::sync::atomic::Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
fn set_ignore_mouse_events(window: tauri::WebviewWindow, ignore: bool, _forward: Option<bool>) -> Result<(), String> {
    window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_window_position(window: tauri::WebviewWindow, x_perc: f64, y_px: f64) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let win_size = window.outer_size().unwrap_or(tauri::PhysicalSize::new((520.0 * scale) as u32, (165.0 * scale) as u32));
        let x = ((size.width as f64 - win_size.width as f64) * (x_perc / 100.0)) as i32;
        let y = (y_px * scale) as i32;
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
    }
    Ok(())
}

// -------------------------------------------------------------
// Phase 2 & 4 Commands: Memory Trimming
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
// Phase 2 Commands: Native System Stats & Battery
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
// Phase 2 Commands: Native GSMTC Media Session
// -------------------------------------------------------------

#[tauri::command]
async fn get_system_media() -> Option<MediaInfo> {
    tokio::task::spawn_blocking(|| {
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
            let artist = media_props.Artist().ok().map(|s| s.to_string()).unwrap_or_default();
            let album = media_props.AlbumTitle().ok().map(|s| s.to_string()).unwrap_or_default();

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
        None
    })
    .await
    .unwrap_or(None)
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
                keybd_event, KEYEVENTF_KEYUP, VK_MEDIA_NEXT_TRACK, VK_MEDIA_PLAY_PAUSE, VK_MEDIA_PREV_TRACK,
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
// Phase 2 Commands: JARVIS Local API Bridge
// -------------------------------------------------------------

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

    let config = {
        let guard = state.jarvis_config.lock().unwrap();
        guard.clone()
    };

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
                let reply = json.get("reply")
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
fn set_jarvis_config(state: tauri::State<AppState>, config: JarvisConfig) -> bool {
    let mut guard = state.jarvis_config.lock().unwrap();
    *guard = config;
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

// -------------------------------------------------------------
// Phase 2 Commands: Settings Window (Destroy on Close)
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
// Clipboard Commands (Native arboard)
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
fn write_clipboard_text(text: String) -> bool {
    if let Ok(mut cb) = arboard::Clipboard::new() {
        cb.set_text(text).is_ok()
    } else {
        false
    }
}

#[tauri::command]
fn clear_clipboard() -> bool {
    if let Ok(mut cb) = arboard::Clipboard::new() {
        cb.clear().is_ok()
    } else {
        false
    }
}

#[tauri::command]
fn get_clipboard_history(state: tauri::State<AppState>) -> Vec<ClipboardItem> {
    state.clipboard_history.lock().unwrap().clone()
}

// -------------------------------------------------------------
// System Helpers: Shell, Audio, Devices, Version
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
    BluetoothStatus {
        connected: false,
        devices: Vec::new(),
    }
}

#[tauri::command]
fn get_app_version() -> String {
    "5.5.3".into()
}

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
// Background Watcher Tasks (Obstruction & Clipboard)
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
            let initial_payload = ObstructionPayload { is_obstructed: false, obstructed: false };
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
                    let payload = ObstructionPayload { is_obstructed, obstructed: is_obstructed };
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
            use windows::Win32::Foundation::POINT;
            use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
            use std::sync::atomic::Ordering;

            let mut is_hovering = false;

            // Wait briefly for main window to stabilize
            std::thread::sleep(Duration::from_millis(500));

            // Initially set cursor events ignored so underlying browser tabs/desktop are clickable
            if let Some(main_win) = app_handle.get_webview_window("main") {
                let _ = main_win.set_ignore_cursor_events(true);
            }

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

                let hitbox_w_phys = (hitbox_w_logical * scale).round() as i32;
                let hitbox_h_phys = (hitbox_h_logical * scale).round() as i32;

                let center_x = win_pos.x + (win_size.width as i32 / 2);
                let top_y = win_pos.y;

                let x_min = center_x - hitbox_w_phys / 2;
                let x_max = center_x + hitbox_w_phys / 2;
                let y_min = top_y;
                let y_max = top_y + hitbox_h_phys;

                let inside = pt.x >= x_min && pt.x <= x_max && pt.y >= y_min && pt.y <= y_max;

                if inside && !is_hovering {
                    is_hovering = true;
                    let _ = main_win.set_ignore_cursor_events(false);
                    let _ = main_win.emit("notch:cursor-enter", ());
                } else if !inside && is_hovering {
                    is_hovering = false;
                    let _ = main_win.set_ignore_cursor_events(true);
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
                        let mut hist = state.clipboard_history.lock().unwrap();
                        hist.push(ClipboardItem {
                            id: format!("clip-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
                            text,
                            timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
                        });
                    }
                }
            }
        }

        loop {
            std::thread::sleep(Duration::from_millis(500));
            if let Ok(mut cb) = arboard::Clipboard::new() {
                if let Ok(current) = cb.get_text() {
                    let text = current.trim().to_string();
                    if !text.is_empty() && text != last_text {
                        last_text = text.clone();
                        let new_item = ClipboardItem {
                            id: format!("clip-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
                            text: text.clone(),
                            timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
                        };

                        if let Some(state) = app_handle.try_state::<AppState>() {
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
            hitbox_width: std::sync::atomic::AtomicI32::new(180),
            hitbox_height: std::sync::atomic::AtomicI32::new(38),
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
            }

            let app_handle_hit = app.handle().clone();
            start_cursor_hit_test_watcher(app_handle_hit);

            let app_handle_obs = app.handle().clone();
            start_obstruction_watcher(app_handle_obs);

            let app_handle_clip = app.handle().clone();
            start_clipboard_watcher(app_handle_clip);

            // System Tray Icon
            let show_item = MenuItem::with_id(app, "show", "Show Quick Pill", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[
                &show_item,
                &sep1,
                &settings_item,
                &sep2,
                &quit_item,
            ])?;

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
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
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
