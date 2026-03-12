/**
 * Things I Love — script.js
 * JS-driven flip animation + persistent state
 */

const loveList = document.getElementById('love-list');
const STORAGE_KEY = 'til_revealed';

function getRevealedState() {
  try {
    const raw = (window.parent !== window)
      ? window.parent.sessionStorage.getItem(STORAGE_KEY)
      : sessionStorage.getItem(STORAGE_KEY);
    return JSON.parse(raw || '[]');
  } catch (e) { return []; }
}

function saveRevealed(index) {
  const state = getRevealedState();
  if (!state.includes(index)) {
    state.push(index);
    const val = JSON.stringify(state);
    try {
      if (window.parent !== window) window.parent.sessionStorage.setItem(STORAGE_KEY, val);
      else sessionStorage.setItem(STORAGE_KEY, val);
    } catch (e) { sessionStorage.setItem(STORAGE_KEY, val); }
  }
}

function flipItem(item, front, back) {
  // Phase 1: rotate out front
  front.style.transition = 'transform 0.22s ease-in, opacity 0.22s ease-in';
  front.style.transform = 'rotateY(90deg)';
  front.style.opacity = '0';

  setTimeout(() => {
    // Swap
    front.style.display = 'none';
    back.style.display = 'flex';
    back.style.transform = 'rotateY(-90deg)';
    back.style.opacity = '0';

    // Phase 2: rotate in back
    requestAnimationFrame(() => {
      back.style.transition = 'transform 0.22s ease-out, opacity 0.22s ease-out';
      back.style.transform = 'rotateY(0deg)';
      back.style.opacity = '1';
    });
  }, 230);
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
      const alreadyRevealed = revealedState.includes(index);

      const item = document.createElement('div');
      item.className = 'flip-item';
      item.style.animationDelay = `${index * 0.08}s`;

      // Front
      const front = document.createElement('div');
      front.className = 'flip-face flip-front';
      front.innerHTML = `
        <div class="item-number">${index + 1}</div>
        <div class="item-hint">Tap untuk membuka ✦</div>
      `;

      // Back
      const back = document.createElement('div');
      back.className = 'flip-face flip-back';
      back.innerHTML = `
        <div class="item-number back-num">${index + 1}</div>
        <div class="item-text">${text}</div>
      `;

      if (alreadyRevealed) {
        front.style.display = 'none';
        back.style.display = 'flex';
        back.style.opacity = '1';
        back.style.transform = 'rotateY(0deg)';
      } else {
        front.style.display = 'flex';
        back.style.display = 'none';
      }

      item.appendChild(front);
      item.appendChild(back);
      loveList.appendChild(item);

      if (!alreadyRevealed) {
        item.addEventListener('click', () => {
          item.style.pointerEvents = 'none';
          saveRevealed(index);
          flipItem(item, front, back);
        });
      }
    });
  }

  createSakura();
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
    let raw = null;
    if (window.parent !== window) raw = window.parent.sessionStorage.getItem('arcadeConfig');
    if (!raw) raw = sessionStorage.getItem('arcadeConfig');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

init();