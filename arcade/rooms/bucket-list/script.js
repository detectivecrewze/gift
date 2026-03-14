/**
 * Bucket List Room — Cozy Journal Diary
 */

document.addEventListener('DOMContentLoaded', () => {
  let bucketListData = [];

  try {
    const configStr = sessionStorage.getItem('arcadeConfig');
    const config = (configStr && configStr !== "null") ? JSON.parse(configStr) : {};
    if (Array.isArray(config.bucket_list) && config.bucket_list.length > 0) {
      bucketListData = config.bucket_list;
    }
  } catch (err) { }

  if (bucketListData.length === 0) {
    bucketListData = [
      { text: "Traveling to Japan together", completed: false },
      { text: "Watching the stars from a roof", completed: true },
      { text: "Building a pixel-art house", completed: false },
      { text: "Learning to cook Ghibli food", completed: false },
      { text: "Finding the hidden forest spirits", completed: true }
    ];
  }

  const savedState = getBucketListState();
  if (savedState && savedState.length === bucketListData.length) {
    bucketListData.forEach((item, index) => {
      item.completed = savedState[index];
    });
  }

  initPetals();
  renderList(bucketListData);
});

function renderList(data) {
  const container = document.getElementById('bucket-list');
  if (!container) return;
  container.innerHTML = '';

  data.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'bucket-item' + (item.completed ? ' completed' : '');
    el.style.animationDelay = `${i * 0.08}s`;

    el.innerHTML = `
      <div class="item-left">
        <div class="check-circle">
          ${item.completed ? '<span class="check-icon">✓</span>' : ''}
        </div>
        <div class="item-line"></div>
      </div>
      <div class="item-body">
        <span class="item-number">${String(i + 1).padStart(2, '0')}</span>
        <p class="item-text">${item.text}</p>
      </div>
    `;

    el.addEventListener('click', () => {
      item.completed = !item.completed;
      saveBucketListState(data);
      renderList(data);
    });

    container.appendChild(el);
  });
}

function initPetals() {
  const container = document.getElementById('petals');
  if (!container) return;
  const count = window.innerWidth < 480 ? 10 : 16;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 5 + Math.random() * 6;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${8 + Math.random() * 10}s;
      animation-delay: -${Math.random() * 12}s;
    `;
    container.appendChild(p);
  }
}

const STORAGE_KEY = 'bucket_list_state';

function getBucketListState() {
  try {
    const raw = (window.parent !== window)
      ? window.parent.sessionStorage.getItem(STORAGE_KEY)
      : sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveBucketListState(data) {
  const stateToSave = data.map(item => item.completed);
  const val = JSON.stringify(stateToSave);
  try {
    if (window.parent !== window) window.parent.sessionStorage.setItem(STORAGE_KEY, val);
    else sessionStorage.setItem(STORAGE_KEY, val);
  } catch (e) { sessionStorage.setItem(STORAGE_KEY, val); }
}