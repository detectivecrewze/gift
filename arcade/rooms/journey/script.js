/**
 * Journey Room — The Celestial Keepsake
 * Handles anniversary calculation and soft celestial particle effects.
 */

const config = JSON.parse(sessionStorage.getItem('arcadeConfig') || '{}');
const anniversaryDate = config.anniversary_date ? new Date(config.anniversary_date) : null;

const els = {
  years: document.getElementById('timer-years'),
  months: document.getElementById('timer-months'),
  days: document.getElementById('timer-days'),
  hours: document.getElementById('timer-hours'),
  minutes: document.getElementById('timer-minutes'),
  seconds: document.getElementById('timer-seconds'),
};

document.addEventListener('DOMContentLoaded', () => {
  initSoftStars();
  
  if (!anniversaryDate || isNaN(anniversaryDate.getTime())) {
    // Default fallback
    updateDisplay({ years: 0, months: 0, days: 0, hours: '00', minutes: '00', seconds: '00' });
    return;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
});

function updateTimer() {
  const now = new Date();
  const start = new Date(anniversaryDate);

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  updateDisplay({ years, months, days, hours, minutes, seconds });
}

function updateDisplay(data) {
  if (els.years) els.years.textContent = data.years;
  if (els.months) els.months.textContent = data.months;
  if (els.days) els.days.textContent = data.days;
  if (els.hours) els.hours.textContent = data.hours;
  if (els.minutes) els.minutes.textContent = data.minutes;
  if (els.seconds) els.seconds.textContent = data.seconds;
}

/**
 * Creates soft, twinkling stars for a more aesthetic feel
 */
function initSoftStars() {
  const container = document.getElementById('stars-container');
  if (!container) return;

  const starCount = window.innerWidth < 480 ? 30 : 60;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    const x = Math.random() * 100;
    const y = Math.random() * 80; // Keep stars mostly in upper sky
    
    const size = Math.random() * 2 + 1;
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 5;
    
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.setProperty('--duration', `${duration}s`);
    star.style.animationDelay = `${delay}s`;

    container.appendChild(star);
  }
}
