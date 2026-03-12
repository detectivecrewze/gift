/**
 * Things I Love — script.js
 * Scratch card reveal per item + persistent state via sessionStorage
 */

const loveList = document.getElementById('love-list');
const STORAGE_KEY = 'til_revealed';

// Get revealed state — array of revealed indexes
function getRevealedState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) { return []; }
}

// Save revealed index
function saveRevealed(index) {
  const state = getRevealedState();
  if (!state.includes(index)) {
    state.push(index);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function init() {
  const config = getRoomConfig();
  const data = config.things_i_love || [
    "Cara kamu tertawa...",
    "Kesabaranmu saat aku cerewet...",
    "Semangatmu mencapai mimpi...",
    "Matamu saat kamu bahagia...",
    "Cara kamu bilang nama aku..."
  ];

  const revealedState = getRevealedState();

  if (loveList) {
    loveList.innerHTML = '';

    data.forEach((text, index) => {
      const item = document.createElement('div');
      const alreadyRevealed = revealedState.includes(index);

      item.className = 'love-item' + (alreadyRevealed ? ' revealed' : '');
      item.style.animationDelay = `${index * 0.08}s`;

      item.innerHTML = `
        <div class="item-index">${index + 1}</div>
        <div class="scratch-wrap">
          <div class="item-text">${text}</div>
          ${alreadyRevealed ? '' : `<canvas class="scratch-canvas"></canvas><div class="scratch-hint">Gosok untuk membuka ✨</div>`}
        </div>
      `;

      loveList.appendChild(item);
    });

    // Init scratch only for unrevealed items
    requestAnimationFrame(() => {
      document.querySelectorAll('.love-item:not(.revealed)').forEach((item, i) => {
        const canvas = item.querySelector('.scratch-canvas');
        if (canvas) {
          // Get the real index from item-index text
          const realIndex = parseInt(item.querySelector('.item-index').textContent) - 1;
          initScratch(canvas, item, realIndex);
        }
      });
    });
  }

  createSakura();
}

function initScratch(canvas, item, index) {
  const wrap = canvas.closest('.scratch-wrap');
  const hint = item.querySelector('.scratch-hint');

  canvas.width = wrap.offsetWidth || 200;
  canvas.height = wrap.offsetHeight || 36;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let revealed = false;

  // Draw scratch layer
  ctx.fillStyle = '#e8c9b0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160, 110, 70, 0.25)';
    ctx.fill();
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - r.left) * scaleX,
        y: (e.touches[0].clientY - r.top) * scaleY
      };
    }
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY
    };
  }

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    checkReveal();
  }

  function checkReveal() {
    if (revealed) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) cleared++;
    }
    if (cleared / (canvas.width * canvas.height) > 0.5) {
      revealed = true;
      saveRevealed(index); // Save to sessionStorage
      canvas.style.transition = 'opacity 0.4s ease';
      canvas.style.opacity = '0';
      item.classList.add('revealed');
      setTimeout(() => canvas.remove(), 400);
    }
  }

  // Mouse
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    hint && hint.remove();
    const p = getPos(e); scratch(p.x, p.y);
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const p = getPos(e); scratch(p.x, p.y);
  });
  canvas.addEventListener('mouseup', () => isDrawing = false);
  canvas.addEventListener('mouseleave', () => isDrawing = false);

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    hint && hint.remove();
    const p = getPos(e); scratch(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const p = getPos(e); scratch(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchend', () => isDrawing = false);
}

function createSakura() {
  const container = document.createElement('div');
  container.className = 'sakura-container';
  document.body.appendChild(container);

  for (let i = 0; i < 18; i++) {
    const s = document.createElement('div');
    s.className = 'sakura';
    const size = 5 + Math.random() * 5;
    const pink = Math.floor(170 + Math.random() * 40);
    s.style.left = `${Math.random() * 100}%`;
    s.style.width = `${size}px`;
    s.style.height = `${size}px`;
    s.style.animationDuration = `${6 + Math.random() * 8}s`;
    s.style.animationDelay = `${Math.random() * 10}s`;
    s.style.setProperty('--sway', `${Math.random() * 80 - 40}px`);
    s.style.background = `rgba(255, ${pink}, ${pink - 20}, 0.65)`;
    container.appendChild(s);
  }
}

function getRoomConfig() {
  try {
    const config = sessionStorage.getItem('arcadeConfig');
    return config ? JSON.parse(config) : {};
  } catch (e) { return {}; }
}

init();