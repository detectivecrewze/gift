/**
 * Fortune Cookie Room — Arcade Edition
 * Tap to open, get a random romantic / funny quote.
 * No config needed from Studio.
 */

/* ── Fortune Library (hardcoded: 25 quotes) ──────────── */
const FORTUNES = [
  "Hari ini, seseorang diam-diam memikirkan hal yang paling kamu sukai dari dirimu.",
  "Kebaikan kecil yang kamu lakukan tadi pagi — itu penting bagi orang yang menerimanya.",
  "Ada seseorang yang merasa lebih aman hanya karena tahu kamu ada.",
  "Kamu tidak perlu menjadi sempurna untuk dicintai. Kamu sudah cukup, persis seperti sekarang.",
  "Cerita kalian baru saja dimulai. Bab terbaiknya belum ditulis.",
  "Terkadang, orang yang paling kamu butuhkan justru sudah ada di sisimu sejak lama.",
  "Waktu berlalu, tapi orang yang benar-benar peduli, mereka tidak pergi ke mana-mana.",
  "Hal yang paling indah tidak selalu bisa difoto — tapi selalu bisa diingat.",
  "Kalian mungkin pernah bertengkar, tapi kalian tetap memilih untuk kembali. Itu bukan hal kecil.",
  "Ada yang sedang berdoa supaya harimu lebih baik dari kemarin.",
  "Kamu bukan sekadar kenangan bagi seseorang. Kamu adalah alasan mereka tersenyum hari ini.",
  "Jarak tidak mengubah rasa, hanya membuatnya lebih nyata.",
  "Ketika kamu capek, istirahat saja. Seseorang akan menunggu dan tidak ke mana-mana.",
  "Hal paling berani yang bisa kamu lakukan adalah jujur tentang apa yang kamu rasakan.",
  "Suatu hari nanti, momen ini akan jadi cerita yang kalian ceritakan sambil tertawa.",
  "Kamu tidak perlu selalu kuat. Seseorang dengan senang hati akan menopangmu.",
  "Kepercayaan yang dijaga dengan baik lebih berharga dari hadiah apapun.",
  "Hubungan yang baik bukan soal tidak pernah bertengkar. Tapi soal selalu mau berbicara lagi.",
  "Orang yang tepat tidak membuatmu merasa harus berpura-pura jadi orang lain.",
  "Ada ketenangan yang hanya muncul ketika kamu berada dengan orang yang tepat.",
  "Kamu pernah membuat seseorang merasa diterima di saat mereka merasa paling sendiri.",
  "Hal kecil yang kamu ingat tentang seseorang — itulah bentuk cinta yang paling tulus.",
  "Tidak semua yang terasa lambat itu buruk. Terkadang yang lambat itulah yang bertahan lama.",
  "Seseorang menyimpan foto kamu di tempatnya yang paling sering dilihat.",
  "Hari ini tidak harus sempurna untuk menjadi hari yang baik buat kalian.",
];

/* ── Confetti Colors ─────────────────────────────────── */
const CONFETTI_COLORS = [
  '#f5d06a','#e8a230','#e85080','#a855d0','#5bc4f5','#5dcf68'
];

/* ── State ───────────────────────────────────────────── */
let openCount = 0;
let isAnimating = false;

/* ── DOM ─────────────────────────────────────────────── */
const machine      = document.getElementById('cookie-machine');
const btn          = document.getElementById('cookie-btn');
const screenIdle   = document.getElementById('screen-idle');
const slipContainer= document.getElementById('slip-container');
const fortuneText  = document.getElementById('fortune-text');
const openCounter  = document.getElementById('open-counter');
const confettiLayer= document.getElementById('confetti-layer');
const petalLayer   = document.getElementById('petal-layer');

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  spawnPetals();
  btn.addEventListener('click', openCookie);
});

/* ── Open Cookie ─────────────────────────────────────── */
function openCookie() {
  if (isAnimating) return;
  isAnimating = true;
  btn.disabled = true;

  // 1. Shake machine
  machine.classList.add('machine-shake');
  machine.addEventListener('animationend', onShakeEnd, { once: true });
}

function onShakeEnd() {
  machine.classList.remove('machine-shake');

  // Pick random fortune (avoid repeating last one)
  const fortune = pickFortune();

  // 2. Hide idle screen, show slip
  screenIdle.style.display = 'none';
  slipContainer.classList.remove('hidden');
  fortuneText.textContent = fortune;

  // 3. Confetti burst
  spawnConfetti();

  // 4. Update counter
  openCount++;
  openCounter.textContent = `🍀 sudah dibuka ${openCount}x hari ini`;

  // 5. Re-enable after 2s
  setTimeout(() => {
    btn.disabled = false;
    btn.querySelector('.btn-top').textContent = 'BUKA LAGI ▶';
    isAnimating = false;
  }, 2000);

  // 6. Button click again resets to new fortune
  btn.onclick = resetAndOpen;
}

let lastIndex = -1;
function pickFortune() {
  let idx;
  do { idx = Math.floor(Math.random() * FORTUNES.length); }
  while (idx === lastIndex && FORTUNES.length > 1);
  lastIndex = idx;
  return FORTUNES[idx];
}

function resetAndOpen() {
  if (isAnimating) return;
  isAnimating = true;
  btn.disabled = true;

  // Collapse the slip
  const slip = document.getElementById('fortune-slip');
  slip.style.animation = 'none';
  slip.offsetHeight; // force reflow

  // Re-shake & pick new fortune
  machine.classList.add('machine-shake');
  machine.addEventListener('animationend', () => {
    machine.classList.remove('machine-shake');
    const fortune = pickFortune();
    // Re-animate slip
    slipContainer.classList.remove('hidden');
    slip.style.animation = '';
    void slip.offsetWidth;
    slip.style.animation = 'slipReveal 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards';
    fortuneText.textContent = fortune;
    spawnConfetti();
    openCount++;
    openCounter.textContent = `🍀 sudah dibuka ${openCount}x hari ini`;
    setTimeout(() => {
      btn.disabled = false;
      isAnimating = false;
    }, 1800);
  }, { once: true });
}

/* ── Confetti ────────────────────────────────────────── */
function spawnConfetti() {
  const count = 28;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const x = 20 + Math.random() * 60; // % from left
      const dur = 1.2 + Math.random() * 1.2;
      const size = 5 + Math.floor(Math.random() * 8);
      el.style.cssText = `
        left: ${x}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation-duration: ${dur}s;
      `;
      confettiLayer.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000 + 100);
    }, i * 40);
  }
}

/* ── Sakura Petals ───────────────────────────────────── */
const PETAL_COLORS = [
  'rgba(232,168,220,0.75)',
  'rgba(255,182,193,0.65)',
  'rgba(245,208,106,0.55)',
  'rgba(255,200,230,0.6)',
];

function spawnPetals() {
  const count = window.innerWidth < 480 ? 10 : 18;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'petal';
      const color  = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      const left   = Math.random() * 100;
      const dur    = 6 + Math.random() * 10;
      const delay  = Math.random() * 6;
      const size   = 4 + Math.floor(Math.random() * 6);
      el.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        animation-duration: ${dur}s;
        animation-delay: ${delay}s;
      `;
      petalLayer.appendChild(el);
      // Loop: remove and re-add after animation
      el.addEventListener('animationend', () => {
        el.style.left = `${Math.random() * 100}%`;
        el.style.animationDuration = `${6 + Math.random() * 10}s`;
        el.style.animationDelay = '0s';
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      });
    }, i * 300);
  }
}
