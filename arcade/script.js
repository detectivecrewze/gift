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

const loadingScreen = $('#loading-screen');
const passwordScreen = $('#password-screen');
const menuScreen = $('#menu-screen');
const loadingBar = $('#loading-bar');
const loadingName = $('#loading-name');
const menuRecipientName = $('#menu-recipient-name');

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const isBypassPreview = urlParams.get('preview') === 'true';
  const previewRoom = urlParams.get('room');
  const pt = urlParams.get('pt');

  giftId = getGiftIdFromURL();

  // ── Standalone Mode Check (Premium) ──────────────────────
  // Only use STANDALONE_CONFIG if NO giftId is provided in URL/Path
  if (window.STANDALONE_CONFIG && !giftId) {
    giftConfig = window.STANDALONE_CONFIG;
    giftId = giftConfig.id || 'premium';
    
    // Set direct loading finish
    const name = giftConfig.recipient_name || 'Lisa';
    loadingName.textContent = name;
    if (menuRecipientName) menuRecipientName.textContent = name;
    loadingBar.style.width = '100%';
    
    await delay(isBypassPreview ? 100 : 1500); 
    
    if (isBypassPreview && pt) {
       const localPt = localStorage.getItem(`arcade_pt_${giftId}`);
       if (pt === localPt) {
          switchScreen(loadingScreen, menuScreen);
          initMainMenu();
          if (previewRoom) navigateToRoom(previewRoom);
          return;
       }
    }

    if (giftConfig.password) {
      switchScreen(loadingScreen, passwordScreen);
      initPasswordGate();
    } else {
      switchScreen(loadingScreen, menuScreen);
      initMainMenu();
    }
    return;
  }

  if (!giftId) {
    showError('No gift ID found. Please check your link.');
    return;
  }

  // Start loading bar animation
  if (!isBypassPreview) animateLoadingBar();

  try {
    // Cache bust if it's a preview
    const cacheBuster = isBypassPreview ? `&t=${Date.now()}` : '';
    const res = await fetch(`${WORKER_URL}/get-config?id=${encodeURIComponent(giftId)}${cacheBuster}`, {
       // Force fresh data if previewing
       cache: isBypassPreview ? 'no-store' : 'default'
    });
    
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

    // Bypass check: PT exists and matches localStorage
    if (isBypassPreview && pt) {
      const savedPt = localStorage.getItem(`arcade_pt_${giftId}`);
      if (pt === savedPt) {
        // Clear PT for safety (short-lived)
        // localStorage.removeItem(`arcade_pt_${giftId}`); 
        
        await delay(300); // Tiny delay for visual feel
        switchScreen(loadingScreen, menuScreen);
        initMainMenu();
        if (previewRoom) navigateToRoom(previewRoom);
        return;
      }
    }

    // Wait for loading animation to finish normally
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
  
  // Path-based: /name (Clean URL) but exclude index.html
  const path = window.location.pathname.split('/').filter(Boolean);
  if (path.length > 0) {
    const lastPart = path[path.length - 1];
    if (lastPart !== 'index.html') return lastPart;
  }

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
  const btn = $('#password-btn');
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

// ── Main Menu ──────────────────────────────────────────────
function initMainMenu() {
  createPetals();
  initParallax();

  // Lock all rooms except music initially
  // AND Hide rooms that are disabled in config
  const activeApps = giftConfig.active_apps || {};

  $$('.menu-item').forEach(item => {
    const room = item.dataset.room;
    
    // Default rooms that are always active
    const isAlwaysActive = (room === 'star-catcher' || room === 'fortune-cookie');
    
    // Map room ID to active_apps key
    let configKey = room;
    if (room === 'bucket-list') configKey = 'bucket_list';

    // If app is disabled in config and not a default room, hide it
    if (!isAlwaysActive && activeApps[configKey] === false) {
      item.style.display = 'none';
      return; // Stop here for this item
    }

    if (room !== 'music') {
      item.classList.add('locked');
    }
    
    item.addEventListener('click', (e) => {
      // Prevent clicking if locked
      if (item.classList.contains('locked')) {
          e.preventDefault();
          return;
      }
      navigateToRoom(room, e);
    });
  });

  // Listen for unlock signal from Music Room
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'MUSIC_STARTED') {
      $$('.menu-item.locked').forEach(i => i.classList.remove('locked'));
    }
  });
}

// ── Petal Particle System ──────────────────────────────
const PETAL_COLORS = [
  'rgba(255,196,147,0.7)',
  'rgba(255,228,180,0.6)',
  'rgba(255,162,118,0.6)',
  'rgba(248,215,183,0.55)',
  'rgba(255,240,200,0.5)',
];

function createPetals() {
  const container = $('#petal-container');
  if (!container) return;
  const count = window.innerWidth < 500 ? 10 : 18;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      bottom: ${Math.random() * -40}%;
      background: ${color};
      width:  ${4 + Math.random() * 6}px;
      height: ${4 + Math.random() * 6}px;
      animation-duration: ${7 + Math.random() * 10}s;
      animation-delay:    ${Math.random() * 8}s;
    `;
    container.appendChild(p);
  }
}

// ── Parallax Engine ────────────────────────────────────
let _px = 0, _py = 0, _tx = 0, _ty = 0;
const PARALLAX_RANGE = 60;  /* max px of layer shift */
const LERP_FACTOR = 0.07; /* smoothing speed       */

function initParallax() {
  const screen = $('#menu-screen');
  if (!screen) return;

  // Desktop: follow mouse
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    _tx = ((e.clientX - cx) / cx) * PARALLAX_RANGE;
    _ty = ((e.clientY - cy) / cy) * PARALLAX_RANGE;
  });

  // Mobile: follow device tilt
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      const gamma = Math.max(-30, Math.min(30, e.gamma || 0)); // side tilt
      const beta = Math.max(-30, Math.min(30, (e.beta || 0) - 25)); // fwd/back
      _tx = (gamma / 30) * PARALLAX_RANGE;
      _ty = (beta / 30) * PARALLAX_RANGE;
    }, true);
  }

  // Main animation loop
  (function tick() {
    _px += (_tx - _px) * LERP_FACTOR;
    _py += (_ty - _py) * LERP_FACTOR;
    screen.style.setProperty('--px', `${_px}px`);
    screen.style.setProperty('--py', `${_py}px`);
    requestAnimationFrame(tick);
  })();
}

function navigateToRoom(room, clickEvent) {
  // Store config for rooms to access
  sessionStorage.setItem('arcadeConfig', JSON.stringify(giftConfig));
  sessionStorage.setItem('arcadeGiftId', giftId);

  const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
  const url = `${basePath}/rooms/${room}/index.html`;

  const isMusic = (room === 'music');

  if (clickEvent) {
    // Intentional delay before opening the room as per user's request
    setTimeout(() => {
      openModal(url, isMusic);
    }, 600); // intentional 0.6s delay
  } else {
    openModal(url, isMusic);
  }
}

function openModal(url, isMusic) {
  const modal = $('#room-modal');
  const roomIframe = $('#room-iframe');
  const musicIframe = $('#music-iframe');

  if (isMusic) {
    roomIframe.style.display = 'none';
    musicIframe.style.display = 'block';
    
    // Only set src if it's the first time
    if (!musicIframe.src || musicIframe.src === 'about:blank' || !musicIframe.src.includes('rooms/music')) {
      musicIframe.src = url;
    }
  } else {
    musicIframe.style.display = 'none';
    roomIframe.style.display = 'block';
    roomIframe.src = url;
  }
  
  if (musicIframe && musicIframe.contentWindow) {
      musicIframe.contentWindow.postMessage({ type: 'VISUALIZER_STATE', active: isMusic }, '*');
  }
  
  modal.classList.add('active');
}

// ── Modal Close Logic ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const modal = $('#room-modal');
  const roomIframe = $('#room-iframe');
  const musicIframe = $('#music-iframe');
  const closeBtn = $('#modal-close');

  const closeRoom = () => {
    modal.classList.remove('active');
    
    if (musicIframe && musicIframe.contentWindow) {
        musicIframe.contentWindow.postMessage({ type: 'VISUALIZER_STATE', active: false }, '*');
    }
    
    // Reset room iframe, but keep music iframe intact
    roomIframe.src = 'about:blank';
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeRoom);
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeRoom();
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
