/**
 * atlas.js — Atlas of Us: Manage location pins.
 */
const Atlas = (() => {
    const MAX_PINS = 10;
    let items = [];
    let _photoUploading = false;
    // item shape: { id, label, coords:[lat,lng]|null, photo:'', note:'', _status:'idle'|'loading'|'ok'|'error' }

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
                _exifSource: p._exifSource || false,
                _status: p.coords ? 'ok' : 'idle'
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
        const statusBadge = _statusBadge(item._status);

        // Koordinat result — shown below whichever method was used
        const coordResult = _coordResultHTML(item);

        // Photo thumbnail (if uploaded)
        const photoThumb = item.photo
            ? `<div class="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 group/photo">
                 <img src="${item.photo}" class="w-full h-full object-cover" />
                 <button class="btn-remove-atlas-photo absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold uppercase tracking-wider">Hapus</button>
               </div>`
            : '';

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

      <!-- Nama Tempat -->
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

      <!-- Koordinat: 2 jalur input -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Koordinat Lokasi</label>
          <button class="btn-atlas-hint flex items-center gap-1.5 text-[9px] font-bold text-[#d4a373] bg-[#d4a373]/10 hover:bg-[#d4a373]/20 px-2.5 py-1 rounded-full transition-all">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
             Panduan
          </button>
        </div>

        <!-- Jalur A: Upload Foto (EXIF) -->
        <div class="atlas-coord-block rounded-xl border border-gray-100 bg-gray-50/60 p-3 mb-2">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-[#d4a373]"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span class="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Upload Foto</span>
            </div>
            <span class="text-[8px] text-gray-400 italic">GPS otomatis dari EXIF</span>
          </div>
          ${item.photo
                ? `<div class="flex items-center gap-3">
                 ${photoThumb}
                 <div class="flex-1 min-w-0">
                   <p class="text-[9px] text-gray-500 leading-relaxed">Foto sudah diupload.</p>
                   ${item._exifSource
                    ? `<p class="text-[9px] text-[#3b6d11] font-bold mt-0.5">📸 Koordinat berhasil diekstrak</p>`
                    : `<p class="text-[9px] text-amber-500 mt-0.5">Tidak ada GPS di foto ini</p>`
                }
                 </div>
               </div>`
                : `<label class="atlas-photo-label flex items-center gap-2 text-[9px] font-bold px-3 py-2 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#d4a373] hover:bg-white transition-all text-gray-400 hover:text-[#d4a373] w-full justify-center">
                 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                 Pilih foto untuk ekstrak lokasi
                 <input type="file" accept="image/*" class="input-atlas-photo hidden" />
               </label>`
            }
        </div>

        <!-- Divider OR -->
        <div class="flex items-center gap-2 my-2">
          <div class="flex-1 h-px bg-gray-100"></div>
          <span class="text-[9px] text-gray-300 font-bold uppercase tracking-widest">atau</span>
          <div class="flex-1 h-px bg-gray-100"></div>
        </div>

        <!-- Jalur B: Google Maps Link -->
        <div class="atlas-coord-block rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-[#d4a373]"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span class="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Google Maps</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="url"
              value="${_escape(item._rawUrl || '')}"
              placeholder="Paste link Google Maps di sini..."
              class="input-atlas-maps flex-1 bg-white border border-gray-200 rounded-lg text-[11px] px-3 py-2 focus:outline-none focus:border-[#d4a373] transition-all placeholder:text-gray-300 text-gray-600"
              autocomplete="off"
              inputmode="url"
            />
            <span class="atlas-badge-wrap flex-shrink-0">${statusBadge}</span>
          </div>
        </div>

        <!-- Hasil koordinat (dari jalur manapun) -->
        <div class="atlas-coords-hint mt-2 text-[10px] min-h-[16px]">${coordResult}</div>
      </div>

      <!-- Cerita Singkat -->
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

    // ── Coord result HTML (shared between render & update) ─────
    function _coordResultHTML(item) {
        if (!item.coords) return '';
        const src = item._exifSource
            ? `📸 ${item.coords[0].toFixed(4)}, ${item.coords[1].toFixed(4)} — dari EXIF foto`
            : `📍 ${item.coords[0].toFixed(4)}, ${item.coords[1].toFixed(4)} — dari Google Maps`;
        return `<span class="text-[#3b6d11] font-medium">${src}</span>`;
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

        // Remove pin
        card.querySelector('.btn-remove-atlas-pin')?.addEventListener('click', () => {
            const i = getIdx(); if (i < 0) return;
            removePin(i);
        });

        // Label input
        const labelInput = card.querySelector('.input-atlas-label');
        labelInput?.addEventListener('input', e => {
            const i = getIdx(); if (i < 0) return;
            items[i].label = e.target.value;
            Autosave.trigger();
        });

        // Note textarea
        const noteInput = card.querySelector('.input-atlas-note');
        noteInput?.addEventListener('input', e => {
            const i = getIdx(); if (i < 0) return;
            items[i].note = e.target.value;
            Autosave.trigger();
        });

        // Maps link input — deduplicate paste+blur double-fire with debounce
        const mapsInput = card.querySelector('.input-atlas-maps');
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

        // Hint modal
        card.querySelector('.btn-atlas-hint')?.addEventListener('click', () => {
            document.getElementById('modal-atlas-hint')?.classList.remove('hidden');
        });

        // Photo upload
        const photoInput = card.querySelector('.input-atlas-photo');
        photoInput?.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Accept any image format — EXIF GPS extraction only works for JPEG,
            // but for non-JPEG formats (PNG, HEIC from PC, etc.) we just upload
            // the photo and skip GPS. iPhone users via Safari get auto-converted
            // to JPEG by iOS, so GPS extraction still works for them.
            const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|heic|heif|webp)$/i.test(file.name);
            if (!isImage) return Studio.showToast('Format harus berupa gambar.');
            if (file.size > 15 * 1024 * 1024) return Studio.showToast('Foto maksimal 15MB.');
            const i = getIdx(); if (i < 0) return;
            await handlePhotoUpload(i, file);
        });

        // Remove photo
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
        items.push({ id: _uid(), label: '', coords: null, photo: '', note: '', _status: 'idle', _rawUrl: '', _exifSource: false });
        render();
        // Focus label of new card
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
    async function handleMapsInput(idx, url) {
        if (!url || idx >= items.length) return;

        items[idx]._rawUrl = url;
        items[idx]._status = 'loading';
        items[idx].coords = null;
        _updateCardStatus(idx);

        // Try direct extraction (works for full Google Maps URLs from browser)
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
        // Format: /@lat,lng or /@lat,lng,zoom
        let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        // Format: ?q=lat,lng or &q=lat,lng
        m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        // Format: ?ll=lat,lng
        m = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        // Format: /place/name/@lat,lng
        m = url.match(/\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        // Format: maps/place/...!3d{lat}!4d{lng} (Google Maps embed/share URL)
        m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        // Format: destination=lat,lng (Google Maps directions)
        m = url.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        // Format: center=lat,lng
        m = url.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) return [parseFloat(m[1]), parseFloat(m[2])];

        return null;
    }

    // ── Update status badge & coords hint without full re-render ──
    function _updateCardStatus(idx) {
        const item = items[idx];
        const card = document.getElementById(`atlas-card-${item.id}`);
        if (!card) return;

        // FIX: outerHTML replaces the element in DOM, so we must use a wrapper container
        // instead of replacing the badge element directly.
        const badgeWrap = card.querySelector('.atlas-badge-wrap');
        if (badgeWrap) badgeWrap.innerHTML = _statusBadge(item._status);

        const coordHint = card.querySelector('.atlas-coords-hint');
        if (coordHint) {
            if (item.coords) {
                coordHint.innerHTML = _coordResultHTML(item);
            } else {
                coordHint.innerHTML = item._status === 'error'
                    ? `<span class="text-red-400">Link tidak dikenali. Coba dari tombol <strong>Share</strong> di Google Maps.</span>`
                    : '';
            }
        }
    }

    // ── Photo Upload (with pure-JS EXIF GPS extraction) ────────
    async function handlePhotoUpload(idx, file) {
        Studio.showToast('Mengupload foto lokasi... 🖼️');
        _photoUploading = true;

        // Run EXIF extraction and R2 upload in parallel for speed
        const [exifCoords, uploadedUrl] = await Promise.allSettled([
            _extractGpsFromFile(file),
            uploadToR2(file, 'photo')
        ]);

        _photoUploading = false;

        if (uploadedUrl.status === 'rejected') {
            Studio.showToast('Gagal upload foto lokasi.');
            return;
        }
        items[idx].photo = uploadedUrl.value;

        const coords = exifCoords.status === 'fulfilled' ? exifCoords.value : null;
        if (coords) {
            if (!items[idx].coords) {
                items[idx].coords = coords;
                items[idx]._status = 'ok';
                items[idx]._exifSource = true;
                Studio.showToast('📍 Koordinat terdeteksi otomatis dari foto!');
            }
        } else {
            if (!items[idx].coords) {
                Studio.showToast('⚠️ Foto tidak memiliki data GPS. Gunakan link Google Maps di bawahnya.');
            }
        }

        render();
        Autosave.trigger();
    }

    // ── EXIF GPS Extraction (pure JS — no library) ─────────────
    async function _extractGpsFromFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try { resolve(_parseExifGps(e.target.result)); }
                catch { resolve(null); }
            };
            reader.onerror = () => resolve(null);
            reader.readAsArrayBuffer(file.slice(0, 131072));
        });
    }

    function _parseExifGps(buffer) {
        const view = new DataView(buffer);
        if (view.getUint16(0) !== 0xFFD8) return null; // must be JPEG
        let offset = 2;
        const len = view.byteLength;
        while (offset < len - 4) {
            const marker = view.getUint16(offset);
            const segLen = view.getUint16(offset + 2);
            if (marker === 0xFFE1) {
                const header = String.fromCharCode(
                    view.getUint8(offset + 4), view.getUint8(offset + 5),
                    view.getUint8(offset + 6), view.getUint8(offset + 7)
                );
                if (header === 'Exif') return _parseTiffGps(buffer, offset + 10);
            }
            if (segLen < 2) break;
            offset += 2 + segLen;
        }
        return null;
    }

    function _parseTiffGps(buffer, tiffStart) {
        const view = new DataView(buffer);
        const byteOrder = view.getUint16(tiffStart);
        const le = (byteOrder === 0x4949);
        const r16 = (o) => view.getUint16(tiffStart + o, le);
        const r32 = (o) => view.getUint32(tiffStart + o, le);
        if (r16(2) !== 42) return null;
        const ifdOffset = r32(4);
        const ifdCount = r16(ifdOffset);
        let gpsIfdOffset = null;
        for (let i = 0; i < ifdCount; i++) {
            const e = ifdOffset + 2 + i * 12;
            if (r16(e) === 0x8825) { gpsIfdOffset = r32(e + 8); break; }
        }
        if (!gpsIfdOffset) return null;
        const gpsCount = r16(gpsIfdOffset);
        const g = {};
        for (let i = 0; i < gpsCount; i++) {
            const e = gpsIfdOffset + 2 + i * 12;
            const tag = r16(e), count = r32(e + 4), vo = e + 8;
            if (tag === 1 || tag === 3) {
                g[tag] = String.fromCharCode(view.getUint8(vo));
            } else if (tag === 2 || tag === 4) {
                const dataOff = count * 8 <= 4 ? vo : r32(vo);
                const abs = tiffStart + dataOff;
                const deg = view.getUint32(abs, le) / view.getUint32(abs + 4, le);
                const min = view.getUint32(abs + 8, le) / view.getUint32(abs + 12, le);
                const sec = view.getUint32(abs + 16, le) / view.getUint32(abs + 20, le);
                g[tag] = deg + min / 60 + sec / 3600;
            }
        }
        if (g[2] == null || g[4] == null) return null;
        const lat = (g[1] === 'S') ? -g[2] : g[2];
        const lng = (g[3] === 'W') ? -g[4] : g[4];
        if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
        if (lat === 0 && lng === 0) return null;
        return [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))];
    }

    // ── Get Items (for autosave / publisher) ───────────────────
    function getItems() {
        return items
            .filter(i => i.label.trim() && i.coords)
            .map(i => ({
                label: i.label.trim(),
                coords: i.coords,
                photo: i.photo || '',
                note: i.note.trim(),
                _exifSource: i._exifSource || false
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