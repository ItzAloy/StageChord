# StageChord 🎸🎤

Aplikasi penampil chord dan lirik lagu gereja yang dirancang khusus untuk kebutuhan panggung (*stage display*). Aplikasi ini cepat, bersih dari iklan, dan sangat mudah digunakan oleh pemusik maupun *singers* langsung saat pelayanan.

## ✨ Fitur Utama

*   **Top-Align Layout**: Struktur *box section* (Intro, Verse, Chorus) yang dinamis dan nempel di atas, mencegah ukuran *box* melar atau terlalu besar.
*   **Monospace Rendering**: Posisi chord dan lirik dijamin 100% sejajar, presisi, dan anti-geser meski menggunakan spasi manual.
*   **Transpose & Number Notation (Nashville)**: Naik-turunkan nada dasar lagu secara dinamis atau ubah tampilan chord abjad menjadi notasi angka (*number system*) secara *real-time* di panggung.
*   **Compact Header**: Header bar yang tipis untuk memaksimalkan ruang baca lirik pada monitor panggung, lengkap dengan tombol Menu (`☰`) dan Edit (`✎`) yang tersusun vertikal di pojok kiri.
*   **Dinamis Font-Size Adjuster**: Tombol cepat (`+` / `-`) langsung di header untuk memperbesar atau memperkecil ukuran teks secara proporsional.
*   **Live Set (Playlist Manager)**: Atur daftar lagu yang akan dimainkan pada ibadah hari itu dengan fitur drag-and-drop.
*   **Data Sync & Management**: Fitur ekspor langsung ke `songData.ts` untuk menyimpan perubahan lagu secara permanen di VS Code, serta fitur *Backup/Import* data via JSON.

---

## 🚀 Cara Menjalankan Project

### 1. Install Dependencies
```bash
npm install