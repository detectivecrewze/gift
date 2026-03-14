/**
 * uploader.js — Photo Upload & Management (v2, Direct Upload to R2)
 *
 * Alur Upload Baru:
 * 1. POST /presign  → Dapat key unik dan CDN URL (tanpa kirim file).
 * 2. PUT  /upload-direct/:key → Upload binary LANGSUNG ke R2.
 * Keuntungan: Lebih cepat, tidak terkena limit memori Worker.
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
        const caption = typeof p === 'string' ? '' : (p.caption || '');
        return { id: Math.random().toString(36).substr(2, 9), url, caption, uploading: false };
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
    const placeholder = { id: Math.random().toString(36).substr(2, 9), url: URL.createObjectURL(file), caption: '', uploading: true };
    photos.push(placeholder);
    renderGrid();
    uploading++;

    try {
      const url = await uploadToR2(file, 'photo');
      placeholder.url = url;
      placeholder.uploading = false;
      renderGrid();
      Autosave.trigger();
    } catch (err) {
      photos = photos.filter(p => p !== placeholder);
      renderGrid();
      Studio.showToast('Gagal upload foto: ' + err.message);
    }
    uploading--;
  }

  function removePhoto(id) {
    photos = photos.filter(p => p.id !== id);
    renderGrid();
    Autosave.trigger();
  }

  function handleCaptionChange(id, value) {
    const p = photos.find(p => p.id === id);
    if (p) {
      p.caption = value;
      Autosave.trigger();
    }
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
      item.className = 'photo-item group relative flex flex-col bg-white shadow-sm hover:shadow-md transition-all p-3 rounded-xl';
      item.dataset.id = photo.id;

      const loadingHTML = photo.uploading ? `
        <div class="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
          <span class="text-[8px] uppercase tracking-widest text-[#d4a373] animate-pulse">Uploading...</span>
        </div>
      ` : '';

      item.innerHTML = `
        <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
          <div class="photo-number absolute top-2 left-2 w-5 h-5 bg-[#d4a373] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm z-20">
            ${i + 1}
          </div>
          <div class="drag-handle absolute top-2 left-8 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing shadow-sm z-10">
            <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
            </svg>
          </div>
          <button class="btn-remove-photo absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-sm z-20" data-id="${photo.id}">
            ✕
          </button>
          <img src="${photo.url}" class="w-full h-full object-cover" alt="Photo ${i + 1}" loading="lazy">
          ${loadingHTML}
        </div>
        <div class="relative mt-3 px-1">
          <textarea
            class="photo-caption w-full px-1 py-1 text-[11px] text-center text-gray-700 bg-transparent border-b border-gray-100 focus:border-[#d4a373] focus:text-gray-900 focus:outline-none placeholder-gray-300 transition-all leading-relaxed font-serif italic resize-none overflow-hidden"
            placeholder="Tulis cerita di sini..."
            maxlength="120"
            rows="2"
            data-id="${photo.id}"
          >${(photo.caption || '').replace(/"/g, '&quot;')}</textarea>
        </div>
      `;
      grid.appendChild(item);
    });

    grid.querySelectorAll('.btn-remove-photo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm('Hapus foto ini?')) return;
        removePhoto(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.photo-caption').forEach(inp => {
      inp.addEventListener('input', (e) => {
        handleCaptionChange(inp.dataset.id, e.target.value);
      });
    });

    if (counter) counter.textContent = photos.length > 0 ? `${photos.length} / ${MAX_PHOTOS} Foto Ditambahkan` : '';
  }

  function getPhotos() {
    return photos.filter(p => !p.uploading).map(p => ({
      url: p.url,
      caption: p.caption || ''
    }));
  }
  function isUploading() { return uploading > 0; }

  return { init, getPhotos, isUploading };
})();

// ── R2 Direct Upload (Shared utility dipakai oleh uploader.js & music.js) ────
// Menggunakan Presign + PUT untuk bypass limitasi memori Worker.
async function uploadToR2(file, typeHint) {
  const workerUrl = Auth.getWorkerUrl();

  // Step 1: Minta key unik dari Worker (tanpa kirim file)
  const presignRes = await fetch(`${workerUrl}/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream'
    })
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(errData.error || `Presign gagal (${presignRes.status})`);
  }

  const { key, publicUrl } = await presignRes.json();

  // Step 2: Upload binary file LANGSUNG ke R2 (tidak lewat Worker memori)
  const uploadRes = await fetch(`${workerUrl}/upload-direct/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file
  });

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(errData.error || `Upload gagal (${uploadRes.status})`);
  }

  return publicUrl;
}
