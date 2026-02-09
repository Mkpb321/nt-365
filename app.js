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

  // Intensivere RGBs (direkt hier geändert)
  const GROUP_RGB = {
    "Evangelien": [140, 192, 255],
    "Geschichte": [122, 230, 185],
    "Paulusbriefe": [188, 150, 255],
    "Allgemeine Briefe": [255, 195, 120],
    "Prophetie": [255, 145, 195],
  };

  // Intensivere Palette für Jahre
  const YEAR_RGB = [
    [140, 192, 255],
    [120, 220, 255],
    [122, 230, 185],
    [120, 245, 150],
    [188, 150, 255],
    [220, 145, 255],
    [255, 195, 120],
    [255, 165, 120],
    [255, 145, 195],
    [255, 135, 160],
    [170, 155, 255],
    [155, 215, 255],
  ];

  const STRONG_A = 1; // gelesen
  const SOFT_A = 0.35;   // ungelesen

  // Deterministische Jahresfarbe: idx = (year mod N) * STEP mod N
  const YEAR_STEP = 5; // coprime with 12

  const $ = (sel) => document.querySelector(sel);

  const btnBack = $("#btnBack");
  const topTitle = $("#topTitle");
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
    if (currentView === "years") {
      topTitle.textContent = "NT 365";
      return;
    }

    if (currentView === "year") {
      const yp = Math.round(yearProgress(currentYear) * 100);
      topTitle.innerHTML = `${escapeHtml(currentYear)} <span class="meta">${yp}%</span>`;
      return;
    }

    if (currentView === "book") {
      const b = BOOKS.find(x => x.id === currentBookId);
      const short = b ? (BOOK_SHORT[b.id] || b.name) : "Buch";
      const read = b ? getReadSet(currentYear, currentBookId).size : 0;
      const total = b ? b.chapters : 0;
      topTitle.innerHTML = `${escapeHtml(short)} <span class="meta">${escapeHtml(currentYear)} · ${read}/${total}</span>`;
    }
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

  function yearPaletteIndex(yearNumber) {
    const n = YEAR_RGB.length;
    const y = Number(yearNumber);
    const mod = ((y % n) + n) % n;
    return (mod * YEAR_STEP) % n;
  }

  function yearRgbFor(yearNumber) {
    return YEAR_RGB[yearPaletteIndex(yearNumber)];
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
      const pct = Math.round(yearProgress(String(y)) * 100);

      const rgb = yearRgbFor(y);
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
            <div class="yearPct">${pct}%</div>
          </div>
        </div>
      `;
      btn.addEventListener("click", () => showYear(y));
      elYearsList.appendChild(btn);
    });
  }

  function renderYear(yearKey) {
    updateTopbar();
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
  }

  function updateYearUI() {
    if (!currentYear) return;
    updateTopbar();

    const tiles = booksGrid.querySelectorAll(".bookTile");
    tiles.forEach(tile => {
      const bookId = tile.dataset.book;
      const pct = Math.round(bookProgress(currentYear, bookId) * 100);
      tile.style.setProperty("--fillPct", `${pct}%`);
    });

    saveState();
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
  }

  function updateBookUI() {
    if (!currentYear || !currentBookId) return;
    updateTopbar();

    const readSet = getReadSet(currentYear, currentBookId);
    chaptersGrid.querySelectorAll(".chapterTile").forEach(tile => {
      const ch = Number(tile.dataset.ch);
      tile.classList.toggle("read", readSet.has(ch));
    });
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
