/** autosave.js — ordered background persistence for Arcade Studio. */
const Autosave = (() => {
  let debounceTimer = null;
  let saveQueue = Promise.resolve();
  const DEBOUNCE_MS = 3000;

  const setStatus = (text, hide = false) => {
    const element = document.getElementById('save-status');
    if (!element) return;
    element.textContent = text;
    element.classList.toggle('opacity-0', hide);
  };

  function trigger() {
    if (debounceTimer) clearTimeout(debounceTimer);
    setStatus('Menyimpan...');
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      saveConfiguration();
    }, DEBOUNCE_MS);
  }

  function cancel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    setStatus('', true);
  }

  const buildState = () => ({
    id: Auth.getToken(),
    recipient_name: document.getElementById('input-name')?.value.trim() || '',
    photos: Uploader.getPhotos(),
    playlist: Music.getPlaylistArray(),
    message: Message.getMessage(),
    anniversary_date: DatePicker.getDate(),
    bucket_list: BucketList.getItems(),
    quiz_questions: Quiz.getItems(),
    active_apps: AppManager.getActiveApps(),
    things_i_love: ThingsILove.getItems(),
    atlas: { pins: Atlas.getItems() },
    password: document.getElementById('input-password')?.value.trim() || '',
    password_hint: document.getElementById('input-password-hint')?.value.trim() || '',
    studioPassword: Studio.getStudioPassword(),
  });

  function saveConfiguration() {
    const runSave = async () => {
      if (Uploader.isUploading() || Music.isUploading() || Atlas.isUploading()) {
        trigger();
        return false;
      }
      const state = buildState();
      if (!state.id) return false;
      try {
        const response = await fetch(`${Auth.getWorkerUrl()}/save-config?id=${encodeURIComponent(state.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || `Server returned ${response.status}`);
        setStatus('Tersimpan Otomatis');
        setTimeout(() => setStatus('', true), 2000);
        return true;
      } catch (error) {
        console.warn('Autosave failed:', error);
        setStatus('Gagal Menyimpan');
        setTimeout(() => setStatus('', true), 4000);
        return false;
      }
    };
    const queued = saveQueue.then(runSave, runSave);
    saveQueue = queued.then(() => undefined, () => undefined);
    return queued;
  }

  function saveNow() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    setStatus('Menyimpan...');
    return saveConfiguration();
  }

  return { trigger, cancel, saveNow };
})();
