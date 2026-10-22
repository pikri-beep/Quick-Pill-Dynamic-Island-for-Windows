FEATURE 
- [x] Terapkan efek dust disappear saat menghapus task, todo, notifikasi di electron (quick pill utama bukan tauri)
- [x] Terapkan suara notifikasi ala iphone saat notifikasi aktif di electron (quick pill utama bukan tauri)

BUGS
- [x] update di setting tidak bekerja, saat disuruh restart. aplikasi tidak menjalankan ulang, Saat direstart manual pun tidak terupdate
    - Installer kini dijalankan helper PowerShell terpisah: tunggu proses Quick Pill benar-benar keluar, lepas lock (audio-helper), install diam, lalu relaunch versi baru.
    - Download gagal (404/hash rusak) tidak lagi dilaporkan "berhasil" sehingga tidak mencoba install file yang sudah dihapus.
    - Manifest update diambil dari repo rilis (R2 yang sertifikatnya kedaluwarsa dibuang).


ALWAYS DO
- [x] push ke github ke branch main agar trigger update


Next Time
- [] Pengaturan AI, sediakan groq untuk opsi AI (kecuali diriku karena aku ada JARVIS)
