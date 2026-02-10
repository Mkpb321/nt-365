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
const btnLogout = $("#btnLogout");

const viewTrackers = $("#viewTrackers");
const viewAddTracker = $("#viewAddTracker");
const viewTracker = $("#viewTracker");
const viewBook = $("#viewBook");

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

// Add tracker draft state
let draftScope = "bible"; // bible | ot | nt | custom
let draftBookIds = new Set([...OT_BOOK_IDS, ...NT_BOOK_IDS]);
let draftColorHex = null;

setupAuth();

function setupAuth() {
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

  btnLogout.addEventListener("click", async () => {
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

      appEl.classList.add("hidden");
      loginView.classList.remove("hidden");
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

  btnBack.addEventListener("click", goBack);

  // Chapters click
  chaptersGrid.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-ch]");
    if (!tile) return;
    const ch = Number(tile.dataset.ch);
    if (!Number.isFinite(ch)) return;
    const tracker = getCurrentTracker();
    if (!tracker || !currentBookId) return;

    toggleChapter(tracker, currentBookId, ch);
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

  viewTrackers.classList.toggle("hidden", v !== "trackers");
  viewAddTracker.classList.toggle("hidden", v !== "add");
  viewTracker.classList.toggle("hidden", v !== "tracker");
  viewBook.classList.toggle("hidden", v !== "book");

  // Back button: show for tracker + book (not for add, because it has bottom cancel)
  btnBack.classList.toggle("hidden", v === "trackers" || v === "add");

  // Only on home
  btnAddTracker.classList.toggle("hidden", v !== "trackers");
  btnLogout.classList.toggle("hidden", v !== "trackers");

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

// --- Firestore writes (progress) ---
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

function persistBookProgress(tracker, bookId, set) {
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
  if (currentView === "book") renderBook();
  if (currentView === "tracker") renderTracker();
  if (currentView === "trackers") renderTrackers();
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
  palette.forEach((hex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatchBtn";
    btn.dataset.color = hex;
    btn.style.background = hex;
    btn.title = hex;
    btn.setAttribute("aria-label", `Farbe ${hex}`);
    colorSwatches.appendChild(btn);
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
    if (!raw) return { view: "trackers", currentTrackerId: null, currentBookId: null, lastTrackerColor: null };
    const obj = JSON.parse(raw);
    return {
      view: typeof obj.view === "string" ? obj.view : "trackers",
      currentTrackerId: typeof obj.currentTrackerId === "string" ? obj.currentTrackerId : null,
      currentBookId: typeof obj.currentBookId === "string" ? obj.currentBookId : null,
      lastTrackerColor: isValidHexColor(obj.lastTrackerColor) ? obj.lastTrackerColor : null,
    };
  } catch {
    return { view: "trackers", currentTrackerId: null, currentBookId: null, lastTrackerColor: null };
  }
}

function saveUiState() {
  ui.view = currentView;
  ui.currentTrackerId = currentTrackerId;
  ui.currentBookId = currentBookId;
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
