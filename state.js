/**
 * state.js — Sumber kebenaran tunggal untuk status game.
 * Sertakan file ini di SEMUA halaman: index.html, map.html, island-1.html, dst.
 * <script src="state.js"></script>
 *
 * Tujuan:
 * - Menghindari perbedaan logika localStorage antar halaman.
 * - Memastikan pulau terbuka selalu berurutan (tidak bisa loncat).
 * - Menyimpan posisi duyung sebagai ID pulau, bukan progress angka,
 *   agar tidak tergantung pada geometri path SVG di map.html.
 */

const ISLAND_ORDER = ['island1', 'island2', 'island3', 'island4'];

/**
 * Ambil daftar pulau yang terbuka, disaring supaya selalu berurutan.
 * Kalau data di localStorage rusak/loncat, otomatis dirapikan dan
 * disimpan ulang.
 */
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
      // Berhenti di celah pertama, karena urutan harus kontinu.
      break;
    }
  }

  // Jika kosong (misal data hilang), minimal island1 terbuka.
  if (sanitized.length === 0) {
    sanitized.push(ISLAND_ORDER[0]);
  }

  try {
    localStorage.setItem('unlockedIslands', JSON.stringify(sanitized));
  } catch (e) {
    // ignore storage errors (private mode, etc)
  }

  return sanitized;
}

/**
 * Buka island berikutnya setelah currentIslandId selesai.
 * Mengembalikan daftar pulau yang terbuka.
 */
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

/**
 * Simpan posisi terakhir duyung sebagai ID pulau.
 * null berarti posisi awal (sebelum berlayar).
 */
function setDuyungAtIsland(islandId) {
  const safeIslandId = ISLAND_ORDER.includes(islandId) ? islandId : null;
  try {
    localStorage.setItem('duyungState', JSON.stringify({ atIsland: safeIslandId }));
  } catch (e) {
    // ignore
  }
}

/**
 * Ambil posisi duyung terakhir.
 * Mengembalikan { atIsland: 'island1' | 'island2' | ... | null }
 */
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

/**
 * Panggil ini dari tombol "Selesai" / "Kembali ke Peta" di setiap halaman island.
 * Otomatis: buka island berikutnya, taruh duyung di island ini, lalu kembali ke map.
 *
 * Contoh di island-1.html:
 *   <button onclick="completeIslandAndReturn('island1')">Kembali ke Peta</button>
 */
function completeIslandAndReturn(currentIslandId) {
  unlockNextIsland(currentIslandId);
  setDuyungAtIsland(currentIslandId);
  window.location.href = 'map.html';
}

/**
 * Reset seluruh progress (untuk debug atau memulai ulang).
 * Bisa dipanggil dari console browser.
 */
function resetProgress() {
  try {
    localStorage.removeItem('unlockedIslands');
    localStorage.removeItem('duyungState');
  } catch (e) {
    // ignore
  }
  // Set ulang ke default: island1 terbuka, duyung di posisi awal.
  getUnlockedIslands();
  setDuyungAtIsland(null);
}
