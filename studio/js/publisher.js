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
    const name = document.getElementById('input-name').value.trim();
    if (!name) return Studio.showError('input-name', 'Nama penerima tidak boleh kosong.');

    const photos = Uploader.getPhotos();
    if (photos.length < 1) {
      Studio.showToast('Minimal 1 foto diperlukan.');
      return;
    }

    const audio = Music.getAudio();
    if (!audio) {
      Studio.showToast('Lagu pilihan diperlukan.');
      return;
    }

    const message = Message.getMessage();
    if (!message) return Studio.showError('input-message', 'Pesan tidak boleh kosong.');

    const date = DatePicker.getDate();
    if (!date || !DatePicker.validateDate()) return Studio.showError('input-date', 'Tanggal valid diperlukan.');

    if (Uploader.isUploading()) {
      Studio.showToast('Tunggu foto selesai diupload.');
      return;
    }

    // 2. Submit
    if (textSpan) textSpan.textContent = 'Menyimpan...';
    btn.disabled = true;

    const password = document.getElementById('input-password').value.trim();

    try {
      const payload = {
        id: Auth.getToken(),
        name,
        photos,
        audio,
        message,
        date,
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
