/**
 * app-manager.js — Inline App Manager
 *
 * Each "managed" section has:
 *   - An <input class="app-toggle" data-app="KEY"> toggle switch in its header
 *   - A <button class="section-collapse-btn"> chevron in its header
 *   - A <div class="section-body"> below that collapses when off/minimized
 *
 * Active state (true/false) controls whether the room appears in the Arcade.
 * Collapsed state is purely cosmetic (just saves scroll space in Studio).
 */
const AppManager = (() => {

  // Default: all apps ON
  const DEFAULT_APPS = {
    music:          true,
    journey:        true,
    moments:        true,
    catcher:        true,
    bucket_list:    true,
    quiz:           true,
    fortune_cookie: true,
    message:        true,
  };

  let _activeApps = { ...DEFAULT_APPS };

  function init(savedApps) {
    _activeApps = { ...DEFAULT_APPS, ...(savedApps || {}) };
    bindToggleSwitches();
    bindCollapseBtns();
    applyAllStates();
  }

  function getActiveApps() {
    return { ..._activeApps };
  }

  // ── Toggle Switches (ON/OFF per room) ──────────────────────
  function bindToggleSwitches() {
    document.querySelectorAll('.app-toggle').forEach(checkbox => {
      const key = checkbox.dataset.app;
      if (!key) return;

      // Set initial visual state
      checkbox.checked = _activeApps[key] !== false;

      checkbox.addEventListener('change', () => {
        _activeApps[key] = checkbox.checked;
        const section = checkbox.closest('.section-card');
        if (section) updateSectionState(section, key);
        if (typeof Autosave !== 'undefined') Autosave.trigger();
      });
    });
  }

  // ── Collapse Buttons (chevron) ──────────────────────────────
  function bindCollapseBtns() {
    document.querySelectorAll('.section-collapse-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.closest('.section-card');
        if (!section) return;
        const body = section.querySelector('.section-body');
        const isCollapsed = body && body.classList.contains('collapsed');
        setBodyCollapse(body, btn, !isCollapsed);
      });
    });
  }

  // ── Apply all states on page load ─────────────────────────
  function applyAllStates() {
    document.querySelectorAll('.app-toggle').forEach(checkbox => {
      const key = checkbox.dataset.app;
      if (!key) return;
      const section = checkbox.closest('.section-card');
      if (section) updateSectionState(section, key);
    });
  }

  // ── Core state function ──────────────────────────────────
  function updateSectionState(section, key) {
    const isActive = _activeApps[key] !== false;
    const body = section.querySelector('.section-body');
    const collapseBtn = section.querySelector('.section-collapse-btn');
    const badge = section.querySelector('.app-status-badge');

    if (isActive) {
      section.classList.remove('section-disabled');
      // Re-open body when turned on if it was auto-collapsed
      if (body && body.classList.contains('auto-collapsed-by-toggle')) {
         setBodyCollapse(body, collapseBtn, false);
         body.classList.remove('auto-collapsed-by-toggle');
      }
      if (badge) {
        badge.textContent = 'AKTIF';
        badge.classList.remove('badge-off');
        badge.classList.add('badge-on');
      }
    } else {
      section.classList.add('section-disabled');
      // Auto-collapse when turned off
      if (body && !body.classList.contains('collapsed')) {
        setBodyCollapse(body, collapseBtn, true);
        body.classList.add('auto-collapsed-by-toggle');
      }
      if (badge) {
        badge.textContent = 'NONAKTIF';
        badge.classList.remove('badge-on');
        badge.classList.add('badge-off');
      }
    }
  }

  function setBodyCollapse(body, btn, shouldCollapse) {
    if (!body) return;
    if (shouldCollapse) {
      body.classList.add('collapsed');
      if (btn) btn.classList.add('collapsed');
    } else {
      body.classList.remove('collapsed');
      if (btn) btn.classList.remove('collapsed');
    }
  }

  return { init, getActiveApps };
})();
