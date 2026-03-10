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
    token = getTokenFromURL();

    if (!token) {
      showError('Token tidak ditemukan. Pastikan link studio kamu benar.');
      return false;
    }

    try {
      const res = await fetch(`${WORKER_URL}/get-config?id=${encodeURIComponent(token)}`);
      
      if (res.status === 404) {
        // New token — fresh studio
        initialConfig = {};
        hideGate();
        return true;
      }
      if (!res.ok) throw new Error('Server error');
      
      initialConfig = await res.json();

      hideGate();
      return true;
    } catch (err) {
      showError('Gagal memuat data. Coba refresh halaman.');
      return false;
    }
  }

  function hideGate() {
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.add('hidden');
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

  function showError(msg) {
    const el = document.getElementById('gate-error');
    const spinner = document.querySelector('.gate-spinner');
    if (el) el.textContent = msg;
    if (spinner) spinner.style.display = 'none';
  }

  return { init, getToken, getInitialConfig, getWorkerUrl };
})();
