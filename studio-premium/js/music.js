/**
 * music.js — Multi-track Audio Management for Arcade Edition
 */

const Music = (() => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_TRACKS = 3;
  
  let playlist = []; // Array of track states

  function init(existingConfig) {
    playlist = [];
    
    // Parse existing config (backward compatibility included)
    if (existingConfig && existingConfig.playlist && Array.isArray(existingConfig.playlist)) {
       existingConfig.playlist.forEach((track, i) => {
          if (i >= MAX_TRACKS) return;
          playlist.push(createTrackState(track));
       });
    } else if (existingConfig && (existingConfig.url || existingConfig.title)) {
       // Migration from single track old format
       playlist.push(createTrackState(existingConfig));
    }
    
    // Default 1 empty slot if none
    if (playlist.length === 0) {
       playlist.push(createTrackState());
    }
    
    renderAll();
  }

  function createTrackState(data = {}) {
    return {
      id: 'track_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      isManualMode: data.isManualMode || false,
      audio: { url: (data.url && data.url !== 'manual_search') ? data.url : null, name: data.name || null },
      cover: { url: data.coverUrl || null },
      title: data.title || '',
      artist: data.artist || '',
      isPlaying: false,
      uploading: false
    };
  }
  
  function renderAll() {
    const container = document.getElementById('music-slots-container');
    if (!container) return;
    
    container.innerHTML = '';
    playlist.forEach((track, index) => {
       const el = document.createElement('div');
       el.innerHTML = getTrackHTML(track, index);
       container.appendChild(el.firstElementChild);
       bindTrackEvents(track, index);
    });
    
    // Add "Tambah Lagu" button
    if (playlist.length < MAX_TRACKS) {
       const addBtnWrap = document.createElement('div');
       addBtnWrap.className = 'text-center mt-6 fade-in';
       addBtnWrap.innerHTML = `<button id="btn-add-track" class="text-[9px] uppercase tracking-widest font-bold border-2 border-dashed border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all px-8 py-3 rounded-xl">+ Tambah Lagu Tambahan</button>`;
       container.appendChild(addBtnWrap);
       
       document.getElementById('btn-add-track')?.addEventListener('click', () => {
         if (playlist.length < MAX_TRACKS) {
           playlist.push(createTrackState());
           renderAll();
           Autosave.trigger();
         }
       });
    }
  }

  function getTrackHTML(track, index) {
    return `
    <div id="${track.id}" class="p-6 bg-white border border-gray-100 rounded-2xl relative shadow-sm hover:shadow-md transition-shadow">
       ${index > 0 || playlist.length > 1 ? `<button class="btn-remove-track absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 hover:border-red-100">✕</button>` : ''}
       
       <h3 class="text-[10px] font-bold text-[#d4a373] uppercase tracking-[0.2em] mb-4">Lagu ${index + 1}</h3>
       
       <div class="flex bg-gray-50 rounded-lg p-1 mb-6 max-w-sm">
          <button class="tab-mp3 flex-1 py-1.5 min-w-0 text-[8px] sm:text-[9px] uppercase tracking-widest font-bold ${!track.isManualMode ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'} rounded-md transition-all truncate px-2">Upload MP3</button>
          <button class="tab-req flex-1 py-1.5 min-w-0 text-[8px] sm:text-[9px] uppercase tracking-widest font-bold ${track.isManualMode ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'} rounded-md transition-all truncate px-2">Request Lagu</button>
       </div>
       
       <div class="mode-mp3 ${track.isManualMode ? 'hidden' : ''} fade-in relative">
          <!-- Uploading Overlay -->
          ${track.uploading ? `
          <div class="absolute inset-x-0 -inset-y-2 bg-white/70 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-center">
             <div class="w-8 h-8 border-2 border-gray-100 border-t-[#d4a373] rounded-full animate-spin mb-3"></div>
             <p class="text-[8px] uppercase tracking-widest text-[#d4a373] font-bold">Sedang Mengupload...</p>
          </div>
          ` : ''}

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div class="sm:col-span-1">
                <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-3 pl-1">Cover (Opsional)</label>
                <div class="cover-dropzone relative cursor-pointer aspect-square w-full max-w-[120px] mx-auto sm:mx-0">
                   <div class="cover-empty absolute inset-0 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:border-[#d4a373] hover:bg-white bg-gray-50/50 ${track.cover.url ? 'hidden' : ''}">
                      <span class="text-xl mb-1 text-gray-300">🖼️</span>
                      <p class="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-medium px-2">Cover</p>
                   </div>
                   <div class="cover-preview-wrap absolute inset-0 rounded-2xl overflow-hidden bg-black group border border-gray-200 shadow-sm ${track.cover.url ? '' : 'hidden'}">
                      <img class="cover-img w-full h-full object-cover" src="${track.cover.url || ''}" />
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         <span class="text-[8px] text-white uppercase tracking-widest font-bold border border-white px-3 py-1 rounded-full">Ganti</span>
                      </div>
                   </div>
                </div>
                <input type="file" accept="image/*" class="input-cover hidden" />
             </div>
             
             <div class="sm:col-span-2 flex flex-col justify-center">
                <div class="mb-5">
                   <label class="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-3 pl-1">File Audio (MP3)</label>
                   
                   <div class="audio-dropzone border-2 border-dashed border-gray-100 rounded-xl p-4 text-center cursor-pointer hover:border-[#d4a373] transition-colors bg-gray-50/50 ${track.audio.url ? 'hidden' : ''}">
                      <p class="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-medium">✨ Upload File MP3</p>
                   </div>
                   
                   <div class="audio-preview mt-2 p-3 rounded-xl bg-[#fdf9f4] border border-[#d4a373]/20 flex flex-col gap-3 ${track.audio.url ? '' : 'hidden'}">
                      <div class="flex justify-between items-center">
                         <span class="audio-name text-[9px] text-gray-700 font-bold uppercase tracking-widest truncate max-w-[150px]">${track.audio.name || 'Custom Track'}</span>
                         <span class="text-[8px] uppercase tracking-widest text-[#d4a373] font-bold">Terupload ✨</span>
                      </div>
                      <div class="flex gap-3">
                         <button class="btn-play text-[8px] uppercase tracking-widest font-bold border border-black px-3 py-1 rounded-lg hover:bg-black hover:text-white transition-all">▶ Play</button>
                         <button class="btn-remove-audio text-[8px] uppercase tracking-widest font-bold text-gray-500 hover:text-red-500 transition-all">✕ Hapus</button>
                      </div>
                      <audio class="audio-player hidden" src="${track.audio.url || ''}"></audio>
                   </div>
                   <input type="file" accept="audio/*,.mp3,.m4a,.wav" class="input-audio hidden" />
                </div>
                
                <div class="space-y-4">
                   <input type="text" placeholder="Judul Lagu..." value="${track.title}" class="input-title w-full text-[10px] uppercase font-bold tracking-widest border-b border-gray-200 pb-2 focus:outline-none focus:border-[#d4a373] text-gray-800 bg-transparent placeholder-gray-300" autocomplete="off" />
                   <input type="text" placeholder="Nama Penyanyi..." value="${track.artist}" class="input-artist w-full text-[10px] uppercase font-bold tracking-widest border-b border-gray-200 pb-2 focus:outline-none focus:border-[#d4a373] text-gray-800 bg-transparent placeholder-gray-300" autocomplete="off" />
                </div>
             </div>
          </div>
       </div>
       
       <div class="mode-req ${track.isManualMode ? '' : 'hidden'} fade-in">
          <div class="p-6 rounded-xl bg-gradient-to-br from-[#fdf9f4] to-white border border-[#d4a373]/20">
             <div class="flex gap-4 items-center mb-6">
                <span class="text-2xl opacity-80">🎧</span>
                <div>
                   <h3 class="text-[10px] uppercase tracking-widest font-bold text-[#b58756]">Request Lagu Ke Admin</h3>
                   <p class="text-[9px] text-gray-500 mt-1 leading-relaxed max-w-xs">Admin akan mencarikan lagu beserta cover-art terbaik untuk dimasukkan ke halaman kado.</p>
                </div>
             </div>
             <div class="space-y-5 max-w-sm">
                <input type="text" placeholder="Judul Lagu (Wajib)..." value="${track.title}" class="input-title-req w-full text-[10px] uppercase font-bold tracking-widest border-b border-[#d4a373]/30 pb-2 focus:outline-none focus:border-[#d4a373] text-gray-800 bg-transparent placeholder-[#d4a373]/60" autocomplete="off" />
                <input type="text" placeholder="Nama Penyanyi (Wajib)..." value="${track.artist}" class="input-artist-req w-full text-[10px] uppercase font-bold tracking-widest border-b border-[#d4a373]/30 pb-2 focus:outline-none focus:border-[#d4a373] text-gray-800 bg-transparent placeholder-[#d4a373]/60" autocomplete="off" />
             </div>
          </div>
       </div>
    </div>
    `;
  }

  function bindTrackEvents(track, index) {
    const el = document.getElementById(track.id);
    if (!el) return;

    // Tabs
    const tabMp3 = el.querySelector('.tab-mp3');
    const tabReq = el.querySelector('.tab-req');
    
    tabMp3?.addEventListener('click', () => {
      track.isManualMode = false;
      renderAll();
      Autosave.trigger();
    });
    
    tabReq?.addEventListener('click', () => {
      track.isManualMode = true;
      renderAll();
      Autosave.trigger();
    });

    // Remove Track
    const btnRemove = el.querySelector('.btn-remove-track');
    btnRemove?.addEventListener('click', () => {
      if (!confirm('Hapus lagu ini dari playlist?')) return;
      playlist.splice(index, 1);
      if (playlist.length === 0) playlist.push(createTrackState());
      renderAll();
      Autosave.trigger();
    });

    // Inputs Text
    const bindSync = (selector, key) => {
      const inputs = el.querySelectorAll(selector);
      inputs.forEach(inp => {
         inp.addEventListener('input', (e) => {
           track[key] = e.target.value;
           // Sync shadow input if exist
           inputs.forEach(sibling => { if (sibling !== e.target) sibling.value = e.target.value; });
           Autosave.trigger();
         });
      });
    };
    bindSync('.input-title, .input-title-req', 'title');
    bindSync('.input-artist, .input-artist-req', 'artist');

    // Files (Cover)
    const dzCover = el.querySelector('.cover-dropzone');
    const inCover = el.querySelector('.input-cover');
    dzCover?.addEventListener('click', () => inCover.click());
    inCover?.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) return Studio.showToast('Format cover harus gambar');
      if (f.size > 5*1024*1024) return Studio.showToast('Cover maksimal 5MB');
      
      Studio.showToast('Mengupload cover... 🖼️');
      const oldUrl = track.cover.url;
      track.cover.url = URL.createObjectURL(f);
      renderAll();

      try {
        const url = await uploadToR2(f, 'photo');
        track.cover.url = url;
        renderAll();
        Studio.showToast('Cover tersimpan!');
        Autosave.trigger();
      } catch (err) {
        track.cover.url = oldUrl;
        renderAll();
        Studio.showToast('Gagal upload cover.');
      }
      inCover.value = '';
    });

    // Files (Audio)
    const dzAudio = el.querySelector('.audio-dropzone');
    const inAudio = el.querySelector('.input-audio');
    const rmAudio = el.querySelector('.btn-remove-audio');
    const plyBtn  = el.querySelector('.btn-play');
    const player  = el.querySelector('.audio-player');
    
    dzAudio?.addEventListener('click', () => inAudio.click());
    inAudio?.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > MAX_SIZE) return Studio.showToast('Audio maksimal ' + (MAX_SIZE / (1024*1024)) + 'MB');
      
      Studio.showToast('Mengupload lagu... 🎶');
      track.uploading = true;
      renderAll();

      try {
        const url = await uploadToR2(f, 'audio');
        track.audio.url = url;
        track.audio.name = f.name;
        track.uploading = false;
        renderAll();
        Studio.showToast('Audio tersimpan!');
        Autosave.trigger();
      } catch (err) {
        track.uploading = false;
        renderAll();
        Studio.showToast('Gagal upload audio.');
      }
      inAudio.value = '';
    });

    rmAudio?.addEventListener('click', () => {
      if (!confirm('Hapus audio yang sudah diupload?')) return;
      track.audio.url = null;
      track.audio.name = null;
      renderAll();
      Autosave.trigger();
    });

    if (player) {
       player.addEventListener('ended', () => {
         track.isPlaying = false;
         if (plyBtn) plyBtn.innerHTML = '▶ Play';
       });
    }

    plyBtn?.addEventListener('click', () => {
       if (!player.src) return;
       // Pause others
       playlist.forEach(t => t.isPlaying = false);
       document.querySelectorAll('audio').forEach(a => { if (a !== player) a.pause(); });
       document.querySelectorAll('.btn-play').forEach(b => { if (b !== plyBtn) b.innerHTML = '▶ Play'; });
       
       if (player.paused) {
         player.play();
         track.isPlaying = true;
         plyBtn.innerHTML = '⏸ Stop';
       } else {
         player.pause();
         track.isPlaying = false;
         plyBtn.innerHTML = '▶ Play';
       }
    });
  }

  // uploadToR2 is a shared global function defined in uploader.js

  // Retrieve array of music config matching new Arcade requirements
  function getPlaylistArray() {
    return playlist.map(track => {
      return {
        type: track.isManualMode ? 'req' : 'mp3',
        url: track.isManualMode ? 'manual_search' : track.audio.url,
        name: track.audio.name || null,
        coverUrl: track.cover.url ? track.cover.url : null,
        title: track.title.trim(),
        artist: track.artist.trim()
      };
    });
  }

  // Provide fallback getters to avoid crashing old script versions if any
  function getMusicConfig() {
     return getPlaylistArray()[0] || null; 
  }

  function isUploading() {
    return playlist.some(t => t.uploading);
  }

  return { init, getMusicConfig, getPlaylistArray, isUploading };
})();
