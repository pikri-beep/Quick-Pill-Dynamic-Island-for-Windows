FEATURE 
- [x] Terapkan efek dust disappear saat menghapus task, todo, notifikasi di electron (quick pill utama bukan tauri)
- [x] Terapkan suara notifikasi ala iphone saat notifikasi aktif di electron (quick pill utama bukan tauri)
- [x] Hapus feature capslock, tidak dibutuhkan
- [x] Saat ada notifikasi, muncul bannernya, aku ingin bannernya saat dihover, langsung ke section/module notifikasi
    - Hover di banner notifikasi langsung membuka notch di module Notifications (diverifikasi di app desktop).
    - Banner juga bisa diklik untuk membuka app/web notifikasi tersebut (deep link bila ada, kalau tidak aktivasi app yang berjalan).
- [x] Notifikasi bisa di swipe up untuk menghilangkan notifikasi, dan tambahkan shortcut untuk swipe up notifnya.
    - Swipe up (threshold 36px) di banner dan di notification center -> notifikasi di-dismiss + efek debu.
    - Shortcut global baru: Alt+Shift+D ("Dismiss Notification") untuk swipe up notifikasi terakhir.

BUGS
- [x] Quick pill sangat sensitif, Saat di hover dia buka lalu menutup.
    - Penyebab: build Electron tidak punya deteksi hover native (hanya Tauri yang punya watcher Rust), jadi hover bergantung pada mouse event yang diteruskan window click-through -- dan itu sering desync.
    - Perbaikan:added native cursor hit-test di main process (GetCursorScreenPoint vs hitbox notch), hover intent 140ms sebelum membuka, collapse diverifikasi lewat posisi kursor, dan CSS transition yang bentrok dengan Framer Motion dihapus.

- [x] Sekarang hovernya kurang responsif, terasa lama saat hover untuk expand dan lama saat mouse keluar dari notch untuk collapse
    - Settle time hover 140ms -> 20ms, collapse 280ms -> 90ms, poll cursor 50ms -> 30ms. Anti-flicker tetap dijaga lewat native hit-test + verifikasi posisi kursor. Terukur: cursor di notch -> expand ~185ms, cursor keluar -> collapse ~105ms.

ALWAYS DO
- [x] push ke github ke branch main agar trigger update

TAURI PARITY AUDIT (v5.5.8)
- [x] Cross-window settings sync: event Tauri pakai `settings:{key}:changed` (camelCase) sedangkan bridge listen `settings:minimal-notch-changed` (kebab-case) -> semua toggle di Settings tidak sampai ke notch. Sekarang emit kebab-case + `settings:changed`.
- [x] `setIgnoreMouseEvents` tadinya no-op (Ctrl+hover click-through mati) dan command aslinya memakai `set_ignore_cursor_events` yang bikin window layered + notch hilang. Sekarang lewat flag WM_NCHITTEST.
- [x] Obstruction watcher disamakan dengan Electron: fullscreen selalu hide, maximized/top-anchored hanya saat Smart Browser Avoidance ON, window Settings ikut diabaikan.
- [x] Global hotkey: tiap simpan shortcut men-spawn thread registrasi baru (RegisterHotKey gagal / hotkey lama nyangkut). Sekarang satu thread + reload via PostThreadMessage.
- [x] `setDisplay` (multi-monitor) diimplementasikan native; `createDesktopShortcut` sekarang benar-benar membuat .lnk dan mengembalikan `{success}`.
- [x] JARVIS: `setJarvisConfig` tidak bisa menerima config parsial (tombol Enable/endpoint gagal), `testJarvisConnection` mengembalikan `{success}` padahal UI baca `{connected, details}`, `launchJarvisServer` tidak memakai `run_gui.bat`, `stopJarvisServer` no-op. Semua disamakan dengan Electron.
- [x] Progress Island tidak lagi stub: file picker, SHA-256 streaming, copy file, snapshot/history, cancel/clear + event `progress:update`.
- [x] Notes: filter tag/archived/pinned/recent, getTags, undoDelete, convertToTask, contextual capture dari clipboard.
- [x] Workspace launcher benar-benar membuka tiap target (app/url), bukan resolve(true).
- [x] System volume & focus window command native.
- [x] Media fetch diberi in-flight guard seperti Electron (hindari spawn PowerShell bertumpuk).
- [x] Notes `getContextualCapture` sekarang mengembalikan `{success, content}` (sebelumnya `{text}`, jadi tombol paste-context selalu dianggap kosong).
- [x] Thumbnail File Shelf: `file:///` diblokir WebView2, sekarang lewat asset protocol (`getFileUrl` + `convertFileSrc`).
- [x] Autostart: entri lama Electron (`Quick Pill`, `electron.app.*`, `Ripple`) dibersihkan; checkbox tray ikut sinkron saat diubah dari Settings.
- [x] Tombol Settings tidak membuka window di Tauri: command sinkron jalan di main thread (WebView2 butuh message loop -> hang) dan webview kedua memakai `additionalBrowserArgs` berbeda dari window `main` -> `HRESULT(0x8007139F)` ERROR_INVALID_STATE. Sekarang command `#[tauri::command(async)]`, args WebView2 disamakan lewat konstanta `WEBVIEW_BROWSER_ARGS`, dan menu tray membangun window dari worker thread. Diverifikasi di release build: window "Quick Pill Settings" tampil + semua tab render.
- [x] Smoke test build release (1920x1200 @150%): notch render di tengah atas, hover expand, mouse keluar collapse, notifikasi WinRT masuk.
- [x] Hit-test terverifikasi langsung: `WM_NCHITTEST` = `HTCLIENT` di badan notch, `HTTRANSPARENT` di area transparan (klik tembus ke app di bawah).
- [ ] Known limitation: drag-out File Shelf memakai clipboard `CF_HDROP` (Tauri tidak punya API native drag-out; Electron pakai `webContents.startDrag`).
- [ ] Known limitation: ganti output device audio tidak ada di Electron maupun Tauri (audio-helper hanya list/volume/mute) — bukan regresi migrasi.



