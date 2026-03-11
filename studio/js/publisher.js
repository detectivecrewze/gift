/**
 * publisher.js — Final Submission Logic
 */
const Publisher = (() => {
  function init() {
    const btnSubmit = document.getElementById('submit-btn');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleSubmit);
    }
  }

  async function handleSubmit() {
    const btn = document.getElementById('submit-btn');
    const textSpan = btn.querySelector('.submit-text');
    
    // Clear errors
    Studio.clearErrors();

    // 1. Validation
    const recipient_name = document.getElementById('input-name').value.trim();
    if (!recipient_name) return Studio.showError('input-name', 'Nama penerima tidak boleh kosong.');

    const photos = Uploader.getPhotos();
    if (photos.length < 1) {
      Studio.showToast('Minimal 1 foto diperlukan.');
      return;
    }

    const playlist = Music.getPlaylistArray();
    let hasValidSong = false;
    
    for (let i = 0; i < playlist.length; i++) {
      const audio = playlist[i];
      if (audio.type === 'req') {
        if (!audio.title || !audio.artist) {
          Studio.showToast(`Lagu ${i+1}: Judul & Penyanyi wajib diisi (Request Mode).`);
          return;
        }
        hasValidSong = true;
      } else {
        if (audio.url) {
          hasValidSong = true;
        }
      }
    }

    if (!hasValidSong) {
      Studio.showToast('Minimal 1 lagu harus diisi/diupload.');
      return;
    }

    const message = Message.getMessage();
    if (!message) return Studio.showError('input-message', 'Pesan tidak boleh kosong.');

    const anniversary_date = DatePicker.getDate();
    if (!anniversary_date || !DatePicker.validateDate()) return Studio.showError('input-date', 'Tanggal valid diperlukan.');

    const bucket_list = BucketList.getItems();

    if (Uploader.isUploading() || Music.isUploading()) {
      Studio.showToast('Tunggu file selesai diupload (Foto/Lagu).');
      return;
    }

    // 2. Submit
    if (textSpan) textSpan.textContent = 'Menyimpan...';
    btn.disabled = true;

    const password = document.getElementById('input-password').value.trim();

    try {
      const payload = {
        id: Auth.getToken(),
        recipient_name,
        photos,
        playlist,
        message,
        anniversary_date,
        bucket_list,
        password,
        studioPassword: Studio.getStudioPassword()
      };

      const res = await fetch(`${Auth.getWorkerUrl()}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showSuccessModal();
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e) {
      Studio.showToast('Gagal submit: ' + e.message);
      if (textSpan) textSpan.textContent = 'Publikasikan Kado';
      btn.disabled = false;
    }
  }

  function showSuccessModal() {
    Autosave.cancel();
    document.getElementById('success-modal').classList.remove('hidden');
  }

  return { init };
})();
