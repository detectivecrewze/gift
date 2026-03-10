/**
 * Arcade Edition — Main Script
 * Handles loading, password gate, main menu, and room navigation.
 */

const WORKER_URL = 'https://arcade-edition.aldoramadhan16.workers.dev';

// ── State ─────────────────────────────────────────────────
let giftConfig = null;
let giftId = null;

// ── DOM References ────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loadingScreen  = $('#loading-screen');
const passwordScreen = $('#password-screen');
const menuScreen     = $('#menu-screen');
const loadingBar     = $('#loading-bar');
const loadingName    = $('#loading-name');
const menuRecipientName = $('#menu-recipient-name');

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  giftId = getGiftIdFromURL();

  if (!giftId) {
    showError('No gift ID found. Please check your link.');
    return;
  }

  // Start loading bar animation
  animateLoadingBar();

  try {
    const res = await fetch(`${WORKER_URL}/get-config?id=${encodeURIComponent(giftId)}`);
    if (!res.ok) throw new Error('Gift not found');
    giftConfig = await res.json();

    // Set recipient name
    const name = giftConfig.recipient_name || 'Lisa';
    loadingName.textContent = name;
    if (menuRecipientName) {
      menuRecipientName.textContent = name;
    }

    // Finish loading bar
    loadingBar.style.width = '100%';

    // Wait for loading animation to finish
    await delay(2500);

    // Decide next screen
    if (giftConfig.password) {
      switchScreen(loadingScreen, passwordScreen);
      initPasswordGate();
    } else {
      switchScreen(loadingScreen, menuScreen);
      initMainMenu();
    }

  } catch (err) {
    console.error('Load error:', err);
    loadingName.textContent = 'Lisa';
    if (menuRecipientName) {
      menuRecipientName.textContent = 'Lisa';
    }
    loadingBar.style.width = '100%';
    await delay(2500);
    // Show menu anyway with demo data for testing
    switchScreen(loadingScreen, menuScreen);
    initMainMenu();
  }
}

// ── URL Parsing ───────────────────────────────────────────
function getGiftIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('to')) return params.get('to');
  if (params.get('id')) return params.get('id');

  // Path-based: /gift/name or /arcade/name
  const path = window.location.pathname.split('/').filter(Boolean);
  if (path.length > 0) return path[path.length - 1];

  return null;
}

// ── Loading Bar ───────────────────────────────────────────
function animateLoadingBar() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 85) progress = 85;
    loadingBar.style.width = progress + '%';
    if (progress >= 85) clearInterval(interval);
  }, 200);
}

// ── Password Gate ─────────────────────────────────────────
function initPasswordGate() {
  const input = $('#password-input');
  const btn   = $('#password-btn');
  const error = $('#password-error');

  btn.addEventListener('click', checkPassword);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPassword();
  });

  function checkPassword() {
    const val = input.value.trim();
    if (!val) return;

    if (val === giftConfig.password) {
      switchScreen(passwordScreen, menuScreen);
      initMainMenu();
    } else {
      input.classList.add('shake');
      error.textContent = 'Wrong password. Try again 💔';
      setTimeout(() => input.classList.remove('shake'), 400);
    }
  }
}

// ── Main Menu ─────────────────────────────────────────────
function initMainMenu() {
  createSparkles();

  // Attach click handlers to menu items
  $$('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const room = item.dataset.room;
      navigateToRoom(room);
    });
  });
}

function createSparkles() {
  const container = $('#sparkle-container');
  if (!container) return;

  for (let i = 0; i < 15; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = (Math.random() * 60 + 10) + '%';
    sparkle.style.animationDelay = (Math.random() * 5) + 's';
    sparkle.style.animationDuration = (2 + Math.random() * 3) + 's';
    container.appendChild(sparkle);
  }
}

function navigateToRoom(room) {
  // Store config for rooms to access
  sessionStorage.setItem('arcadeConfig', JSON.stringify(giftConfig));
  sessionStorage.setItem('arcadeGiftId', giftId);

  const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
  const url = `${basePath}/rooms/${room}/index.html`;

  const modal = $('#room-modal');
  const iframe = $('#room-iframe');
  
  iframe.src = url;
  modal.classList.add('active');
}

// ── Modal Close Logic ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const modal = $('#room-modal');
  const iframe = $('#room-iframe');
  const closeBtn = $('#modal-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      iframe.src = 'about:blank'; // Reset iframe to stop music/videos
    });
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        iframe.src = 'about:blank';
      }
    });
  }
});

// ── Screen Management ─────────────────────────────────────
function switchScreen(from, to) {
  from.classList.remove('active');
  from.classList.add('fade-out');
  to.classList.add('active', 'fade-in');

  setTimeout(() => {
    from.classList.remove('fade-out');
    to.classList.remove('fade-in');
  }, 500);
}

// ── Utilities ─────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showError(msg) {
  loadingName.textContent = '';
  const text = $('#loading-text');
  if (text) {
    text.innerHTML = `<span style="color:#FF6B6B;font-family:'DM Sans',sans-serif;font-style:normal;font-size:0.9rem">${msg}</span>`;
  }
}
