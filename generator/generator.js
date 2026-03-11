/**
 * generator.js — Arcade Edition
 * Logic for creating and accessing Arcade Studio projects.
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://arcade-edition.aldoramadhan16.workers.dev';
    
    const btnCreate = document.getElementById('btn-create');
    const formAccess = document.getElementById('form-access');
    const inputToken = document.getElementById('input-token');

    // ── Password Gate Logic ──────────────────────────────────
    const gate = document.getElementById('password-gate');
    const mainContent = document.getElementById('main-content');
    const btnUnlock = document.getElementById('btn-unlock-gate');
    const inputPass = document.getElementById('input-gate-pass');
    const gateError = document.getElementById('gate-error');

    const checkAuth = () => {
        if (sessionStorage.getItem('arcade_generator_unlocked') === 'true') {
            gate.classList.add('hidden');
            mainContent.classList.remove('hidden');
        }
    };

    const unlock = async () => {
        const pass = inputPass.value;
        if (!pass) return;

        btnUnlock.disabled = true;
        btnUnlock.innerText = 'MEMVERIFIKASI...';

        try {
            const response = await fetch(`${API_BASE_URL}/generator-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pass })
            });

            const result = await response.json();

            if (result.success) {
                sessionStorage.setItem('arcade_generator_unlocked', 'true');
                gate.classList.add('hidden');
                mainContent.classList.remove('hidden');
            } else {
                gateError.innerText = result.error || 'Password salah';
                gateError.classList.remove('hidden');
            }
        } catch (err) {
            console.error('[Generator] Auth error:', err);
            gateError.innerText = 'Gagal terhubung ke server';
            gateError.classList.remove('hidden');
        } finally {
            btnUnlock.disabled = false;
            btnUnlock.innerText = 'BUKA AKSES';
        }
    };

    btnUnlock?.addEventListener('click', unlock);
    inputPass?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') unlock();
    });

    checkAuth();

    // ── Logic Create Project ──────────────────────────────────
    const handleCreateProject = async (isPremium = false) => {
        const customName = document.getElementById('input-new-token')?.value.trim();
        const studioPass = document.getElementById('input-studio-pass')?.value.trim();
        const giftPass = document.getElementById('input-gift-pass')?.value.trim();
        
        let finalId = '';
        if (customName) {
            finalId = customName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            if (finalId.length < 3) {
                alert('Nama project minimal 3 karakter.');
                return;
            }
        } else {
            alert('PENTING: Silakan ketik Nama Project (Slug) terlebih dahulu! (Tidak boleh kosong)');
            return;
        }

        const activeBtn = isPremium ? document.getElementById('btn-create-premium') : btnCreate;
        const originalText = activeBtn.innerText;
        activeBtn.innerText = 'Mengecek...';
        activeBtn.disabled = true;

        try {
            // Check for duplicates
            const checkResponse = await fetch(`${API_BASE_URL}/get-config?id=${finalId}`);
            if (checkResponse.ok) {
                alert(`Nama project "${finalId}" sudah digunakan!`);
                activeBtn.innerText = originalText;
                activeBtn.disabled = false;
                return;
            }

            // Create initial Arcade state
            const initialState = {
                id: finalId,
                name: '',
                photos: [],
                audio: null,
                message: '',
                date: '',
                studioPassword: studioPass || null,
                password: giftPass || null,
                created_at: new Date().toISOString(),
                is_premium: isPremium // Mark as premium in db just in case
            };

            const response = await fetch(`${API_BASE_URL}/save-config?id=${finalId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialState)
            });

            if (response.ok) {
                const folder = isPremium ? 'studio-premium' : 'studio';
                const studioUrl = `${window.location.origin}/${folder}/${finalId}`;
                
                // Inject success UI
                const successDiv = document.createElement('div');
                successDiv.className = 'glass-panel p-6 mt-6 text-center border-2 border-[#d4a373]/40 bg-white/50 backdrop-blur-md';
                successDiv.innerHTML = `
                    <p class="text-[11px] uppercase tracking-widest text-[#b58756] font-bold mb-3">✅ Project Berhasil Dibuat!</p>
                    <p class="text-[9px] text-gray-500 mb-2">Berikan link editor ini ke kustomer Anda:</p>
                    <input type="text" readonly value="${studioUrl}" class="w-full text-center text-xs p-3 border border-gray-200 rounded-md bg-white mb-4 text-black font-mono shadow-inner cursor-pointer" onclick="this.select(); document.execCommand('copy'); alert('Link disalin!')">
                    <a href="${studioUrl}" target="_blank" class="btn-premium w-full text-center block shadow-lg py-3">Buka Akses Editor ➔</a>
                `;
                
                // Append below the buttons
                document.getElementById('main-content').appendChild(successDiv);
                
                activeBtn.innerText = originalText;
                activeBtn.disabled = false;

                // Clear input
                if (document.getElementById('input-new-token')) document.getElementById('input-new-token').value = '';
            } else {
                alert('Gagal menyimpan project baru.');
                activeBtn.innerText = originalText;
                activeBtn.disabled = false;
            }
        } catch (err) {
            console.error('[Generator] Create error:', err);
            alert('Terjadi kesalahan koneksi.');
            activeBtn.innerText = originalText;
            activeBtn.disabled = false;
        }
    };

    // ── Create New Arcade Project ────────────────────────────
    btnCreate?.addEventListener('click', () => handleCreateProject(false));
    
    // ── Create Premium Project ───────────────────────────────
    const btnCreatePremium = document.getElementById('btn-create-premium');
    btnCreatePremium?.addEventListener('click', () => handleCreateProject(true));

    // ── Access Existing Arcade Project ───────────────────────
    formAccess?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = inputToken.value.trim();
        const submitBtn = formAccess.querySelector('button[type="submit"]');
        if (!token) return;

        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Mengecek...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/get-config?id=${token}`);
            if (res.ok) {
                const config = await res.json();
                // Determine which studio to redirect to based on DB state
                const folder = config.is_premium ? 'studio-premium' : 'studio';
                window.location.href = `../${folder}/${token}`;
            } else {
                alert('Project tidak ditemukan. Silakan cek kembali kode Anda.');
            }
        } catch (err) {
            console.error('Access check error:', err);
            alert('Gagal mengecek project.');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});
