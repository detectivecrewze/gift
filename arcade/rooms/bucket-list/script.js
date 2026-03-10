/**
 * Bucket List Room — The Attic Journal
 * Handles dynamic list rendering and aesthetic toggle interactions
 */

let bucketListData = [];

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('Attic Journal opening...');
  
  // 1. Data Loading (Robust Try-Catch)
  try {
    const configStr = sessionStorage.getItem('arcadeConfig');
    const config = (configStr && configStr !== "null" && configStr !== "undefined") ? JSON.parse(configStr) : {};
    
    if (Array.isArray(config.bucket_list) && config.bucket_list.length > 0) {
      bucketListData = config.bucket_list;
    }
  } catch (err) {
    console.error('Bucket List Config Parse Failed:', err);
  }

  // 2. Fallback Data
  if (bucketListData.length === 0) {
    bucketListData = [
      { text: "Traveling to Japan together", completed: false },
      { text: "Watching the stars from a roof", completed: true },
      { text: "Building a pixel-art house", completed: false },
      { text: "Learning to cook Ghibli food", completed: false },
      { text: "Finding the hidden forest spirits", completed: true }
    ];
  }

  // 3. Kickstart
  initParticles();
  renderList();
});

/**
 * Renders the bucket list items with aesthetic animations
 */
function renderList() {
  const container = document.getElementById('bucket-list');
  if (!container) return;
  
  container.innerHTML = '';

  bucketListData.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = `bucket-item ${item.completed ? 'completed' : ''}`;
    el.style.animation = `fadeSlideIn 0.5s ease-out forwards ${index * 0.1}s`;
    el.style.opacity = '0';
    
    el.innerHTML = `
      <div class="check-box"></div>
      <span class="item-text">${item.text}</span>
    `;

    el.addEventListener('click', () => toggleItem(index));
    container.appendChild(el);
  });
}

/**
 * Toggles the completed state with visual feedback
 */
function toggleItem(index) {
  bucketListData[index].completed = !bucketListData[index].completed;
  
  // Re-render to show updated state
  renderList();
  
  // Optional: In a more complex app, we'd sync back to session storage
  // but here we just keep it in memory for the session.
}

/**
 * Aesthetic Drifting Petals
 */
function initParticles() {
  const container = document.getElementById('petals');
  if (!container) return;
  
  const particleCount = window.innerWidth < 480 ? 12 : 20;
  
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 6 + Math.random() * 8;
    
    p.style.width = p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${7 + Math.random() * 12}s`;
    p.style.animationDelay = `-${Math.random() * 10}s`;
    
    container.appendChild(p);
  }
}

// Inline animation for list arrival
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);
