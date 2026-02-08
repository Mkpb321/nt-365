(() => {
  const STORAGE_KEY = "nt_reading_tracker_v2";

  // Neues Testament: Buch + Kapitelanzahl
  const BOOKS = [
    // Evangelien
    { id: "mat", name: "Matthäus", chapters: 28, group: "Evangelien" },
    { id: "mar", name: "Markus", chapters: 16, group: "Evangelien" },
    { id: "luk", name: "Lukas", chapters: 24, group: "Evangelien" },
    { id: "joh", name: "Johannes", chapters: 21, group: "Evangelien" },

    // Geschichte
    { id: "act", name: "Apostelgeschichte", chapters: 28, group: "Geschichte" },

    // Paulusbriefe
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

    // Allgemeine Briefe
    { id: "heb", name: "Hebräer", chapters: 13, group: "Allgemeine Briefe" },
    { id: "jam", name: "Jakobus", chapters: 5, group: "Allgemeine Briefe" },
    { id: "1pe", name: "1. Petrus", chapters: 5, group: "Allgemeine Briefe" },
    { id: "2pe", name: "2. Petrus", chapters: 3, group: "Allgemeine Briefe" },
    { id: "1jo", name: "1. Johannes", chapters: 5, group: "Allgemeine Briefe" },
    { id: "2jo", name: "2. Johannes", chapters: 1, group: "Allgemeine Briefe" },
    { id: "3jo", name: "3. Johannes", chapters: 1, group: "Allgemeine Briefe" },
    { id: "jud", name: "Judas", chapters: 1, group: "Allgemeine Briefe" },

    // Prophetie
    { id: "rev", name: "Offenbarung", chapters: 22, group: "Prophetie" },
  ];

  const GROUP_ORDER = ["Evangelien", "Geschichte", "Paulusbriefe", "Allgemeine Briefe", "Prophetie"];

  // 1 Pastellfarbe pro Kategorie (Bücher)
  const GROUP_COLORS = {
    "Evangelien": "rgba(205, 228, 255, .70)",        // pastel blau
    "Geschichte": "rgba(209, 245, 224, .70)",        // pastel mint
    "Paulusbriefe": "rgba(233, 220, 255, .70)",      // pastel violett
    "Allgemeine Briefe": "rgba(255, 232, 210, .70)", // pastel apricot
    "Prophetie": "rgba(255, 220, 236, .70)",         // pastel pink
  };

  // Jahre ebenfalls farbig (rotierend)
  const YEAR_COLORS = [
    "rgba(205, 228, 255, .75)",
    "rgba(209, 245, 224, .75)",
    "rgba(233, 220, 255, .75)",
    "rgba(255, 232, 210, .75)",
    "rgba(255, 220, 236, .75)",
    "rgba(225, 235, 255, .75)",
  ];

  const $ = (sel) => document.querySelector(sel);

  const elYearsList = $("#yearsList");
  const viewYears = $("#viewYears");
  const viewYear = $("#viewYear");
  const btnAddYear = $("#btnAddYear");
  const btnBackToYears = $("#btnBackToYears");

  const yearTitle = $("#yearTitle");
  const yearMeta = $("#yearMeta");
  const yearProgressFill = $("#yearProgressFill");
  const booksGrid = $("#booksGrid");

  const overlay = $("#overlay");
  const btnCloseOverlay = $("#btnCloseOverlay");
  const overlayBookTitle = $("#overlayBookTitle");
  const overlayBookMeta = $("#overlayBookMeta");
  const chaptersGrid = $("#chaptersGrid");
  const btnMarkAll = $("#btnMarkAll");
  const btnMarkNone = $("#btnMarkNone");

  let state = loadState();
  let currentYear = null;
  let currentBookId = null;

  init();

  function init() {
    ensureDefaultYears();
    renderYears();

    btnAddYear.addEventListener("click", addYearFlow);
    btnBackToYears.addEventListener("click", () => {
      currentYear = null;
      showYears();
    });

    btnCloseOverlay.addEventListener("click", closeOverlay);

    chaptersGrid.addEventListener("click", (e) => {
      const tile = e.target.closest("[data-ch]");
      if (!tile || !currentYear || !currentBookId) return;
      const ch = Number(tile.dataset.ch);
      toggleChapter(currentYear, currentBookId, ch);
      updateOverlayUI();
      updateYearUI();
    });

    btnMarkAll.addEventListener("click", () => {
      if (!currentYear || !currentBookId) return;
      markAllChapters(currentYear, currentBookId);
      updateOverlayUI();
      updateYearUI();
    });

    btnMarkNone.addEventListener("click", () => {
      if (!currentYear || !currentBookId) return;
      clearAllChapters(currentYear, currentBookId);
      updateOverlayUI();
      updateYearUI();
    });

    showYears();
  }

  function ensureDefaultYears() {
    if (!state.yearsOrder || !Array.isArray(state.yearsOrder) || state.yearsOrder.length === 0) {
      const now = new Date();
      const y = now.getFullYear();
      state.yearsOrder = [y - 2, y - 1, y, y + 1, y + 2];
      state.years = state.years || {};
      for (const yy of state.yearsOrder) {
        state.years[String(yy)] = state.years[String(yy)] || {};
      }
      saveState();
    } else {
      state.years = state.years || {};
      for (const yy of state.yearsOrder) {
        state.years[String(yy)] = state.years[String(yy)] || {};
      }
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

  function showYears() {
    viewYear.classList.add("hidden");
    viewYears.classList.remove("hidden");
    renderYears();
  }

  function showYear(y) {
    currentYear = String(y);
    viewYears.classList.add("hidden");
    viewYear.classList.remove("hidden");
    renderYear(currentYear);
  }

  function openBook(bookId) {
    currentBookId = bookId;
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    renderOverlay();
  }

  function closeOverlay() {
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
    currentBookId = null;
  }

  function renderYears() {
    elYearsList.innerHTML = "";
    const years = (state.yearsOrder || []).slice().sort((a, b) => a - b);

    years.forEach((y, idx) => {
      const pct = Math.round(yearProgress(String(y)) * 100);
      const btn = document.createElement("button");
      btn.className = "yearItem";
      btn.type = "button";

      // Jahre farbig
      btn.style.background = YEAR_COLORS[idx % YEAR_COLORS.length];

      btn.innerHTML = `
        <div class="yearTop">
          <div class="yearLabel">${y}</div>
          <div class="yearPct">${pct}%</div>
        </div>
        <div class="progressTrack" aria-hidden="true">
          <div class="progressFill" style="width:${pct}%"></div>
        </div>
      `;
      btn.addEventListener("click", () => showYear(y));
      elYearsList.appendChild(btn);
    });
  }

  function renderYear(yearKey) {
    yearTitle.textContent = yearKey;
    booksGrid.innerHTML = "";

    // Alle Bücher in einem Grid, in Gruppenreihenfolge (Farbe wechselt, wenn Gruppe wechselt)
    const orderedBooks = [];
    for (const groupName of GROUP_ORDER) {
      for (const b of BOOKS) {
        if (b.group === groupName) orderedBooks.push(b);
      }
    }

    orderedBooks.forEach((b) => {
      const pct = Math.round(bookProgress(yearKey, b.id) * 100);
      const read = getReadSet(yearKey, b.id).size;

      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "bookTile";
      tile.dataset.book = b.id;

      tile.style.background = GROUP_COLORS[b.group] || "rgba(230,230,230,.70)";

      tile.innerHTML = `
        <div class="bookName">${escapeHtml(b.name)}</div>
        <div class="bookMetaRow">
          <div class="bookPct">${pct}%</div>
          <div class="bookCh">${read}/${b.chapters}</div>
        </div>
        <div class="bookBar" aria-hidden="true">
          <div class="bookBarFill" style="width:${pct}%"></div>
        </div>
      `;

      tile.addEventListener("click", () => openBook(b.id));
      booksGrid.appendChild(tile);
    });

    updateYearUI();
  }

  function updateYearUI() {
    if (!currentYear) return;

    const yp = Math.round(yearProgress(currentYear) * 100);
    yearMeta.textContent = `${yp}% gelesen`;
    yearProgressFill.style.width = `${yp}%`;

    // Update book tiles in the year view
    const tiles = booksGrid.querySelectorAll(".bookTile");
    tiles.forEach(tile => {
      const bookId = tile.dataset.book;
      const b = BOOKS.find(x => x.id === bookId);
      if (!b) return;

      const pct = Math.round(bookProgress(currentYear, bookId) * 100);
      const read = getReadSet(currentYear, bookId).size;

      tile.querySelector(".bookPct").textContent = `${pct}%`;
      tile.querySelector(".bookCh").textContent = `${read}/${b.chapters}`;
      tile.querySelector(".bookBarFill").style.width = `${pct}%`;
    });

    saveState();
  }

  function renderOverlay() {
    if (!currentYear || !currentBookId) return;

    const b = BOOKS.find(x => x.id === currentBookId);
    overlayBookTitle.textContent = b ? b.name : "Buch";

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

    updateOverlayUI();
  }

  function updateOverlayUI() {
    if (!currentYear || !currentBookId) return;

    const b = BOOKS.find(x => x.id === currentBookId);
    const read = getReadSet(currentYear, currentBookId).size;
    const pct = Math.round((read / b.chapters) * 100);

    overlayBookMeta.textContent = `${pct}% · ${read}/${b.chapters} Kapitel`;

    const readSet = getReadSet(currentYear, currentBookId);
    chaptersGrid.querySelectorAll(".chapterTile").forEach(tile => {
      const ch = Number(tile.dataset.ch);
      tile.classList.toggle("read", readSet.has(ch));
    });
  }

  function yearProgress(yearKey) {
    const total = totalChapters();
    let read = 0;
    for (const b of BOOKS) {
      read += getReadSet(yearKey, b.id).size;
    }
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
