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

    const stateToSave = {
      id: Auth.getToken(),
      name: document.getElementById('input-name')?.value.trim() || '',
      photos: Uploader.getPhotos(),
      audio: Music.getAudio(),
      message: Message.getMessage(),
      date: DatePicker.getDate(),
      password: document.getElementById('input-password')?.value.trim() || '',
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

  return { trigger, cancel };
})();
