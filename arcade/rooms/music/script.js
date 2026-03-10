/**
 * Music Room — The Dreamy Star-Player
 * Updated for the new Glass-Pixel aesthetic
 */

let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let starmanInterval = null;

// ── DOM References ─────────────────────────────────────────
const UI = {
  audio: document.getElementById('audio-player'),
  cover: document.getElementById('album-cover'),
  title: document.getElementById('track-title'),
  artist: document.getElementById('track-artist'),
  playBtn: document.getElementById('play-btn'),
  playIcon: document.getElementById('play-icon'),
  shuffleBtn: document.getElementById('shuffle-btn'),
  repeatBtn: document.getElementById('repeat-btn'),
  progressArea: document.getElementById('progress-container'),
  progressBar: document.getElementById('progress-bar'),
  currentTime: document.getElementById('current-time'),
  totalTime: document.getElementById('total-time'),
  visualizer: document.getElementById('spirited-visualizer')
};

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log("Dreamy Star-Player Engine starting...");
  
  // 1. Load Data
  try {
    const configStr = sessionStorage.getItem('arcadeConfig');
    const config = (configStr && configStr !== "null" && configStr !== "undefined") ? JSON.parse(configStr) : {};
    
    const audioUrl = config.audio_url || '';
    const trackTitle = config.track_title || 'Merry-Go-Round of Life';
    const trackArtist = config.track_artist || "Studio Ghibli";
    const albumUrl = config.album_art || '../../../assets/mockup_1.png';

    if (UI.audio && audioUrl) UI.audio.src = audioUrl;
    if (UI.title) UI.title.textContent = trackTitle;
    if (UI.artist) UI.artist.textContent = trackArtist;
    if (UI.cover) UI.cover.src = albumUrl;
  } catch (e) {
    console.warn("Music Config Error, using fallbacks:", e);
  }

  // 2. Bind Events
  setupEvents();
});

function setupEvents() {
  if (UI.playBtn) UI.playBtn.addEventListener('click', togglePlay);
  if (UI.shuffleBtn) UI.shuffleBtn.addEventListener('click', toggleShuffle);
  if (UI.repeatBtn) UI.repeatBtn.addEventListener('click', toggleRepeat);

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
}

function togglePlay() {
  if (!UI.audio.src) return;
  
  if (isPlaying) {
    UI.audio.pause();
    UI.playIcon.textContent = '▶';
    stopVisualizer();
  } else {
    UI.audio.play().then(() => {
        UI.playIcon.textContent = '⏸';
        startVisualizer();
    }).catch(e => {
        console.warn("Playback blocked:", e);
        UI.playIcon.textContent = '▶';
    });
  }
  isPlaying = !isPlaying;
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  UI.shuffleBtn.style.color = isShuffle ? 'var(--star-gold)' : '';
  UI.shuffleBtn.style.opacity = isShuffle ? '1' : '';
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  UI.repeatBtn.style.color = isRepeat ? 'var(--star-gold)' : '';
  UI.repeatBtn.style.opacity = isRepeat ? '1' : '';
}

function updateProgress() {
  if (UI.audio.duration) {
    const pct = (UI.audio.currentTime / UI.audio.duration) * 100;
    UI.progressBar.style.setProperty('--progress', `${pct}%`);
    UI.currentTime.textContent = formatTime(UI.audio.currentTime);
  }
}

function handleTrackEnd() {
  if (isRepeat) {
    UI.audio.currentTime = 0;
    UI.audio.play();
  } else {
    isPlaying = false;
    UI.playIcon.textContent = '▶';
    stopVisualizer();
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
