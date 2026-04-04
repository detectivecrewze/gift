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
          Studio.showToast(`Lagu ${i + 1}: Judul & Penyanyi wajib diisi (Request Mode).`);
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
      things_i_love: ThingsILove.getItems(),
      atlas: { pins: Atlas.getItems() },
      active_apps: {
        ...AppManager.getActiveApps()
      },
      password,
      password_hint: document.getElementById('input-password-hint')?.value.trim() || '',
      studioPassword: Studio.getStudioPassword()
    };

    // Pre-fill input nama URL (Read only)
    const token = Auth.getToken();
    const inputName = document.getElementById('input-gift-name');
    if (inputName && token) {
      inputName.value = token;
    }

    _toggleModal('modal-name', true);
  }

  // 2. Kirim data ke API & tampilkan Modal Sukses
  async function _handlePublish() {
    if (!validatedPayload) return;

    _toggleModal('modal-name', false);

    const btn = document.getElementById('submit-btn');
    const textSpan = btn.querySelector('.submit-text');

    if (textSpan) textSpan.textContent = 'Menyimpan...';
    btn.disabled = true;

    try {
      const res = await fetch(`${Auth.getWorkerUrl()}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedPayload)
      });
      const data = await res.json();

      if (data.success) {
        Autosave.cancel();

        // Buat URL Kado
        const giftId = validatedPayload.id;
        const giftUrl = `${window.location.origin}/${giftId}`;

        _showSuccessModal(giftUrl);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e) {
      Studio.showToast('Gagal submit: ' + e.message);
    } finally {
      if (textSpan) textSpan.textContent = 'Publikasikan Kado';
      btn.disabled = false;
    }
  }

  // 3. Tampilkan Modal Sukses dengan QR & Share Link
  function _showSuccessModal(giftUrl) {
    const modal = document.getElementById('modal-success');
    const urlDisplay = document.getElementById('modal-gift-url');
    const whatsappBtn = document.getElementById('btn-share-whatsapp');
    const viewBtn = document.getElementById('btn-view-gift');
    const qrContainer = document.getElementById('qr-code-box');

    if (urlDisplay) urlDisplay.textContent = giftUrl;
    if (viewBtn) viewBtn.href = giftUrl;

    // Generate WhatsApp share link
    if (whatsappBtn) {
      const messageText = encodeURIComponent(`Untukmu, kenangan yang abadi. ✨\n\n${giftUrl}`);
      whatsappBtn.href = `https://wa.me/?text=${messageText}`;
    }

    // Generate Aesthetic QR Code
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: giftUrl,
        width: 128,
        height: 128,
        colorDark: '#1a1a1a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });

      setTimeout(() => {
        const qrImg = qrContainer.querySelector('img');
        const qrCanvas = qrContainer.querySelector('canvas');
        if (qrImg) {
          qrImg.style.margin = '0 auto';
          qrImg.style.display = 'block';
          qrImg.style.borderRadius = '4px';
        }
        if (qrCanvas) qrCanvas.style.display = 'none';
      }, 100);
    }

    // Bind Download QR Button
    const downloadBtn = document.getElementById('btn-download-qr');
    if (downloadBtn) {
      const newBtn = downloadBtn.cloneNode(true);
      downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
      newBtn.addEventListener('click', _handleDownloadQR);
    }

    if (modal) modal.classList.remove('hidden');
  }

  // 4. Download QR Code Polaroid PNG menggunakan html2canvas
  async function _handleDownloadQR() {
    const exportNode = document.getElementById('qr-export-container');
    const btn = document.getElementById('btn-download-qr');

    if (!exportNode || typeof html2canvas === 'undefined') {
      Studio.showToast('Fitur download belum siap. Silakan screenshot manual.');
      return;
    }

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span style="opacity:0.7">Memproses...</span>';
    btn.disabled = true;

    try {
      const canvas = await html2canvas(exportNode, {
        scale: 3,
        backgroundColor: '#fffaf5',
        useCORS: true,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');

      const a = document.createElement('a');
      a.download = `TheArcadeEdition-QR-${Date.now()}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      Studio.showToast('Barcode berhasil didownload! 📲');
    } catch (err) {
      console.error('Download QR error:', err);
      Studio.showToast('Gagal download barcode. Coba lagi.');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }

  // 5. Copy Link Manual
  function _handleCopyLink() {
    const urlText = document.getElementById('modal-gift-url')?.textContent;
    if (!urlText) return;

    navigator.clipboard.writeText(urlText)
      .then(() => {
        const btn = document.getElementById('btn-copy-link');
        if (btn) {
          btn.textContent = 'TERSALIN';
          setTimeout(() => btn.textContent = 'SALIN LINK', 2000);
        }
      })
      .catch(() => {
        Studio.showToast('Gagal menyalin. Silakan coba manual.');
      });
  }

  return { init };
})();