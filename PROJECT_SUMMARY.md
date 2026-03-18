# Arcade Edition — Project Summary
**Owner:** Aldor (AL)  
**Period:** March 12–18, 2026  
**Stack:** Cloudflare Workers + R2, Next.js (landing page), Vanilla JS, HTML/CSS

---

## 🎯 Tentang Project

**For You, Always.** adalah platform kado digital romantis dengan dua produk:

### 1. Voices. Gift
Layanan kado digital emosional berbasis foto dan suara. Customer dapat mengunggah 12-15 foto kenangan serta merekam atau mengunggah pesan suara pribadi. Audio tersebut dapat dipadukan dengan musik latar (ambient) pilihan untuk menciptakan pengalaman yang menyentuh hati. Penerima kado akan melihat galeri foto yang sinkron dengan pesan suara pengirim.

### 2. Arcade Edition ⭐ (Fokus Utama)
Platform kado interaktif dengan **10 ruangan** berbasis pixel art Ghibli. Customer mengisi konten lewat **Studio Editor** sendiri (self-serve, privat), lalu publish dan kirim link ke pasangan. Penerima buka lewat password.

**Harga:** Rp 20.000  
**Domain:** `for-you-always.my.id` (landing page) + `arcade.for-you-always.my.id` (Arcade demo & clean links)
**Target customer:** 90% perempuan, romantic, non-IT, pakai HP

---

## 🏗️ Arsitektur Teknis

```
for-you-always.my.id (Next.js)
├── / → Voices Gift landing page
└── /arcade → Arcade Edition landing page

arcade.for-you-always.my.id (Vercel Routing / Cloudflare Workers)
├── / → Arcade Demo (Instant Access)
├── /admin → Admin Insight Dashboard
├── /generator → Studio Project Generator
├── /studio/:token → Regular Studio Editor
├── /studio-premium/:token → Premium Studio Editor
└── /:id → Arcade Player (Recipient View)

Storage: Cloudflare R2 (foto, video, audio, assets)
CDN: cdn.for-you-always.my.id
Region: Singapore (ap-southeast-1)
AI: Qwen Plus via dashscope-intl.aliyuncs.com
```

---

## 🎮 10 Ruangan Arcade

| Room | Deskripsi |
|------|-----------|
| **Music** | Putar lagu dengan star visualizer |
| **Journey** | Timeline hubungan dari awal (dengan hint tips jadian/nikah) |
| **Moments** | Galeri foto sinematik |
| **Quiz** | Tebak jawaban tentang penerima (up to 10 QS) |
| **Atlas** | Peta kenangan interaktif (Windows 98 Style) |
| **Catcher** | Mini-game tangkap bintang |
| **Fortune** | Kartu ramalan romantis |
| **Things I Love** | Flip card hal yang dicintai |
| **Bucket List** | Daftar impian bersama gaya journal vertical |
| **Message** | Pesan cinta penutup |

---

## ✅ Semua Pekerjaan yang Sudah Selesai

### 🔧 Setup & Infrastructure
- Install **The Agency** (68 AI skills) di Windows via Antigravity
- Setup semua agency skill prompt untuk dipakai sebagai prompter
- Cloudflare Workers deployment pipeline

### 🔒 Security & Bug Fixes
- **Security patch** — Worker `/submit` menolak jika ID sudah ada kecuali `studioPassword` cocok
- **Performance fix** — `will-change: transform, opacity` di God Rays & Petals CSS
- **AI migration** — Ganti Gemini → Qwen Plus (endpoint Singapore/intl)
- **Autosave bug fix #1** — Race condition: autosave tidak cek `Music.isUploading()` sebelum save
- **Autosave bug fix #2** — Infinite retry loop di catch block dihapus
- **Things I Love publisher fix** — `things_i_love` tidak masuk ke `validatedPayload`, sudah diperbaiki

### 🎨 Studio Editor (Regular & Premium)
- **Section reordering** — urutan baru: Recipient Name → Journey → Moments → Music → Quiz → Things I Love → Bucket List → Message → Password
- **Quiz MAX_QUESTIONS** — dinaikkan dari 7 → 10 pertanyaan
- **Admin dashboard** — folder `admin/` baru untuk monitoring customer
- **Premium Studio Refinement** — Centering modal sukses, penambahan langkah konfirmasi "Sudah Selesai?", dan integrasi input Vercel Domain Request.
- **Vercel Domain Validation** — Proteksi input domain agar tidak mengandung spasi, emoji, atau karakter spesial.
- **Barcode (QR Code) Integration** — Sistem otomatis generate QR kado aesthetic yang bisa didownload user.

### 🕹️ Arcade Player
- **Things I Love room** — redesign total menjadi **flip card** system:
  - Front: gradient cream, "Tap untuk membuka ✦"
  - Back: Dancing Script font, tinggi auto
  - Persistent state via `sessionStorage`
- **Wood Sign dynamic name** — menampilkan "For [Name], Always" dengan nama di-highlight gold italic, auto-shrink font untuk nama panjang
- **Password hint redesign** — kraft/cream gradient, pin emoji, animasi slide-up
- **Bucket List redesign** — journal diary vertical: book spine, ruled lines, red margin line, Caveat font, golden circle checkmarks
- **Main menu reordering** — Row 1: Music·Journey·Moments·Quiz | Row 2: Atlas·Catcher·Fortune·Things·Bucket·Message
- **Menu items margin** — turun 30px desktop, 20px mobile
- **Persistent iframe** — Things I Love tidak reload saat dibuka ulang
- **Typography Overhaul** — Integrasi font `Caveat` (22px) untuk pesan personal agar lebih personal dan nyaman dibaca.

### 🌐 Branding & Routing (Update Maret 18)
- **Clean URL Routing** — Menghilangkan `.html` dari semua path. `/admin`, `/generator`, dan `/studio` kini bisa diakses langsung.
- **Root Demo Mapping** — Domain utama `arcade.for-you-always.my.id` langsung mengarah ke demo Arcade.
- **Favicon Integration** — Integrasi lengkap (ICO, PNG, SVG, Apple Touch Icon) di seluruh modul proyek.
- **Workspace Cleanup** — Menghapus file zip dan folder temporary, merapikan aset ke `/assets/favicons`.

### 📍 Atlas of Us (Room ke-10)
- **Room Development** — Room berbasis peta interaktif dengan tema Windows 98 dan background Ghibli sea.
- **Pin Management** — Fitur tambah pin lokasi, upload foto lokasi, dan catatan kenangan di Studio.
- **Simplified Instructions** — Panduan copy-link manual yang lebih stabil untuk user.
- **Pagination Logic** — Perbaikan navigasi: Overview (0/N) ➡️ Location 1 ➡️ dst.

### 🌟 Stargazing Room (Dibuat lalu di-revert)
- Room baru "Stargazing" — langit malam, bintang = kenangan, tap bintang → popup cerita + foto
- Diputuskan di-revert karena hasil visual kurang memuaskan

---

## 📁 Struktur File Penting

```
/ (Root)
├── vercel.json         ← Routing Config
├── arcade/
│   ├── index.html      ← Main player
│   ├── assets/
│   │   └── favicons/   ← Branding assets
│   └── rooms/          ← 10 rooms (termasuk Atlas-Of-Us)
├── studio/             ← Editor Regular
├── studio-premium/     ← Editor Premium
├── admin/              ← Dashboard Admin
└── generator/          ← Project Generator
/landing (Next.js - for-you-always.my.id)
├── app/
│   ├── (landing)/
│   │   ├── layout.tsx   ← Navbar shared
│   │   └── page.tsx     ← Voices landing
│   └── arcade/
│       └── page.tsx     ← Arcade landing
└── styles/
    ├── landing.css
    └── arcade.css
```

---

## 🔑 Info Teknis Penting

| Key | Value |
|-----|-------|
| Worker URL | `arcade-edition.aldoramadhan16.workers.dev` |
| CDN | `cdn.for-you-always.my.id` |
| WhatsApp | `wa.me/6281381543981` |
| AI Endpoint | `dashscope-intl.aliyuncs.com` (Singapore) |
| AI Model | `qwen-plus` |
| R2 Region | `ap-southeast-1` |
| Voices GIF | `bpahzgewtgfjwobjrpdk.supabase.co/...voices.gif` |

---

## 📋 Aturan Kerja yang Disepakati

1. **SELALU** tulis "DO NOT push to GitHub, DO NOT deploy to Cloudflare" di setiap prompt
2. Max **4 agency skills** per prompt
3. Selalu minta **planning dulu**, tunggu ACC sebelum eksekusi
4. Selalu push perubahan sebelum implement fitur baru
5. Pakai **intl endpoint** untuk semua API (Singapore region)
6. **Tidak ada emoji** di landing page — gunakan SVG icons
7. Desain harus **feminine, warm, romantic** — bukan sci-fi atau boyish

---

---

## 💎 Voices Gift — Premium Standalone Mode

Fase ini bertujuan untuk membuat produk "Layanan Jasa Pembuatan Website Kado" yang benar-benar mandiri dan eksklusif.

### Fitur Baru & Perubahan:
1. **Premium Submission Flow**: Studio Premium kini mengirimkan data kado langsung ke Telegram Admin dalam bentuk ringkasan order dan file `config.js` yang siap pakai.
2. **Standalone Configuration**: Semua tema di Voices Gift (Original, Rosewood, Midnight, Mossy, Magenta) kini mendukung file `config.js`. Jika file ini ada di folder tema, website akan otomatis berjalan tanpa memerlukan koneksi ke database pusat.
3. **Vercel Domain Request**: Di akhir proses pembuatan, pelanggan wajib menentukan nama domain yang mereka inginkan (contoh: `kado-untuk-lisa.vercel.app`). Informasi ini otomatis diteruskan ke admin via Telegram & WhatsApp.
4. **AI Message Generator (Qwen)**: Integrasi dengan Qwen AI Alibaba untuk membantu pelanggan menulis pesan romantis secara otomatis sesuai *tone* yang dipilih (Romantis, Lucu, Santai, atau Tulus).

### Workflow Operasional:
1. Pelanggan mengisi konten di `studio-premium/`.
2. Setelah klik Publish, Admin menerima chat di Telegram berisi `config.js`.
3. Admin memasukkan `config.js` ke folder tema yang dipilih (misal folder `gift-sage/`).
4. Admin men-deploy folder tersebut ke Vercel dengan domain pilihan pelanggan.
5. Selesai. Link kado bersifat permanen dan sangat cepat diakses.

---

## 🚧 Yang Masih Pending / Belum Selesai

1. **Deep bug audit** seluruh `/arcade` folder — prompt sudah dibuat, belum dijalankan.
2. **Video/GIF main menu** — placeholder di slideshow, belum ada URL video asli.
3. **Background Stargazing** — belum ada Ghibli night sky background yang cocok.
4. **Room Stargazing** — direverted, mungkin akan dibangun ulang dengan visual yang lebih baik di masa depan.
5. **Marketing Deployment** — Strategi sudah siap (`marketing-strategy.md`), tinggal eksekusi.

🚀 **Last Updated: March 18, 2026**
