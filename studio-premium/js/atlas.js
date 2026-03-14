/**
 * atlas.js — Atlas of Us: Manage location pins. (Studio Premium)
 * Mirrors the regular Studio Atlas pattern.
 */
const Atlas = (() => {
    let _photoUploading = false;
    const MAX_PINS = 10;
    let items = [];
    let container, emptyState, btnAdd;

    // ── Init ──────────────────────────────────────────────────
    function init(initialPins = []) {
        items = Array.isArray(initialPins)
            ? initialPins.map(p => ({
                id: _uid(),
                label: p.label || '',
                coords: Array.isArray(p.coords) && p.coords.length === 2 ? p.coords : null,
                photo: p.photo || '',
                note: p.note || '',
                _status: p.coords ? 'ok' : 'idle',
                _rawUrl: ''
            }))
            : [];

        container = document.getElementById('atlas-pins-container');
        emptyState = document.getElementById('atlas-empty-state');
        btnAdd = document.getElementById('btn-add-atlas-pin');

        if (btnAdd) btnAdd.addEventListener('click', addNewPin);
        if (emptyState) emptyState.addEventListener('click', addNewPin);

        render();
    }

    // ── Render ─────────────────────────────────────────────────
    function render() {
        if (!container) return;
        container.innerHTML = '';

        const hasSome = items.length > 0;
        if (emptyState) emptyState.classList.toggle('hidden', hasSome);
        container.classList.toggle('hidden', !hasSome);

        if (btnAdd) {
            btnAdd.disabled = items.length >= MAX_PINS;
            btnAdd.classList.toggle('opacity-40', items.length >= MAX_PINS);
            btnAdd.classList.toggle('pointer-events-none', items.length >= MAX_PINS);
        }

        items.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'atlas-pin-card bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 mb-4';
            card.id = `atlas-card-${item.id}`;
            card.innerHTML = _cardHTML(item, idx);
            container.appendChild(card);
            _bindCardEvents(item, idx);
        });
    }

    // ── Card HTML ──────────────────────────────────────────────
    function _cardHTML(item, idx) {
        const coordText = item.coords
            ? `<span class="text-[#3b6d11]">📍 ${item.coords[0].toFixed(4)}, ${item.coords[1].toFixed(4)} — terdeteksi otomatis</span>`
            : '';

        const statusBadge = _statusBadge(item._status);

        const photoSection = item.photo
            ? `<div class="flex items-center gap-3">
           <div class="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
             <img src="${item.photo}" class="w-full h-full object-cover" />
           </div>
           <button class="btn-remove-atlas-photo text-[9px] uppercase tracking-widest font-bold text-gray-400 hover:text-red-500 transition-colors">✕ Hapus Foto</button>
         </div>`
            : `<div class="flex items-center gap-3">
           <label class="atlas-photo-label flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold px-4 py-2 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-colors text-gray-500 hover:text-black">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
             Upload Foto
             <input type="file" accept="image/*" class="input-atlas-photo hidden" />
           </label>
           <span class="text-[9px] text-gray-300 italic">Opsional</span>
         </div>`;

        return `
      <div class="flex items-center justify-between">
        <span class="text-[9px] uppercase tracking-[0.3em] text-[#d4a373] font-bold">Lokasi ${idx + 1}</span>
        <button class="btn-remove-atlas-pin text-gray-300 hover:text-red-500 transition-colors p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      <div>
        <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Nama Tempat</label>
        <input
          type="text"
          value="${_escape(item.label)}"
          placeholder="Contoh: BCP Food Court, Jakarta..."
          class="input-atlas-label w-full border-b border-gray-200 bg-transparent text-sm py-2 focus:outline-none focus:border-black transition-all placeholder:text-gray-300 text-gray-800 font-medium"
          autocomplete="off"
        />
      </div>

      <div>
        <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2 mb-2">
          Link Google Maps
          <button class="btn-atlas-hint w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-[9px] font-bold flex items-center justify-center transition-colors flex-shrink-0">?</button>
        </label>
        <div class="flex items-center gap-2">
          <input
            type="url"
            value="${_escape(item._rawUrl || '')}"
            placeholder="Paste link Google Maps dari browser..."
            class="input-atlas-maps flex-1 border-b border-gray-200 bg-transparent text-[12px] py-2 focus:outline-none focus:border-black transition-all placeholder:text-gray-300 text-gray-600"
            autocomplete="off"
            inputmode="url"
          />
          <span class="atlas-badge-wrap">${statusBadge}</span>
        </div>
        <div class="atlas-coords-hint mt-1 text-[10px] min-h-[18px]">${coordText}</div>
      </div>

      <div>
        <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Foto</label>
        ${photoSection}
      </div>

      <div>
        <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Cerita Singkat</label>
        <textarea
          class="input-atlas-note w-full border-b border-gray-200 bg-transparent text-[13px] py-2 focus:outline-none focus:border-black transition-all placeholder:text-gray-300 text-gray-800 resize-none leading-relaxed"
          placeholder="Tulis kenangan di tempat ini..."
          rows="2"
          maxlength="200"
        >${_escape(item.note)}</textarea>
      </div>
    `;
    }

    function _statusBadge(status) {
        if (status === 'loading') {
            return `<span class="atlas-status-badge flex-shrink-0 text-[9px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
        <span class="inline-block w-2.5 h-2.5 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></span> Memproses...
      </span>`;
        }
        if (status === 'ok') {
            return `<span class="atlas-status-badge flex-shrink-0 text-[9px] font-bold px-3 py-1 rounded-full bg-[#eaf3de] text-[#3b6d11] border border-[#c0dd97]">✓ OK</span>`;
        }
        if (status === 'error') {
            return `<span class="atlas-status-badge flex-shrink-0 text-[9px] font-bold px-3 py-1 rounded-full bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">✕ Gagal</span>`;
        }
        return '';
    }

    // ── Bind Card Events ───────────────────────────────────────
    function _bindCardEvents(item, idx) {
        const card = document.getElementById(`atlas-card-${item.id}`);
        if (!card) return;

        // Always look up the current index by id at call time — avoids stale closures from re-renders
        const getIdx = () => items.findIndex(i => i.id === item.id);

        card.querySelector('.btn-remove-atlas-pin')?.addEventListener('click', () => {
            const i = getIdx(); if (i < 0) return;
            removePin(i);
        });

        const labelInput = card.querySelector('.input-atlas-label');
        labelInput?.addEventListener('input', e => {
            const i = getIdx(); if (i < 0) return;
            items[i].label = e.target.value;
            Autosave.trigger();
        });

        const noteInput = card.querySelector('.input-atlas-note');
        noteInput?.addEventListener('input', e => {
            const i = getIdx(); if (i < 0) return;
            items[i].note = e.target.value;
            Autosave.trigger();
        });

        const mapsInput = card.querySelector('.input-atlas-maps');

        // Deduplicate paste + blur: use a small debounce flag per card
        let _mapsDebounce = null;
        const processMapsUrl = () => {
            if (_mapsDebounce) { clearTimeout(_mapsDebounce); }
            _mapsDebounce = setTimeout(() => {
                const i = getIdx(); if (i < 0) return;
                const url = mapsInput.value.trim();
                if (url) handleMapsInput(i, url);
                _mapsDebounce = null;
            }, 120);
        };

        mapsInput?.addEventListener('paste', () => setTimeout(processMapsUrl, 50));
        mapsInput?.addEventListener('blur', processMapsUrl);

        card.querySelector('.btn-atlas-hint')?.addEventListener('click', () => {
            document.getElementById('modal-atlas-hint')?.classList.remove('hidden');
        });

        const photoInput = card.querySelector('.input-atlas-photo');
        photoInput?.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) return Studio.showToast('Format harus gambar.');
            if (file.size > 10 * 1024 * 1024) return Studio.showToast('Foto maksimal 10MB.');
            const i = getIdx(); if (i < 0) return;
            await handlePhotoUpload(i, file);
        });

        card.querySelector('.btn-remove-atlas-photo')?.addEventListener('click', () => {
            if (!confirm('Hapus foto lokasi ini?')) return;
            const i = getIdx(); if (i < 0) return;
            items[i].photo = '';
            render();
            Autosave.trigger();
        });
    }


    // ── Add / Remove ───────────────────────────────────────────
    function addNewPin() {
        if (items.length >= MAX_PINS) return;
        items.push({ id: _uid(), label: '', coords: null, photo: '', note: '', _status: 'idle', _rawUrl: '' });
        render();
        const cards = container.querySelectorAll('.atlas-pin-card');
        const last = cards[cards.length - 1];
        if (last) last.querySelector('.input-atlas-label')?.focus();
        Autosave.trigger();
    }

    function removePin(idx) {
        if (!confirm('Hapus lokasi ini dari Atlas?')) return;
        items.splice(idx, 1);
        render();
        Autosave.trigger();
    }

    // ── Google Maps Coordinate Extraction ─────────────────────
    function handleMapsInput(idx, url) {
        if (!url || idx >= items.length) return;

        items[idx]._rawUrl = url;
        items[idx]._status = 'loading';
        items[idx].coords = null;
        _updateCardStatus(idx);

        const coords = _extractCoordsFromUrl(url);
        if (coords) {
            items[idx].coords = coords;
            items[idx]._status = 'ok';
        } else {
            items[idx]._status = 'error';
            Studio.showToast('Gunakan link lengkap dari Browser (cek tanda tanya ?)');
        }

        _updateCardStatus(idx);
        Autosave.trigger();
    }

    function _extractCoordsFromUrl(url) {
        let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        m = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        m = url.match(/\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        m = url.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        m = url.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        return null;
    }

    // ── Update status badge & coords hint without full re-render ──
    function _updateCardStatus(idx) {
        const item = items[idx];
        const card = document.getElementById(`atlas-card-${item.id}`);
        if (!card) return;

        const badgeWrap = card.querySelector('.atlas-badge-wrap');
        if (badgeWrap) badgeWrap.innerHTML = _statusBadge(item._status);

        const coordHint = card.querySelector('.atlas-coords-hint');
        if (coordHint) {
            coordHint.innerHTML = item.coords
                ? `<span class="text-[#3b6d11]">📍 ${item.coords[0].toFixed(4)}, ${item.coords[1].toFixed(4)} — terdeteksi otomatis</span>`
                : (item._status === 'error'
                    ? `<span class="text-red-400">Link tidak dikenali. Gunakan link dari browser, bukan dari aplikasi Maps.</span>`
                    : '');
        }
    }

    // ── Photo Upload ───────────────────────────────────────────
    async function handlePhotoUpload(idx, file) {
        Studio.showToast('Mengupload foto lokasi... 🖼️');
        _photoUploading = true;
        try {
            const url = await uploadToR2(file, 'photo');
            items[idx].photo = url;
            render();
            Studio.showToast('Foto berhasil diupload!');
            Autosave.trigger();
        } catch (err) {
            Studio.showToast('Gagal upload foto lokasi.');
        } finally {
            _photoUploading = false;
        }
    }

    // ── Get Items (for autosave / publisher) ───────────────────
    function getItems() {
        return items
            .filter(i => i.label.trim() && i.coords)
            .map(i => ({
                label: i.label.trim(),
                coords: i.coords,
                photo: i.photo || '',
                note: i.note.trim()
            }));
    }

    // ── Utilities ──────────────────────────────────────────────
    function _uid() {
        return 'pin_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }

    function _escape(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function isUploading() { return _photoUploading; }

    return { init, getItems, isUploading };
})();
