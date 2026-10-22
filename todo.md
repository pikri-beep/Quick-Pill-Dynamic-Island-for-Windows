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
- [ ] push ke github ke branch main agar trigger update


Next Time
- [] Pengaturan AI, sediakan groq untuk opsi AI (kecuali diriku karena aku ada JARVIS)
