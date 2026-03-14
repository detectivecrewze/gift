/**
 * things-i-love.js — Handle adding and removing things I love items.
 */
const ThingsILove = (() => {
  let items = [];
  const MAX_ITEMS = 15;
  const CHAR_LIMIT = 100;

  // DOM Elements
  let container, emptyState, btnAdd;

  function init(initialItems = []) {
    // Ensure initialItems is an array of strings
    items = Array.isArray(initialItems) ? initialItems : [];
    
    container = document.getElementById('things-love-container');
    emptyState = document.getElementById('things-love-empty-state');
    btnAdd = document.getElementById('btn-add-things-love');

    if (btnAdd) {
      btnAdd.addEventListener('click', addNewItem);
    }
    if (emptyState) {
      emptyState.addEventListener('click', addNewItem);
    }

    render();
  }

  function render() {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (items.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      container.classList.add('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      container.classList.remove('hidden');

      items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm transition-all focus-within:border-black';
        
        // Bullet number
        const bullet = document.createElement('div');
        bullet.className = 'w-6 h-6 rounded-full bg-[#d4a373] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0';
        bullet.textContent = index + 1;

        // Input text
        const inputStr = document.createElement('input');
        inputStr.type = 'text';
        inputStr.value = item || '';
        inputStr.placeholder = 'Hal yang membuatmu spesial...';
        inputStr.maxLength = CHAR_LIMIT;
        inputStr.className = 'flex-1 bg-transparent text-[11px] font-medium outline-none text-gray-800 placeholder-gray-300';
        inputStr.oninput = (e) => {
          items[index] = e.target.value;
          Autosave.trigger();
        };

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-300 hover:text-red-500 transition-colors p-1';
        deleteBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        deleteBtn.onclick = () => removeItem(index);

        row.appendChild(bullet);
        row.appendChild(inputStr);
        row.appendChild(deleteBtn);
        
        container.appendChild(row);
      });
    }

    // Toggle add button visibility based on limit
    if (btnAdd) {
      if (items.length >= MAX_ITEMS) {
        btnAdd.classList.add('opacity-50', 'pointer-events-none');
      } else {
        btnAdd.classList.remove('opacity-50', 'pointer-events-none');
      }
    }
  }

  function addNewItem() {
    if (items.length >= MAX_ITEMS) return;
    items.push('');
    render();
    
    // Auto-focus last input
    const inputs = container.querySelectorAll('input[type="text"]');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
    Autosave.trigger();
  }

  function removeItem(index) {
    if (!confirm('Hapus item ini dari Things I Love?')) return;
    items.splice(index, 1);
    render();
    Autosave.trigger();
  }

  function getItems() {
    return items.filter(i => (typeof i === 'string' && i.trim() !== '')); 
  }

  return { init, getItems };
})();
