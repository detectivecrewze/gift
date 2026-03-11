/**
 * Music Room — The Dreamy Star-Player
 * Updated for the new Glass-Pixel aesthetic and Multi-Track Playlist
 */

let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let starmanInterval = null;

let currentTrackIndex = 0;
let playlist = [];

// ── DOM References ─────────────────────────────────────────
const UI = {
  audio: document.getElementById('audio-player'),
  cover: document.getElementById('album-cover'),
  title: document.getElementById('track-title'),
  artist: document.getElementById('track-artist'),
  playBtn: document.getElementById('play-btn'),
  playIconSvg: document.getElementById('play-icon-svg'),
  shuffleBtn: document.getElementById('shuffle-btn'),
  repeatBtn: document.getElementById('repeat-btn'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  progressArea: document.getElementById('progress-container'),
  progressBar: document.getElementById('progress-bar'),
  progressThumb: document.getElementById('progress-thumb'),
  currentTime: document.getElementById('current-time'),
  totalTime: document.getElementById('total-time'),
  visualizer: document.getElementById('spirited-visualizer'),
  trackCounter: document.getElementById('track-counter')
};

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log("Dreamy Star-Player Engine starting...");
  
  // 1. Load Data
  try {
    const configStr = sessionStorage.getItem('arcadeConfig');
    const config = (configStr && configStr !== "null" && configStr !== "undefined") ? JSON.parse(configStr) : {};
    
    // Parse playlist from config
    if (config.playlist && Array.isArray(config.playlist) && config.playlist.length > 0) {
      playlist = config.playlist;
    } else {
      // Fallback
      playlist = [{
        url: config.audio_url || '',
        title: config.track_title || 'Merry-Go-Round of Life',
        artist: config.track_artist || "Studio Ghibli",
        coverUrl: config.album_art || '../../../assets/mockup_1.png',
        type: 'mp3'
      }];
    }

    loadTrack(currentTrackIndex);
  } catch (e) {
    console.warn("Music Config Error, using fallbacks:", e);
  }

  // 2. Bind Events
  setupEvents();
});

function loadTrack(index) {
   if (playlist.length === 0) return;
   
   if (index < 0) index = playlist.length - 1;
   if (index >= playlist.length) index = 0;
   
   currentTrackIndex = index;
   const track = playlist[index];
   
   if (UI.audio) {
     UI.audio.src = (track.url && track.url !== 'manual_search') ? track.url : '';
   }
   if (UI.title) UI.title.textContent = track.title || 'Unknown Title';
   if (UI.artist) UI.artist.textContent = track.artist || 'Unknown Artist';
   if (UI.cover) UI.cover.src = track.coverUrl || '../../../assets/mockup_1.png';
  
  if (UI.trackCounter) {
    UI.trackCounter.textContent = `${String(index + 1).padStart(2,'0')} / ${String(playlist.length).padStart(2,'0')}`;
  }
   
   // Reset progress visually
   if (UI.progressBar) UI.progressBar.style.setProperty('--progress', '0%');
   if (UI.currentTime) UI.currentTime.textContent = '0:00';
   
   if (isPlaying && UI.audio.src) {
      UI.audio.play().then(() => {
          window.parent.postMessage({ type: 'MUSIC_STARTED' }, '*');
      }).catch(e => {
          console.warn("Playback blocked:", e);
          isPlaying = false;
          setPlayIcon(false);
          stopVisualizer();
      });
   } else if (!UI.audio.src && isPlaying) {
      isPlaying = false;
      setPlayIcon(false);
      stopVisualizer();
   }
}

function nextTrack() {
  let nextIndex = currentTrackIndex + 1;
  if (isShuffle) {
    nextIndex = Math.floor(Math.random() * playlist.length);
  }
  loadTrack(nextIndex);
  
  if (isPlaying && UI.audio.src) {
     UI.audio.play().then(() => {
         window.parent.postMessage({ type: 'MUSIC_STARTED' }, '*');
     });
  }
}

function prevTrack() {
  loadTrack(currentTrackIndex - 1);
  if (isPlaying && UI.audio.src) {
     UI.audio.play().then(() => {
         window.parent.postMessage({ type: 'MUSIC_STARTED' }, '*');
     });
  }
}

// ── SVG Icon Toggle ────────────────────────────────────────
function setPlayIcon(playing) {
  if (!UI.playIconSvg) return;
  if (playing) {
    // Pause icon: two bars
    UI.playIconSvg.innerHTML = `<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>`;
    UI.playBtn?.classList.add('playing');
  } else {
    // Play icon: triangle
    UI.playIconSvg.innerHTML = `<path d="M6 4l14 8-14 8V4z"/>`;
    UI.playBtn?.classList.remove('playing');
  }
}

function setupEvents() {
  if (UI.playBtn) UI.playBtn.addEventListener('click', togglePlay);
  if (UI.shuffleBtn) UI.shuffleBtn.addEventListener('click', toggleShuffle);
  if (UI.repeatBtn) UI.repeatBtn.addEventListener('click', toggleRepeat);
  if (UI.nextBtn) UI.nextBtn.addEventListener('click', nextTrack);
  if (UI.prevBtn) UI.prevBtn.addEventListener('click', prevTrack);

  if (UI.audio) {
    UI.audio.addEventListener('timeupdate', updateProgress);
    UI.audio.addEventListener('loadedmetadata', () => {
      UI.totalTime.textContent = formatTime(UI.audio.duration);
    });
    UI.audio.addEventListener('ended', handleTrackEnd);
  }

  // Progress scrubbing
  if (UI.progressArea) {
    UI.progressArea.addEventListener('click', (e) => {
      if (!UI.audio.duration) return;
      const rect = UI.progressArea.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      UI.audio.currentTime = pos * UI.audio.duration;
    });
  }

  // Listen for suspension from parent
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'VISUALIZER_STATE') {
      if (e.data.active && isPlaying) {
        startVisualizer();
      } else {
        stopVisualizer();
      }
    }
  });
}

function togglePlay() {
  if (!UI.audio.src) return;
  
  if (isPlaying) {
    UI.audio.pause();
    setPlayIcon(false);
    stopVisualizer();
  } else {
    UI.audio.play().then(() => {
        setPlayIcon(true);
        startVisualizer();
        // Send signal to unlock main menu
        window.parent.postMessage({ type: 'MUSIC_STARTED' }, '*');
    }).catch(e => {
        console.warn("Playback blocked:", e);
        setPlayIcon(false);
    });
  }
  isPlaying = !isPlaying;
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  if (UI.shuffleBtn) {
    UI.shuffleBtn.classList.toggle('active', isShuffle);
  }
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  if (UI.repeatBtn) {
    UI.repeatBtn.classList.toggle('active', isRepeat);
  }
}

function updateProgress() {
  if (UI.audio.duration) {
    const pct = (UI.audio.currentTime / UI.audio.duration) * 100;
    const pctStr = `${pct}%`;
    if (UI.progressBar) UI.progressBar.style.setProperty('--progress', pctStr);
    if (UI.progressThumb) UI.progressThumb.style.setProperty('--progress', pctStr);
    if (UI.currentTime) UI.currentTime.textContent = formatTime(UI.audio.currentTime);
  }
}

function handleTrackEnd() {
  if (isRepeat) {
    UI.audio.currentTime = 0;
    UI.audio.play();
  } else {
    // Move to next track automatically
    nextTrack();
  }
}

function formatTime(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ── Starman Visualizer ──────────────────────────────────
function startVisualizer() {
  if (starmanInterval) return;
  starmanInterval = setInterval(createStarman, 250);
}

function stopVisualizer() {
  if (starmanInterval) clearInterval(starmanInterval);
  starmanInterval = null;
}

function createStarman() {
  if (!UI.visualizer) return;
  const star = document.createElement('div');
  star.className = 'ember';
  
  const size = Math.random() * 6 + 2;
  const xStart = Math.random() * 100;
  const xDrift = (Math.random() - 0.5) * 100;
  const duration = Math.random() * 3 + 3;

  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.left = `${xStart}%`;
  star.style.bottom = `-20px`;
  star.style.setProperty('--d', `${duration}s`);
  star.style.setProperty('--x', `${xDrift}px`);

  UI.visualizer.appendChild(star);
  setTimeout(() => star.remove(), duration * 1000);
}
