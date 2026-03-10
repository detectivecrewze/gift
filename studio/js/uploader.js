/**
 * uploader.js — Photo Upload & Management (Tailwind UI)
 */

const Uploader = (() => {
  const MAX_PHOTOS = 15;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  let photos = []; // [{ id, url, file, uploading }]
  let uploading = 0;
  let sortableInstance = null;

  function init(existingPhotos) {
    if (existingPhotos && Array.isArray(existingPhotos)) {
      photos = existingPhotos.map(p => {
        const url = typeof p === 'string' ? p : p.url;
        return { id: Math.random().toString(36).substr(2, 9), url, uploading: false };
      });
    }
    bindEvents();
    renderGrid();
  }

  function bindEvents() {
    const dz = document.getElementById('photo-dropzone');
    const input = document.getElementById('file-input');
    const btnAdd = document.getElementById('upload-area');

    if (btnAdd) btnAdd.addEventListener('click', () => input.click());
    if (dz) {
      dz.addEventListener('click', () => input.click());
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-[#d4a373]', 'bg-white'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('border-[#d4a373]', 'bg-white'));
      dz.addEventListener('drop', e => {
        e.preventDefault(); dz.classList.remove('border-[#d4a373]', 'bg-white');
        handleFiles(e.dataTransfer.files);
      });
    }
    input.addEventListener('change', e => {
      handleFiles(e.target.files);
      input.value = '';
    });

    // Init sortable
    const grid = document.getElementById('photo-grid');
    if (grid && typeof Sortable !== 'undefined') {
      sortableInstance = new Sortable(grid, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'opacity-50',
        onEnd: (evt) => {
          if (evt.oldIndex === evt.newIndex) return;
          const item = photos.splice(evt.oldIndex, 1)[0];
          photos.splice(evt.newIndex, 0, item);
          renderGrid();
          Autosave.trigger();
        }
      });
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Studio.showToast('Maksimal 15 foto!');
      return;
    }
    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      if (file.size > MAX_SIZE) {
        Studio.showToast(`${file.name} terlalu besar (maks 10MB)`);
        continue;
      }
      await uploadPhoto(file);
    }
  }

  async function uploadPhoto(file) {
    const placeholder = { id: Math.random().toString(36).substr(2, 9), url: URL.createObjectURL(file), uploading: true };
    photos.push(placeholder);
    renderGrid();
    uploading++;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'photo');
      formData.append('id', Auth.getToken() || 'test');

      const res = await fetch(`${Auth.getWorkerUrl()}/upload`, {
        method: 'POST', body: formData
      });
      const data = await res.json();

      if (data.success) {
        placeholder.url = data.url;
        placeholder.uploading = false;
        renderGrid();
        Autosave.trigger();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      photos = photos.filter(p => p !== placeholder);
      renderGrid();
      Studio.showToast('Gagal upload: ' + err.message);
    }
    uploading--;
  }

  function removePhoto(id) {
    photos = photos.filter(p => p.id !== id);
    renderGrid();
    Autosave.trigger();
  }

  function renderGrid() {
    const grid = document.getElementById('photo-grid');
    const counter = document.getElementById('photo-counter');
    const dz = document.getElementById('photo-dropzone');
    grid.innerHTML = '';

    const hasPhotos = photos.length > 0;
    dz.classList.toggle('hidden', hasPhotos);
    grid.classList.toggle('hidden', !hasPhotos);

    grid.className = 'grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8';

    photos.forEach((photo, i) => {
      const item = document.createElement('div');
      item.className = 'photo-item group relative flex flex-col bg-white overflow-hidden shadow-sm';
      item.dataset.id = photo.id;
      item.style.aspectRatio = '4/5';
      item.style.padding = '8px 8px 32px 8px';
      item.style.borderRadius = '4px';
      item.style.border = '1px solid rgba(0,0,0,0.05)';

      const loadingHTML = photo.uploading ? `
        <div class="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
          <span class="text-[8px] uppercase tracking-widest text-[#d4a373] animate-pulse">Uploading...</span>
        </div>
      ` : '';

      item.innerHTML = `
        <div class="photo-number absolute top-3 left-3 w-5 h-5 bg-[#d4a373] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm z-20">
          ${i + 1}
        </div>
        <div class="drag-handle absolute top-3 left-10 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing shadow-sm z-10">
          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
          </svg>
        </div>
        <button class="btn-remove-photo absolute top-3 right-3 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-sm z-20" data-id="${photo.id}">
          ✕
        </button>
        <img src="${photo.url}" class="w-full h-full object-cover rounded-[2px]" alt="Photo ${i+1}">
        ${loadingHTML}
      `;
      grid.appendChild(item);
    });

    grid.querySelectorAll('.btn-remove-photo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removePhoto(btn.dataset.id);
      });
    });

    if (counter) counter.textContent = photos.length > 0 ? `${photos.length} / ${MAX_PHOTOS} Foto Ditambahkan` : '';
  }

  function getPhotos() { return photos.filter(p => !p.uploading).map(p => p.url); }
  function isUploading() { return uploading > 0; }

  return { init, getPhotos, isUploading };
})();
