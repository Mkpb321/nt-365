// NT 365
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
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/**
 * Storage:
 * - Firestore: reading progress + which years exist
 *   /nt-365/{uid}/years/{YYYY}
 * - Browser (localStorage): UI/location only (last view/year/book + lastYear for colors)
 */

const ROOT_COLLECTION = "nt-365";
const UI_STORAGE_KEY = "nt365_ui_v1";

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

const BOOKS = [
  { id: "mat", name: "Matthäus", chapters: 28, group: "Evangelien" },
  { id: "mar", name: "Markus", chapters: 16, group: "Evangelien" },
  { id: "luk", name: "Lukas", chapters: 24, group: "Evangelien" },
  { id: "joh", name: "Johannes", chapters: 21, group: "Evangelien" },

  { id: "act", name: "Apostelgeschichte", chapters: 28, group: "Geschichte" },

  { id: "rom", name: "Römer", chapters: 16, group: "Paulusbriefe" },
  { id: "1co", name: "1. Korinther", chapters: 16, group: "Paulusbriefe" },
  { id: "2co", name: "2. Korinther", chapters: 13, group: "Paulusbriefe" },
  { id: "gal", name: "Galater", chapters: 6, group: "Paulusbriefe" },
  { id: "eph", name: "Epheser", chapters: 6, group: "Paulusbriefe" },
  { id: "phi", name: "Philipper", chapters: 4, group: "Paulusbriefe" },
  { id: "col", name: "Kolosser", chapters: 4, group: "Paulusbriefe" },
  { id: "1th", name: "1. Thessalonicher", chapters: 5, group: "Paulusbriefe" },
  { id: "2th", name: "2. Thessalonicher", chapters: 3, group: "Paulusbriefe" },
  { id: "1ti", name: "1. Timotheus", chapters: 6, group: "Paulusbriefe" },
  { id: "2ti", name: "2. Timotheus", chapters: 4, group: "Paulusbriefe" },
  { id: "tit", name: "Titus", chapters: 3, group: "Paulusbriefe" },
  { id: "phm", name: "Philemon", chapters: 1, group: "Paulusbriefe" },

  { id: "heb", name: "Hebräer", chapters: 13, group: "Allgemeine Briefe" },
  { id: "jam", name: "Jakobus", chapters: 5, group: "Allgemeine Briefe" },
  { id: "1pe", name: "1. Petrus", chapters: 5, group: "Allgemeine Briefe" },
  { id: "2pe", name: "2. Petrus", chapters: 3, group: "Allgemeine Briefe" },
  { id: "1jo", name: "1. Johannes", chapters: 5, group: "Allgemeine Briefe" },
  { id: "2jo", name: "2. Johannes", chapters: 1, group: "Allgemeine Briefe" },
  { id: "3jo", name: "3. Johannes", chapters: 1, group: "Allgemeine Briefe" },
  { id: "jud", name: "Judas", chapters: 1, group: "Allgemeine Briefe" },

  { id: "rev", name: "Offenbarung", chapters: 22, group: "Prophetie" },
];

const BOOK_SHORT = {
  mat: "Mt",
  mar: "Mk",
  luk: "Lk",
  joh: "Joh",
  act: "Apg",
  rom: "Röm",
  "1co": "1. Kor",
  "2co": "2. Kor",
  gal: "Gal",
  eph: "Eph",
  phi: "Phil",
  col: "Kol",
  "1th": "1. Thess",
  "2th": "2. Thess",
  "1ti": "1. Tim",
  "2ti": "2. Tim",
  tit: "Tit",
  phm: "Phlm",
  heb: "Hebr",
  jam: "Jak",
  "1pe": "1. Petr",
  "2pe": "2. Petr",
  "1jo": "1. Joh",
  "2jo": "2. Joh",
  "3jo": "3. Joh",
  jud: "Jud",
  rev: "Offb",
};

const GROUP_ORDER = ["Evangelien", "Geschichte", "Paulusbriefe", "Allgemeine Briefe", "Prophetie"];

// Intensivere RGBs (direkt geändert)
const GROUP_RGB = {
  "Evangelien": [140, 192, 255],
  "Geschichte": [122, 230, 185],
  "Paulusbriefe": [188, 150, 255],
  "Allgemeine Briefe": [255, 195, 120],
  "Prophetie": [255, 145, 195],
};

const STRONG_A = 1;     // gelesen
const SOFT_A = 0.35;    // ungelesen

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
const btnAddYear = $("#btnAddYear");
const btnLogout = $("#btnLogout");

const viewYears = $("#viewYears");
const viewYear = $("#viewYear");
const viewBook = $("#viewBook");

const elYearsList = $("#yearsList");
const booksGrid = $("#booksGrid");
const chaptersGrid = $("#chaptersGrid");
const btnMarkAll = $("#btnMarkAll");
const btnMarkNone = $("#btnMarkNone");

// Browser UI/location state (local only)
let ui = loadUiState();

// Firestore progress state (per-user)
let currentUid = null;
let unsubscribeYears = null;
let remote = { yearsOrder: [], years: {} }; // years: { [yearKey]: { [bookId]: number[] } }

// Navigation
let currentYear = null;
let currentBookId = null;
let currentView = "years"; // years | year | book
let uiWired = false;
let allowUiPersist = false;
let started = false;
let restoredAfterRemote = false;

setupAuth();

function setupAuth() {
  // Login submit
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

  // Logout
  btnLogout.addEventListener("click", async () => {
    try { await signOut(auth); } catch { /* ignore */ }
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      teardownUser();
      appEl.classList.add("hidden");
      loginView.classList.remove("hidden");
      loginError.textContent = "";
      return;
    }

    // signed in
    loginView.classList.add("hidden");
    appEl.classList.remove("hidden");
    startAppOnce(user.uid);
  });
}

function teardownUser() {
  if (typeof unsubscribeYears === "function") {
    try { unsubscribeYears(); } catch { /* ignore */ }
  }
  unsubscribeYears = null;
  currentUid = null;
  remote = { yearsOrder: [], years: {} };
  currentYear = null;
  currentBookId = null;
  currentView = "years";
  started = false;
  restoredAfterRemote = false;
  allowUiPersist = false;
}

function startAppOnce(uid) {
  if (started && currentUid === uid) {
    // still update header vars
    updateTopbar();
    setView(currentView);
    return;
  }

  started = true;
  currentUid = uid;

  // Wire UI interactions (once)
if (!uiWired) {
  btnAddYear.addEventListener("click", addYearFlow);
  btnBack.addEventListener("click", goBack);

  chaptersGrid.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-ch]");
    if (!tile || !currentYear || !currentBookId) return;
    const ch = Number(tile.dataset.ch);
    toggleChapter(currentYear, currentBookId, ch);
    updateBookUI();
    updateYearUI();
  });

  btnMarkAll.addEventListener("click", () => {
    if (!currentYear || !currentBookId) return;
    markAllChapters(currentYear, currentBookId);
    updateBookUI();
    updateYearUI();
  });

  btnMarkNone.addEventListener("click", () => {
    if (!currentYear || !currentBookId) return;
    clearAllChapters(currentYear, currentBookId);
    updateBookUI();
    updateYearUI();
  });

  // prevent zoom on double tap (best-effort)
  document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });

  uiWired = true;
}

  // Start with years view (empty until Firestore loads)
  setView("years");
  renderYears();

  // Subscribe to Firestore years; first snapshot will also restore UI state
  subscribeYears(uid);
}

function yearsCollectionRef(uid) {
  return collection(db, ROOT_COLLECTION, uid, "years");
}
function yearDocRef(uid, yearKey) {
  return doc(db, ROOT_COLLECTION, uid, "years", String(yearKey));
}

function subscribeYears(uid) {
  if (typeof unsubscribeYears === "function") {
    try { unsubscribeYears(); } catch { /* ignore */ }
  }

  unsubscribeYears = onSnapshot(
    yearsCollectionRef(uid),
    async (snap) => {
      const years = {};
      const yearsOrder = [];

      for (const d of snap.docs) {
        const yearKey = String(d.id);
        const data = d.data() || {};
        const books = (data.books && typeof data.books === "object") ? data.books : {};
        years[yearKey] = books;

        const yNum = Number(yearKey);
        if (Number.isFinite(yNum)) yearsOrder.push(yNum);
      }

      yearsOrder.sort((a, b) => a - b);
      remote = { yearsOrder, years };

      // If currentYear was deleted remotely -> go back to years
      if (currentYear && !remote.years[currentYear]) {
        currentYear = null;
        currentBookId = null;
        setView("years");
      }

      // First-time restore (after we have year list)
      if (!restoredAfterRemote) {
        restoredAfterRemote = true;
        restoreUiLocation();
      }

      refreshCurrentView();
    },
    (err) => {
      console.error("Firestore subscribe error:", err);
      // still try to render what we have (likely empty)
      refreshCurrentView();
    }
  );
}

function refreshCurrentView() {
  if (currentView === "years") {
    renderYears();
    return;
  }
  if (currentView === "year") {
    if (!currentYear) {
      setView("years");
      renderYears();
      return;
    }
    renderYear(currentYear);
    return;
  }
  if (currentView === "book") {
    if (!currentYear || !currentBookId) {
      setView("years");
      renderYears();
      return;
    }
    renderBook();
  }
}

function restoreUiLocation() {
  const desiredView = ui.view || "years";
  const y = ui.currentYear ? String(ui.currentYear) : null;
  const b = ui.currentBookId ? String(ui.currentBookId) : null;

  if (desiredView === "book" && y && b && remote.years[y]) {
    currentYear = y;
    currentBookId = b;
    setView("book");
    renderBook();
    allowUiPersist = true;
    persistUiLocation();
    return;
  }

  if ((desiredView === "year" || desiredView === "book") && y && remote.years[y]) {
    currentYear = y;
    currentBookId = null;
    setView("year");
    renderYear(y);
    allowUiPersist = true;
    persistUiLocation();
    return;
  }

  currentYear = null;
  currentBookId = null;
  setView("years");
  renderYears();
  allowUiPersist = true;
  persistUiLocation();
}

function persistUiLocation() {
  ui.view = currentView;
  ui.currentYear = currentYear;
  ui.currentBookId = currentBookId;
  saveUiState();
}

function setView(v) {
  currentView = v;

  viewYears.classList.toggle("hidden", v !== "years");
  viewYear.classList.toggle("hidden", v !== "year");
  viewBook.classList.toggle("hidden", v !== "book");

  btnBack.classList.toggle("hidden", v === "years");

  // Only on main page
  btnAddYear.classList.toggle("hidden", v !== "years");
  btnLogout.classList.toggle("hidden", v !== "years");

  if (allowUiPersist) persistUiLocation();
  updateTopbar();
}

function updateTopbar() {
  // Title always "NT 365"
  topTitle.textContent = "NT 365";

  // Defaults: years overview -> transparent bar
  let pct = 0;
  let barStrong = "transparent";
  let barSoft = "transparent";
  let btnYearSoft = "transparent";
  topSub.textContent = "";

  if (currentView === "year" && currentYear) {
    const yPct = Math.round(yearProgress(currentYear) * 100);
    const doneBooks = booksCompletedCount(currentYear);
    const rgb = yearRgbFor(Number(currentYear));
    pct = yPct;
    barStrong = rgba(rgb, STRONG_A);
    barSoft = rgba(rgb, SOFT_A);
    btnYearSoft = barSoft;
    topSub.textContent = `${currentYear} · ${doneBooks}/27 · ${yPct}%`;
  } else if (currentView === "book" && currentYear && currentBookId) {
    const b = BOOKS.find(x => x.id === currentBookId);
    const short = b ? (BOOK_SHORT[b.id] || b.name) : "Buch";
    const read = b ? getReadSet(currentYear, currentBookId).size : 0;
    const total = b ? b.chapters : 0;
    const bPct = total ? Math.round((read / total) * 100) : 0;

    const rgb = yearRgbFor(Number(currentYear));
    pct = bPct;
    barStrong = rgba(rgb, STRONG_A);
    barSoft = rgba(rgb, SOFT_A);
    btnYearSoft = barSoft;
    topSub.textContent = `${currentYear} · ${short} · ${read}/${total} · ${bPct}%`;
  }

  // + and logout button color (years view only): last clicked year in SOFT
  let addSoft = "var(--btnBg)";
  if (currentView === "years") {
    const y = ui.lastYear ? Number(ui.lastYear) : null;
    if (Number.isFinite(y)) addSoft = rgba(yearRgbFor(y), SOFT_A);
  }

  topbar.style.setProperty("--barStrong", barStrong);
  topbar.style.setProperty("--barSoft", barSoft);
  topbar.style.setProperty("--barPct", `${pct}%`);
  appEl.style.setProperty("--btnYearSoft", btnYearSoft);
  appEl.style.setProperty("--addSoft", addSoft);
}

function goBack() {
  if (currentView === "book") {
    currentBookId = null;
    setView("year");
    renderYear(currentYear);
    return;
  }
  if (currentView === "year") {
    currentYear = null;
    setView("years");
    renderYears();
  }
}

function rgba([r,g,b], a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Deterministic year color, avoid pink/magenta band.
function yearRgbFor(yearNumber) {
  const y = Number(yearNumber);
  let hue = ((y * 137.508) % 360 + 360) % 360;

  // Avoid pink/magenta (roughly 285..345°)
  if (hue >= 285 && hue <= 345) hue = (hue + 180) % 360;

  return hslToRgb(hue, 72, 72);
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2*l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1=0, g1=0, b1=0;

  if (0 <= hh && hh < 1) [r1,g1,b1] = [c,x,0];
  else if (1 <= hh && hh < 2) [r1,g1,b1] = [x,c,0];
  else if (2 <= hh && hh < 3) [r1,g1,b1] = [0,c,x];
  else if (3 <= hh && hh < 4) [r1,g1,b1] = [0,x,c];
  else if (4 <= hh && hh < 5) [r1,g1,b1] = [x,0,c];
  else if (5 <= hh && hh < 6) [r1,g1,b1] = [c,0,x];

  const m = l - c/2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return [r,g,b];
}

async function addYearFlow() {
  const input = prompt("Jahr hinzufügen (z.B. 2026):");
  if (!input) return;
  const y = Number(String(input).trim());
  if (!Number.isFinite(y) || y < 1900 || y > 3000) return;

  const yearKey = String(Math.trunc(y));
  if (!currentUid) return;

  // already exists -> just open it
  if (remote.years[yearKey]) {
    showYear(yearKey);
    return;
  }

  try {
    await setDoc(yearDocRef(currentUid, yearKey), {
      year: Math.trunc(y),
      books: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: false });

    // Snapshot will refresh lists. We can still navigate optimistically.
    showYear(yearKey);
  } catch (e) {
    console.error("Failed to create year:", e);
  }
}

function showYear(y) {
  currentYear = String(y);
  currentBookId = null;
  ui.lastYear = currentYear;
  saveUiState();
  setView("year");
  renderYear(currentYear);
}

function showBook(bookId) {
  currentBookId = bookId;
  setView("book");
  renderBook();
}

function renderYears() {
  elYearsList.innerHTML = "";
  const years = (remote.yearsOrder || []).slice().sort((a, b) => a - b);

  if (!years.length) {
    const hint = document.createElement("div");
    hint.className = "emptyHint";
    hint.textContent = "Noch keine Jahre – tippe auf ＋ um ein Jahr anzulegen.";
    elYearsList.appendChild(hint);
    updateTopbar();
    return;
  }

  years.forEach((y) => {
    const yearKey = String(y);
    const pct = Math.round(yearProgress(yearKey) * 100);
    const doneBooks = booksCompletedCount(yearKey);

    const rgb = yearRgbFor(Number(y));
    const fillStrong = rgba(rgb, STRONG_A);
    const fillSoft = rgba(rgb, SOFT_A);

    const btn = document.createElement("button");
    btn.className = "yearItem tile";
    btn.type = "button";
    btn.style.setProperty("--fillPct", `${pct}%`);
    btn.style.setProperty("--fillStrong", fillStrong);
    btn.style.setProperty("--fillSoft", fillSoft);

    btn.innerHTML = `
      <div class="tileBase" aria-hidden="true"></div>
      <div class="tileFill" aria-hidden="true"></div>
      <div class="tileContent">
        <div class="yearTop">
          <div class="yearLabel">${y}</div>
          <div class="yearPct">${pct}% · ${doneBooks}/27</div>
        </div>
      </div>
    `;
    btn.addEventListener("click", () => showYear(yearKey));
    elYearsList.appendChild(btn);
  });

  updateTopbar();
}

function renderYear(yearKey) {
  booksGrid.innerHTML = "";

  const orderedBooks = [];
  for (const groupName of GROUP_ORDER) {
    for (const b of BOOKS) if (b.group === groupName) orderedBooks.push(b);
  }

  orderedBooks.forEach((b) => {
    const pct = Math.round(bookProgress(yearKey, b.id) * 100);

    const rgb = GROUP_RGB[b.group] || [200, 200, 200];
    const fillStrong = rgba(rgb, STRONG_A);
    const fillSoft = rgba(rgb, SOFT_A);

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "bookTile tile";
    tile.dataset.book = b.id;
    tile.style.setProperty("--fillPct", `${pct}%`);
    tile.style.setProperty("--fillStrong", fillStrong);
    tile.style.setProperty("--fillSoft", fillSoft);

    const shortLabel = BOOK_SHORT[b.id] || b.name;

    tile.innerHTML = `
      <div class="tileBase" aria-hidden="true"></div>
      <div class="tileFill" aria-hidden="true"></div>
      <div class="tileContent">
        <div class="bookShort">${escapeHtml(shortLabel)}</div>
      </div>
    `;

    tile.addEventListener("click", () => showBook(b.id));
    booksGrid.appendChild(tile);
  });

  updateTopbar();
}

function updateYearUI() {
  if (!currentYear) return;

  const tiles = booksGrid.querySelectorAll(".bookTile");
  tiles.forEach(tile => {
    const bookId = tile.dataset.book;
    const pct = Math.round(bookProgress(currentYear, bookId) * 100);
    tile.style.setProperty("--fillPct", `${pct}%`);
  });

  updateTopbar();
}

function renderBook() {
  if (!currentYear || !currentBookId) return;

  const b = BOOKS.find(x => x.id === currentBookId);
  const rgb = b ? (GROUP_RGB[b.group] || [200,200,200]) : [200,200,200];

  const chStrong = rgba(rgb, STRONG_A);
  const chSoft = rgba(rgb, SOFT_A);

  chaptersGrid.style.setProperty("--chSoft", chSoft);
  chaptersGrid.style.setProperty("--chStrong", chStrong);

  chaptersGrid.innerHTML = "";
  const readSet = getReadSet(currentYear, currentBookId);

  const total = b.chapters;
  for (let ch = 1; ch <= total; ch++) {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "chapterTile" + (readSet.has(ch) ? " read" : "");
    t.dataset.ch = String(ch);
    t.textContent = String(ch);
    chaptersGrid.appendChild(t);
  }

  updateBookUI();
  updateTopbar();
}

function updateBookUI() {
  if (!currentYear || !currentBookId) return;

  const readSet = getReadSet(currentYear, currentBookId);
  chaptersGrid.querySelectorAll(".chapterTile").forEach(tile => {
    const ch = Number(tile.dataset.ch);
    tile.classList.toggle("read", readSet.has(ch));
  });

  updateTopbar();
}

function booksCompletedCount(yearKey) {
  let done = 0;
  for (const b of BOOKS) {
    if (getReadSet(yearKey, b.id).size >= b.chapters) done += 1;
  }
  return done;
}

function yearProgress(yearKey) {
  const total = totalChapters();
  let read = 0;
  for (const b of BOOKS) read += getReadSet(yearKey, b.id).size;
  return total === 0 ? 0 : read / total;
}

function bookProgress(yearKey, bookId) {
  const b = BOOKS.find(x => x.id === bookId);
  if (!b) return 0;
  const read = getReadSet(yearKey, bookId).size;
  return b.chapters === 0 ? 0 : read / b.chapters;
}

function totalChapters() {
  return BOOKS.reduce((sum, b) => sum + b.chapters, 0);
}

function getReadSet(yearKey, bookId) {
  const y = remote.years && remote.years[yearKey] ? remote.years[yearKey] : {};
  const arr = Array.isArray(y[bookId]) ? y[bookId] : [];
  const b = BOOKS.find(x => x.id === bookId);
  const max = b ? b.chapters : 9999;

  const s = new Set();
  for (const v of arr) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1 && n <= max) s.add(n);
  }
  return s;
}

function setReadSetLocal(yearKey, bookId, set) {
  const arr = Array.from(set).sort((a, b) => a - b);
  remote.years = remote.years || {};
  remote.years[yearKey] = remote.years[yearKey] || {};
  remote.years[yearKey][bookId] = arr;
}

async function toggleChapter(yearKey, bookId, ch) {
  if (!currentUid) return;
  const s = getReadSet(yearKey, bookId);
  const has = s.has(ch);
  if (has) s.delete(ch); else s.add(ch);

  // optimistic local update
  setReadSetLocal(yearKey, bookId, s);

  try {
    await updateDoc(yearDocRef(currentUid, yearKey), {
      [`books.${bookId}`]: has ? arrayRemove(ch) : arrayUnion(ch),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to toggle chapter:", e);
  }
}

async function markAllChapters(yearKey, bookId) {
  if (!currentUid) return;
  const b = BOOKS.find(x => x.id === bookId);
  if (!b) return;

  const all = [];
  for (let i = 1; i <= b.chapters; i++) all.push(i);

  // optimistic local update
  setReadSetLocal(yearKey, bookId, new Set(all));

  try {
    await updateDoc(yearDocRef(currentUid, yearKey), {
      [`books.${bookId}`]: all,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to mark all chapters:", e);
  }
}

async function clearAllChapters(yearKey, bookId) {
  if (!currentUid) return;

  // optimistic local update
  setReadSetLocal(yearKey, bookId, new Set());

  try {
    await updateDoc(yearDocRef(currentUid, yearKey), {
      [`books.${bookId}`]: [],
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to clear chapters:", e);
  }
}

function loadUiState() {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return {
      view: "years",
      currentYear: null,
      currentBookId: null,
      lastYear: null,
    };
    const obj = JSON.parse(raw);
    return {
      view: (obj && typeof obj.view === "string") ? obj.view : "years",
      currentYear: (obj && (typeof obj.currentYear === "string" || typeof obj.currentYear === "number"))
        ? String(obj.currentYear)
        : null,
      currentBookId: (obj && typeof obj.currentBookId === "string") ? obj.currentBookId : null,
      lastYear: (obj && (typeof obj.lastYear === "string" || typeof obj.lastYear === "number"))
        ? String(obj.lastYear)
        : null,
    };
  } catch {
    return {
      view: "years",
      currentYear: null,
      currentBookId: null,
      lastYear: null,
    };
  }
}

function saveUiState() {
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(ui));
}

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
