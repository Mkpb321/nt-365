// NT 365 – Multi-Tracker (Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase configuration (provided)
const firebaseConfig = {
  apiKey: "AIzaSyDVzf54RilCJO3JD4a5Lm7KsJ7Xo1XQJME",
  authDomain: "my-hobby-apps.firebaseapp.com",
  projectId: "my-hobby-apps",
  storageBucket: "my-hobby-apps.firebasestorage.app",
  messagingSenderId: "894079667150",
  appId: "1:894079667150:web:c88ac0aae916980f7ef99f"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// Local storage only for UI/navigation state (no progress)
const UI_STATE_KEY = "nt365_ui_state_v1";

// --- Bible books (OT + NT) ---
const BOOKS = [
  // AT
  { id: "gen", name: "1. Mose", short: "Gen", chapters: 50, testament: "ot" },
  { id: "exo", name: "2. Mose", short: "Ex", chapters: 40, testament: "ot" },
  { id: "lev", name: "3. Mose", short: "Lev", chapters: 27, testament: "ot" },
  { id: "num", name: "4. Mose", short: "Num", chapters: 36, testament: "ot" },
  { id: "deu", name: "5. Mose", short: "Dtn", chapters: 34, testament: "ot" },
  { id: "jos", name: "Josua", short: "Jos", chapters: 24, testament: "ot" },
  { id: "jdg", name: "Richter", short: "Ri", chapters: 21, testament: "ot" },
  { id: "rut", name: "Ruth", short: "Rut", chapters: 4, testament: "ot" },
  { id: "1sa", name: "1. Samuel", short: "1 Sam", chapters: 31, testament: "ot" },
  { id: "2sa", name: "2. Samuel", short: "2 Sam", chapters: 24, testament: "ot" },
  { id: "1ki", name: "1. Könige", short: "1 Kön", chapters: 22, testament: "ot" },
  { id: "2ki", name: "2. Könige", short: "2 Kön", chapters: 25, testament: "ot" },
  { id: "1ch", name: "1. Chronik", short: "1 Chr", chapters: 29, testament: "ot" },
  { id: "2ch", name: "2. Chronik", short: "2 Chr", chapters: 36, testament: "ot" },
  { id: "ezr", name: "Esra", short: "Esra", chapters: 10, testament: "ot" },
  { id: "neh", name: "Nehemia", short: "Neh", chapters: 13, testament: "ot" },
  { id: "est", name: "Esther", short: "Est", chapters: 10, testament: "ot" },
  { id: "job", name: "Hiob", short: "Hi", chapters: 42, testament: "ot" },
  { id: "psa", name: "Psalmen", short: "Ps", chapters: 150, testament: "ot" },
  { id: "pro", name: "Sprüche", short: "Spr", chapters: 31, testament: "ot" },
  { id: "ecc", name: "Prediger", short: "Pred", chapters: 12, testament: "ot" },
  { id: "sng", name: "Hoheslied", short: "Hld", chapters: 8, testament: "ot" },
  { id: "isa", name: "Jesaja", short: "Jes", chapters: 66, testament: "ot" },
  { id: "jer", name: "Jeremia", short: "Jer", chapters: 52, testament: "ot" },
  { id: "lam", name: "Klagelieder", short: "Klgl", chapters: 5, testament: "ot" },
  { id: "ezk", name: "Hesekiel", short: "Hes", chapters: 48, testament: "ot" },
  { id: "dan", name: "Daniel", short: "Dan", chapters: 12, testament: "ot" },
  { id: "hos", name: "Hosea", short: "Hos", chapters: 14, testament: "ot" },
  { id: "jol", name: "Joel", short: "Joel", chapters: 3, testament: "ot" },
  { id: "amo", name: "Amos", short: "Am", chapters: 9, testament: "ot" },
  { id: "oba", name: "Obadja", short: "Ob", chapters: 1, testament: "ot" },
  { id: "jon", name: "Jona", short: "Jona", chapters: 4, testament: "ot" },
  { id: "mic", name: "Micha", short: "Mi", chapters: 7, testament: "ot" },
  { id: "nam", name: "Nahum", short: "Nah", chapters: 3, testament: "ot" },
  { id: "hab", name: "Habakuk", short: "Hab", chapters: 3, testament: "ot" },
  { id: "zep", name: "Zefanja", short: "Zef", chapters: 3, testament: "ot" },
  { id: "hag", name: "Haggai", short: "Hag", chapters: 2, testament: "ot" },
  { id: "zec", name: "Sacharja", short: "Sach", chapters: 14, testament: "ot" },
  { id: "mal", name: "Maleachi", short: "Mal", chapters: 4, testament: "ot" },

  // NT
  { id: "mat", name: "Matthäus", short: "Mt", chapters: 28, testament: "nt" },
  { id: "mar", name: "Markus", short: "Mk", chapters: 16, testament: "nt" },
  { id: "luk", name: "Lukas", short: "Lk", chapters: 24, testament: "nt" },
  { id: "joh", name: "Johannes", short: "Joh", chapters: 21, testament: "nt" },
  { id: "act", name: "Apostelgeschichte", short: "Apg", chapters: 28, testament: "nt" },
  { id: "rom", name: "Römer", short: "Röm", chapters: 16, testament: "nt" },
  { id: "1co", name: "1. Korinther", short: "1. Kor", chapters: 16, testament: "nt" },
  { id: "2co", name: "2. Korinther", short: "2. Kor", chapters: 13, testament: "nt" },
  { id: "gal", name: "Galater", short: "Gal", chapters: 6, testament: "nt" },
  { id: "eph", name: "Epheser", short: "Eph", chapters: 6, testament: "nt" },
  { id: "phi", name: "Philipper", short: "Phil", chapters: 4, testament: "nt" },
  { id: "col", name: "Kolosser", short: "Kol", chapters: 4, testament: "nt" },
  { id: "1th", name: "1. Thessalonicher", short: "1. Thess", chapters: 5, testament: "nt" },
  { id: "2th", name: "2. Thessalonicher", short: "2. Thess", chapters: 3, testament: "nt" },
  { id: "1ti", name: "1. Timotheus", short: "1. Tim", chapters: 6, testament: "nt" },
  { id: "2ti", name: "2. Timotheus", short: "2. Tim", chapters: 4, testament: "nt" },
  { id: "tit", name: "Titus", short: "Tit", chapters: 3, testament: "nt" },
  { id: "phm", name: "Philemon", short: "Phlm", chapters: 1, testament: "nt" },
  { id: "heb", name: "Hebräer", short: "Hebr", chapters: 13, testament: "nt" },
  { id: "jam", name: "Jakobus", short: "Jak", chapters: 5, testament: "nt" },
  { id: "1pe", name: "1. Petrus", short: "1. Petr", chapters: 5, testament: "nt" },
  { id: "2pe", name: "2. Petrus", short: "2. Petr", chapters: 3, testament: "nt" },
  { id: "1jo", name: "1. Johannes", short: "1. Joh", chapters: 5, testament: "nt" },
  { id: "2jo", name: "2. Johannes", short: "2. Joh", chapters: 1, testament: "nt" },
  { id: "3jo", name: "3. Johannes", short: "3. Joh", chapters: 1, testament: "nt" },
  { id: "jud", name: "Judas", short: "Jud", chapters: 1, testament: "nt" },
  { id: "rev", name: "Offenbarung", short: "Offb", chapters: 22, testament: "nt" },
];

const BOOK_BY_ID = new Map(BOOKS.map(b => [b.id, b]));
const OT_BOOK_IDS = BOOKS.filter(b => b.testament === "ot").map(b => b.id);
const NT_BOOK_IDS = BOOKS.filter(b => b.testament === "nt").map(b => b.id);

// --- Book groups + colors (used for book tiles + book picker) ---
const GROUP_RGB = {
  // AT
  "Gesetz": [140, 192, 255],
  "AT Geschichte": [122, 230, 185],
  "Weisheit": [255, 195, 120],
  "Große Propheten": [188, 150, 255],
  "Kleine Propheten": [255, 145, 195],

  // NT
  // NOTE: all group colors are unique (no duplicates across AT/NT)
  "Evangelien": [120, 220, 255],
  "NT Geschichte": [255, 225, 140],
  "Paulusbriefe": [150, 160, 255],
  "Allgemeine Briefe": [180, 255, 150],
  "Prophetie": [255, 160, 140],
};

const BOOK_GROUP_BY_ID = (() => {
  const m = new Map();

  const put = (group, ids) => ids.forEach(id => m.set(id, group));

  // AT
  put("Gesetz", ["gen", "exo", "lev", "num", "deu"]);
  put("AT Geschichte", [
    "jos", "jdg", "rut",
    "1sa", "2sa", "1ki", "2ki",
    "1ch", "2ch", "ezr", "neh", "est"
  ]);
  put("Weisheit", ["job", "psa", "pro", "ecc", "sng"]);
  put("Große Propheten", ["isa", "jer", "lam", "ezk", "dan"]);
  put("Kleine Propheten", ["hos", "jol", "amo", "oba", "jon", "mic", "nam", "hab", "zep", "hag", "zec", "mal"]);

  // NT
  put("Evangelien", ["mat", "mar", "luk", "joh"]);
  put("NT Geschichte", ["act"]);
  put("Paulusbriefe", [
    "rom", "1co", "2co", "gal", "eph", "phi", "col",
    "1th", "2th", "1ti", "2ti", "tit", "phm"
  ]);
  put("Allgemeine Briefe", ["heb", "jam", "1pe", "2pe", "1jo", "2jo", "3jo", "jud"]);
  put("Prophetie", ["rev"]);

  return m;
})();

function bookGroup(bookId) {
  return BOOK_GROUP_BY_ID.get(bookId) || (BOOK_BY_ID.get(bookId)?.testament === "ot" ? "AT Geschichte" : "Evangelien");
}

function bookGroupRgb(bookId) {
  const g = bookGroup(bookId);
  return GROUP_RGB[g] || [200, 200, 200];
}

const STRONG_A = 1;
const SOFT_A = 0.35;
// Even softer background alpha for inputs/cards in the add-tracker view
const SUPERSOFT_A = 0.10;

const $ = (sel) => document.querySelector(sel);

// Auth UI
const loginView = $("#loginView");
const loginForm = $("#loginForm");
const loginEmail = $("#loginEmail");
const loginPassword = $("#loginPassword");
const loginError = $("#loginError");
const btnLogin = $("#btnLogin");

const appEl = $("#app");

// App UI
const topbar = $("#topbar");
const btnBack = $("#btnBack");
const topTitle = $("#topTitle");
const topSub = $("#topSub");
const btnAddTracker = $("#btnAddTracker");
const btnEditTracker = $("#btnEditTracker");
const btnMenu = $("#btnMenu");

// Burger menu
const menuOverlay = $("#menuOverlay");
const btnMenuEpic = $("#btnMenuEpic");
const btnMenuLogout = $("#btnMenuLogout");

const viewTrackers = $("#viewTrackers");
const viewAddTracker = $("#viewAddTracker");
const viewEditTracker = $("#viewEditTracker");
const viewTracker = $("#viewTracker");
const viewBook = $("#viewBook");

// Year progress
const yearProgress = $("#yearProgress");
const yearProgressFill = $("#yearProgressFill");

// Edit tracker view
const editTrackerForm = $("#editTrackerForm");
const editTrackerName = $("#editTrackerName");
const editColorSwatches = $("#editColorSwatches");
const editYearly = $("#editYearly");
const editTrackerError = $("#editTrackerError");
const btnEditCancel = $("#btnEditCancel");
const btnEditDelete = $("#btnEditDelete");
const btnEditSave = $("#btnEditSave");
const elTrackersList = $("#trackersList");
const emptyTrackersHint = $("#emptyTrackersHint");

const booksGrid = $("#booksGrid");
const chaptersGrid = $("#chaptersGrid");
const btnMarkAll = $("#btnMarkAll");
const btnMarkNone = $("#btnMarkNone");

// Add tracker UI
const addTrackerForm = $("#addTrackerForm");
const trackerNameInput = $("#trackerName");
const colorSwatches = $("#colorSwatches");
const scopeRow = $(".scopeRow");
const booksSummary = $("#booksSummary");
const bookPicker = $("#bookPicker");
const pickGridOT = $("#pickGridOT");
const pickGridNT = $("#pickGridNT");
const btnSelectNT = $("#btnSelectNT");
const btnSelectOT = $("#btnSelectOT");
const btnSelectAll = $("#btnSelectAll");
const btnSelectNone = $("#btnSelectNone");
const btnAddCancel = $("#btnAddCancel");
const addTrackerError = $("#addTrackerError");

/**
 * In-memory
 */
let currentUser = null;
let unsubTrackers = null;

let trackers = []; // [{id, name, color, year, bookIds, progress, createdAt, updatedAt}]
let trackersById = new Map();

let ui = loadUiState();
const requestedNav = {
  view: ui.view || "trackers",
  trackerId: ui.currentTrackerId || null,
  bookId: ui.currentBookId || null,
};

// Start always on home; after the first Firestore snapshot we restore the last page.
let currentView = "trackers"; // trackers | add | tracker | book
let currentTrackerId = null;
let currentBookId = null;
let initialSnapshotSeen = false;
let requestedNavApplied = false;

let started = false;

// Epic-mode render lock: prevents Firestore snapshots from re-rendering the DOM
// while we are running chained FX (wave / escalation). Without this, the grid
// gets replaced mid-animation and most effects never show.
let epicLockUntil = 0;
let epicPendingRender = false;
let epicPendingTimer = null;

// Add tracker draft state
let draftScope = "bible"; // bible | ot | nt | custom
let draftBookIds = new Set([...OT_BOOK_IDS, ...NT_BOOK_IDS]);
let draftColorHex = null;

// Edit tracker draft state
let editColorHex = null;
let editYearlyValue = false;

setupAuth();

function setupAuth() {
  applyAuthTheme();

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    btnLogin.disabled = true;
    try {
      const email = String(loginEmail.value || "").trim();
      const pass = String(loginPassword.value || "");
      await signInWithEmailAndPassword(auth, email, pass);
      loginPassword.value = "";
    } catch (err) {
      loginError.textContent = humanAuthError(err);
    } finally {
      btnLogin.disabled = false;
    }
  });

  btnMenuLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      cleanupSubscriptions();
      currentUser = null;

      closeMenu();

      appEl.classList.add("hidden");
      loginView.classList.remove("hidden");
      applyAuthTheme();
      loginError.textContent = "";
      return;
    }

    loginView.classList.add("hidden");
    appEl.classList.remove("hidden");

    currentUser = user;
    startAppOnce();
  });
}

function cleanupSubscriptions() {
  if (unsubTrackers) {
    try { unsubTrackers(); } catch { /* noop */ }
  }
  unsubTrackers = null;
}

function startAppOnce() {
  if (started) {
    subscribeTrackers();
    setView(currentView);
    return;
  }
  started = true;

  // Wire events
  btnAddTracker.addEventListener("click", () => {
    openAddTracker();
  });

  btnMenu.addEventListener("click", () => {
    toggleMenu();
  });

  menuOverlay.addEventListener("click", (e) => {
    // close on overlay click; keep clicks inside panel open
    if (e.target === menuOverlay) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Epic button: three levels (0 -> 1 -> 2 -> 0). Must NOT close the menu.
  if (btnMenuEpic) {
    btnMenuEpic.addEventListener("click", () => {
      const prev = getEpicModeLevel();
      const next = prev === 0 ? 1 : (prev === 1 ? 2 : 0);
      setEpicModeLevel(next, { source: "user" });
      updateMenuEpicLabel();
    });
  }

  btnEditTracker.addEventListener("click", () => {
    openEditTracker();
  });

  btnBack.addEventListener("click", goBack);

// Chapters interactions
let pressedChapterTile = null;
const clearPressedChapter = () => {
  if (pressedChapterTile) {
    pressedChapterTile.classList.remove("epic-pressing");
    pressedChapterTile = null;
  }
  appEl.classList.remove("epic-app-pressing");
};

chaptersGrid.addEventListener("pointerdown", (e) => {
  const tile = e.target.closest("[data-ch]");
  if (!tile) return;
  if (!isEpicEnabled()) return;
  pressedChapterTile = tile;
  tile.classList.add("epic-pressing");
  appEl.classList.add("epic-app-pressing");
});
chaptersGrid.addEventListener("pointerup", clearPressedChapter);
chaptersGrid.addEventListener("pointercancel", clearPressedChapter);
chaptersGrid.addEventListener("pointerleave", clearPressedChapter);

chaptersGrid.addEventListener("click", (e) => {
  const tile = e.target.closest("[data-ch]");
  if (!tile) return;
  const ch = Number(tile.dataset.ch);
  if (!Number.isFinite(ch)) return;

  const tracker = getCurrentTracker();
  if (!tracker || !currentBookId) return;

  // Release the "press" state (if any) before we animate
  clearPressedChapter();

  handleChapterToggle(tile, tracker, currentBookId, ch);
});

  btnMarkAll.addEventListener("click", () => {
    const tracker = getCurrentTracker();
    if (!tracker || !currentBookId) return;
    markAllChapters(tracker, currentBookId);
  });

  btnMarkNone.addEventListener("click", () => {
    const tracker = getCurrentTracker();
    if (!tracker || !currentBookId) return;
    clearAllChapters(tracker, currentBookId);
  });

  // Add tracker form
  addTrackerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await confirmAddTracker();
  });

  btnAddCancel.addEventListener("click", () => {
    setView("trackers");
  });

  scopeRow.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-scope]");
    if (!btn) return;
    setDraftScope(btn.dataset.scope);
  });

  colorSwatches.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-color]");
    if (!btn) return;
    setDraftColor(btn.dataset.color);
  });

  if (editColorSwatches) {
    editColorSwatches.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-color]");
      if (!btn) return;
      setEditColor(btn.dataset.color);
    });
  }

  if (btnEditCancel) {
    btnEditCancel.addEventListener("click", () => {
      setView("tracker");
    });
  }

  if (btnEditDelete) {
    btnEditDelete.addEventListener("click", () => {
      const t = getCurrentTracker();
      if (!t) return;
      const ok = window.confirm(`Tracker „${String(t.name || "Tracker")}“ wirklich löschen?`);
      if (!ok) return;
      deleteTracker(t.id);
    });
  }

  if (editTrackerForm) {
    editTrackerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await confirmEditTracker();
    });
  }

  if (editYearly) {
    editYearly.addEventListener("change", () => {
      editYearlyValue = !!editYearly.checked;
    });
  }

  bookPicker.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (!btn) return;
    if (draftScope !== "custom") return;
    toggleDraftBook(btn.dataset.book);
  });

  btnSelectAll.addEventListener("click", () => {
    if (draftScope !== "custom") return;
    draftBookIds = new Set([...OT_BOOK_IDS, ...NT_BOOK_IDS]);
    updateAddTrackerUI();
  });

  btnSelectNT.addEventListener("click", () => {
    if (draftScope !== "custom") return;
    draftBookIds = new Set(NT_BOOK_IDS);
    updateAddTrackerUI();
  });

  btnSelectOT.addEventListener("click", () => {
    if (draftScope !== "custom") return;
    draftBookIds = new Set(OT_BOOK_IDS);
    updateAddTrackerUI();
  });

  btnSelectNone.addEventListener("click", () => {
    if (draftScope !== "custom") return;
    draftBookIds = new Set();
    updateAddTrackerUI();
  });

  // prevent zoom on double tap (best-effort)
  document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });

  // Build static add-tracker UI once
  buildAddTrackerUiOnce();

  // Epic FX canvas (global particle renderer)
  ensureFxLayer();

  subscribeTrackers();
  // Show home immediately; last page is restored after the first Firestore snapshot.
  setView("trackers", { skipSave: true });
}

function subscribeTrackers() {
  if (!currentUser) return;
  if (unsubTrackers) return; // already subscribed

  const colRef = collection(db, "nt-365", currentUser.uid, "trackers");
  const q = query(colRef, orderBy("updatedAt", "desc"));

  unsubTrackers = onSnapshot(q, (snap) => {
    trackers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    trackersById = new Map(trackers.map(t => [t.id, t]));
    if (!initialSnapshotSeen) initialSnapshotSeen = true;

    // Restore last page once after the first snapshot (unless the user already navigated).
    if (!requestedNavApplied && currentView === "trackers") {
      applyRequestedNavigation();
      return;
    }

    normalizeNavigationAfterData();

    // If epic FX are running, keep the current DOM stable until the chain ends.
    // (We still keep the in-memory data updated.)
    const now = Date.now();
    if (isEpicEnabled() && now < epicLockUntil) {
      epicPendingRender = true;
      if (epicPendingTimer) window.clearTimeout(epicPendingTimer);
      epicPendingTimer = window.setTimeout(() => {
        epicPendingTimer = null;
        if (!epicPendingRender) return;
        epicPendingRender = false;
        normalizeNavigationAfterData();
        renderCurrentView();
      }, Math.max(0, epicLockUntil - now) + 30);
      return;
    }

    renderCurrentView();
  }, (err) => {
    console.error("Firestore subscribe error:", err);
  });
}

function applyRequestedNavigation() {
  requestedNavApplied = true;

  const v = String(requestedNav.view || "trackers");
  const tid = requestedNav.trackerId;
  const bid = requestedNav.bookId;

  if (v === "tracker" && tid && trackersById.has(tid)) {
    currentTrackerId = tid;
    currentBookId = null;
    const t = trackersById.get(tid);
    if (t && t.color) ui.lastTrackerColor = t.color;
    setView("tracker");
    return;
  }

  if (v === "book" && tid && bid && trackersById.has(tid)) {
    const t = trackersById.get(tid);
    const ids = normalizeBookIds(t.bookIds);
    if (ids.includes(bid)) {
      currentTrackerId = tid;
      currentBookId = bid;
      if (t && t.color) ui.lastTrackerColor = t.color;
      setView("book");
      return;
    }
  }

  // Fallback
  currentTrackerId = null;
  currentBookId = null;
  setView("trackers");
}

function normalizeNavigationAfterData() {
  // If we were on tracker/book but tracker is gone, go home
  if ((currentView === "tracker" || currentView === "book") && currentTrackerId) {
    if (!trackersById.has(currentTrackerId)) {
      currentTrackerId = null;
      currentBookId = null;
      currentView = "trackers";
    }
  }

  if (currentView === "book") {
    const t = getCurrentTracker();
    if (!t) {
      currentView = "trackers";
      currentTrackerId = null;
      currentBookId = null;
    } else {
      const ids = Array.isArray(t.bookIds) ? t.bookIds : [];
      if (!currentBookId || !ids.includes(currentBookId)) {
        currentBookId = null;
        currentView = "tracker";
      }
    }
  }

  saveUiState();
}

function setView(v, opts = {}) {
  const { skipSave = false, skipRender = false } = opts;
  currentView = v;

  // Close menu on navigation (except when toggling epic inside menu, which does not call setView)
  closeMenu();

  viewTrackers.classList.toggle("hidden", v !== "trackers");
  viewAddTracker.classList.toggle("hidden", v !== "add");
  viewEditTracker.classList.toggle("hidden", v !== "edit");
  viewTracker.classList.toggle("hidden", v !== "tracker");
  viewBook.classList.toggle("hidden", v !== "book");

  // Back button: show for tracker + book (not for add, because it has bottom cancel)
  btnBack.classList.toggle("hidden", v === "trackers" || v === "add" || v === "edit");

  // Only on home
  btnAddTracker.classList.toggle("hidden", v !== "trackers");
  btnEditTracker.classList.toggle("hidden", v !== "tracker");
  btnMenu.classList.toggle("hidden", v !== "trackers");

  if (!skipSave) saveUiState();
  if (!skipRender) renderCurrentView();
}

function goBack() {
  if (currentView === "book") {
    currentBookId = null;
    setView("tracker");
    return;
  }
  if (currentView === "tracker") {
    currentTrackerId = null;
    setView("trackers");
  }
}

function renderCurrentView() {
  if (!currentUser) return;

  if (currentView === "trackers") renderTrackers();
  else if (currentView === "add") renderAddTrackerView();
  else if (currentView === "edit") renderEditTrackerView();
  else if (currentView === "tracker") renderTracker();
  else if (currentView === "book") renderBook();

  updateTopbar();
}

// --- Topbar ---
function updateTopbar() {
  let pct = 0;
  let barStrong = "transparent";
  let barSoft = "transparent";
  let btnSoft = "transparent";
  let btnStrong = "transparent";

  const tracker = getCurrentTracker();

  if (currentView === "trackers") {
    topTitle.textContent = "NT 365";
    topSub.textContent = "";
  } else if (currentView === "add") {
    topTitle.textContent = "Tracker hinzufügen";
    topSub.textContent = "";

    // Important: keep pills (Abbrechen/Hinzufügen) tinted in the add view
    // (updateTopbar runs after the add view render and would otherwise overwrite).
    const rgb = hexToRgb(draftColorHex || ui.lastTrackerColor || "#cccccc");
    btnSoft = rgba(rgb, SOFT_A);
    btnStrong = rgba(rgb, STRONG_A);
  } else if (currentView === "edit" && tracker) {
    topTitle.textContent = "Tracker bearbeiten";
    topSub.textContent = String(tracker.name || "Tracker");

    const rgb = hexToRgb((tracker.color || ui.lastTrackerColor || "#cccccc"));
    btnSoft = rgba(rgb, SOFT_A);
    btnStrong = rgba(rgb, STRONG_A);
  } else if (currentView === "tracker" && tracker) {
    const st = trackerStats(tracker);
    topTitle.textContent = String(tracker.name || "Tracker");
    topSub.textContent = `${trackerYear(tracker)} · ${st.doneBooks}/${st.totalBooks} · ${st.pct}%`;

    const rgb = hexToRgb(tracker.color || ui.lastTrackerColor || "#cccccc");
    pct = st.pct;
    barStrong = rgba(rgb, STRONG_A);
    barSoft = rgba(rgb, SOFT_A);
    btnSoft = barSoft;
    btnStrong = barStrong;
  } else if (currentView === "book" && tracker && currentBookId) {
    const b = BOOK_BY_ID.get(currentBookId);
    const read = getReadSet(tracker, currentBookId).size;
    const total = b ? b.chapters : 0;
    const bpct = total ? Math.round((read / total) * 100) : 0;

    topTitle.textContent = String(tracker.name || "Tracker");
    topSub.textContent = `${trackerYear(tracker)} · ${(b && b.short) ? b.short : "Buch"} · ${read}/${total} · ${bpct}%`;

    const rgb = hexToRgb(tracker.color || ui.lastTrackerColor || "#cccccc");
    pct = bpct;
    barStrong = rgba(rgb, STRONG_A);
    barSoft = rgba(rgb, SOFT_A);
    btnSoft = barSoft;
    btnStrong = barStrong;
  } else {
    topTitle.textContent = "NT 365";
    topSub.textContent = "";
  }

  // Home: + button tint = last used tracker color
  let addSoft = "var(--btnBg)";
  if (currentView === "trackers") {
    const c = ui.lastTrackerColor;
    if (c) {
      addSoft = rgba(hexToRgb(c), SOFT_A);
    }
  }

  topbar.style.setProperty("--barStrong", barStrong);
  topbar.style.setProperty("--barSoft", barSoft);
  topbar.style.setProperty("--barPct", `${pct}%`);
  appEl.style.setProperty("--btnYearSoft", btnSoft);
  appEl.style.setProperty("--btnYearStrong", btnStrong);
  appEl.style.setProperty("--addSoft", addSoft);


  // Epic toggle tint + label
  const epicHex = ui.lastTrackerColor || draftColorHex || "#8cc0ff";
  const ergb = hexToRgb(epicHex);
  appEl.style.setProperty("--epcSoft", rgba(ergb, SOFT_A));
  appEl.style.setProperty("--epcStrong", rgba(ergb, STRONG_A));

  // Keep menu toggle in sync
  if (menuEpic) {
    menuEpic.checked = getEpicModeLevel() > 0;
  }
}

// --- Home (Trackers list) ---
function renderTrackers() {
  elTrackersList.innerHTML = "";

  emptyTrackersHint.classList.toggle("hidden", trackers.length !== 0);

  trackers.forEach((t) => {
    const st = trackerStats(t);
    const rgb = hexToRgb(t.color);
    const fillStrong = rgba(rgb, STRONG_A);
    const fillSoft = rgba(rgb, SOFT_A);

    const btn = document.createElement("button");
    btn.className = "yearItem tile";
    btn.type = "button";
    btn.style.setProperty("--fillPct", `${st.pct}%`);
    btn.style.setProperty("--fillStrong", fillStrong);
    btn.style.setProperty("--fillSoft", fillSoft);

    btn.innerHTML = `
      <div class="tileBase" aria-hidden="true"></div>
      <div class="tileFill" aria-hidden="true"></div>
      <div class="tileContent">
        <div class="yearTop">
          <div class="yearLabel">${escapeHtml(String(t.name || "Tracker"))}</div>
          <div class="yearPct">${st.pct}% · ${st.doneBooks}/${st.totalBooks}</div>
        </div>
      </div>
    `;

    btn.addEventListener("click", () => {
      openTracker(t.id);
    });

    elTrackersList.appendChild(btn);
  });
}

function openTracker(trackerId) {
  currentTrackerId = trackerId;
  currentBookId = null;

  const t = trackersById.get(trackerId);
  if (t && t.color) ui.lastTrackerColor = t.color;

  applyAuthTheme();

  saveUiState();
  setView("tracker");
}

// --- Tracker page (books) ---
function renderTracker() {
  const t = getCurrentTracker();
  if (!t) {
    setView("trackers");
    return;
  }

  renderYearProgress(t);

  booksGrid.innerHTML = "";

  const ids = normalizeBookIds(t.bookIds);

  ids.forEach((bookId) => {
    const b = BOOK_BY_ID.get(bookId);
    if (!b) return;

    // Book tiles: color by book group (not by tracker)
    const rgb = bookGroupRgb(bookId);
    const fillStrong = rgba(rgb, STRONG_A);
    const fillSoft = rgba(rgb, SOFT_A);

    const bp = bookProgress(t, bookId);
    const pct = Math.round(bp * 100);

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "bookTile tile";
    tile.dataset.book = bookId;
    tile.style.setProperty("--fillPct", `${pct}%`);
    tile.style.setProperty("--fillStrong", fillStrong);
    tile.style.setProperty("--fillSoft", fillSoft);

    tile.innerHTML = `
      <div class="tileBase" aria-hidden="true"></div>
      <div class="tileFill" aria-hidden="true"></div>
      <div class="tileContent">
        <div class="bookShort">${escapeHtml(b.short || b.name)}</div>
      </div>
    `;

    tile.addEventListener("click", () => {
      openBook(bookId);
    });

    booksGrid.appendChild(tile);
  });
}

function renderYearProgress(tracker) {
  if (!yearProgress || !yearProgressFill) return;

  const on = !!tracker.yearly;
  yearProgress.classList.toggle("hidden", !on);
  if (!on) return;

  const now = new Date();
  const y = now.getFullYear();
  const start = new Date(y, 0, 1, 0, 0, 0, 0).getTime();
  const end = new Date(y + 1, 0, 1, 0, 0, 0, 0).getTime();
  const p = Math.max(0, Math.min(1, (now.getTime() - start) / (end - start)));
  const pct = Math.round(p * 100);

  const c = tracker.color || ui.lastTrackerColor || "#849eeb";
  const rgb = hexToRgb(c);
  appEl.style.setProperty("--yearStrong", rgba(rgb, STRONG_A));
  appEl.style.setProperty("--yearSoft", rgba(rgb, SOFT_A));
  yearProgressFill.style.width = `${pct}%`;
}

function openBook(bookId) {
  const t = getCurrentTracker();
  if (!t) return;

  const ids = normalizeBookIds(t.bookIds);
  if (!ids.includes(bookId)) return;

  currentBookId = bookId;
  saveUiState();
  setView("book");
}

// --- Book page (chapters) ---
function renderBook() {
  const t = getCurrentTracker();
  if (!t || !currentBookId) {
    setView("trackers");
    return;
  }

  const b = BOOK_BY_ID.get(currentBookId);
  if (!b) {
    currentBookId = null;
    setView("tracker");
    return;
  }

  const rgb = bookGroupRgb(currentBookId);
  const chStrong = rgba(rgb, STRONG_A);
  const chSoft = rgba(rgb, SOFT_A);

  chaptersGrid.style.setProperty("--chSoft", chSoft);
  chaptersGrid.style.setProperty("--chStrong", chStrong);

  chaptersGrid.innerHTML = "";

  const readSet = getReadSet(t, currentBookId);
  for (let ch = 1; ch <= b.chapters; ch++) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "chapterTile" + (readSet.has(ch) ? " read" : "");
    tile.dataset.ch = String(ch);
    tile.textContent = String(ch);
    chaptersGrid.appendChild(tile);
  }
}


// --- Epic Mode (Gamification) ---
let FX = null;

function ensureFxLayer() {
  if (FX) return;

  const canvas = document.createElement("canvas");
  canvas.className = "fxCanvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  // Laser grid + slam overlays (DOM-based)
  const grid = document.createElement("div");
  grid.className = "laserGrid";
  grid.setAttribute("aria-hidden", "true");
  document.body.appendChild(grid);

  const slamLayer = document.createElement("div");
  slamLayer.className = "epic-slam-layer";
  slamLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(slamLayer);

const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

// Performance: keep the illusion "epic" but cap real work.
const particles = [];
const pool = [];
let rafId = 0;
let lastT = performance.now();
let lastDraw = 0;

const hw = navigator.hardwareConcurrency || 4;
const mem = navigator.deviceMemory || 4;
const LOW_END = hw <= 4 || mem <= 4;

// Quality knobs (smaller canvas + fewer draws/particles) — still looks loud.
const COUNT_Q = LOW_END ? 0.62 : 0.9;      // scale particle counts
const FPS = LOW_END ? 26 : 34;             // throttle draws
const FRAME_MS = 1000 / FPS;
const RES_SCALE = LOW_END ? 0.70 : 0.82;   // internal canvas resolution multiplier
const DPR_CAP = 1.5;

const resize = () => {
  const dpr = Math.max(1, Math.min(DPR_CAP, window.devicePixelRatio || 1));
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);

  canvas.width = Math.round(w * dpr * RES_SCALE);
  canvas.height = Math.round(h * dpr * RES_SCALE);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  // Map drawing coords to CSS pixels while rendering at lower res.
  ctx.setTransform(dpr * RES_SCALE, 0, 0, dpr * RES_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = true;
};
window.addEventListener("resize", resize, { passive: true });
resize();

const maxParticles = () => {
  const base = LOW_END ? 520 : 760;
  return Math.round(base * (isMoreEpic() ? 1.15 : 1.0));
};

const alloc = () => (pool.pop() || {});
const free = (p) => { pool.push(p); };

const push = (p) => {
  const cap = maxParticles();
  // hard cap to avoid stalls
  if (particles.length >= cap) {
    // drop some oldest
    particles.splice(0, Math.ceil((particles.length - cap + 1) * 0.6));
  }
  particles.push(p);
};

const start = () => {
  if (rafId) return;
  lastT = performance.now();
  lastDraw = 0;
  rafId = requestAnimationFrame(tick);
};

const tick = (t) => {
  const dt = Math.min(0.04, Math.max(0.001, (t - lastT) / 1000));
  lastT = t;

  if (t - lastDraw < FRAME_MS) {
    rafId = requestAnimationFrame(tick);
    return;
  }
  lastDraw = t;

  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.ttl) {
      particles[i] = particles[particles.length - 1];
      particles.pop();
      free(p);
      continue;
    }

    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;

    const life = 1 - (p.age / p.ttl);
    const a = life <= 0 ? 0 : (life >= 1 ? 1 : life);

    if (p.type === "laser") {
      // cheaper "laser": single glow stroke (no per-frame gradients)
      const sp = Math.max(1, Math.hypot(p.vx, p.vy));
      const ux = p.vx / sp;
      const uy = p.vy / sp;
      const ex = p.x - ux * p.len;
      const ey = p.y - uy * p.len;

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = a;

      ctx.strokeStyle = p.color;
      ctx.lineCap = "round";
      ctx.shadowBlur = 14;
      ctx.shadowColor = p.color;

      // glow pass
      ctx.lineWidth = p.w * 2.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // core pass
      ctx.shadowBlur = 0;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = a;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }

  // reset state
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";

  if (particles.length) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = 0;
  }
};

const burst = (x, y, opts = {}) => {
  const {
    count = 18,
    palette = ["#fff"],
    power = 1,
    gravity = 2200,
    spread = 1,
    size = 1,
    ttl = 1.05,
  } = opts;

  const n = Math.max(0, Math.min(220, Math.round((count || 0) * COUNT_Q)));
  if (!n) return;

  for (let i = 0; i < n; i++) {
    // Upward explosion with wide spread
    const ang = (Math.random() * Math.PI) + Math.PI; // pi..2pi (mostly upward)
    const angJitter = (Math.random() - 0.5) * 0.55 * spread;
    const a = ang + angJitter;

    const speed = (520 + Math.random() * 980) * power;
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed;

    const w = (4 + Math.random() * 5) * size;
    const h = (8 + Math.random() * 16) * size;
    const vr = (Math.random() * 12 - 6);
    const color = palette[Math.floor(Math.random() * palette.length)];
    const pttl = ttl + (Math.random() * 0.5);

    const p = alloc();
    p.type = "conf";
    p.x = x + (Math.random() - 0.5) * 4;
    p.y = y + (Math.random() - 0.5) * 4;
    p.vx = vx;
    p.vy = vy;
    p.g = gravity;
    p.w = w;
    p.h = h;
    p.rot = Math.random() * Math.PI;
    p.vr = vr;
    p.color = color;
    p.ttl = pttl;
    p.age = 0;

    push(p);
  }
  start();
};

const storm = (opts = {}) => {
  const {
    count = 140,
    palette = ["#fff"],
    gravity = 2600,
  } = opts;

  const w = window.innerWidth;
  const n = Math.max(0, Math.min(720, Math.round((count || 0) * COUNT_Q)));
  if (!n) return;

  for (let i = 0; i < n; i++) {
    const p = alloc();
    p.type = "conf";
    p.x = Math.random() * w;
    p.y = -20 - Math.random() * 140;
    p.vx = (Math.random() - 0.5) * 320;
    p.vy = 160 + Math.random() * 380;

    p.w = 4 + Math.random() * 6;
    p.h = 10 + Math.random() * 16;
    p.vr = (Math.random() * 10 - 5);
    p.color = palette[Math.floor(Math.random() * palette.length)];
    p.ttl = 1.45 + Math.random() * 0.85;
    p.age = 0;
    p.g = gravity;
    p.rot = Math.random() * Math.PI;

    push(p);
  }
  start();
};

const lasers = (x, y, opts = {}) => {
  const {
    count = 6,
    palette = ["#fff"],
    power = 1,
    ttl = 0.55,
    spread = 1,
    width = 2,
    length = 180,
    gravity = 0,
  } = opts;

  const n = Math.max(0, Math.min(140, Math.round((count || 0) * (LOW_END ? 0.75 : 1))));
  if (!n) return;

  for (let i = 0; i < n; i++) {
    const a = (Math.random() * Math.PI * 2) + ((Math.random() - 0.5) * 0.35 * spread);
    const speed = (900 + Math.random() * 1400) * power;
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed;

    const p = alloc();
    p.type = "laser";
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.g = gravity;
    p.w = (width + Math.random() * width * 0.6);
    p.len = length * (0.75 + Math.random() * 0.7);
    p.color = palette[Math.floor(Math.random() * palette.length)];
    p.ttl = (ttl + (Math.random() * 0.22));
    p.age = 0;
    p.rot = 0;
    p.vr = 0;
    p.h = 0;

    push(p);
  }
  start();
};

FX = { burst, storm, lasers, resize, gridEl: grid, slamLayer, q: { LOW_END, COUNT_Q, FPS, RES_SCALE } };
}


function getEpicModeLevel() {
  return Math.max(0, Math.min(2, Number(ui.epicLevel || 0)));
}

function isEpicEnabled() {
  return getEpicModeLevel() > 0;
}

function isMoreEpic() {
  return getEpicModeLevel() >= 2;
}


function setEpicModeLevel(level, { source = "code" } = {}) {
  const next = Math.max(0, Math.min(2, Math.round(Number(level) || 0)));
  const prev = getEpicModeLevel();
  if (prev === next) return;

  ui.epicLevel = next;
  ui.epic = next > 0; // legacy mirror
  saveUiState();
  updateTopbar();
  updateMenuEpicLabel();

  // More Epic activation: dramatic button "camera zoom" + satirical overlays.
  if (source === "user" && prev === 1 && next === 2) {
    epicDramaticZoomTo(btnMenu);
    epicSlamOverlay({ count: 3, intensity: 1.0, text: "EPIC" });
    epicFlashLaserGrid({ intensity: 0.9, duration: 520 });
  }
}


function lockEpic(ms) {
  if (!isEpicEnabled()) return;
  const until = Date.now() + Math.max(0, Number(ms) || 0);
  if (until > epicLockUntil) epicLockUntil = until;
}

function handleChapterToggle(tile, tracker, bookId, ch) {
  const b = BOOK_BY_ID.get(bookId);
  if (!b) return;
  if (ch < 1 || ch > b.chapters) return;

  const set = getReadSet(tracker, bookId);
  const wasRead = set.has(ch);
  const willBeRead = !wasRead;

  if (willBeRead) set.add(ch);
  else set.delete(ch);

  // Update DOM immediately to keep animations alive (epic mode skips full re-render)
  if (willBeRead) tile.classList.add("read");
  else tile.classList.remove("read");

  const didCompleteBook = willBeRead && b.chapters > 0 && set.size >= b.chapters;
  const didCompleteTracker = willBeRead && didCompleteBook && wouldCompleteTracker(tracker, bookId, set);

  if (isEpicEnabled() && willBeRead) {
    const bookRgb = bookGroupRgb(bookId);
    const trackerColor = tracker.color;

    // Escalation ladder: chapter -> book -> tracker
    const chapterLevel = 1;
    const bookLevel = 2;
    const trackerLevel = 4;
    const level = didCompleteTracker ? trackerLevel : (didCompleteBook ? bookLevel : chapterLevel);

    // Keep the DOM stable while the FX chain runs (snapshots shouldn't replace the grid mid-animation)
    lockEpic(didCompleteTracker ? 5200 : (didCompleteBook ? 2600 : 1100));

    // 1) The clicked tile always gets the full hit
    epicBurstTile(tile, { level, trackerColor, bookRgb, wave: false });
    epicAppHit(level);

    if (didCompleteBook) {
      // 2) Book finish: add an extra punch (so it clearly feels "bigger" than a single chapter)
      epicBookFinishBoost(tile, { trackerColor, bookRgb, didCompleteTracker });

      // 3) Wave: neighbours -> further out (all tiles get pop/shake/halo/confetti)
      epicWaveFromTile(tile, { level: didCompleteTracker ? trackerLevel : bookLevel, trackerColor, bookRgb });

      // 4) Tracker finish: TOTAL escalation ON TOP of the wave
      if (didCompleteTracker) {
        window.setTimeout(() => {
          epicTotalEskalation(tile, { trackerColor, bookRgb });
        }, 240);
      }
    }
  }

  persistBookProgress(tracker, bookId, set, { skipRerender: isEpicEnabled() });
}

function wouldCompleteTracker(tracker, bookId, newSetForBook) {
  const ids = normalizeBookIds(tracker.bookIds);
  for (const id of ids) {
    const b = BOOK_BY_ID.get(id);
    if (!b || !b.chapters) continue;
    const size = (id === bookId) ? newSetForBook.size : getReadSet(tracker, id).size;
    if (size < b.chapters) return false;
  }
  return true;
}

function epicAppHit(level) {
  // subtle global punch; stronger on escalation (and stronger again in MORE EPIC)
  const more = isMoreEpic();
  const cls = level >= 4
    ? (more ? "epic-app-mega-more" : "epic-app-mega")
    : (more ? "epic-app-hit-more" : "epic-app-hit");

  appEl.classList.remove("epic-app-hit", "epic-app-mega", "epic-app-hit-more", "epic-app-mega-more");
  // restart animation
  void appEl.offsetWidth;
  appEl.classList.add(cls);
  window.setTimeout(() => {
    appEl.classList.remove("epic-app-hit", "epic-app-mega", "epic-app-hit-more", "epic-app-mega-more");
  }, 700);
}


function epicBookFinishBoost(originTile, { trackerColor = "#8cc0ff", bookRgb = [200, 200, 200], didCompleteTracker = false } = {}) {
  // Bigger-than-chapter punch, optimized: fewer particles, more "screen language".
  ensureFxLayer();

  const rect = originTile.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const trackerRgb = hexToRgb(trackerColor || "#8cc0ff");
  const palette = [
    `rgb(${bookRgb[0]}, ${bookRgb[1]}, ${bookRgb[2]})`,
    `rgb(${trackerRgb[0]}, ${trackerRgb[1]}, ${trackerRgb[2]})`,
    "rgb(255, 255, 255)",
    "rgb(255, 240, 120)",
  ];

  const q = (FX && FX.q ? (FX.q.COUNT_Q || 1) : 1);
  const c1 = Math.round((didCompleteTracker ? 72 : 58) * q);
  const c2 = Math.round((didCompleteTracker ? 52 : 40) * q);

  FX.burst(x, y, { count: c1, palette, power: 1.35, gravity: 2550, spread: 1.26, size: 1.14, ttl: 1.18 });
  window.setTimeout(() => {
    FX.burst(x, y, { count: c2, palette, power: 1.15, gravity: 2650, spread: 1.12, size: 1.08, ttl: 1.10 });
  }, 110);

  // Halos are cheap but feel huge.
  epicHaloAt(x, y, bookRgb, didCompleteTracker ? 4 : 2, false);
  window.setTimeout(() => epicHaloAt(x, y, bookRgb, didCompleteTracker ? 4 : 2, false), 140);

  // MORE EPIC: small laser burst + slam (kept modest for perf)
  if (isMoreEpic()) {
    epicFlashLaserGrid({ intensity: didCompleteTracker ? 0.95 : 0.7, duration: didCompleteTracker ? 620 : 420 });
    epicSlamOverlay({ count: didCompleteTracker ? 4 : 2, intensity: didCompleteTracker ? 1.35 : 1.1, text: "EPIC" });

    FX.lasers(x, y, {
      count: didCompleteTracker ? 14 : 10,
      palette,
      power: didCompleteTracker ? 1.25 : 1.12,
      ttl: didCompleteTracker ? 0.62 : 0.52,
      spread: 1.25,
      width: didCompleteTracker ? 2.6 : 2.2,
      length: didCompleteTracker ? 300 : 260,
    });
  }
}
function epicBurstTile(tile, { level = 1, trackerColor = "#8cc0ff", bookRgb = [200, 200, 200], wave = false, particles = "auto" } = {}) {
  ensureFxLayer();

  const more = isMoreEpic();

  // Combined pop+shake animation (single transform animation so it doesn't get overridden)
  tile.classList.remove("epic-burst", "epic-burst-soft", "epic-burst-more", "epic-burst-soft-more");
  void tile.offsetWidth;
  tile.classList.add(
    wave
      ? (more ? "epic-burst-soft-more" : "epic-burst-soft")
      : (more ? "epic-burst-more" : "epic-burst")
  );

  const rect = tile.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Halo ring (screen-space so it survives re-renders)
  epicHaloAt(x, y, bookRgb, level, wave);

  // Palette (book + tracker + highlights)
  const trackerRgb = hexToRgb(trackerColor || "#8cc0ff");
  const palette = [
    `rgb(${bookRgb[0]}, ${bookRgb[1]}, ${bookRgb[2]})`,
    `rgb(${trackerRgb[0]}, ${trackerRgb[1]}, ${trackerRgb[2]})`,
    "rgb(255, 255, 255)",
    "rgb(255, 240, 120)",
  ];

  // Particle mode: keep it dramatic but light.
  let mode = particles;
  if (mode === "auto") mode = wave ? "micro" : "full";

  const q = (FX && FX.q ? (FX.q.COUNT_Q || 1) : 1);

  let count = 0;
  if (mode === "none") {
    count = 0;
  } else if (mode === "micro") {
    count = wave
      ? (level >= 4 ? 4 : (level >= 2 ? 3 : 2))
      : (level >= 4 ? 8 : (level >= 2 ? 6 : 5));
  } else { // full
    count = wave
      ? (level >= 4 ? 6 : (level >= 2 ? 5 : 3))
      : (level >= 4 ? 38 : (level >= 2 ? 24 : 14));
  }

  // MORE EPIC: increase feel via power/size; only slightly more particles.
  count = Math.round(count * q * (more ? 1.12 : 1.0));
  const power = (wave ? 0.62 : (level >= 4 ? 1.55 : (level >= 2 ? 1.25 : 1.05))) * (more ? 1.14 : 1.0);
  const spread = (wave ? 0.92 : (level >= 4 ? 1.28 : (level >= 2 ? 1.15 : 1.02))) * (more ? 1.12 : 1.0);
  const gravity = (level >= 4 ? 2700 : (level >= 2 ? 2500 : 2300)) * (more ? 1.08 : 1.0);
  const size = (wave ? 0.9 : (level >= 4 ? 1.18 : (level >= 2 ? 1.06 : 1.0))) * (more ? 1.10 : 1.0);
  const ttl = (wave ? 0.92 : (level >= 4 ? 1.22 : (level >= 2 ? 1.12 : 1.03))) * (more ? 1.06 : 1.0);

  if (count > 0) {
    FX.burst(x, y, { count, palette, power, gravity, spread, size, ttl });
  }

  // MORE EPIC extras: keep counts low, rely on light DOM FX (grid/slams/halo).
  if (more && !wave) {
    const laserCount = (level >= 4 ? 10 : (level >= 2 ? 6 : 4));
    FX.lasers(x, y, {
      count: laserCount,
      palette,
      power: (level >= 4 ? 1.2 : (level >= 2 ? 1.05 : 0.95)),
      ttl: (level >= 4 ? 0.58 : 0.48),
      spread: 1.18,
      width: (level >= 4 ? 2.4 : 2.0),
      length: (level >= 4 ? 290 : 240),
    });

    const slamCount = level >= 4 ? 2 : (level >= 2 ? 1 : 0);
    if (slamCount) epicSlamOverlay({ count: slamCount, intensity: level >= 4 ? 1.2 : 1.0, text: "EPIC" });

    if (level >= 2) {
      epicFlashLaserGrid({ intensity: level >= 4 ? 0.85 : 0.5, duration: level >= 4 ? 420 : 260 });
    }
  }
}

function epicHaloAt(x, y, rgb, level, wave) {
  const more = isMoreEpic();

  const halo = document.createElement("div");
  halo.className = more ? "epic-halo-screen epic-halo-more" : "epic-halo-screen";
  halo.style.left = `${x}px`;
  halo.style.top = `${y}px`;

  const alpha = wave ? 0.55 : 0.88;
  halo.style.borderColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

  const base = level >= 4 ? 12 : (level >= 2 ? 9 : 7);
  const scale = base * (more ? 1.35 : 1.0) * (wave ? 0.92 : 1.0);
  halo.style.setProperty("--haloScale", String(scale));
  halo.style.setProperty("--haloStroke", more ? "4px" : "3px");

  document.body.appendChild(halo);
  halo.addEventListener("animationend", () => halo.remove(), { once: true });
}



function epicFlashLaserGrid({ intensity = 0.6, duration = 320 } = {}) {
  ensureFxLayer();
  const grid = FX && FX.gridEl;
  if (!grid) return;

  grid.style.setProperty("--gridA", String(Math.max(0, Math.min(1, intensity))));
  grid.style.setProperty("--gridDur", `${Math.max(120, Math.round(duration))}ms`);

  grid.classList.remove("on");
  // restart animation
  void grid.offsetWidth;
  grid.classList.add("on");
}

function epicSlamOverlay({ count = 1, intensity = 1.0, text = "EPIC" } = {}) {
  ensureFxLayer();
  const layer = FX && FX.slamLayer;
  if (!layer) return;

  const n = Math.max(1, Math.min(18, Math.round(count)));
  const it = Math.max(0.6, Math.min(2.2, Number(intensity) || 1));

  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "epic-slam";
    el.textContent = text;

    const x = 10 + Math.random() * 80;
    const y = 10 + Math.random() * 55;

    const rot = (Math.random() * 34 - 17) * it;
    const scale = (0.9 + Math.random() * 0.55) * it;

    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.setProperty("--slamRot", `${rot}deg`);
    el.style.setProperty("--slamScale", String(scale));
    el.style.setProperty("--slamDur", `${Math.round(520 + 260 * it)}ms`);

    layer.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }
}

function epicDramaticZoomTo(btnEl) {
  if (!btnEl) return;

  const br = btnEl.getBoundingClientRect();
  const ar = appEl.getBoundingClientRect();
  const ox = (br.left + br.width / 2) - ar.left;
  const oy = (br.top + br.height / 2) - ar.top;

  appEl.style.setProperty("--camOx", `${Math.max(0, ox)}px`);
  appEl.style.setProperty("--camOy", `${Math.max(0, oy)}px`);

  appEl.classList.remove("epic-camera-zoom");
  void appEl.offsetWidth;
  appEl.classList.add("epic-camera-zoom");
  window.setTimeout(() => appEl.classList.remove("epic-camera-zoom"), 520);
}


function epicWaveFromTile(originTile, { level = 2, trackerColor = "#8cc0ff", bookRgb = [200, 200, 200] } = {}) {
  ensureFxLayer();
  const tiles = Array.from(chaptersGrid.querySelectorAll(".chapterTile"));
  if (tiles.length < 2) return;

  // Use offsets (cheaper than getBoundingClientRect for every tile).
  const ox = originTile.offsetLeft + originTile.offsetWidth / 2;
  const oy = originTile.offsetTop + originTile.offsetHeight / 2;

  // Sort by distance → creates the "wave"
  const withDist = tiles.map((t) => {
    const x = t.offsetLeft + t.offsetWidth / 2;
    const y = t.offsetTop + t.offsetHeight / 2;
    const d = Math.hypot(x - ox, y - oy);
    return { t, d };
  }).sort((a, b) => a.d - b.d);

  // Delay shaping: keep it snappy (and stable) on big chapter grids.
  const perTileDelay = tiles.length > 120 ? 3.2 : (tiles.length > 80 ? 3.6 : 4.2);

  const maxD = withDist.length ? withDist[withDist.length - 1].d : 0;
  const maxDelay = Math.min(1400, 120 + Math.round(maxD / perTileDelay));
  lockEpic(maxDelay + 820);

  const originCh = originTile?.dataset?.ch;

  // Reduce timer overhead: group into ~20ms buckets.
  const bucketMs = tiles.length > 100 ? 26 : 20;
  const buckets = new Map(); // delay -> [chapterId]
  const spawnStride = tiles.length > 120 ? 5 : (tiles.length > 80 ? 3 : 2);

  withDist.forEach(({ t, d }, idx) => {
    const ch = t.dataset.ch;
    if (originCh && ch === originCh) return;

    const delay = Math.min(1400, 120 + Math.round(d / perTileDelay));
    const bucket = Math.round(delay / bucketMs) * bucketMs;

    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push({ ch, idx });
  });

  const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
  keys.forEach((delay) => {
    window.setTimeout(() => {
      const list = buckets.get(delay) || [];
      for (const item of list) {
        const live = chaptersGrid.querySelector(`[data-ch="${CSS.escape(String(item.ch))}"]`);
        if (!live) continue;

        // Particle trick: only some tiles spawn confetti; others still pop+halo.
        const particles = (tiles.length <= 70 || (item.idx % spawnStride === 0)) ? "micro" : "none";
        epicBurstTile(live, { level, trackerColor, bookRgb, wave: true, particles });
      }
    }, delay);
  });
}

function epicTotalEskalation(originTile, { trackerColor = "#8cc0ff", bookRgb = [200, 200, 200] } = {}) {
  // Tracker finish: keep the spectacle, cap the compute.
  lockEpic(isMoreEpic() ? 4800 : 4200);
  ensureFxLayer();

  // Screen flash (double pulse)
  const mkFlash = () => {
    const flash = document.createElement("div");
    flash.className = "epic-flash";
    document.body.appendChild(flash);
    flash.addEventListener("animationend", () => flash.remove(), { once: true });
  };
  mkFlash();
  window.setTimeout(mkFlash, 170);

  // Grid + slams (cheap, reads as "huge")
  if (isMoreEpic()) {
    epicFlashLaserGrid({ intensity: 1.0, duration: 900 });
    epicSlamOverlay({ count: 6, intensity: 1.7, text: "EPIC" });
  } else {
    epicFlashLaserGrid({ intensity: 0.78, duration: 520 });
    epicSlamOverlay({ count: 3, intensity: 1.15, text: "EPIC" });
  }

  const o = originTile.getBoundingClientRect();
  const ox = o.left + o.width / 2;
  const oy = o.top + o.height / 2;

  const trackerRgb = hexToRgb(trackerColor || "#8cc0ff");
  const palette = [
    `rgb(${bookRgb[0]}, ${bookRgb[1]}, ${bookRgb[2]})`,
    `rgb(${trackerRgb[0]}, ${trackerRgb[1]}, ${trackerRgb[2]})`,
    "rgb(255, 255, 255)",
    "rgb(255, 240, 120)",
    "rgb(255, 150, 220)",
    "rgb(150, 255, 210)",
  ];

  const q = (FX && FX.q ? (FX.q.COUNT_Q || 1) : 1);

  // Main burst (big, but not a thousand particles)
  FX.burst(ox, oy, {
    count: Math.round((isMoreEpic() ? 220 : 150) * q),
    palette,
    power: isMoreEpic() ? 2.0 : 1.75,
    gravity: 2750,
    spread: 1.38,
    size: isMoreEpic() ? 1.30 : 1.18,
    ttl: isMoreEpic() ? 1.45 : 1.30,
  });

  // Laser beams from the clicked tile (moderate count, thicker beams)
  FX.lasers(ox, oy, {
    count: isMoreEpic() ? 28 : 18,
    palette,
    power: isMoreEpic() ? 1.55 : 1.25,
    ttl: isMoreEpic() ? 0.85 : 0.65,
    spread: 1.35,
    width: isMoreEpic() ? 3.0 : 2.3,
    length: isMoreEpic() ? 420 : 320,
  });

  // Follow-up bursts + side cannons (big shapes, low count)
  window.setTimeout(() => {
    FX.burst(ox, oy, {
      count: Math.round((isMoreEpic() ? 140 : 95) * q),
      palette,
      power: isMoreEpic() ? 1.75 : 1.5,
      gravity: 2900,
      spread: 1.28,
      size: isMoreEpic() ? 1.22 : 1.10,
      ttl: isMoreEpic() ? 1.35 : 1.25,
    });
  }, 140);

  window.setTimeout(() => {
    FX.burst(70, window.innerHeight - 70, {
      count: Math.round((isMoreEpic() ? 90 : 60) * q),
      palette,
      power: 1.45,
      gravity: 3000,
      spread: 1.35,
      size: 1.12,
      ttl: 1.35,
    });
    FX.burst(window.innerWidth - 70, window.innerHeight - 70, {
      count: Math.round((isMoreEpic() ? 90 : 60) * q),
      palette,
      power: 1.45,
      gravity: 3000,
      spread: 1.35,
      size: 1.12,
      ttl: 1.35,
    });
  }, 230);

  // Storm (cheap illusion with limited count)
  window.setTimeout(() => {
    FX.storm({
      count: isMoreEpic() ? 420 : 260,
      palette,
      gravity: isMoreEpic() ? 3400 : 3000,
    });
  }, 300);

  // Extra halos for maximum overkill (cheap)
  epicHaloAt(ox, oy, bookRgb, 4, false);
  window.setTimeout(() => epicHaloAt(ox, oy, bookRgb, 4, false), 170);
  if (isMoreEpic()) window.setTimeout(() => epicHaloAt(ox, oy, bookRgb, 4, false), 360);

  // Banner (bigger, moving, stays longer)
  const banner = document.createElement("div");
  banner.className = "epic-banner epic-banner--mega" + (isMoreEpic() ? " epic-banner--more" : "");
  banner.textContent = "TRACKER FINISHED";
  const bannerMs = isMoreEpic() ? 7600 : 5600;
  banner.style.setProperty("--bannerDur", `${bannerMs}ms`);
  document.body.appendChild(banner);
  window.setTimeout(() => banner.remove(), bannerMs);
}

// --- (progress) ---
function toggleChapter(tracker, bookId, ch) {
  const b = BOOK_BY_ID.get(bookId);
  if (!b) return;
  if (ch < 1 || ch > b.chapters) return;

  const set = getReadSet(tracker, bookId);
  if (set.has(ch)) set.delete(ch);
  else set.add(ch);

  persistBookProgress(tracker, bookId, set);
}

function markAllChapters(tracker, bookId) {
  const b = BOOK_BY_ID.get(bookId);
  if (!b) return;

  const set = new Set();
  for (let i = 1; i <= b.chapters; i++) set.add(i);
  persistBookProgress(tracker, bookId, set);
}

function clearAllChapters(tracker, bookId) {
  persistBookProgress(tracker, bookId, new Set());
}

function persistBookProgress(tracker, bookId, set, opts = {}) {
  const { skipRerender = false } = opts;
  const b = BOOK_BY_ID.get(bookId);
  const max = b ? b.chapters : 9999;

  const arr = Array.from(set)
    .map(n => Number(n))
    .filter(n => Number.isFinite(n) && n >= 1 && n <= max)
    .sort((a, b2) => a - b2);

  // Optimistic local update
  const next = {
    ...tracker,
    progress: {
      ...(tracker.progress && typeof tracker.progress === "object" ? tracker.progress : {}),
      [bookId]: arr,
    }
  };
  trackersById.set(tracker.id, next);
  trackers = trackers.map(t => (t.id === tracker.id ? next : t));

  // Immediately update UI
  if (!skipRerender) {
    if (currentView === "book") renderBook();
    if (currentView === "tracker") renderTracker();
    if (currentView === "trackers") renderTrackers();
  }
  updateTopbar();

  // Persist to Firestore
  const ref = doc(db, "nt-365", currentUser.uid, "trackers", tracker.id);
  updateDoc(ref, {
    [`progress.${bookId}`]: arr,
    updatedAt: serverTimestamp()
  }).catch((err) => {
    console.error("Firestore update failed:", err);
  });
}

// --- Add Tracker ---
function buildAddTrackerUiOnce() {
  // Swatches
  const palette = generatePalette();
  colorSwatches.innerHTML = "";
  if (editColorSwatches) editColorSwatches.innerHTML = "";
  palette.forEach((hex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatchBtn";
    btn.dataset.color = hex;
    btn.style.background = hex;
    btn.title = hex;
    btn.setAttribute("aria-label", `Farbe ${hex}`);
    colorSwatches.appendChild(btn);

    // Edit view gets the same palette
    if (editColorSwatches) {
      const btn2 = btn.cloneNode(true);
      editColorSwatches.appendChild(btn2);
    }
  });

  // Book pickers
  buildBookPickGrid(pickGridOT, BOOKS.filter(b => b.testament === "ot"));
  buildBookPickGrid(pickGridNT, BOOKS.filter(b => b.testament === "nt"));

  // Defaults
  // Default: 16th color (dark blue / slightly violet) + whole bible
  draftColorHex = palette[15] || palette[0] || "#8cc0ff";
  setDraftScope("bible");
  setDraftColor(draftColorHex);

  trackerNameInput.value = "";
  updateAddTrackerUI();
}

function buildBookPickGrid(container, books) {
  container.innerHTML = "";
  books.forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pickBtn";
    btn.dataset.book = b.id;
    btn.textContent = b.short || b.name;

    // Per-book group color (unselected = SOFT_A, selected = STRONG_A)
    const rgb = bookGroupRgb(b.id);
    btn.style.setProperty("--bookSoft", rgba(rgb, SOFT_A));
    btn.style.setProperty("--bookStrong", rgba(rgb, STRONG_A));

    container.appendChild(btn);
  });
}

function openAddTracker() {
  // Reset draft
  draftScope = "bible";
  draftBookIds = new Set([...OT_BOOK_IDS, ...NT_BOOK_IDS]);
  const palette = Array.from(colorSwatches.querySelectorAll("[data-color]")).map(el => el.dataset.color);
  // Default: 16th color (index 15)
  draftColorHex = palette[15] || palette[0] || "#8cc0ff";

  trackerNameInput.value = "";
  addTrackerError.textContent = "";

  updateAddTrackerUI();
  setView("add");
}

function renderAddTrackerView() {
  updateAddTrackerUI();
}

function openEditTracker() {
  const t = getCurrentTracker();
  if (!t) return;

  editTrackerError.textContent = "";
  editTrackerName.value = String(t.name || "");
  editColorHex = isValidHexColor(t.color) ? t.color : (ui.lastTrackerColor || "#849eeb");
  editYearlyValue = !!t.yearly;

  if (editYearly) editYearly.checked = editYearlyValue;
  updateEditTrackerUI();
  setView("edit");
}

function renderEditTrackerView() {
  updateEditTrackerUI();
}

function setEditColor(hex) {
  if (!isValidHexColor(hex)) return;
  editColorHex = hex;
  updateEditTrackerUI();
}

function updateEditTrackerUI() {
  if (!editColorHex) editColorHex = ui.lastTrackerColor || "#849eeb";

  // Color swatches
  if (editColorSwatches) {
    editColorSwatches.querySelectorAll("[data-color]").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.color === editColorHex);
    });
  }

  const rgb = hexToRgb(editColorHex || "#cccccc");
  appEl.style.setProperty("--draftSoft", rgba(rgb, SOFT_A));
  appEl.style.setProperty("--draftStrong", rgba(rgb, STRONG_A));
  appEl.style.setProperty("--draftSuperSoft", rgba(rgb, SUPERSOFT_A));
}

async function confirmEditTracker() {
  const t = getCurrentTracker();
  if (!t) return;

  editTrackerError.textContent = "";
  const name = String(editTrackerName.value || "").trim();
  if (!name) {
    editTrackerError.textContent = "Name fehlt.";
    return;
  }
  if (!isValidHexColor(editColorHex)) {
    editTrackerError.textContent = "Ungültige Farbe.";
    return;
  }

  try {
    const ref = doc(db, "nt-365", currentUser.uid, "trackers", t.id);
    await updateDoc(ref, {
      name,
      color: editColorHex,
      yearly: !!editYearlyValue,
      updatedAt: serverTimestamp()
    });

    // Keep UI tint consistent
    ui.lastTrackerColor = editColorHex;
    saveUiState();
    applyAuthTheme();

    setView("tracker");
  } catch (err) {
    console.error("Tracker update failed:", err);
    editTrackerError.textContent = "Speichern fehlgeschlagen.";
  }
}

async function deleteTracker(trackerId) {
  if (!trackerId || !currentUser) return;
  try {
    const ref = doc(db, "nt-365", currentUser.uid, "trackers", trackerId);
    await deleteDoc(ref);
    currentTrackerId = null;
    currentBookId = null;
    setView("trackers");
  } catch (err) {
    console.error("Tracker delete failed:", err);
    if (editTrackerError) editTrackerError.textContent = "Löschen fehlgeschlagen.";
  }
}

function setDraftScope(scope) {
  const s = String(scope || "").toLowerCase();
  if (!["bible", "ot", "nt", "custom"].includes(s)) return;
  const prev = draftScope;
  draftScope = s;

  if (draftScope === "bible") draftBookIds = new Set([...OT_BOOK_IDS, ...NT_BOOK_IDS]);
  else if (draftScope === "ot") draftBookIds = new Set(OT_BOOK_IDS);
  else if (draftScope === "nt") draftBookIds = new Set(NT_BOOK_IDS);
  else if (draftScope === "custom" && prev !== "custom") {
    // Requirement: switching to "Bücher wählen" starts with nothing selected
    draftBookIds = new Set();
  }

  updateAddTrackerUI();
}

function setDraftColor(hex) {
  if (!isValidHexColor(hex)) return;
  draftColorHex = hex;
  updateAddTrackerUI();
}

function toggleDraftBook(bookId) {
  if (!BOOK_BY_ID.has(bookId)) return;
  if (draftBookIds.has(bookId)) draftBookIds.delete(bookId);
  else draftBookIds.add(bookId);
  updateAddTrackerUI();
}

function updateAddTrackerUI() {
  // Scope buttons
  scopeRow.querySelectorAll("[data-scope]").forEach((btn) => {
    const on = btn.dataset.scope === draftScope;
    btn.setAttribute("aria-checked", on ? "true" : "false");
  });

  // Book picker
  bookPicker.classList.toggle("hidden", draftScope !== "custom");

  // Book selection visual state
  bookPicker.querySelectorAll("[data-book]").forEach((btn) => {
    const on = draftBookIds.has(btn.dataset.book);
    btn.classList.toggle("selected", on);
  });

  // Summary
  // Hinweise/Counts sind bewusst entfernt (Start bei 0, weniger UI-Lärm)
  if (booksSummary) {
    booksSummary.textContent = "";
    booksSummary.classList.add("hidden");
  }

  // Color swatches
  colorSwatches.querySelectorAll("[data-color]").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.color === draftColorHex);
  });

  // Make pills & tiles reflect draft color (nice preview)
  const rgb = hexToRgb(draftColorHex || "#cccccc");
  const soft = rgba(rgb, SOFT_A);
  const strong = rgba(rgb, STRONG_A);
  const superSoft = rgba(rgb, SUPERSOFT_A);
  appEl.style.setProperty("--draftSoft", soft);
  appEl.style.setProperty("--draftStrong", strong);
  appEl.style.setProperty("--draftSuperSoft", superSoft);
  // Existing variables used across the app (pills)
  appEl.style.setProperty("--btnYearSoft", soft);
}

async function confirmAddTracker() {
  addTrackerError.textContent = "";

  const name = String(trackerNameInput.value || "").trim();
  if (!name) {
    addTrackerError.textContent = "Bitte einen Namen eingeben.";
    return;
  }

  if (!draftColorHex || !isValidHexColor(draftColorHex)) {
    addTrackerError.textContent = "Bitte eine Farbe auswählen.";
    return;
  }

  const bookIds = normalizeBookIds(Array.from(draftBookIds));
  if (bookIds.length < 1) {
    addTrackerError.textContent = "Bitte mindestens ein Buch auswählen.";
    return;
  }

  if (!currentUser) return;

  try {
    const ref = await addDoc(collection(db, "nt-365", currentUser.uid, "trackers"), {
      name,
      color: draftColorHex,
      yearly: false,
      year: new Date().getFullYear(),
      bookIds,
      progress: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    ui.lastTrackerColor = draftColorHex;
    currentTrackerId = ref.id;
    currentBookId = null;
    saveUiState();
    setView("tracker");
  } catch (err) {
    console.error("Tracker create failed:", err);
    addTrackerError.textContent = "Hinzufügen fehlgeschlagen.";
  }
}

// --- Stats helpers ---
function trackerYear(tracker) {
  const y = Number(tracker && tracker.year);
  if (Number.isFinite(y) && y >= 1900 && y <= 3000) return String(y);
  return String(new Date().getFullYear());
}

function normalizeBookIds(ids) {
  const arr = Array.isArray(ids) ? ids : [];
  const out = [];
  const seen = new Set();
  for (const id of arr) {
    const s = String(id || "").trim();
    if (!s) continue;
    if (!BOOK_BY_ID.has(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  // Keep canonical bible order
  const order = new Map(BOOKS.map((b, i) => [b.id, i]));
  out.sort((a, b) => (order.get(a) ?? 9999) - (order.get(b) ?? 9999));
  return out;
}

function trackerStats(tracker) {
  const ids = normalizeBookIds(tracker.bookIds);
  const totalBooks = ids.length;

  let totalCh = 0;
  let readCh = 0;
  let doneBooks = 0;

  for (const id of ids) {
    const b = BOOK_BY_ID.get(id);
    if (!b) continue;
    const s = getReadSet(tracker, id);
    totalCh += b.chapters;
    readCh += s.size;
    if (s.size >= b.chapters && b.chapters > 0) doneBooks += 1;
  }

  const pct = totalCh ? Math.round((readCh / totalCh) * 100) : 0;
  return { totalBooks, doneBooks, pct, totalCh, readCh };
}

function bookProgress(tracker, bookId) {
  const b = BOOK_BY_ID.get(bookId);
  if (!b) return 0;
  const read = getReadSet(tracker, bookId).size;
  return b.chapters ? (read / b.chapters) : 0;
}

function getReadSet(tracker, bookId) {
  const b = BOOK_BY_ID.get(bookId);
  const max = b ? b.chapters : 9999;
  const p = (tracker && tracker.progress && typeof tracker.progress === "object") ? tracker.progress : {};
  const arr = Array.isArray(p[bookId]) ? p[bookId] : [];
  const s = new Set();
  for (const v of arr) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1 && n <= max) s.add(n);
  }
  return s;
}

function getCurrentTracker() {
  if (!currentTrackerId) return null;
  return trackersById.get(currentTrackerId) || null;
}

// --- UI state persistence ---
function loadUiState() {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) {
      return {
        view: "trackers",
        currentTrackerId: null,
        currentBookId: null,
        lastTrackerColor: null,
        epicLevel: 0
      };
    }

    const obj = JSON.parse(raw);

    // Backward compatibility: older builds stored `epic: boolean`.
    const legacyEpic = obj && typeof obj.epic === "boolean" ? obj.epic : false;
    const lvl = (obj && typeof obj.epicLevel === "number")
      ? Math.max(0, Math.min(2, Math.round(obj.epicLevel)))
      : (legacyEpic ? 1 : 0);

    return {
      view: typeof obj.view === "string" ? obj.view : "trackers",
      currentTrackerId: typeof obj.currentTrackerId === "string" ? obj.currentTrackerId : null,
      currentBookId: typeof obj.currentBookId === "string" ? obj.currentBookId : null,
      lastTrackerColor: isValidHexColor(obj.lastTrackerColor) ? obj.lastTrackerColor : null,
      epicLevel: lvl,
      // keep legacy field so older logic (if any remains) doesn't explode
      epic: lvl > 0,
    };
  } catch {
    return { view: "trackers", currentTrackerId: null, currentBookId: null, lastTrackerColor: null, epicLevel: 0, epic: false };
  }
}

function saveUiState() {
  ui.view = currentView;
  ui.currentTrackerId = currentTrackerId;
  ui.currentBookId = currentBookId;
  // keep legacy flag in sync
  ui.epic = getEpicModeLevel() > 0;
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(ui));
}

// --- Color helpers ---
function rgba([r, g, b], a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function isValidHexColor(v) {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function hexToRgb(hex) {
  const h = String(hex || "").trim();
  if (!isValidHexColor(h)) return [200, 200, 200];
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return [r, g, b];
}

function generatePalette() {
  const hues = [];
  for (let h = 0; h < 360; h += 15) hues.push(h);
  return hues.map(h => rgbToHex(hslToRgb(h, 72, 72)));
}

function rgbToHex([r, g, b]) {
  const to = (x) => x.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;

  if (0 <= hh && hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (1 <= hh && hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (2 <= hh && hh < 3) [r1, g1, b1] = [0, c, x];
  else if (3 <= hh && hh < 4) [r1, g1, b1] = [0, x, c];
  else if (4 <= hh && hh < 5) [r1, g1, b1] = [x, 0, c];
  else if (5 <= hh && hh < 6) [r1, g1, b1] = [c, 0, x];

  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return [r, g, b];
}

function applyAuthTheme() {
  // Theme for login + auth buttons (Anmelden/Abmelden)
  const c = ui.lastTrackerColor || "#849eeb";
  const rgb = hexToRgb(c);
  document.documentElement.style.setProperty("--authSoft", rgba(rgb, SOFT_A));
  document.documentElement.style.setProperty("--authSuperSoft", rgba(rgb, SUPERSOFT_A));
  document.documentElement.style.setProperty("--authStrong", rgba(rgb, STRONG_A));
}

function updateMenuEpicLabel() {
  if (!btnMenuEpic) return;
  const lvl = getEpicModeLevel();
  btnMenuEpic.textContent = lvl === 0 ? "Epic: Aus" : (lvl === 1 ? "Epic: An" : "Epic: Mehr");
}

function openMenu() {
  if (!menuOverlay) return;
  menuOverlay.classList.remove("hidden");
  menuOverlay.setAttribute("aria-hidden", "false");
  updateMenuEpicLabel();
}

function closeMenu() {
  if (!menuOverlay) return;
  menuOverlay.classList.add("hidden");
  menuOverlay.setAttribute("aria-hidden", "true");
}

function toggleMenu() {
  if (!menuOverlay) return;
  if (menuOverlay.classList.contains("hidden")) openMenu();
  else closeMenu();
}

// --- Misc ---
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanAuthError(err) {
  const code = err && typeof err === "object" ? (err.code || "") : "";
  if (code === "auth/invalid-email") return "Ungültige E‑Mail.";
  if (code === "auth/user-not-found") return "Benutzer nicht gefunden.";
  if (code === "auth/wrong-password") return "Falsches Passwort.";
  if (code === "auth/too-many-requests") return "Zu viele Versuche. Später erneut.";
  if (code === "auth/network-request-failed") return "Netzwerkfehler.";
  if (code === "auth/invalid-credential") return "Login nicht möglich.";
  return "Login fehlgeschlagen.";
}
