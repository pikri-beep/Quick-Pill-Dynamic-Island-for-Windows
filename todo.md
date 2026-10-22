FEATURE 
- [x] Terapkan efek dust disappear saat menghapus task, todo, notifikasi di electron (quick pill utama bukan tauri)
- [x] Terapkan suara notifikasi ala iphone saat notifikasi aktif di electron (quick pill utama bukan tauri)
- [x] Hapus feature capslock, tidak dibutuhkan


BUGS
- [x] Quick pill sangat sensitif, Saat di hover dia buka lalu menutup.
    - Penyebab: build Electron tidak punya deteksi hover native (hanya Tauri yang punya watcher Rust), jadi hover bergantung pada mouse event yang diteruskan window click-through -- dan itu sering desync.
    - Perbaikan:added native cursor hit-test di main process (GetCursorScreenPoint vs hitbox notch), hover intent 140ms sebelum membuka, collapse diverifikasi lewat posisi kursor, dan CSS transition yang bentrok dengan Framer Motion dihapus.


ALWAYS DO
- [x] push ke github ke branch main agar trigger update


Next Time
- [] Pengaturan AI, sediakan groq untuk opsi AI (kecuali diriku karena aku ada JARVIS)
