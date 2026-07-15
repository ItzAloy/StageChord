Berikut adalah draf file **`README.md`** yang baru. Isinya sudah diperbarui total menjadi ringkasan dari proyek aplikasi **StageChord** kamu, dibuat super simpel, rapi, dan menjelaskan cara kerjanya secara langsung tanpa embel-embel template default Vite lagi.

Kamu bisa langsung salin dan timpa isi file `README.md` lama kamu di VS Code:

---

```markdown
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

```

### 2. Jalankan Server Dev (Lokal)

```bash
npm run dev

```

### 3. Build untuk Production

```bash
npm run build

```

---

## 💾 Cara Menyimpan Perubahan Lagu ke VS Code

Karena perubahan lagu di web tersimpan di penyimpanan browser (*LocalStorage*), gunakan cara ini agar perubahan masuk secara permanen ke file proyek di VS Code:

1. Edit atau tambahkan lagu melalui menu **Composer Form** di website.
2. Buka sidebar, lalu scroll ke panel management paling bawah.
3. Klik tombol **Export songData.ts**.
4. Ambil file unduhan tersebut, lalu timpa (*overwrite*) file `src/songData.ts` lama di folder proyek VS Code kamu.
5. Lakukan `git commit` dan `git push` ke repository GitHub kamu!

```