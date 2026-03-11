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
            finalId = 'arcade-' + Math.random().toString(36).substr(2, 6);
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
                setTimeout(() => {
                    // Redirect to the appropriate studio folder based on project type
                    const folder = isPremium ? 'studio-premium' : 'studio';
                    window.location.href = `../${folder}/${finalId}`;
                }, 500);
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
    formAccess?.addEventListener('submit', (e) => {
        e.preventDefault();
        const token = inputToken.value.trim();
        if (token) {
            window.location.href = `../studio/${token}`;
        }
    });
});
