/**
 * auth.js — Token validation & initial config loading for Arcade Edition
 */

const Auth = (() => {
  const WORKER_URL = 'https://arcade-edition.aldoramadhan16.workers.dev';
  let token = null;
  let initialConfig = null;

  function getToken() { return token; }
  function getInitialConfig() { return initialConfig; }
  function getWorkerUrl() { return WORKER_URL; }

  async function init() {
    // Show loading indicator early (optional, could be default)

    token = getTokenFromURL();

    if (!token) {
      showError('Token tidak ditemukan di URL.');
      return false;
    }

    try {
      const res = await fetch(`${WORKER_URL}/get-config?id=${encodeURIComponent(token)}`);
      
      if (res.status === 404) {
        showError('Project tidak ditemukan. Silakan buat project melalui Generator.');
        return false;
      }
      if (!res.ok) throw new Error('Server error');
      
      const data = await res.json();
      initialConfig = data;

      // Cek Password Editor (jika disetel dari Generator)
      if (data.studioPassword) {
        let isAuthed = false;
        try {
          isAuthed = sessionStorage.getItem(`auth_${token}`) === 'true';
        } catch (e) { }

        // Cek query string "pass" buat auto-login saat redirect dari Generator
        const urlParams = new URLSearchParams(window.location.search);
        const passFromUrl = urlParams.get('pass');

        if (passFromUrl === data.studioPassword) {
            try { sessionStorage.setItem(`auth_${token}`, 'true'); } catch (e) { }
            showStudio();
            return true;
        } else if (!isAuthed) {
            setupStudioAuth(data.studioPassword);
            showAuthGate();
            return false; // Return false so init chain halts until unlocked
        }
      }

      showStudio();
      return true;
    } catch (err) {
      showError('Gagal terhubung ke server. Coba muat ulang.');
      return false;
    }
  }

  function setupStudioAuth(correctPass) {
    const input = document.getElementById('studio-pass-input');
    const btn = document.getElementById('btn-unlock-studio');
    const errorMsg = document.getElementById('studio-pass-error');

    const tryUnlock = () => {
      if (input.value === correctPass) {
        try { sessionStorage.setItem(`auth_${token}`, 'true'); } catch (e) { }
        document.getElementById('auth-gate').classList.add('hidden');
        Studio.initPostAuth(); // Lanjutkan init Studio
      } else {
        errorMsg.classList.remove('hidden');
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
      }
    };

    btn?.addEventListener('click', tryUnlock);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryUnlock();
    });
  }

  function showStudio() {
    document.getElementById('loading-screen')?.classList.add('hidden');
    document.getElementById('auth-gate')?.classList.add('hidden');
    document.getElementById('error-screen')?.classList.add('hidden');
  }

  function showAuthGate() {
    document.getElementById('loading-screen')?.classList.add('hidden');
    document.getElementById('auth-gate')?.classList.remove('hidden');
    document.getElementById('error-screen')?.classList.add('hidden');
  }

  function showError(msg) {
    document.getElementById('loading-screen')?.classList.add('hidden');
    document.getElementById('auth-gate')?.classList.add('hidden');
    const errScrn = document.getElementById('error-screen');
    const errMsg = document.getElementById('error-message');
    if (errScrn) errScrn.classList.remove('hidden');
    if (errMsg) errMsg.textContent = msg;
  }

  function getTokenFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) return params.get('token');
    if (params.get('id'))    return params.get('id');
    const path = window.location.pathname.split('/').filter(Boolean);
    if (path.length > 0 && path[path.length - 1] !== 'index.html' && path[path.length - 1] !== 'studio') {
      return path[path.length - 1];
    }
    return null;
  }

  return { init, getToken, getInitialConfig, getWorkerUrl };
})();
