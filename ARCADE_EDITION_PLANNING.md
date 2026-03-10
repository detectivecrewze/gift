# Arcade Edition — For You, Always.
### Complete Build Planning Document
> Dokumen ini adalah panduan lengkap untuk membangun produk **Arcade Edition** dari nol. Baca seluruh dokumen sebelum mulai mengeksekusi apapun.

---

## 1. KONTEKS PRODUK

### Apa ini?
Arcade Edition adalah produk digital gift **kedua** dari brand **For You, Always.** — terpisah sepenuhnya dari produk pertama (Voice Gift).

### Perbedaan dari Voice Gift
| | Voice Gift | Arcade Edition |
|---|---|---|
| Inti produk | Rekaman suara | Foto, lagu, pesan tulisan |
| Target user | Semua orang | Yang tidak mau rekam suara |
| Tampilan gift | Cinematic audio player | Pixel art Ghibli interactive |
| Voice recording | Wajib | Tidak ada sama sekali |

### Yang Bisa Dilakukan Customer
Customer (pemberi kado) mengisi 5 hal di studio editor:
1. **Nama penerima** — untuk keperluan URL deploy
2. **Upload foto** — max 15 foto, drag & drop
3. **Upload lagu** — 1 file audio MP3/M4A, max 7MB
4. **Tulis pesan** — surat personal, font handwriting
5. **Tanggal mulai bersama** — untuk timer anniversary real-time

### Yang Dialami Penerima Kado
Penerima buka link → loading screen → main menu pixel art Ghibli → 4 room interaktif.

---

## 2. FLOW BISNIS

```
Customer order + bayar ke owner
        ↓
Owner generate token/ID unik
        ↓
Owner kirim link studio ke customer
        ↓
Customer buka studio:
  → Isi nama penerima
  → Upload foto (max 15)
  → Upload lagu (1 file)
  → Tulis pesan
  → Set tanggal anniversary
  → Klik Submit
        ↓
Owner dapat notifikasi WhatsApp
        ↓
Owner deploy gift page ke Vercel
dengan custom URL: untuk-[nama].vercel.app
        ↓
Owner kirim link final ke customer
        ↓
Customer kirim link ke pasangan
```

---

## 3. STRUKTUR FILE LENGKAP

```
/arcade/
  index.html          → loading screen + main menu (SATU FILE)
  style.css
  script.js

  /rooms/
    /moments/
      index.html      → galeri foto polaroid
      style.css
      script.js

    /journey/
      index.html      → timer anniversary real-time
      style.css
      script.js

    /message/
      index.html      → surat/pesan handwriting
      style.css
      script.js

    /music/
      index.html      → music player (tidak autoplay)
      style.css
      script.js

/studio/
  index.html          → semua UI studio dalam SATU FILE
  style.css
  js/
    auth.js           → validasi token dari URL
    uploader.js       → upload foto ke R2
    music.js          → upload lagu ke R2
    message.js        → tulis pesan, char counter
    date-picker.js    → set tanggal anniversary
    autosave.js       → autosave dengan debounce 3 detik
    publisher.js      → submit order + notif WA ke owner
    studio.js         → main controller, sambungkan semua module

/worker/
  index.js            → Cloudflare Worker (semua endpoint)
```

---

## 4. CLOUDFLARE WORKER

### Stack
- **Runtime**: Cloudflare Worker
- **Storage foto & audio**: Cloudflare R2
- **Database config**: Cloudflare KV
- **Notifikasi**: WhatsApp via Fonnte API

### Endpoints

#### `POST /upload`
Upload foto atau audio ke R2.
```
Request: FormData { file, type: 'photo'|'audio', id }
Response: { success: true, url: 'https://...' }
```

#### `POST /submit`
Simpan semua data studio ke KV + kirim notifikasi WA ke owner.
```
Request (JSON):
{
  "id": "token-unik",
  "recipient_name": "Bintang",
  "photos": ["url1", "url2", ...],
  "audio_url": "url",
  "message": "Hei kamu...",
  "anniversary_date": "2023-03-09",
  "password": "opsional",
  "status": "pending"
}

Response: { success: true }
```

#### `GET /get-config?id=`
Gift page ambil semua data customer dari KV.
```
Response (JSON):
{
  "recipient_name": "Bintang",
  "photos": ["url1", "url2"],
  "audio_url": "url",
  "message": "Hei kamu...",
  "anniversary_date": "2023-03-09",
  "password": null,
  "status": "pending"
}
```

### Data Structure di KV
```json
{
  "recipient_name": "Bintang",
  "photos": ["url1", "url2"],
  "audio_url": "https://r2.../audio.mp3",
  "message": "Hei kamu, aku mau bilang...",
  "anniversary_date": "2023-03-09",
  "password": null,
  "status": "pending",
  "submitted_at": "2026-03-09T10:00:00Z"
}
```

---

## 5. STUDIO EDITOR

### Referensi
Studio editor ini mengikuti **pola yang sama** dengan Voice Gift studio yang sudah ada. Semua module JS bersifat modular dan saling berkomunikasi melalui `studio.js` sebagai controller utama.

### auth.js
- Ambil token dari URL: `/studio?token=xxx` atau `/studio/xxx`
- `GET /get-config?id=token` ke worker
- Jika token valid → tampilkan studio
- Jika token tidak ada → tampilkan error state
- Jika sudah submitted → tampilkan state "sudah dikirim"
- Expose `Auth.getToken()` dan `Auth.getInitialConfig()` ke module lain

### uploader.js
- Drag & drop area untuk foto
- Multiple file upload
- Max 15 foto
- Preview instan setelah upload
- Upload langsung ke R2 via `POST /upload`
- Tampilkan progress per foto
- Bisa reorder foto (drag to sort)
- Bisa hapus foto individual
- Expose `Uploader.isUploading()` ke publisher.js

### music.js
- Upload 1 file audio (MP3/M4A)
- Max 7MB
- Preview player setelah upload (bisa play/pause di studio)
- Upload ke R2 via `POST /upload` dengan `type: 'audio'`
- Tampilkan nama file + durasi setelah upload
- Bisa ganti/hapus lagu

### message.js
- Textarea untuk tulis pesan
- Font: Caveat (handwriting) dari Google Fonts
- Max 800 karakter
- Character counter real-time
- Trigger autosave saat ada perubahan

### date-picker.js
- Input tanggal "mulai bersama"
- Format: DD/MM/YYYY atau date picker native
- Validasi: tidak boleh tanggal di masa depan
- Trigger autosave saat berubah

### autosave.js
- Debounce 3 detik setelah ada perubahan
- `POST /submit` dengan status `"draft"`
- Indikator: "Menyimpan..." → "✓ Tersimpan" → fade out
- Min interval 2 menit antar save (sama seperti Voice Gift)
- Cancel in-flight save jika ada save baru

### publisher.js
- Validasi sebelum submit:
  - Minimal 1 foto wajib ada
  - Nama penerima wajib diisi
  - Pesan wajib diisi
  - Tanggal anniversary wajib diisi
  - Lagu wajib diupload
- Klik Submit → `POST /submit` dengan status `"pending"`
- Tampilkan modal sukses: "Pesanan kamu sudah diterima! Kami akan menghubungimu dalam 1x24 jam 🤍"
- Setelah submit, studio dikunci (tidak bisa edit lagi)

### studio.js
- Controller utama
- Init semua module: `Auth → Uploader → Music → Message → DatePicker → Autosave → Publisher`
- `Studio.getState()` → return semua data terkini
- `Studio.showToast(message)` → tampilkan toast notification
- Sambungkan semua event antar module

---

## 6. GIFT PAGE — VISUAL LENGKAP

### Screen 1: Loading Screen
**Cara kerja:**
- Layar pertama saat link dibuka
- Fetch data dari `GET /get-config?id=` sambil animasi berjalan
- Jika ada password → setelah loading, tampilkan password gate
- Jika tidak ada password → langsung masuk main menu

**Visual:**
- Background: gelap warm `#2C1810`
- Animasi buku terbuka pelan (CSS transform + perspective)
- Halaman buku bergerak seperti tertiup angin
- Setelah buku terbuka: teks muncul pelan di tengah
- Teks: *"For [nama], Always. 🤍"*
- Font: Cormorant Garamond italic
- Durasi total: 2-3 detik → auto transisi ke main menu

### Screen 2: Password Gate (Opsional)
- Muncul hanya jika customer set password di studio
- Input password sederhana
- Jika salah → shake animation + error message
- Jika benar → masuk main menu

### Screen 3: Main Menu
**Background (dari atas ke bawah):**
- Langit biru Ghibli: `#87CEEB` → `#C9E8F5`
- Matahari pixel kecil di pojok kiri atas dengan glow
- Awan putih gemuk pixel: bergerak horizontal pelan ke kanan (CSS animation infinite)
- 2-3 awan dengan kecepatan berbeda untuk efek parallax
- Partikel sparkle kecil melayang random di udara
- Bukit hijau pixel berlapis di bawah: `#5B8C3E` → `#7AB648`
- Tanah pixel di paling bawah: `#8B5E3C`

**4 Item Pixel Art di atas bukit:**

Setiap item memiliki:
- Sprite pixel art (dibuat dengan CSS atau inline SVG pixel)
- Label teks di bawah: font Press Start 2P (kecil)
- Animasi float naik turun pelan (CSS keyframes, offset timing berbeda)
- Hover: glow effect + sparkle muncul
- Klik: fade out → transisi ke room

| Item | Label | Room Tujuan |
|---|---|---|
| 📷 Kamera tua pixel | MOMENTS | /rooms/moments/ |
| ⏱️ Jam pasir pixel | JOURNEY | /rooms/journey/ |
| 📖 Amplop pixel | MESSAGE | /rooms/message/ |
| 🎵 Gramofon pixel | MUSIC | /rooms/music/ |

### Screen 4: Room Moments
**Background:**
- Padang rumput Ghibli
- Langit sore warm keemasan
- Partikel daun/bunga melayang pelan

**Konten:**
- Foto ditampilkan dalam frame polaroid pixel art
- Navigasi: tombol panah kiri/kanan
- Indikator halaman: "1 / 5" di bawah
- Transisi antar foto: slide atau fade
- Back button pojok atas → kembali ke main menu

### Screen 5: Room Journey
**Background:**
- Langit senja: gradasi oranye → ungu → biru gelap
- Bintang pixel bermunculan pelan
- Bulan pixel di pojok atas

**Konten:**
- Jam pasir pixel animasi berputar di tengah
- Teks di bawah jam pasir:
  ```
  Sudah bersama selama
  1 tahun 2 bulan 14 hari
  6 jam 32 menit 18 detik
  ```
- Detik terus bergerak real-time (`requestAnimationFrame`)
- Kalkulasi dari `anniversary_date` yang diset customer
- Font: Press Start 2P untuk angka, DM Sans untuk label

### Screen 6: Room Message
**Background:**
- Interior rumah Ghibli
- Meja kayu dengan lilin menyala
- Efek candlelight flicker pada lilin
- Jendela dengan cahaya hangat dari luar

**Konten:**
- Surat terbuka pelan (animasi CSS)
- Teks pesan muncul seperti ditulis tangan (typewriter effect pelan)
- Font: Caveat (handwriting)
- Warna teks: `#3D2B1A` (coklat tua)

### Screen 7: Room Music
**Background:**
- Taman Ghibli siang hari
- Pohon dan rumput bergerak tertiup angin
- Langit biru cerah

**Konten:**
- Gramofon pixel di tengah layar
- **TIDAK autoplay** — ada tombol play yang harus diklik
- Saat play: jarum gramofon bergerak, piringan berputar
- Partikel musik (♪ ♫) beterbangan saat musik play
- Tombol pause tersedia
- Progress bar sederhana

---

## 7. VISUAL SYSTEM

### Color Palette
```
Langit:        #87CEEB → #C9E8F5
Awan:          #FFFFFF
Bukit:         #5B8C3E → #7AB648
Tanah:         #8B5E3C
Accent:        #F4C653  (kuning Ghibli)
Text utama:    #3D2B1A  (coklat tua)
Loading bg:    #2C1810  (warm dark)
```

### Typography
```
Display/Title:   Cormorant Garamond  (loading screen, judul)
Pixel label:     Press Start 2P      (item label, timer angka)
Handwriting:     Caveat              (room message)
Body/UI:         DM Sans             (semua teks UI biasa)
```

### Animasi Kunci
```
Awan:            bergerak kanan, infinite, linear
Item float:      translateY -8px → 0 → -8px, 3s ease-in-out
Sparkle hover:   muncul random di sekitar item, fade out 0.5s
Transisi room:   fade + scale 0.95 → 1, 0.3s ease
Timer:           requestAnimationFrame, update tiap detik
Buku loading:    CSS perspective transform, 2s ease
Candlelight:     opacity 0.8 → 1 random, 0.15s
Typewriter:      karakter muncul satu per satu, 30ms interval
```

---

## 8. URUTAN BUILD

```
① WORKER
   → Setup Cloudflare Worker baru (terpisah dari Voice Gift)
   → Buat R2 bucket baru
   → Buat KV namespace baru
   → Implement POST /upload
   → Implement POST /submit + notif WA
   → Implement GET /get-config
   → Test semua endpoint

② STUDIO EDITOR
   → auth.js
   → uploader.js
   → music.js
   → message.js
   → date-picker.js
   → autosave.js
   → publisher.js
   → studio.js (sambungkan semua)
   → index.html + style.css (UI)
   → Test full flow studio

③ GIFT PAGE — MAIN MENU
   → index.html struktur dasar
   → Loading screen + animasi buku
   → Fetch data dari worker
   → Background Ghibli pixel art
   → 4 item pixel + animasi float
   → Hover effects + sparkle
   → Klik → navigasi ke room
   → Test di mobile

④ GIFT PAGE — 4 ROOMS
   → /rooms/moments/ (galeri polaroid)
   → /rooms/journey/ (timer real-time)
   → /rooms/message/ (surat typewriter)
   → /rooms/music/ (player, tidak autoplay)
   → Back button di setiap room
   → Test navigasi antar room

⑤ POLISH & TESTING
   → Mobile responsive semua halaman
   → Cross browser (Chrome, Safari, Firefox)
   → Performance (lazy load foto)
   → Password gate (opsional)
   → Edge cases: foto 1, foto 15, pesan panjang
   → Deploy test ke Vercel
```

---

## 9. CATATAN PENTING UNTUK EKSEKUSI

1. **Proyek ini TERPISAH dari Voice Gift** — worker berbeda, R2 berbeda, KV berbeda, domain berbeda.

2. **Studio editor mengikuti pola Voice Gift** — struktur module JS yang sama, autosave pattern yang sama, auth pattern yang sama. Gunakan sebagai referensi, bukan copy paste.

3. **Tidak ada voice recording sama sekali** — jangan tambahkan `voice-recorder.js` atau fitur rekam suara apapun.

4. **Musik tidak autoplay** — saat penerima masuk room music, lagu tidak langsung play. Harus klik play.

5. **Password gift page bersifat opsional** — customer boleh tidak set password.

6. **Pixel art dibuat dengan CSS/SVG** — tidak menggunakan asset gambar eksternal untuk sprite pixel art. Semua dibuat dari CSS box-shadow atau inline SVG agar ringan dan tidak ada dependensi eksternal.

7. **Mobile first** — mayoritas penerima kado akan buka di HP. Pastikan semua room nyaman di layar kecil.

8. **Font dari Google Fonts:**
   - `Cormorant+Garamond:ital,wght@1,400`
   - `Press+Start+2P`
   - `Caveat:wght@400;700`
   - `DM+Sans:wght@300;400;500`

---

*For You, Always. — Arcade Edition*
*Build Document v1.0*
