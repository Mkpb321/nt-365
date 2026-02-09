(() => {
  const STORAGE_KEY = "nt_reading_tracker_v2";

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

  // Wie vorgegeben
  const STRONG_A = 1; // gelesen
  const SOFT_A = 0.35;   // ungelesen

  const $ = (sel) => document.querySelector(sel);

  const topbar = $("#topbar");
  const btnBack = $("#btnBack");
  const topTitle = $("#topTitle");
  const topSub = $("#topSub");
  const btnAddYear = $("#btnAddYear");

  const viewYears = $("#viewYears");
  const viewYear = $("#viewYear");
  const viewBook = $("#viewBook");

  const elYearsList = $("#yearsList");
  const booksGrid = $("#booksGrid");
  const chaptersGrid = $("#chaptersGrid");
  const btnMarkAll = $("#btnMarkAll");
  const btnMarkNone = $("#btnMarkNone");

  let state = loadState();
  let currentYear = null;
  let currentBookId = null;
  let currentView = "years"; // years | year | book

  init();

  function init() {
    ensureDefaultYears();
    renderYears();
    setView("years");

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

    // prevent zoom on double tap (best-effort); we already set touch-action, but block dblclick too
    document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
  }

  function setView(v) {
    currentView = v;

    viewYears.classList.toggle("hidden", v !== "years");
    viewYear.classList.toggle("hidden", v !== "year");
    viewBook.classList.toggle("hidden", v !== "book");

    btnBack.classList.toggle("hidden", v === "years");
    btnAddYear.classList.toggle("hidden", v !== "years");

    updateTopbar();
  }

  function updateTopbar() {
    // Title always "NT 365"
    topTitle.textContent = "NT 365";

    // Default: years overview -> transparent bar
    let pct = 0;
    let barStrong = "transparent";
    let barSoft = "transparent";
    topSub.textContent = "";

    if (currentView === "year" && currentYear) {
      const yPct = Math.round(yearProgress(currentYear) * 100);
      const doneBooks = booksCompletedCount(currentYear);
      const rgb = yearRgbFor(Number(currentYear));
      pct = yPct;
      barStrong = rgba(rgb, STRONG_A);
      barSoft = rgba(rgb, SOFT_A);
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
      topSub.textContent = `${currentYear} · ${short} · ${read}/${total} · ${bPct}%`;
    }

    topbar.style.setProperty("--barStrong", barStrong);
    topbar.style.setProperty("--barSoft", barSoft);
    topbar.style.setProperty("--barPct", `${pct}%`);
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

  // Deterministic year color with minimal repeats:
  // Use golden-angle hue stepping -> adjacent years far apart.
    function yearRgbFor(yearNumber) {
    const y = Number(yearNumber);
    // Golden-angle distribution -> adjacent years differ strongly
    let hue = ((y * 137.508) % 360 + 360) % 360;

    // Avoid pink/magenta band (roughly 285..345 deg)
    if (hue >= 285 && hue <= 345) hue = (hue + 180) % 360;

    // Pastel-but-intense: high saturation + high lightness
    return hslToRgb(hue, 72, 72);
  }

  function hslToRgb(h, s, l) {
    // h [0..360), s/l [0..100]
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

  function ensureDefaultYears() {
    if (!state.yearsOrder || !Array.isArray(state.yearsOrder) || state.yearsOrder.length === 0) {
      const now = new Date();
      const y = now.getFullYear();
      state.yearsOrder = [y - 2, y - 1, y, y + 1, y + 2];
      state.years = state.years || {};
      for (const yy of state.yearsOrder) state.years[String(yy)] = state.years[String(yy)] || {};
      saveState();
    } else {
      state.years = state.years || {};
      for (const yy of state.yearsOrder) state.years[String(yy)] = state.years[String(yy)] || {};
      saveState();
    }
  }

  function addYearFlow() {
    const input = prompt("Jahr hinzufügen (z.B. 2026):");
    if (!input) return;
    const y = Number(String(input).trim());
    if (!Number.isFinite(y) || y < 1900 || y > 3000) return;

    const key = String(y);
    state.years = state.years || {};
    state.yearsOrder = state.yearsOrder || [];

    if (!state.yearsOrder.includes(y)) state.yearsOrder.push(y);
    state.yearsOrder.sort((a, b) => a - b);

    state.years[key] = state.years[key] || {};
    saveState();
    renderYears();
  }

  function showYear(y) {
    currentYear = String(y);
    currentBookId = null;
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
    const years = (state.yearsOrder || []).slice().sort((a, b) => a - b);

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
      btn.addEventListener("click", () => showYear(y));
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

    saveState();
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
    state.years = state.years || {};
    state.years[yearKey] = state.years[yearKey] || {};
    const arr = state.years[yearKey][bookId] || [];
    const b = BOOKS.find(x => x.id === bookId);
    const max = b ? b.chapters : 9999;
    const s = new Set();
    for (const v of arr) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= max) s.add(n);
    }
    return s;
  }

  function setReadSet(yearKey, bookId, set) {
    state.years = state.years || {};
    state.years[yearKey] = state.years[yearKey] || {};
    const arr = Array.from(set).sort((a, b) => a - b);
    state.years[yearKey][bookId] = arr;
    saveState();
  }

  function toggleChapter(yearKey, bookId, ch) {
    const s = getReadSet(yearKey, bookId);
    if (s.has(ch)) s.delete(ch);
    else s.add(ch);
    setReadSet(yearKey, bookId, s);
  }

  function markAllChapters(yearKey, bookId) {
    const b = BOOKS.find(x => x.id === bookId);
    if (!b) return;
    const s = new Set();
    for (let i = 1; i <= b.chapters; i++) s.add(i);
    setReadSet(yearKey, bookId, s);
  }

  function clearAllChapters(yearKey, bookId) {
    setReadSet(yearKey, bookId, new Set());
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { yearsOrder: [], years: {} };
      const obj = JSON.parse(raw);
      return {
        yearsOrder: Array.isArray(obj.yearsOrder) ? obj.yearsOrder : [],
        years: obj.years && typeof obj.years === "object" ? obj.years : {}
      };
    } catch {
      return { yearsOrder: [], years: {} };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
