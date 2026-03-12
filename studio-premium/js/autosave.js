/**
 * autosave.js — Handles background state saving
 */
const Autosave = (() => {
  let debounceTimer = null;
  const DEBOUNCE_MS = 3000;

  function trigger() {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) {
      saveStatus.textContent = 'Menyimpan...';
      saveStatus.classList.remove('opacity-0');
    }

    debounceTimer = setTimeout(() => {
      saveConfiguration();
    }, DEBOUNCE_MS);
  }

  function cancel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) saveStatus.classList.add('opacity-0');
  }

  async function saveConfiguration() {
    if (Uploader.isUploading()) {
      trigger(); // Retry later if still uploading
      return;
    }

    const playlist = Music.getPlaylistArray();
    const stateToSave = {
      id: Auth.getToken(),
      recipient_name: document.getElementById('input-name')?.value.trim() || '',
      photos: Uploader.getPhotos(),
      playlist: playlist,
      message: Message.getMessage(),
      anniversary_date: DatePicker.getDate(),
      bucket_list: BucketList.getItems(),
      quiz_questions: Quiz.getItems(),
      active_apps: AppManager.getActiveApps(),
      things_i_love: ThingsILove.getItems(),
      password: document.getElementById('input-password')?.value.trim() || '',
      password_hint: document.getElementById('input-password-hint')?.value.trim() || '',
      studioPassword: Studio.getStudioPassword()
    };

    try {
      const res = await fetch(`${Auth.getWorkerUrl()}/save-config?id=${stateToSave.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateToSave)
      });
      const data = await res.json();
      
      const saveStatus = document.getElementById('save-status');
      if (data.success && saveStatus) {
        saveStatus.textContent = 'Tersimpan Otomatis';
        setTimeout(() => saveStatus.classList.add('opacity-0'), 2000);
      }
    } catch (e) {
      console.warn('Autosave failed:', e);
      trigger(); // Retry
    }
  }

  async function saveNow() {
    if (debounceTimer) clearTimeout(debounceTimer);
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) {
      saveStatus.textContent = 'Menyimpan...';
      saveStatus.classList.remove('opacity-0');
    }
    await saveConfiguration();
  }

  return { trigger, cancel, saveNow };
})();
