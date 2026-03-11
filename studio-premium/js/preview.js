/**
 * preview.js — Live Preview Sync (New Tab Mode)
 * Arcade Edition
 */
const Preview = (() => {

  async function openPreview() {
    const token = Auth.getToken();
    
    // Validasi token
    if (!token) {
      Studio.showToast('Gagal memuat preview: Kode Rahasia tidak ditemukan.');
      return;
    }

    // Proteksi: Minimal ada 1 foto
    const photos = Uploader.getPhotos();
    if (!photos || photos.length === 0) {
      Studio.showToast('Oops! Tambahkan minimal 1 foto dulu di Galeri Kenangan. 📸');
      return;
    }

    Studio.showToast('Menyimpan perubahan & Membuka Preview...');
    
    try {
      // Autosave secara paksa sebelum membuka tab baru
      await Autosave.saveNow();

      // Kasih jeda 500ms agar data sinkron di Cloudflare KV
      setTimeout(() => {
        const previewUrl = `../arcade/index.html?id=${token}&preview=true&t=${Date.now()}`;
        window.open(previewUrl, '_blank');
      }, 500);

    } catch(e) {
      Studio.showToast('Gagal memuat preview. Coba lagi.');
      console.error(e);
    }
  }

  return { openPreview };
})();
