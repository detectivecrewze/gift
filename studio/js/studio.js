/**
 * studio.js — Main Controller for Arcade Studio
 */

// Define global Studio var early 
const Studio = (() => {

  let _studioPassword = null;

  async function init() {
    const isValid = await Auth.init();
    
    if (isValid) {
      const config = Auth.getInitialConfig();
      _studioPassword = config.studioPassword || null;

      Uploader.init(config.photos || []);
      Music.init(config.audio || null);
      Message.init(config.message || '');
      DatePicker.init(config.date || '');
      Publisher.init();

      if (config.name) document.getElementById('input-name').value = config.name;
      if (config.password) document.getElementById('input-password').value = config.password;
      
      bindGlobalEvents();
      
      /* 
      if (config.submitted_at) {
        showSubmittedState();
      } else {
        document.getElementById('studio-main').classList.remove('hidden');
      }
      */
      document.getElementById('studio-main').classList.remove('hidden');

    } else {
      // Missing token - redirect or show error
      if (!Auth.getToken()) {
        showErrorState("URL tidak valid. Pastikan link kamu memiliki kode rahasia yang benar.");
      }
    }
  }

  function bindGlobalEvents() {
    document.getElementById('input-name').addEventListener('input', Autosave.trigger);
    document.getElementById('input-password').addEventListener('input', Autosave.trigger);
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('border-rose-500');
    showToast(msg);
    el.focus();
    setTimeout(() => el.classList.remove('border-rose-500'), 3000);
  }

  function clearErrors() {
    document.querySelectorAll('.border-rose-500').forEach(el => el.classList.remove('border-rose-500'));
  }

  function showSubmittedState() {
    document.getElementById('auth-gate').classList.add('hidden');
    document.getElementById('studio-main').classList.add('hidden');
    document.getElementById('submitted-state').classList.remove('hidden');
  }

  function showErrorState(msg) {
    const gate = document.getElementById('auth-gate');
    gate.innerHTML = `<div class="max-w-xs text-center p-8 bg-white rounded-xl shadow-lg border border-red-50">
      <h2 class="text-xl text-serif italic mb-2 text-red-600">Akses Ditolak</h2>
      <p class="text-xs text-gray-500 mb-8 uppercase tracking-widest leading-relaxed">${msg}</p>
    </div>`;
  }

  return { init, showToast, showError, clearErrors, showSubmittedState, showErrorState, getStudioPassword: () => _studioPassword };
})();

// Start everything once DOM loads
document.addEventListener('DOMContentLoaded', () => {
  Studio.init();
});
