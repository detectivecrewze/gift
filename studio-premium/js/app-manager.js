/**
 * app-manager.js — Centralized Master Control Panel
 * v4: Toggle controls moved to top Master Panel.
 *     Sections that are OFF are fully hidden from the editor (Opsi B).
 */
const AppManager = (() => {

  // Default: all apps ON. Music is always on and non-toggleable.
  const DEFAULT_APPS = {
    music:         true,
    journey:       true,
    moments:       true,
    bucket_list:   true,
    quiz:          true,
    message:       true,
    things_i_love: true,
    atlas:         true,
  };

  // Map: app key → section element ID in the HTML
  const SECTION_MAP = {
    moments:      'section-gallery',
    atlas:        'section-atlas',
    music:        'section-music',
    quiz:         'section-quiz',
    things_i_love:'section-things-love',
    bucket_list:  'section-bucket',
    message:      'section-message',
  };

  let _activeApps = { ...DEFAULT_APPS };

  function init(savedApps) {
    _activeApps = { ...DEFAULT_APPS, ...(savedApps || {}) };
    bindMasterPanel();
    bindCollapseBtns();
    applyAllStates();
  }

  function getActiveApps() {
    return { ..._activeApps };
  }

  // ── Master Panel Toggles ────────────────────────────────────
  function bindMasterPanel() {
    document.querySelectorAll('.master-app-toggle').forEach(checkbox => {
      const key = checkbox.dataset.app;
      if (!key) return;

      // Set initial visual state from saved data
      checkbox.checked = _activeApps[key] !== false;
      _updateMasterBadge(checkbox, checkbox.checked);

      checkbox.addEventListener('change', () => {
        _activeApps[key] = checkbox.checked;
        _updateMasterBadge(checkbox, checkbox.checked);
        _applySectionVisibility(key);
        if (typeof Autosave !== 'undefined') Autosave.trigger();
      });
    });
  }

  function _updateMasterBadge(checkbox, isOn) {
    const item = checkbox.closest('.master-panel-item');
    if (!item) return;
    const badge = item.querySelector('.master-status-dot');
    if (badge) {
      badge.className = isOn
        ? 'master-status-dot w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5'
        : 'master-status-dot w-1.5 h-1.5 rounded-full bg-gray-300 mt-0.5';
    }
  }

  // ── Section Visibility (Opsi B: fully hide) ────────────────
  function _applySectionVisibility(key) {
    const sectionId = SECTION_MAP[key];
    if (!sectionId) return;
    const section = document.getElementById(sectionId);
    if (!section) return;

    const isActive = _activeApps[key] !== false;
    if (isActive) {
      // Show with smooth animation
      section.style.display = '';
      requestAnimationFrame(() => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
        section.style.maxHeight = '10000px';
        section.style.marginBottom = '';
        section.style.overflow = '';
      });
    } else {
      // Hide with smooth animation, then display:none
      section.style.opacity = '0';
      section.style.transform = 'translateY(-12px)';
      section.style.overflow = 'hidden';
      section.style.maxHeight = '0';
      section.style.marginBottom = '0';
      setTimeout(() => {
        // Only hide if still inactive (user might have re-toggled quickly)
        if (_activeApps[key] === false) {
          section.style.display = 'none';
        }
      }, 350);
    }
  }

  // ── Collapse Buttons (chevron per section) ──────────────────
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
    Object.keys(SECTION_MAP).forEach(key => {
      _applySectionVisibility(key);
    });
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
