/**
 * state.js — Sumber kebenaran tunggal untuk status game.
 * Sertakan di SEMUA halaman:
 * index.html, map.html, island-1.html, dst.
 *
 * Penyimpanan memakai localStorage agar progres bertahan
 * saat browser ditutup.
 */

const ISLAND_ORDER = [
  'island1',
  'island2',
  'island3',
  'island4'
];

const LAST_RESET_KEY = 'lastResetTimestamp';


/* =====================================================
   STORAGE HELPER
===================================================== */

function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}


function storageSet(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (e) {
    // ignore
  }
}


function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}


/* =====================================================
   RESET OTOMATIS SETIAP 24 JAM
===================================================== */

function autoResetDailyIfNeeded() {

  const now = Date.now();

  const last =
    Number(
      localStorage.getItem(
        LAST_RESET_KEY
      )
    ) || 0;


  if (
    now - last >
    24 * 60 * 60 * 1000
  ) {

    storageRemove(
      'unlockedIslands'
    );

    storageRemove(
      'completedIslands'
    );

    storageRemove(
      'duyungState'
    );
  }


  try {

    localStorage.setItem(
      LAST_RESET_KEY,
      String(now)
    );

  } catch (e) {
    // ignore
  }
}


/* =====================================================
   COMPLETED ISLANDS
===================================================== */

function getCompletedIslands() {

  const stored =
    storageGet(
      'completedIslands',
      []
    );


  if (!Array.isArray(stored)) {
    return [];
  }


  const sanitized = [];


  for (
    const id of ISLAND_ORDER
  ) {

    if (
      stored.includes(id)
    ) {

      sanitized.push(id);

    } else {

      break;
    }
  }


  storageSet(
    'completedIslands',
    sanitized
  );


  return sanitized;
}


function completeIsland(
  islandId
) {

  const completed =
    getCompletedIslands();


  if (
    !completed.includes(islandId) &&
    ISLAND_ORDER.includes(islandId)
  ) {

    completed.push(
      islandId
    );

    storageSet(
      'completedIslands',
      completed
    );
  }


  return completed;
}


function isIslandCompleted(
  islandId
) {

  return getCompletedIslands()
    .includes(islandId);
}


/* =====================================================
   UNLOCKED ISLANDS
===================================================== */

function getUnlockedIslands() {

  const completed =
    getCompletedIslands();


  const unlocked = [
    'island1'
  ];


  for (
    let i = 1;
    i < ISLAND_ORDER.length;
    i++
  ) {

    if (
      completed.includes(
        ISLAND_ORDER[i - 1]
      )
    ) {

      unlocked.push(
        ISLAND_ORDER[i]
      );

    } else {

      break;
    }
  }


  storageSet(
    'unlockedIslands',
    unlocked
  );


  return unlocked;
}


function unlockNextIsland(
  currentIslandId
) {

  return getUnlockedIslands();
}


/* =====================================================
   DUYUNG STATE
===================================================== */

function setDuyungAtIsland(
  islandId
) {

  const safeIslandId =
    ISLAND_ORDER.includes(
      islandId
    )
      ? islandId
      : null;


  storageSet(
    'duyungState',
    {
      atIsland:
        safeIslandId
    }
  );
}


function getDuyungState() {

  const s =
    storageGet(
      'duyungState',
      {
        atIsland: null
      }
    );


  if (
    s &&
    (
      s.atIsland === null ||
      ISLAND_ORDER.includes(
        s.atIsland
      )
    )
  ) {

    return s;
  }


  return {
    atIsland: null
  };
}


/* =====================================================
   SELESAI PULAU
===================================================== */

function completeIslandAndReturn(
  currentIslandId
) {

  completeIsland(
    currentIslandId
  );

  setDuyungAtIsland(
    currentIslandId
  );

  getUnlockedIslands();

  navigateTo(
    'map.html'
  );
}


/* =====================================================
   TRANSISI
===================================================== */

function createTransitionOverlay() {

  if (
    document.getElementById(
      'transitionOverlay'
    )
  ) {

    return document.getElementById(
      'transitionOverlay'
    );
  }


  const overlay =
    document.createElement(
      'div'
    );


  overlay.id =
    'transitionOverlay';


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


  document.body.appendChild(
    overlay
  );


  return overlay;
}


function navigateTo(url) {

  const overlay =
    createTransitionOverlay();


  overlay.style.pointerEvents =
    'auto';


  overlay.style.opacity =
    '1';


  setTimeout(() => {

    window.location.href =
      url;

  }, 400);
}


function initPageTransition() {

  const overlay =
    createTransitionOverlay();


  overlay.style.opacity =
    '1';


  overlay.style.pointerEvents =
    'none';


  requestAnimationFrame(() => {

    setTimeout(() => {

      overlay.style.opacity =
        '0';

    }, 50);

  });
}


/* =====================================================
   RESET TOTAL
===================================================== */

function resetProgress() {

  storageRemove(
    'unlockedIslands'
  );

  storageRemove(
    'completedIslands'
  );

  storageRemove(
    'duyungState'
  );


  /*
    Buat kembali state awal.
  */

  getCompletedIslands();

  getUnlockedIslands();

  setDuyungAtIsland(
    null
  );
}


/* =====================================================
   AUTO INIT
===================================================== */

if (
  typeof document !== 'undefined'
) {

  autoResetDailyIfNeeded();


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initPageTransition
    );

  } else {

    initPageTransition();
  }
}
