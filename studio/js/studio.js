/**
 * studio.js — Main Controller for Arcade Studio
 */

// Define global Studio var early 
const Studio = (() => {

  let _studioPassword = null;

  async function init() {
    const isUnlockedAndValid = await Auth.init();
    
    // isUnlockedAndValid akan true jika:
    // 1. Tdk ada studioPassword MATAUPUN 
    // 2. Ada studioPassword DAN user baru saja auto-login via URL / session valid.
    // Jika masih dilock-screen, Auth.init() mereturn false (pending until unlock).
    if (isUnlockedAndValid) {
      initPostAuth();
    }
  }

  function initPostAuth() {
      const config = Auth.getInitialConfig();
      _studioPassword = config.studioPassword || null;

      AppManager.init(config.active_apps || null);
      BucketList.init(config.bucket_list || []);
      Quiz.init(config.quiz_questions || []);
      Uploader.init(config.photos || []);
      Music.init({
        playlist: config.playlist,
        url: config.audio_url || null,
        name: config.track_title || null, // fallback
        coverUrl: config.album_art || null,
        title: config.track_title || '',
        artist: config.track_artist || '',
        isManualMode: config.isManualMode || false
      });
      Message.init(config.message || '');
      DatePicker.init(config.anniversary_date || config.date || '');
      Publisher.init();

      if (config.recipient_name || config.name) document.getElementById('input-name').value = config.recipient_name || config.name;
      if (config.password) document.getElementById('input-password').value = config.password;
      
      bindGlobalEvents();
      
      document.getElementById('studio-main').classList.remove('hidden');
  }

  function bindGlobalEvents() {
    document.getElementById('input-name').addEventListener('input', Autosave.trigger);
    document.getElementById('input-password').addEventListener('input', Autosave.trigger);
  }

  let toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    
    // Reset timer jika ada notif baru masuk
    if (toastTimer) clearTimeout(toastTimer);
    
    t.textContent = msg;
    t.classList.remove('hidden');
    
    toastTimer = setTimeout(() => {
      t.classList.add('hidden');
      toastTimer = null;
    }, 3000);
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

  return { init, initPostAuth, showToast, showError, clearErrors, showSubmittedState, showErrorState, getStudioPassword: () => _studioPassword };
})();

// Start everything once DOM loads
document.addEventListener('DOMContentLoaded', () => {
  Studio.init();
});
