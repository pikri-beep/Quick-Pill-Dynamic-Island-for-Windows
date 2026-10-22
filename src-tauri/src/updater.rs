//! In-app updater for the Tauri build.
//!
//! Mirrors the Electron updater: a small JSON manifest is published with every
//! release, the client compares versions, downloads the installer, verifies
//! its SHA-256 digest and finally hands the file over to the Windows installer.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Where the live manifest lives (same repository the Electron build uses).
pub const MANIFEST_URL: &str =
    "https://raw.githubusercontent.com/pikri-beep/Quick-Pill-Dynamic-Island-for-Windows/main/web%20app/public/version.json";

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct PlatformAsset {
    pub url: String,
    #[serde(default)]
    pub sha256: String,
    #[serde(default)]
    pub size: u64,
    #[serde(default)]
    pub installer_type: String,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct UpdateManifest {
    pub version: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub changelog: Vec<String>,
    #[serde(default)]
    pub mandatory: bool,
    #[serde(default)]
    pub min_supported_version: String,
    #[serde(default)]
    pub platforms: std::collections::HashMap<String, PlatformAsset>,
}

#[derive(Serialize, Clone, Debug)]
pub struct UpdaterState {
    pub status: String,
    pub update_info: Option<UpdateManifest>,
    pub downloaded_file_path: Option<String>,
    pub current_version: String,
    pub percent: f64,
    pub error: Option<String>,
}

impl UpdaterState {
    pub fn idle(current_version: &str) -> Self {
        Self {
            status: "idle".into(),
            update_info: None,
            downloaded_file_path: None,
            current_version: current_version.to_string(),
            percent: 0.0,
            error: None,
        }
    }
}

/// Compare two dotted version strings. Returns `true` when `a` is newer.
pub fn is_newer(candidate: &str, current: &str) -> bool {
    fn parts(value: &str) -> Vec<u64> {
        value
            .trim()
            .trim_start_matches('v')
            .split(['.', '-', '+'])
            .map(|p| p.trim().parse::<u64>().unwrap_or(0))
            .collect()
    }
    let a = parts(candidate);
    let b = parts(current);
    for index in 0..a.len().max(b.len()) {
        let left = a.get(index).copied().unwrap_or(0);
        let right = b.get(index).copied().unwrap_or(0);
        if left != right {
            return left > right;
        }
    }
    false
}

/// SHA-256 of a file, hex encoded.
pub fn sha256_file(path: &PathBuf) -> Option<String> {
    use ring::digest::{digest, SHA256};
    let bytes = std::fs::read(path).ok()?;
    let result = digest(&SHA256, &bytes);
    let mut out = String::with_capacity(64);
    for byte in result.as_ref() {
        out.push_str(&format!("{:02x}", byte));
    }
    Some(out)
}

/// Shared updater state (status, progress, downloaded file).
pub struct Updater {
    inner: Arc<UpdaterInner>,
}

struct UpdaterInner {
    state: Mutex<UpdaterState>,
    cancel: Mutex<bool>,
    listeners: Mutex<Vec<Box<dyn Fn(UpdaterState) + Send + Sync>>>,
}

impl Clone for Updater {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl Default for Updater {
    fn default() -> Self {
        Self::new()
    }
}

impl Updater {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(UpdaterInner {
                state: Mutex::new(UpdaterState::idle("")),
                cancel: Mutex::new(false),
                listeners: Mutex::new(Vec::new()),
            }),
        }
    }

    pub fn current_version(&self) -> String {
        self.inner.state.lock().unwrap().current_version.clone()
    }

    pub fn snapshot(&self) -> UpdaterState {
        self.inner.state.lock().unwrap().clone()
    }

    fn publish(&self, state: UpdaterState) {
        *self.inner.state.lock().unwrap() = state.clone();
        let listeners = self.inner.listeners.lock().unwrap();
        for listener in listeners.iter() {
            listener(state.clone());
        }
    }

    pub fn on_update(&self, listener: Box<dyn Fn(UpdaterState) + Send + Sync>) {
        self.inner.listeners.lock().unwrap().push(listener);
    }

    /// Fetch the manifest and report whether an update is available.
    pub async fn check(&self, current_version: &str) -> Result<Option<UpdateManifest>, String> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(15))
            .user_agent(format!("QuickPill-Updater/{}", current_version))
            .build()
            .map_err(|e| e.to_string())?;

        let manifest: UpdateManifest = client
            .get(MANIFEST_URL)
            .send()
            .await
            .map_err(|e| format!("manifest request failed: {}", e))?
            .json()
            .await
            .map_err(|e| format!("manifest parse failed: {}", e))?;

        let available = is_newer(&manifest.version, current_version);
        let mut state = self.snapshot();
        state.current_version = current_version.to_string();
        state.status = if available {
            "update-available".into()
        } else {
            "idle".into()
        };
        state.update_info = if available { Some(manifest.clone()) } else { None };
        self.publish(state);

        Ok(if available { Some(manifest) } else { None })
    }

    /// Download the installer for the given manifest.
    pub async fn download(&self, manifest: &UpdateManifest) -> Result<PathBuf, String> {
        let asset = manifest
            .platforms
            .get("win32-x64")
            .ok_or_else(|| "manifest has no win32-x64 asset".to_string())?
            .clone();

        *self.inner.cancel.lock().unwrap() = false;

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(600))
            .user_agent("QuickPill-Updater")
            .build()
            .map_err(|e| e.to_string())?;

        let response = client
            .get(&asset.url)
            .send()
            .await
            .map_err(|e| format!("download failed: {}", e))?;

        let total = response.content_length().unwrap_or(asset.size);
        let mut file = std::io::BufWriter::new(
            std::fs::File::create(download_path())
                .map_err(|e| format!("cannot create download file: {}", e))?,
        );
        use futures_util::StreamExt;
        let mut stream = response.bytes_stream();
        let mut received: u64 = 0;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("download interrupted: {}", e))?;
            if *self.inner.cancel.lock().unwrap() {
                return Err("download cancelled".into());
            }
            use std::io::Write;
            file.write_all(&chunk).map_err(|e| e.to_string())?;
            received += chunk.len() as u64;
            let percent = if total > 0 {
                (received as f64 / total as f64) * 100.0
            } else {
                0.0
            };
            let mut state = self.snapshot();
            state.status = "downloading".into();
            state.percent = percent;
            self.publish(state);
        }
        use std::io::Write;
        file.flush().map_err(|e| e.to_string())?;

        let path = download_path();
        if !asset.sha256.is_empty() {
            if let Some(actual) = sha256_file(&path) {
                if !actual.eq_ignore_ascii_case(&asset.sha256) {
                    let _ = std::fs::remove_file(&path);
                    return Err("checksum mismatch - update rejected".into());
                }
            }
        }

        let mut state = self.snapshot();
        state.status = "downloaded".into();
        state.percent = 100.0;
        state.downloaded_file_path = Some(path.to_string_lossy().to_string());
        self.publish(state);

        Ok(path)
    }

    pub fn cancel_download(&self) {
        *self.inner.cancel.lock().unwrap() = true;
        let mut state = self.snapshot();
        state.status = "idle".into();
        state.percent = 0.0;
        self.publish(state);
    }

    /// Run the downloaded installer and quit the app.
    pub fn install(&self) -> Result<(), String> {
        let state = self.snapshot();
        let path = state
            .downloaded_file_path
            .ok_or_else(|| "no update has been downloaded".to_string())?;
        let path = PathBuf::from(path);
        if !path.exists() {
            return Err("the downloaded installer is gone".into());
        }

        let mut update_state = self.snapshot();
        update_state.status = "installing".into();
        self.publish(update_state);

        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            // BREAKAWAY_FROM_JOB so the installer survives the app shutdown.
            const CREATE_BREAKAWAY_FROM_JOB: u32 = 0x0100_0000;
            const DETACHED_PROCESS: u32 = 0x0000_0008;
            std::process::Command::new(&path)
                .creation_flags(CREATE_BREAKAWAY_FROM_JOB | DETACHED_PROCESS)
                .spawn()
                .map_err(|e| format!("cannot start the installer: {}", e))?;
            Ok(())
        }
        #[cfg(not(windows))]
        {
            let _ = path;
            Err("automatic updates are only supported on Windows".into())
        }
    }
}

/// Where the installer is downloaded to.
pub fn download_path() -> PathBuf {
    let base = std::env::var("TEMP")
        .or_else(|_| std::env::var("TMP"))
        .unwrap_or_else(|_| ".".to_string());
    PathBuf::from(base).join("quick-pill-update-setup.exe")
}
