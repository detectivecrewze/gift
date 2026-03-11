/**
 * Moments Room — The Wind of Memories
 * Pixel Gallery Edition (Studio Integrated — Final Polish)
 */

// ── State ─────────────────────────────────────────────────
let photos = [];
let currentIndex = 0;

// ── DOM References (Lazy Initialized to ensure they exist) ───
const UI = {
  get photo() { return document.getElementById('main-photo'); },
  get caption() { return document.getElementById('caption-text'); },
  get counter() { return document.getElementById('gallery-counter'); },
  get prev() { return document.getElementById('prev-btn'); },
  get next() { return document.getElementById('next-btn'); }
};

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('Moments Pixel Gallery powering up...');

  // 1. Load Data from SessionStorage (with deep error safety)
  try {
    const configStr = sessionStorage.getItem('arcadeConfig');
    const config = (configStr && configStr !== "null") ? JSON.parse(configStr) : {};
    let rawPhotos = config.photos;

    if (Array.isArray(rawPhotos) && rawPhotos.length > 0) {
      photos = rawPhotos.map(p => {
        if (typeof p === 'string') return { url: p, caption: '' };
        if (typeof p === 'object' && p !== null) {
          return { url: p.url || '', caption: p.caption || '' };
        }
        return null;
      }).filter(Boolean);
    }

    // Show recipient name on wooden sign
    const nameEl = document.getElementById('recipient-name');
    if (nameEl) {
      const name = config.recipient_name || config.name || 'My Love';
      nameEl.textContent = name.toUpperCase();
    }
  } catch (err) {
    console.error('Config parse failed:', err);
  }

  // 2. Fallback if still empty
  if (photos.length === 0) {
    photos = [
      { url: '../../../assets/mockup_1.png', caption: 'Memories on the hill... ✨' },
      { url: '../../../assets/mockup_2.png', caption: 'A golden afternoon with you. 🌅' },
      { url: '../../../assets/mockup_3.png', caption: 'Cozy nights and starry skies. 🕯️' }
    ];
  }

  // 3. Kickstart UI
  updateGallery();
  initParticles();
  setupEvents();
});

function setupEvents() {
  if (UI.prev) UI.prev.addEventListener('click', () => navigate(-1));
  if (UI.next) UI.next.addEventListener('click', () => navigate(1));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape') window.parent.postMessage('closeRoom', '*');
  });

  // Swipe support (throttled)
  let startX = 0;
  let isMoving = false;
  document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isMoving = true; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!isMoving) return;
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      navigate(diff < 0 ? 1 : -1);
      isMoving = false;
    }
  }, { passive: true });
}

function updateGallery() {
  if (!photos.length) return;
  const current = photos[currentIndex];

  // 1. Update Photo with Pixel Fade
  if (UI.photo) {
    UI.photo.style.opacity = 0;

    // Preload image to avoid flickering
    const tempImg = new Image();
    tempImg.onload = () => {
      UI.photo.src = current.url;
      UI.photo.alt = current.caption || 'Moment';
      UI.photo.style.opacity = 1;
    };
    tempImg.onerror = () => {
      UI.photo.src = 'https://via.placeholder.com/400x500?text=Error+Loading+Image';
      UI.photo.style.opacity = 1;
    };
    tempImg.src = current.url;
  }

  // 2. Update Caption (Studio Integrated)
  if (UI.caption) {
    UI.caption.textContent = current.caption || '...';
  }

  // 3. Update Nav States
  if (UI.counter) UI.counter.textContent = `${currentIndex + 1} / ${photos.length}`;
  if (UI.prev) UI.prev.disabled = currentIndex === 0;
  if (UI.next) UI.next.disabled = currentIndex === photos.length - 1;
}

function navigate(dir) {
  const next = currentIndex + dir;
  if (next >= 0 && next < photos.length) {
    currentIndex = next;
    updateGallery();
  }
}

// ── Magical Particles — Petals (Pixel Aesthetic) ──────────
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 6 + Math.random() * 8;
    p.style.width = p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 10) + 's';
    p.style.animationDelay = `-${Math.random() * 10}s`;

    // Pixel-style blur (optional, subtle)
    if (Math.random() > 0.7) p.style.filter = `blur(${Math.random() * 1.5}px)`;

    container.appendChild(p);
  }
}
