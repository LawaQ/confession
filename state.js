/**
 * state.js — Sumber kebenaran tunggal untuk status game.
 * Sertakan file ini di SEMUA halaman: index.html, map.html, island-1.html, dst.
 * <script src="state.js"></script>
 *
 * Fitur:
 * - Manajemen pulau terbuka (unlocked) & selesai (completed)
 * - Posisi duyung persisten (atIsland)
 * - Transisi antar halaman (fade-in/fade-out)
 * - Reset progress untuk debug
 */

const ISLAND_ORDER = ['island1', 'island2', 'island3', 'island4'];

/* =====================================================
 * 1. UNLOCKED ISLANDS
 * ===================================================== */

function getUnlockedIslands() {
  let stored = [];
  try {
    const raw = localStorage.getItem('unlockedIslands');
    if (raw) stored = JSON.parse(raw);
    if (!Array.isArray(stored)) stored = [];
  } catch (e) {
    stored = [];
  }

  const sanitized = [];
  for (const id of ISLAND_ORDER) {
    if (stored.includes(id)) {
      sanitized.push(id);
    } else {
      break;
    }
  }
  if (sanitized.length === 0) sanitized.push(ISLAND_ORDER[0]);

  try {
    localStorage.setItem('unlockedIslands', JSON.stringify(sanitized));
  } catch (e) {
    // ignore
  }

  return sanitized;
}

function unlockNextIsland(currentIslandId) {
  const idx = ISLAND_ORDER.indexOf(currentIslandId);
  const unlocked = getUnlockedIslands();

  if (idx > -1 && idx + 1 < ISLAND_ORDER.length) {
    const nextId = ISLAND_ORDER[idx + 1];
    if (!unlocked.includes(nextId)) {
      unlocked.push(nextId);
      try {
        localStorage.setItem('unlockedIslands', JSON.stringify(unlocked));
      } catch (e) {
        // ignore
      }
    }
  }

  return unlocked;
}

/* =====================================================
 * 2. COMPLETED ISLANDS (Progress)
 * ===================================================== */

function getCompletedIslands() {
  let stored = [];
  try {
    const raw = localStorage.getItem('completedIslands');
    if (raw) stored = JSON.parse(raw);
    if (!Array.isArray(stored)) stored = [];
  } catch (e) {
    stored = [];
  }

  // Filter hanya ID valid
  const sanitized = stored.filter(id => ISLAND_ORDER.includes(id));

  try {
    localStorage.setItem('completedIslands', JSON.stringify(sanitized));
  } catch (e) {
    // ignore
  }

  return sanitized;
}

function completeIsland(islandId) {
  const completed = getCompletedIslands();
  if (!completed.includes(islandId)) {
    completed.push(islandId);
    try {
      localStorage.setItem('completedIslands', JSON.stringify(completed));
    } catch (e) {
      // ignore
    }
  }
  return completed;
}

function isIslandCompleted(islandId) {
  return getCompletedIslands().includes(islandId);
}

/* =====================================================
 * 3. DUYUNG STATE
 * ===================================================== */

function setDuyungAtIsland(islandId) {
  const safeIslandId = ISLAND_ORDER.includes(islandId) ? islandId : null;
  try {
    localStorage.setItem('duyungState', JSON.stringify({ atIsland: safeIslandId }));
  } catch (e) {
    // ignore
  }
}

function getDuyungState() {
  try {
    const raw = localStorage.getItem('duyungState');
    if (raw) {
      const s = JSON.parse(raw);
      if (s && (s.atIsland === null || ISLAND_ORDER.includes(s.atIsland))) {
        return s;
      }
    }
  } catch (e) {
    // ignore
  }
  return { atIsland: null };
}

/* =====================================================
 * 4. AKSI SELESAI PULAU & KEMBALI
 * ===================================================== */

function completeIslandAndReturn(currentIslandId) {
  completeIsland(currentIslandId);
  unlockNextIsland(currentIslandId);
  setDuyungAtIsland(currentIslandId);
  navigateTo('map.html');
}

/* =====================================================
 * 5. TRANSISI ANTAR HALAMAN
 * ===================================================== */

function createTransitionOverlay() {
  // Cegah duplikat overlay
  if (document.getElementById('transitionOverlay')) {
    return document.getElementById('transitionOverlay');
  }

  const overlay = document.createElement('div');
  overlay.id = 'transitionOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0a1c2e;
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  `;
  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Pindah halaman dengan efek fade-out.
 * Gunakan ini untuk SEMUA navigasi.
 */
function navigateTo(url) {
  const overlay = createTransitionOverlay();
  overlay.style.pointerEvents = 'auto';
  overlay.style.opacity = '1';

  setTimeout(() => {
    window.location.href = url;
  }, 400);
}

/**
 * Panggil saat halaman dimuat untuk memulai fade-in.
 */
function initPageTransition() {
  const overlay = createTransitionOverlay();
  // Pastikan overlay tertutup dulu
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'none';

  requestAnimationFrame(() => {
    setTimeout(() => {
      overlay.style.opacity = '0';
    }, 50);
  });
}

/* =====================================================
 * 6. RESET PROGRESS (untuk debug / mulai ulang)
 * ===================================================== */

function resetProgress() {
  try {
    localStorage.removeItem('unlockedIslands');
    localStorage.removeItem('completedIslands');
    localStorage.removeItem('duyungState');
  } catch (e) {
    // ignore
  }
  getUnlockedIslands();
  getCompletedIslands();
  setDuyungAtIsland(null);
}

/* =====================================================
 * AUTO-INIT: jalankan transisi saat halaman dimuat
 * ===================================================== */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTransition);
  } else {
    initPageTransition();
  }
}
