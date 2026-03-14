/**
 * bucket-list.js — Handle adding, removing, checking bucket list items.
 */
const BucketList = (() => {
  let items = [];

  // DOM Elements
  let container, emptyState, btnAdd;

  function init(initialItems = []) {
    items = Array.isArray(initialItems) ? initialItems : [];
    
    container = document.getElementById('bucket-list-container');
    emptyState = document.getElementById('bucket-empty-state');
    btnAdd = document.getElementById('btn-add-bucket');

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
      emptyState.classList.remove('hidden');
      container.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      container.classList.remove('hidden');

      items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm transition-all focus-within:border-black';
        
        // Checkbox
        const checkboxBtn = document.createElement('button');
        checkboxBtn.className = `w-6 h-6 rounded-md border flex items-center justify-center transition-all ${item.completed ? 'bg-black border-black text-white' : 'border-gray-300 bg-white hover:border-black'}`;
        checkboxBtn.innerHTML = item.completed ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : '';
        checkboxBtn.onclick = () => toggleCheck(index);

        // Input text
        const inputStr = document.createElement('input');
        inputStr.type = 'text';
        inputStr.value = item.text || '';
        inputStr.placeholder = 'Tulis impian baru di sini...';
        inputStr.className = 'flex-1 bg-transparent text-[11px] font-medium outline-none text-gray-800 placeholder-gray-300';
        inputStr.oninput = (e) => {
          items[index].text = e.target.value;
          Autosave.trigger();
        };

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-300 hover:text-red-500 transition-colors p-1';
        deleteBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        deleteBtn.onclick = () => removeItem(index);

        row.appendChild(checkboxBtn);
        row.appendChild(inputStr);
        row.appendChild(deleteBtn);
        
        container.appendChild(row);
      });
    }
  }

  function addNewItem() {
    items.push({ text: '', completed: false });
    render();
    
    // Auto-focus last input
    const inputs = container.querySelectorAll('input[type="text"]');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
    Autosave.trigger();
  }

  function removeItem(index) {
    if (!confirm('Hapus item ini dari Bucket List?')) return;
    items.splice(index, 1);
    render();
    Autosave.trigger();
  }

  function toggleCheck(index) {
    items[index].completed = !items[index].completed;
    render();
    Autosave.trigger();
  }

  function getItems() {
    return items.filter(i => i.text.trim() !== ''); // Hanya ambil item yang diisi
  }

  return { init, getItems };
})();
