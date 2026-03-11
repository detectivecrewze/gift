/**
 * publisher.js — Final Submission Logic
 */
const Publisher = (() => {
  let validatedPayload = null;

  function init() {
    const btnSubmit = document.getElementById('submit-btn');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handlePreSubmit);
    }

    document.getElementById('btn-confirm-name')?.addEventListener('click', _handlePublish);
    document.getElementById('btn-cancel-name')?.addEventListener('click', () => _toggleModal('modal-name', false));
    document.getElementById('btn-copy-link')?.addEventListener('click', _handleCopyLink);
  }

  function _toggleModal(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
  }

  // 1. Validasi awal sebelum memunculkan modal name
  function handlePreSubmit() {
    Studio.clearErrors();

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

    const password = document.getElementById('input-password').value.trim();

    // Simpan payload untuk digunakan saat publish sesungguhnya
    validatedPayload = {
      id: Auth.getToken(),
      recipient_name,
      photos,
      playlist,
      message,
      anniversary_date,
      bucket_list,
      quiz_questions: Quiz.getItems(),
      active_apps: AppManager.getActiveApps(),
      password,
      studioPassword: Studio.getStudioPassword()
    };

    // Pre-fill input nama URL (Read only)
    const token = Auth.getToken();
    const inputName = document.getElementById('input-gift-name');
    if (inputName && token) {
      inputName.value = token.replace('project-', '');
    }

    // Bypass konfirmasi nama, langsung proses
    _handlePublish();
  }

  // 2. Generate Data Lokal & Tampilkan Modal Sukses
  async function _handlePublish() {
    if (!validatedPayload) return;

    _toggleModal('modal-name', false);

    const btn = document.getElementById('submit-btn');
    const textSpan = btn.querySelector('.submit-text');
    
    if (textSpan) textSpan.textContent = 'Mengirim Data...';
    btn.disabled = true;

    try {
      Autosave.cancel();
      
      const response = await fetch(`${Auth.getWorkerUrl()}/submit-premium?id=${validatedPayload.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validatedPayload.studioPassword || ''}`
        },
        body: JSON.stringify(validatedPayload)
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim data ke server.');
      }
      
      _showSuccessModal();
    } catch (e) {
      Studio.showToast('Gagal memproses data: ' + e.message);
    } finally {
      if (textSpan) textSpan.textContent = 'Publish VIP Config';
      btn.disabled = false;
    }
  }

  // 3. Tampilkan Modal Sukses
  function _showSuccessModal() {
    const modal = document.getElementById('modal-success');
    if (modal) modal.classList.remove('hidden');
  }

  return { init };
})();
