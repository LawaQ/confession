/**
 * state.js — Sumber kebenaran tunggal untuk status game.
 * Sertakan di SEMUA halaman: index.html, map.html, island-1.html, dst.
 * <script src="state.js"></script>
 *
 * Catatan:
 * - Semua penyimpanan sekarang memakai sessionStorage,
 *   jadi progres hanya bertahan selama sesi browser.
 * - Jika tab ditutup dan dibuka lagi, progres otomatis mulai dari awal.
 * - Ini mencegah data lama nyangkut di HP dan membuat pulau terbuka sendiri.
 */

const ISLAND_ORDER = ['island1', 'island2', 'island3', 'island4'];

/* =====================================================
 * STORAGE HELPER (sessionStorage)
 * ===================================================== */

function storageGet(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

function storageRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

/* =====================================================
 * 1. COMPLETED ISLANDS
 * ===================================================== */

function getCompletedIslands() {
  const stored = storageGet('completedIslands', []);
  if (!Array.isArray(stored)) return [];

  // Sanitasi: hanya ambil yang berurutan mulai dari island1.
  const sanitized = [];
  for (const id of ISLAND_ORDER) {
    if (stored.includes(id)) {
      sanitized.push(id);
    } else {
      break;
    }
  }

  storageSet('completedIslands', sanitized);
  return sanitized;
}

function completeIsland(islandId) {
  const completed = getCompletedIslands();
  if (!completed.includes(islandId) && ISLAND_ORDER.includes(islandId)) {
    completed.push(islandId);
    storageSet('completedIslands', completed);
  }
  return completed;
}

function isIslandCompleted(islandId) {
  return getCompletedIslands().includes(islandId);
}

/* =====================================================
 * 2. UNLOCKED ISLANDS — dihitung dari completed
 * ===================================================== */

function getUnlockedIslands() {
  const completed = getCompletedIslands();

  // Island pertama selalu terbuka.
  const unlocked = ['island1'];

  // Buka island berikutnya HANYA jika pulau sebelumnya selesai.
  for (let i = 1; i < ISLAND_ORDER.length; i++) {
    if (completed.includes(ISLAND_ORDER[i - 1])) {
      unlocked.push(ISLAND_ORDER[i]);
    } else {
      break;
    }
  }

  storageSet('unlockedIslands', unlocked);
  return unlocked;
}

function unlockNextIsland(currentIslandId) {
  // Tidak perlu logika manual lagi.
  // getUnlockedIslands() otomatis menghitung dari completedIslands.
  return getUnlockedIslands();
}

/* =====================================================
 * 3. DUYUNG STATE
 * ===================================================== */

function setDuyungAtIsland(islandId) {
  const safeIslandId = ISLAND_ORDER.includes(islandId) ? islandId : null;
  storageSet('duyungState', { atIsland: safeIslandId });
}

function getDuyungState() {
  const s = storageGet('duyungState', { atIsland: null });
  if (s && (s.atIsland === null || ISLAND_ORDER.includes(s.atIsland))) {
    return s;
  }
  return { atIsland: null };
}

/* =====================================================
 * 4. AKSI SELESAI PULAU & KEMBALI
 * ===================================================== */

function completeIslandAndReturn(currentIslandId) {
  completeIsland(currentIslandId);
  setDuyungAtIsland(currentIslandId);
  getUnlockedIslands(); // refresh unlock
  navigateTo('map.html');
}

/* =====================================================
 * 5. TRANSISI ANTAR HALAMAN
 * ===================================================== */

function createTransitionOverlay() {
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

function navigateTo(url) {
  const overlay = createTransitionOverlay();
  overlay.style.pointerEvents = 'auto';
  overlay.style.opacity = '1';

  setTimeout(() => {
    window.location.href = url;
  }, 400);
}

function initPageTransition() {
  const overlay = createTransitionOverlay();
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
  storageRemove('unlockedIslands');
  storageRemove('completedIslands');
  storageRemove('duyungState');

  // Set ulang ke default
  getCompletedIslands();
  getUnlockedIslands();
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
