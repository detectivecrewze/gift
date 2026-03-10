/**
 * music.js — Audio Upload & Management for Arcade Edition
 */

const Music = (() => {
  const MAX_SIZE = 7 * 1024 * 1024; // 7MB
  let audioData = { url: null, name: null };
  let isPlaying = false;

  function init(existingAudio) {
    if (existingAudio && existingAudio.url) {
      audioData = existingAudio;
      render();
    }
    bindEvents();
  }

  function bindEvents() {
    const dz = document.getElementById('music-upload');
    const input = document.getElementById('music-input');
    const playBtn = document.getElementById('music-play-btn');
    const removeBtn = document.getElementById('music-remove-btn');
    const player = document.getElementById('music-player');

    if (dz) dz.addEventListener('click', () => input.click());
    if (input) {
      input.addEventListener('change', e => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
        input.value = '';
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (!player.src) return;
        if (isPlaying) {
          player.pause();
          playBtn.innerHTML = '▶ Play';
        } else {
          player.play();
          playBtn.innerHTML = '⏸ Stop';
        }
        isPlaying = !isPlaying;
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        audioData = { url: null, name: null };
        if (player) {
          player.pause();
          player.src = '';
        }
        isPlaying = false;
        render();
        Autosave.trigger();
      });
    }

    if (player) {
      player.addEventListener('ended', () => {
        isPlaying = false;
        if (playBtn) playBtn.innerHTML = '▶ Play';
      });
    }
  }

  async function handleFile(file) {
    if (file.size > MAX_SIZE) {
      Studio.showToast('File terlalu besar (Maks 7MB).');
      return;
    }

    Studio.showToast('Mengupload lagu... 🎶');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'audio');
      formData.append('id', Auth.getToken() || 'test');

      const res = await fetch(`${Auth.getWorkerUrl()}/upload`, {
        method: 'POST', body: formData
      });
      const data = await res.json();

      if (data.success) {
        audioData = { url: data.url, name: file.name };
        Studio.showToast('Lagu berhasil diupload! ✨');
        render();
        Autosave.trigger();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      Studio.showToast('Gagal upload: ' + err.message);
    }
  }

  function render() {
    const uploadArea = document.getElementById('music-upload');
    const previewArea = document.getElementById('music-preview');
    const nameLabel = document.getElementById('music-name');
    const player = document.getElementById('music-player');
    const playBtn = document.getElementById('music-play-btn');

    if (audioData.url) {
      uploadArea.classList.add('hidden');
      previewArea.classList.remove('hidden');
      
      nameLabel.textContent = audioData.name || 'Custom Music';
      player.src = audioData.url;
      player.load();
      isPlaying = false;
      playBtn.innerHTML = '▶ Play';
    } else {
      uploadArea.classList.remove('hidden');
      previewArea.classList.add('hidden');
      player.src = '';
    }
  }

  function getAudio() { return audioData.url ? audioData : null; }

  return { init, getAudio };
})();
