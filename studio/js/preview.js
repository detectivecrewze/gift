/**
 * preview.js — Live Preview Sync (New Tab Mode)
 * Arcade Edition
 */
const Preview = (() => {
  let _token = null;

  function init() {
    // Bind main preview button (existing if any)
    document.getElementById('btn-preview-arcade')?.addEventListener('click', openPreview);

    // Bind new section-specific preview buttons
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-section-preview');
      if (btn) {
        const room = btn.dataset.previewRoom;
        if (room) openSectionPreview(room);
      }
    });
  }

  async function openPreview() {
    _token = Auth.getToken();
    if (!_token) {
      Studio.showToast('Gagal memuat preview: Kode Rahasia tidak ditemukan.');
      return;
    }

    // Open window immediately (synchronous to user click to satisfy iOS Safari)
    const previewWin = window.open('about:blank', '_blank');
    if (!previewWin) {
      Studio.showToast('Gagal membuka preview: Browser memblokir popup.');
      return;
    }

    Studio.showToast('Menyimpan perubahan & Membuka Preview...');
    
    try {
      await Autosave.saveNow();
      // Redirect the already-open window
      const previewUrl = `../arcade/index.html?to=${_token}&preview=true&t=${Date.now()}`;
      previewWin.location.href = previewUrl;
    } catch(e) {
      console.error(e);
      previewWin.close();
      Studio.showToast('Gagal memuat preview. Coba lagi.');
    }
  }

  async function openSectionPreview(room) {
    _token = Auth.getToken();
    if (!_token) return Studio.showToast('Gagal: Token tidak ditemukan.');

    // Open window immediately
    const previewWin = window.open('about:blank', '_blank');
    if (!previewWin) {
      Studio.showToast('Gagal membuka preview: Browser memblokir popup.');
      return;
    }

    Studio.showToast(`Menyimpan & Membuka ${room.toUpperCase()}...`);

    try {
      // Force save
      await Autosave.saveNow();

      // Generate a short-lived random token for the bypass pt (Preview Token)
      const pt = Math.random().toString(36).substring(2, 10);
      localStorage.setItem(`arcade_pt_${_token}`, pt);

      // Redirect
      const previewUrl = `../arcade/index.html?to=${_token}&preview=true&room=${room}&pt=${pt}&t=${Date.now()}`;
      previewWin.location.href = previewUrl;

    } catch(e) {
      console.error(e);
      previewWin.close();
      Studio.showToast('Gagal membuka preview seksi.');
    }
  }

  return { init, openPreview, openSectionPreview };
})();
