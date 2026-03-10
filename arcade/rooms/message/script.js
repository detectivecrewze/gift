/**
 * Message Room — The Aesthetic Letter
 * Handles smooth typewriter effect and sunlight/dust particles
 */

let config = {};
try {
  const stored = sessionStorage.getItem('arcadeConfig');
  if (stored && stored !== 'undefined' && stored !== 'null') {
    config = JSON.parse(stored);
  }
} catch (error) {
  console.error('Message Room: Failed to parse arcadeConfig', error);
}

// Ensure the message is valid, if it's just spaces, default it.
let safeMsg = typeof config.message === 'string' ? config.message.trim() : '';
if (!safeMsg) {
  safeMsg = `My Dearest,

Sometimes I think about the many small moments we've shared, and they all feel like scenes from a beautiful dream. Just like a quiet afternoon where the sunlight hits the floor just right, your presence fills my life with a gentle warmth.

Thank you for being my favorite person to share this journey with. I hope this little surprise brings a smile to your face today.

With all my heart,
Your favorite person 🌸✨`;
}
const message = safeMsg;

document.addEventListener('DOMContentLoaded', () => {
  console.log("Message Room: DOM Content Loaded");
  initDustParticles();

  // Selection happens inside the listener to be 100% safe
  const textEl = document.getElementById('letter-text');
  const cursorEl = document.getElementById('letter-cursor');

  if (!textEl) {
    console.error("Message Room Error: #letter-text element not found!");
    return;
  }

  // Gentle delay before typing starts
  setTimeout(() => {
    typeWriter(textEl, cursorEl, message, 0);
  }, 800);
});

/**
 * Super smooth, elegant typewriter effect
 */
function typeWriter(textEl, cursorEl, text, index) {
  if (index < text.length) {
    textEl.textContent += text.charAt(index);
    
    // Auto-scroll the letter smoothly
    const scrollArea = textEl.closest('.scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }

    // Dynamic delay for natural rhythm
    let delay = 30 + Math.random() * 20; 
    
    const char = text.charAt(index);
    if (char === '\n') delay = 400;
    else if (char === '.' || char === '!' || char === '?') delay = 600;
    else if (char === ',') delay = 200;

    setTimeout(() => typeWriter(textEl, cursorEl, text, index + 1), delay);
  } else {
    // Done typing, hide cursor
    if (cursorEl) {
      cursorEl.style.display = 'none';
    }
    console.log("Message Room: Typing complete");
  }
}

/**
 * Creates drifting dust/light motes for the cottagecore atmosphere
 */
function initDustParticles() {
  const container = document.getElementById('dust-container');
  if (!container) return;

  const particleCount = window.innerWidth < 480 ? 15 : 30;

  for (let i = 0; i < particleCount; i++) {
    const mote = document.createElement('div');
    mote.className = 'mote';
    
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() * 3 + 1;
    const duration = 6 + Math.random() * 10;
    const delay = Math.random() * 5;
    
    const moveX = (Math.random() - 0.5) * 40 + 'px';
    const moveY = (Math.random() - 0.5) * -50 + 'px';

    mote.style.left = `${x}%`;
    mote.style.top = `${y}%`;
    mote.style.width = `${size}px`;
    mote.style.height = `${size}px`;
    mote.style.opacity = (Math.random() * 0.3 + 0.1).toString();
    
    mote.style.setProperty('--duration', `${duration}s`);
    mote.style.setProperty('--mx', moveX);
    mote.style.setProperty('--my', moveY);
    mote.style.animationDelay = `${delay}s`;

    container.appendChild(mote);
  }
}
