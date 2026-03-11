/**
 * Quiz Room — script.js (Retro Pixel Arcade Redesign)
 * Loads quiz_questions from sessionStorage/worker and runs the game.
 */

const WORKER_URL = 'https://arcade-edition.aldoramadhan16.workers.dev';

// ── DOM refs ─────────────────────────────────────────────────
const loadingScreen  = document.getElementById('loading-screen');
const emptyScreen    = document.getElementById('empty-screen');
const quizScreen     = document.getElementById('quiz-screen');
const endingScreen   = document.getElementById('ending-screen');

const questionCard   = document.getElementById('question-card');
const questionText   = document.getElementById('question-text');
const hudScore       = document.getElementById('hud-score');
const hudQnum        = document.getElementById('hud-qnum');
const progressPips   = document.getElementById('progress-pips');
const optionsGrid    = document.getElementById('options-grid');
const monitorFlash   = document.getElementById('monitor-flash');
const nextBtn        = document.getElementById('next-btn');
const replayBtn      = document.getElementById('replay-btn');
const finalScore     = document.getElementById('final-score');
const totalQ         = document.getElementById('total-q');
const rankBadge      = document.getElementById('rank-badge');
const endingMessage  = document.getElementById('ending-message');

// ── State ─────────────────────────────────────────────────────
let questions     = [];
let currentIndex  = 0;
let score         = 0;
let answered      = false;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  spawnPixelParticles();
  animateLoadBar();

  let config = null;

  const raw = sessionStorage.getItem('arcadeConfig');
  if (raw) {
    try { config = JSON.parse(raw); } catch(e) {}
  }

  if (!config) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('to');
    if (id) {
      try {
        const res = await fetch(`${WORKER_URL}/get-config?id=${encodeURIComponent(id)}`);
        if (res.ok) config = await res.json();
      } catch(e) {}
    }
  }

  await delay(1400);

  const quiz = config?.quiz_questions;
  if (!Array.isArray(quiz) || quiz.length === 0) {
    showScreen(emptyScreen);
    return;
  }

  questions = quiz;
  startQuiz();
  showScreen(quizScreen);
});

// ── Quiz Flow ──────────────────────────────────────────────────
function startQuiz() {
  currentIndex = 0;
  score        = 0;
  answered     = false;

  buildPips();
  renderQuestion();
}

function buildPips() {
  progressPips.innerHTML = '';
  questions.forEach((_, i) => {
    const pip = document.createElement('div');
    pip.className = 'pip' + (i === 0 ? ' current' : '');
    pip.id = `pip-${i}`;
    progressPips.appendChild(pip);
  });
}

function updatePip(index, result) {
  const pip = document.getElementById(`pip-${index}`);
  if (!pip) return;
  pip.classList.remove('current');
  pip.classList.add(result ? 'correct' : 'wrong');
  const next = document.getElementById(`pip-${index + 1}`);
  if (next) next.classList.add('current');
}

function renderQuestion() {
  const q = questions[currentIndex];
  answered = false;

  hudQnum.textContent  = `${currentIndex + 1}/${questions.length}`;
  hudScore.textContent = String(score).padStart(3, '0');
  questionText.textContent = q.question;

  monitorFlash.className = 'monitor-flash';
  nextBtn.classList.add('hidden');

  // Build option buttons A/B/C/D
  optionsGrid.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  (q.options || []).forEach((opt, oi) => {
    if (opt === undefined || opt === null || String(opt).trim() === '') return;
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="opt-letter">${letters[oi]}</span><span>${opt}</span>`;
    btn.addEventListener('click', () => selectAnswer(oi, q.answer));
    optionsGrid.appendChild(btn);
  });
}

function selectAnswer(selected, correct) {
  if (answered) return;
  answered = true;

  const isCorrect = selected === correct;
  if (isCorrect) score++;

  updatePip(currentIndex, isCorrect);

  // Mark buttons
  const btns = optionsGrid.querySelectorAll('.option-btn');
  btns.forEach((btn, oi) => {
    btn.disabled = true;
    if (oi === correct)                    btn.classList.add('correct-answer');
    if (oi === selected && !isCorrect)     btn.classList.add('wrong-answer');
  });

  // Flash monitor
  monitorFlash.className = 'monitor-flash ' + (isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    questionCard.classList.add('shake');
    questionCard.addEventListener('animationend', () =>
      questionCard.classList.remove('shake'), { once: true });
  }

  hudScore.textContent = String(score).padStart(3, '0');

  // Show next
  nextBtn.classList.remove('hidden');
  nextBtn.querySelector('.btn-text').textContent =
    currentIndex < questions.length - 1 ? 'NEXT ▶' : 'RESULTS ★';
}

nextBtn.addEventListener('click', () => {
  monitorFlash.className = 'monitor-flash';
  currentIndex++;

  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    showEnding();
  }
});

replayBtn.addEventListener('click', () => {
  showScreen(quizScreen);
  buildPips();
  startQuiz();
});

// ── Ending ─────────────────────────────────────────────────────
function showEnding() {
  const total = questions.length;
  const pct   = score / total;

  finalScore.textContent = score;
  totalQ.textContent     = total;

  let rank, titleText;

  if (pct === 1) {
    rank      = '★ PERFECT ★';
    titleText = 'PERFECT!';
  } else if (pct >= 0.8) {
    rank      = '★ A RANK ★';
    titleText = 'EXCELLENT';
  } else if (pct >= 0.6) {
    rank      = '◆ B RANK ◆';
    titleText = 'GOOD';
  } else if (pct >= 0.4) {
    rank      = '▲ C RANK ▲';
    titleText = 'OK';
  } else {
    rank      = '░ D RANK ░';
    titleText = 'TRY AGAIN';
  }

  document.querySelector('.rainbow-text').textContent = titleText;
  rankBadge.textContent = rank;

  // No messages displayed at all
  if (endingMessage) endingMessage.style.display = 'none';

  showScreen(endingScreen);
}



// ── Pixel Particles ────────────────────────────────────────────
function spawnPixelParticles() {
  const container = document.getElementById('pixel-particles');
  if (!container) return;
  const count = window.innerWidth < 500 ? 10 : 20;
  const colors = ['#f4c653', '#e0a830', '#c8852a', '#3ecf58', '#5ba8f5'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'px-particle';
    const size = (Math.random() > 0.5 ? 4 : 6);
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      bottom: ${-size}px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${8 + Math.random() * 14}s;
      animation-delay: ${Math.random() * 12}s;
    `;
    container.appendChild(p);
  }
}

// ── Load Bar Animation ─────────────────────────────────────────
function animateLoadBar() {
  const bar = document.getElementById('load-bar');
  if (bar) bar.style.animationPlayState = 'running';
}

// ── Screen Switch ──────────────────────────────────────────────
function showScreen(target) {
  [loadingScreen, emptyScreen, quizScreen, endingScreen].forEach(s => {
    if (s) s.classList.remove('active');
  });
  if (target) target.classList.add('active');
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
