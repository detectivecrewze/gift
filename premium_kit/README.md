# 🌟 Arcade Edition: Premium Standalone Kit

Kit ini memungkinkan Anda untuk mendeploy kado kustomer sebagai website mandiri (misalnya: `kado-lisa.com`) tanpa ketergantungan pada database pusat. 

Ini adalah fitur **Premium** di mana kustomer mendapatkan URL bersih dan performa loading yang lebih cepat karena data sudah tertanam di dalam kode.

## Cara Menggunakan (Workflow)

### 1. Persiapan Folder
Copy seluruh isi folder `arcade/` dari project utama Anda ke folder baru di komputer Anda (misalnya buat folder bernama `premium-deployment`).

### 2. Isi Konfigurasi Data
Gunakan file `config.js` yang tersedia di dalam kit ini.
1. Pindahkan file `config.js` ke dalam folder kado baru Anda (sejajar dengan `index.html`).
2. Buka `config.js` dan isi data sesuai dengan hasil yang sudah dibuat kustomer di Studio (Nama, Foto, Pesan, Lagu, dll).

### 3. Deploy ke Vercel
1. Upload folder `premium-deployment` tadi ke GitHub (sebagai repository baru).
2. Hubungkan repository tersebut ke Vercel.
3. Vercel akan membaca file `index.html` dan otomatis memuat data dari `config.js` karena sistem kita sekarang sudah mendukung **Standalone Mode**.

## Keuntungan Standalone Mode:
- **White-Labeling**: Anda bisa menghapus branding "Arcade Edition" jika diinginkan.
- **Offline Ready**: Bisa dibuka tanpa koneksi internet (jika aset gambar/lagu sudah di-download).
- **Kecepatan**: Tidak ada proses `fetch` ke server API (lebih instan).
- **Custom Domain**: Anda bisa memasangkan domain apa saja ke website tersebut.

---
*Created by Antigravity for Arcade Edition Premium.*
