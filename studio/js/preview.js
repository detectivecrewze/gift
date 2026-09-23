/**
 * preview.js — two-stage preview for Arcade Studio
 * Room previews stay in Studio; the final preview opens a browser tab.
 */
const Preview = (() => {
  let _bound = false;
  let _lastRequest = null;
  let _previousFocus = null;
  let _requestId = 0;

  const roomLabels = {
    journey: 'The Journey',
    moments: 'Moments',
    'Atlas-Of-Us': 'Atlas of Us',
    music: 'Music',
    quiz: 'Quiz',
    'things-i-love': 'Things I Love',
    'bucket-list': 'Bucket List',
    message: 'Message',
  };

  const elements = () => ({
    modal: document.getElementById('arcade-preview-modal'),
    card: document.querySelector('#arcade-preview-modal .studio-preview-card'),
    title: document.getElementById('arcade-preview-title'),
    subtitle: document.getElementById('arcade-preview-subtitle'),
    status: document.getElementById('arcade-preview-status'),
    statusText: document.getElementById('arcade-preview-status-text'),
    retry: document.getElementById('arcade-preview-retry'),
    stage: document.getElementById('arcade-preview-stage'),
    device: document.getElementById('arcade-preview-device'),
    close: document.getElementById('arcade-preview-close'),
  });

  const buildUrl = (token, room = null, pt = null) => {
    let url = `../arcade/index.html?to=${encodeURIComponent(token)}&preview=true`;
    if (room) url += `&room=${encodeURIComponent(room)}`;
    if (pt) url += `&pt=${encodeURIComponent(pt)}`;
    return `${url}&t=${Date.now()}`;
  };

  const setViewport = () => {
    const { stage } = elements();
    if (stage) stage.dataset.previewViewport = window.matchMedia('(min-width: 721px)').matches ? 'desktop' : 'mobile';
  };

  const setStatus = (message, state = 'loading') => {
    const { status, statusText, retry } = elements();
    if (status) status.dataset.state = state;
    if (statusText) statusText.textContent = message;
    if (retry) retry.hidden = state !== 'error';
  };

  const removeFrame = () => {
    const frame = elements().device?.querySelector('iframe');
    if (!frame) return;
    frame.src = 'about:blank';
    frame.remove();
  };

  const showModal = (title) => {
    const ui = elements();
    if (!ui.modal) return false;
    const firstOpen = ui.modal.classList.contains('hidden');
    if (firstOpen) _previousFocus = document.activeElement;
    if (ui.title) ui.title.textContent = title;
    ui.modal.classList.remove('hidden');
    ui.modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('studio-preview-open');
    document.body.classList.add('studio-preview-open');
    setViewport();
    if (firstOpen) requestAnimationFrame(() => ui.close?.focus());
    return true;
  };

  const closeModal = () => {
    const { modal } = elements();
    if (!modal || modal.classList.contains('hidden')) return;
    _requestId += 1;
    removeFrame();
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('studio-preview-open');
    document.body.classList.remove('studio-preview-open');
    _lastRequest = null;
    _previousFocus?.focus?.({ preventScroll: true });
    _previousFocus = null;
  };

  const mountFrame = (url, title, requestId) => {
    const { device } = elements();
    if (!device) return;
    removeFrame();
    const frame = document.createElement('iframe');
    frame.title = title;
    frame.loading = 'eager';
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.addEventListener('load', () => {
      const { modal } = elements();
      if (requestId !== _requestId || modal?.classList.contains('hidden')) return;
      try {
        frame.contentWindow?.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') closeModal();
        });
      } catch {}
      setStatus('Preview siap. Semua interaksi dapat dicoba di dalam layar.', 'ready');
    }, { once: true });
    frame.src = url;
    device.appendChild(frame);
  };

  const loadRequest = async (request) => {
    const requestId = ++_requestId;
    _lastRequest = request;
    if (!showModal(request.title)) return Studio.showToast('Modal preview tidak tersedia.');
    removeFrame();
    setStatus('Menyimpan perubahan...', 'loading');

    try {
      const saved = await Autosave.saveNow();
      if (!saved) throw new Error('SAVE_FAILED');
      if (requestId !== _requestId) return;

      const token = Auth.getToken();
      const pt = Math.random().toString(36).substring(2, 10);
      localStorage.setItem(`arcade_pt_${token}`, pt);
      setStatus('Menyiapkan preview...', 'loading');
      mountFrame(buildUrl(token, request.room, pt), request.title, requestId);
    } catch (error) {
      if (requestId !== _requestId) return;
      console.warn('[Arcade preview]', error);
      setStatus('Perubahan belum berhasil disimpan. Coba lagi agar preview memakai data terbaru.', 'error');
    }
  };

  const handleKeydown = (event) => {
    const { modal, card } = elements();
    if (!modal || modal.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab' || !card) return;
    const focusable = [...card.querySelectorAll('button:not([disabled]):not([hidden]), iframe')]
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };

  function init() {
    if (_bound) return;
    _bound = true;
    document.body.addEventListener('click', (event) => {
      const button = event.target.closest('.btn-section-preview');
      if (button?.dataset.previewRoom) openSectionPreview(button.dataset.previewRoom);
    });
    document.getElementById('arcade-preview-close')?.addEventListener('click', closeModal);
    document.getElementById('arcade-preview-backdrop')?.addEventListener('click', closeModal);
    document.getElementById('arcade-preview-retry')?.addEventListener('click', () => _lastRequest && loadRequest(_lastRequest));
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', () => {
      if (!elements().modal?.classList.contains('hidden')) setViewport();
    });
  }

  async function openPreview() {
    const token = Auth.getToken();
    if (!token) return Studio.showToast('Gagal memuat preview: Kode Rahasia tidak ditemukan.');
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) return Studio.showToast('Gagal membuka preview: Browser memblokir popup.');
    Studio.showToast('Menyimpan perubahan & membuka Preview...');
    try {
      const saved = await Autosave.saveNow();
      if (!saved) throw new Error('SAVE_FAILED');
      previewWindow.location.href = buildUrl(token);
    } catch (error) {
      previewWindow.close();
      Studio.showToast('Gagal memuat preview. Coba lagi.');
    }
  }

  function openSectionPreview(room) {
    if (!Auth.getToken()) return Studio.showToast('Gagal: Token tidak ditemukan.');
    const label = roomLabels[room] || room;
    return loadRequest({ room, title: `Preview ${label}` });
  }

  return { init, closeModal, openPreview, openSectionPreview };
})();
