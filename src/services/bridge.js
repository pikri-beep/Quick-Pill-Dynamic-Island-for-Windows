/**
 * Universal Frontend Bridge Adapter for Tauri v2 & Electron Fallback
 * Exposes window.electronAPI so all existing React components work with 0 rewrites.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const isTauriEnv = () => {
  return typeof window !== 'undefined' && Boolean(
    window.__TAURI_INTERNALS__ ||
    window.__TAURI__ ||
    window.isTauri
  );
};

// Safe event listener helper that always returns a synchronous unlisten function
function createTauriListener(eventName, callback) {
  let isCleanedUp = false;
  let unlistenFn = null;

  try {
    listen(eventName, (event) => {
      if (!isCleanedUp && typeof callback === 'function') {
        callback(event.payload);
      }
    }).then((unlisten) => {
      if (isCleanedUp) {
        unlisten();
      } else {
        unlistenFn = unlisten;
      }
    }).catch((err) => {
      console.warn(`[Tauri Bridge] Failed to subscribe to '${eventName}':`, err);
    });
  } catch (err) {
    console.warn(`[Tauri Bridge] Immediate subscribe failure for '${eventName}':`, err);
  }

  return () => {
    isCleanedUp = true;
    if (typeof unlistenFn === 'function') {
      try {
        unlistenFn();
      } catch (_) {}
    }
  };
}

// Local storage helper for persisting app state without native files
const storage = {
  get: (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (_) {
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (_) {
      return false;
    }
  }
};

// Safe recursive proxy to prevent any "undefined is not a function" crashes
function createSafeProxy(target, path = '') {
  return new Proxy(target, {
    get(obj, prop) {
      if (typeof prop !== 'string') return obj[prop];
      if (prop in obj) {
        const val = obj[prop];
        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Promise)) {
          return createSafeProxy(val, `${path}${prop}.`);
        }
        return val;
      }
      // If event listener, return synchronous no-op unsubscriber
      if (prop.startsWith('on')) {
        return () => () => {};
      }
      // If method, return a Promise resolving to null
      return (...args) => {
        console.warn(`[Bridge Proxy Fallback] Called unhandled method: window.electronAPI.${path}${prop}`, args);
        return Promise.resolve(null);
      };
    }
  });
}

export function initBridge() {
  if (typeof window === 'undefined') return;

  // If already running inside Electron with real preload, preserve it as fallback
  if (window.electronAPI && !isTauriEnv()) {
    console.log('[Bridge] Running under native Electron runtime.');
    return;
  }

  console.log('[Bridge] Initializing Tauri v2 Native Bridge for React UI.');

  const bridgeAPI = {
    platform: 'win32',

    getFilePath: (file) => file?.path || '',

    settingsWindow: {
      minimize: () => invoke('minimize_settings_window').catch(() => {}),
      close: () => invoke('close_settings_window').catch(() => {}),
    },

    setNotchHitbox: (width, height, expanded) => {
      return invoke('set_notch_hitbox', {
        width: Math.round(width),
        height: Math.round(height),
        expanded: Boolean(expanded)
      }).catch((e) => console.warn('[Bridge] set_notch_hitbox error:', e));
    },

    onNotchCursorEnter: (cb) => createTauriListener('notch:cursor-enter', cb),
    onNotchCursorLeave: (cb) => createTauriListener('notch:cursor-leave', cb),

    setIgnoreMouseEvents: (ignore, forward) => {
      // In Tauri v2, cursor events are dynamically evaluated by the native Win32 50ms hit-test loop
      // to avoid permanently locking the window transparent.
      return Promise.resolve();
    },

    getSystemMedia: () => invoke('get_system_media').catch(() => null),

    controlSystemMedia: (command, ...args) => {
      const seekSec = typeof args[0] === 'number' ? args[0] : null;
      return invoke('control_system_media', { command, seekSec }).catch(() => {});
    },

    getBluetoothStatus: () => invoke('get_bluetooth_status').catch(() => ({ connected: false, devices: [] })),
    getCameraStatus: () => invoke('get_camera_status').catch(() => false),
    getMicrophoneStatus: () => invoke('get_microphone_status').catch(() => false),
    getSystemMetrics: () => invoke('get_system_metrics').catch(() => ({ cpu: 0, ram: 0 })),
    getBatteryStatus: () => invoke('get_battery_status').catch(() => ({ percent: 100, charging: true })),

    openExternal: (url) => invoke('open_external', { url }).catch((e) => console.error('[Bridge] openExternal:', e)),

    launchApp: (target) => invoke('open_external', { url: target }).catch((e) => console.error('[Bridge] launchApp:', e)),
    buildAppCache: () => Promise.resolve([]),
    searchApps: () => Promise.resolve([]),

    getDisplays: () => Promise.resolve([{ id: 'primary', bounds: { x: 0, y: 0, width: 1920, height: 1080 } }]),
    setDisplay: () => Promise.resolve(true),
    updateWindowPosition: (xPerc, yPx) => invoke('update_window_position', { xPerc: Number(xPerc), yPx: Number(yPx) }).catch(() => {}),

    setAutoLaunch: (enable) => invoke('set_auto_launch', { enable: Boolean(enable) }).catch(() => false),
    getAutoLaunch: () => invoke('get_auto_launch').catch(() => false),
    createDesktopShortcut: () => Promise.resolve(true),
    onAutoLaunchChange: (cb) => createTauriListener('settings:auto-launch-changed', cb),

    getClipboardText: () => invoke('get_clipboard_text').catch(() => ''),
    writeClipboardText: (text) => invoke('write_clipboard_text', { text }).catch(() => false),
    clearClipboard: () => invoke('clear_clipboard').catch(() => false),

    controlSystemVolume: () => Promise.resolve(true),
    focusWindow: () => Promise.resolve(true),

    logMessage: (level, msg, details) => {
      console.log(`[QuickPill ${level}]`, msg, details || '');
    },
    logRendererError: (errorData) => {
      console.error('[QuickPill Renderer Error]', errorData);
      try {
        localStorage.setItem('qp_last_renderer_error', JSON.stringify(errorData));
      } catch (_) {}
    },

    getNotifications: () => Promise.resolve([]),
    dismissNotification: () => Promise.resolve(true),
    focusNotificationApp: () => Promise.resolve(true),
    openNotificationTarget: (payload) => {
      const target = payload || {};
      if (target.url) return invoke('open_external', { url: target.url }).catch(() => false);
      return Promise.resolve(true);
    },
    onDismissLatestNotification: (cb) => createTauriListener('dismiss-latest-notification', cb),

    onUSBChange: (cb) => createTauriListener('usb-change', cb),

    checkForUpdates: () => Promise.resolve({ updateAvailable: false }),
    startUpdateDownload: () => Promise.resolve(true),
    cancelUpdateDownload: () => Promise.resolve(true),
    installUpdate: () => Promise.resolve(true),
    getUpdaterState: () => Promise.resolve({ state: 'idle' }),
    getAppVersion: () => invoke('get_app_version').catch(() => '5.5.3'),
    getAutoDownloadInstall: () => Promise.resolve(false),
    setAutoDownloadInstall: () => Promise.resolve(true),

    getAlwaysOnTop: () => Promise.resolve(true),
    setAlwaysOnTop: () => Promise.resolve(true),
    onAlwaysOnTopChange: (cb) => createTauriListener('always-on-top-changed', cb),
    onUpdateEvent: (cb) => createTauriListener('update-event', cb),
    onSystemResume: (cb) => createTauriListener('system-resume', cb),

    audioMixer: {
      getDevices: () => Promise.resolve({ devices: [], defaultDeviceId: 'default' }),
      getSessions: () => Promise.resolve({ sessions: [], masterVolume: 80, isMuted: false }),
      setVolume: () => Promise.resolve(true),
      setMute: () => Promise.resolve(true),
      setMasterVolume: () => Promise.resolve(true),
      setMasterMute: () => Promise.resolve(true),
    },

    progress: {
      getSnapshot: () => Promise.resolve({ operations: [], history: [], compactDisplay: null }),
      executeAction: () => Promise.resolve(true),
      startFileOperation: () => Promise.resolve(true),
      startHashOperation: () => Promise.resolve(true),
      selectFile: () => Promise.resolve(null),
      clearHistory: () => Promise.resolve(true),
      onUpdate: (cb) => createTauriListener('progress:update', cb)
    },

    notifications: {
      getSnapshot: () => Promise.resolve({
        active: [],
        standalone: [],
        groups: [],
        snoozed: [],
        history: [],
        recentDismissals: [],
        lowPrioritySummary: { count: 0, items: [] },
        incomingCall: null,
        settings: { hidePreviews: false, excludedApps: [] },
        stats: { totalActive: 0, unreviewedCount: 0, snoozedCount: 0, criticalCount: 0, historyCount: 0, hasUndo: false }
      }),
      syncNow: () => Promise.resolve({
        active: [],
        standalone: [],
        groups: [],
        snoozed: [],
        history: [],
        recentDismissals: [],
        lowPrioritySummary: { count: 0, items: [] },
        incomingCall: null,
        settings: { hidePreviews: false, excludedApps: [] },
        stats: { totalActive: 0, unreviewedCount: 0, snoozedCount: 0, criticalCount: 0, historyCount: 0, hasUndo: false }
      }),
      executeAction: () => Promise.resolve(true),
      snooze: () => Promise.resolve(true),
      cancelSnooze: () => Promise.resolve(true),
      dismiss: () => Promise.resolve(true),
      dismissGroup: () => Promise.resolve(true),
      clearAll: () => Promise.resolve(true),
      undoDismiss: () => Promise.resolve(true),
      markReviewed: () => Promise.resolve(true),
      markAllReviewed: () => Promise.resolve(true),
      setHidePreviews: () => Promise.resolve(true),
      setAppExcluded: () => Promise.resolve(true),
      clearHistory: () => Promise.resolve(true),
      onUpdate: (cb) => createTauriListener('notification:update', cb)
    },

    launcher: {
      searchApps: () => Promise.resolve([]),
      getCatalog: () => Promise.resolve([]),
      reindexCatalog: () => Promise.resolve([]),
      launchApp: (target) => invoke('open_external', { url: target }).catch(() => {}),
      getRunningWindows: () => Promise.resolve([]),
      activateWindow: () => Promise.resolve(true),
      getFavorites: () => Promise.resolve(storage.get('qp_favorites', [])),
      setFavorites: (favorites) => {
        storage.set('qp_favorites', favorites);
        return Promise.resolve(true);
      },
      openApp: (p) => invoke('open_external', { url: p }).catch(() => {}),
      openUrl: (u) => invoke('open_external', { url: u }).catch(() => {}),
      selectFile: () => Promise.resolve(null),
      getWorkspaces: () => Promise.resolve(storage.get('qp_workspaces', [])),
      saveWorkspace: (ws) => {
        const list = storage.get('qp_workspaces', []);
        const idx = list.findIndex(w => w.id === ws.id);
        if (idx >= 0) list[idx] = ws; else list.push(ws);
        storage.set('qp_workspaces', list);
        return Promise.resolve(ws);
      },
      deleteWorkspace: (id) => {
        const list = storage.get('qp_workspaces', []).filter(w => w.id !== id);
        storage.set('qp_workspaces', list);
        return Promise.resolve(true);
      },
      launchWorkspace: () => Promise.resolve(true),
      onWindowActivated: (cb) => createTauriListener('launcher:window-activated', cb)
    },

    workspaces: {
      getWorkspaces: () => Promise.resolve(storage.get('qp_workspaces', [])),
      saveWorkspace: (ws) => {
        const list = storage.get('qp_workspaces', []);
        const idx = list.findIndex(w => w.id === ws.id);
        if (idx >= 0) list[idx] = ws; else list.push(ws);
        storage.set('qp_workspaces', list);
        return Promise.resolve(ws);
      },
      deleteWorkspace: (id) => {
        const list = storage.get('qp_workspaces', []).filter(w => w.id !== id);
        storage.set('qp_workspaces', list);
        return Promise.resolve(true);
      },
      launchWorkspace: () => Promise.resolve(true),
    },

    notes: {
      getNotes: (filter) => {
        const notes = storage.get('qp_notes', []);
        if (!filter) return Promise.resolve(notes);
        return Promise.resolve(notes.filter(n => !n.archived));
      },
      saveNote: (note) => {
        const notes = storage.get('qp_notes', []);
        const id = note.id || `note-${Date.now()}`;
        const newNote = { ...note, id, updatedAt: Date.now() };
        const idx = notes.findIndex(n => n.id === id);
        if (idx >= 0) notes[idx] = newNote; else notes.unshift(newNote);
        storage.set('qp_notes', notes);
        return Promise.resolve(newNote);
      },
      deleteNote: (id) => {
        const notes = storage.get('qp_notes', []).filter(n => n.id !== id);
        storage.set('qp_notes', notes);
        return Promise.resolve(true);
      },
      undoDelete: () => Promise.resolve(true),
      togglePin: (id) => {
        const notes = storage.get('qp_notes', []);
        const note = notes.find(n => n.id === id);
        if (note) note.pinned = !note.pinned;
        storage.set('qp_notes', notes);
        return Promise.resolve(note);
      },
      toggleArchive: (id) => {
        const notes = storage.get('qp_notes', []);
        const note = notes.find(n => n.id === id);
        if (note) note.archived = !note.archived;
        storage.set('qp_notes', notes);
        return Promise.resolve(note);
      },
      saveDraft: (draft) => {
        storage.set('qp_note_draft', draft);
        return Promise.resolve(true);
      },
      getDraft: () => Promise.resolve(storage.get('qp_note_draft', null)),
      clearDraft: () => {
        localStorage.removeItem('qp_note_draft');
        return Promise.resolve(true);
      },
      getContextualCapture: () => Promise.resolve(null),
      searchNotes: (q) => {
        const notes = storage.get('qp_notes', []);
        return Promise.resolve(notes.filter(n => (n.text || n.title || '').toLowerCase().includes((q || '').toLowerCase())));
      },
      getTags: () => Promise.resolve([]),
      convertToTask: () => Promise.resolve(true),
      onQuickCaptureTriggered: (cb) => createTauriListener('notes:quick-capture-triggered', cb),
      onNotesUpdated: (cb) => createTauriListener('notes:updated', cb)
    },

    shortcuts: {
      getTabShortcuts: () => Promise.resolve(storage.get('qp_tab_shortcuts', {})),
      setTabShortcuts: (sc) => {
        storage.set('qp_tab_shortcuts', sc);
        return Promise.resolve(sc);
      },
      resetTabShortcuts: () => {
        localStorage.removeItem('qp_tab_shortcuts');
        return Promise.resolve({});
      },
      onOpenTabInstant: (cb) => createTauriListener('open-tab-instant', cb),
      onShortcutsUpdated: (cb) => createTauriListener('shortcuts:updated', cb)
    },

    getMascotMode: () => Promise.resolve(localStorage.getItem('qp_mascot_mode') === 'true'),
    setMascotMode: (enabled) => {
      localStorage.setItem('qp_mascot_mode', String(enabled));
      return Promise.resolve(enabled);
    },

    getMinimalNotch: () => Promise.resolve(localStorage.getItem('qp_minimal_notch') === 'true'),
    setMinimalNotch: (enabled) => {
      localStorage.setItem('qp_minimal_notch', String(enabled));
      return Promise.resolve(enabled);
    },
    toggleMinimalNotch: () => {
      const next = !(localStorage.getItem('qp_minimal_notch') === 'true');
      localStorage.setItem('qp_minimal_notch', String(next));
      return Promise.resolve(next);
    },

    getHiddenTabs: () => Promise.resolve(storage.get('qp_hidden_tabs', [])),
    setHiddenTabs: (tabs) => {
      storage.set('qp_hidden_tabs', tabs);
      return Promise.resolve(tabs);
    },
    onHiddenTabsChange: (cb) => createTauriListener('settings:hidden-tabs-changed', cb),

    getTabOrder: () => Promise.resolve(storage.get('qp_tab_order', [])),
    setTabOrder: (tabs) => {
      storage.set('qp_tab_order', tabs);
      return Promise.resolve(tabs);
    },
    onTabOrderChange: (cb) => createTauriListener('settings:tab-order-changed', cb),

    openSettingsWindow: () => invoke('open_settings_window').catch((e) => console.error('[Bridge] openSettingsWindow:', e)),

    startDrag: () => {},
    cacheFileIcon: () => Promise.resolve(null),

    clipboard: {
      getHistory: () => invoke('get_clipboard_history').catch(() => []),
      write: (text) => invoke('write_clipboard_text', { text }).catch(() => false),
      clear: () => invoke('clear_clipboard').catch(() => false),
      onUpdate: (cb) => createTauriListener('clipboard:update', cb)
    },

    onObstructionStatus: (cb) => {
      const handler = (payload) => {
        const isObstructed = Boolean(payload?.isObstructed ?? payload?.obstructed);
        cb({ isObstructed, obstructed: isObstructed });
      };
      const unsub1 = createTauriListener('obstruction-changed', handler);
      const unsub2 = createTauriListener('desktop:obstruction-status', handler);
      return () => {
        unsub1();
        unsub2();
      };
    },

    onMascotModeChange: (cb) => createTauriListener('settings:mascot-mode-changed', cb),
    onMinimalNotchChange: (cb) => createTauriListener('settings:minimal-notch-changed', cb),

    getSmartBrowserAvoidance: () => Promise.resolve(localStorage.getItem('qp_smart_avoidance') !== 'false'),
    setSmartBrowserAvoidance: (enabled) => {
      localStorage.setItem('qp_smart_avoidance', String(enabled));
      return Promise.resolve(enabled);
    },
    onSmartBrowserAvoidanceChange: (cb) => createTauriListener('settings:smart-browser-avoidance-changed', cb),

    onToggleMinimalNotchHotkey: (cb) => createTauriListener('toggle-minimal-notch-hotkey', cb),

    getPrivacyDots: () => Promise.resolve(localStorage.getItem('qp_privacy_dots') !== 'false'),
    setPrivacyDots: (enabled) => {
      localStorage.setItem('qp_privacy_dots', String(enabled));
      return Promise.resolve(enabled);
    },
    onPrivacyDotsChange: (cb) => createTauriListener('settings:privacy-dots-changed', cb),

    invalidateWindow: () => Promise.resolve(true),

    askJarvis: (prompt) => invoke('ask_jarvis', { text: prompt }).catch((e) => ({
      success: false,
      error: String(e)
    })),
    getJarvisConfig: () => invoke('get_jarvis_config').catch(() => ({
      enabled: true,
      endpoint: 'http://127.0.0.1:8765/api/process',
      timeout_seconds: 45,
      auto_speak: true,
      auto_collapse: true,
      collapse_delay: 8,
      auto_start_server: false,
    })),
    setJarvisConfig: (config) => invoke('set_jarvis_config', { config }).catch(() => false),
    testJarvisConnection: (endpoint) => invoke('test_jarvis_connection', { endpoint }).catch(() => ({ success: false })),
    launchJarvisServer: () => Promise.resolve({ success: false, message: 'JARVIS server must be running at 127.0.0.1:8765' }),
    stopJarvisServer: () => Promise.resolve(true),
    onJarvisConfigUpdate: (cb) => createTauriListener('jarvis:configUpdated', cb),

    // Phase 4: Idle working set memory trimmer
    trimMemory: () => invoke('trim_memory').catch(() => {}),
  };

  // Expose deeply guarded Proxy on window object
  window.electronAPI = createSafeProxy(bridgeAPI);
}

// Automatically initialize when imported
initBridge();

export default window.electronAPI;
