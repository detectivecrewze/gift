/**
 * quiz.js — Studio: Manage quiz questions for the Quiz Room.
 * Pattern mirrors bucket-list.js for consistency.
 */
const Quiz = (() => {
  const MAX_QUESTIONS = 10;
  let questions = []; // [{ question, options:[str,str,str,str], answer:0-3 }]

  let container, emptyState, btnAdd;

  function init(initialQuestions = []) {
    questions = Array.isArray(initialQuestions) ? initialQuestions : [];

    container = document.getElementById('quiz-container');
    emptyState = document.getElementById('quiz-empty-state');
    btnAdd = document.getElementById('btn-add-quiz');

    if (btnAdd) btnAdd.addEventListener('click', addQuestion);
    if (emptyState) emptyState.addEventListener('click', addQuestion);

    render();
  }

  function render() {
    if (!container) return;
    container.innerHTML = '';

    const hasSome = questions.length > 0;
    emptyState && emptyState.classList.toggle('hidden', hasSome);
    container.classList.toggle('hidden', !hasSome);

    // Update add-button disabled state
    if (btnAdd) {
      btnAdd.disabled = questions.length >= MAX_QUESTIONS;
      btnAdd.classList.toggle('opacity-40', questions.length >= MAX_QUESTIONS);
    }

    questions.forEach((q, qi) => {
      const card = document.createElement('div');
      card.className = 'quiz-question-card bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3';

      // Header row
      const header = document.createElement('div');
      header.className = 'flex items-center justify-between mb-1';
      header.innerHTML = `
        <span class="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold">Pertanyaan ${qi + 1}</span>
        <button class="quiz-del text-gray-300 hover:text-red-500 transition-colors p-1" data-idx="${qi}" title="Hapus pertanyaan">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>`;
      header.querySelector('.quiz-del').onclick = () => removeQuestion(qi);

      // Question input
      const qInput = document.createElement('input');
      qInput.type = 'text';
      qInput.value = q.question || '';
      qInput.placeholder = 'Tulis pertanyaanmu di sini...';
      qInput.className = 'w-full border-b border-gray-200 bg-transparent text-sm py-2 focus:outline-none focus:border-black transition-all placeholder:text-gray-300 text-gray-800 font-medium';
      qInput.oninput = e => { questions[qi].question = e.target.value; Autosave.trigger(); };

      // Options grid
      const optGrid = document.createElement('div');
      optGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2';

      const letters = ['A', 'B', 'C', 'D'];
      letters.forEach((letter, oi) => {
        const row = document.createElement('label');
        const isCorrect = questions[qi].answer === oi;
        row.className = `flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${isCorrect ? 'border-[#d4a373] bg-[#d4a373]/5' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
          }`;

        row.innerHTML = `
          <input type="radio" name="quiz-answer-${qi}" value="${oi}" class="accent-[#d4a373] cursor-pointer" ${isCorrect ? 'checked' : ''}>
          <span class="text-[9px] font-bold text-[#d4a373] w-4">${letter}</span>
          <input
            type="text"
            value="${q.options?.[oi] || ''}"
            placeholder="Opsi ${letter}..."
            class="flex-1 bg-transparent text-[11px] outline-none text-gray-700 placeholder:text-gray-300 min-w-0"
            data-qi="${qi}" data-oi="${oi}"
          >`;

        const radio = row.querySelector('input[type="radio"]');
        radio.onchange = () => { questions[qi].answer = oi; render(); Autosave.trigger(); };

        const optInput = row.querySelector('input[type="text"]');
        optInput.oninput = e => {
          if (!questions[qi].options) questions[qi].options = ['', '', '', ''];
          questions[qi].options[oi] = e.target.value;
          Autosave.trigger();
        };

        optGrid.appendChild(row);
      });

      card.appendChild(header);
      card.appendChild(qInput);
      card.appendChild(optGrid);
      container.appendChild(card);
    });
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return;
    questions.push({ question: '', options: ['', '', '', ''], answer: 0 });
    render();
    // Focus the new question input
    const cards = container.querySelectorAll('.quiz-question-card');
    const last = cards[cards.length - 1];
    if (last) last.querySelector('input[type="text"]').focus();
    Autosave.trigger();
  }

  function removeQuestion(idx) {
    questions.splice(idx, 1);
    render();
    Autosave.trigger();
  }

  function getItems() {
    return questions.filter(q => q.question.trim() !== '');
  }

  return { init, getItems };
})();
