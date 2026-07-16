/* ==========================================================================
   CONVENTIONAL — VOLUME 1 / LOST AND FOUND
   Tutte le interazioni funzionano senza GSAP; il livello motion è un'aggiunta.
   ========================================================================== */
(() => {
  "use strict";

  const data = window.CONVENTIONAL_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)").matches;

  const TONES = { casa: "blue", abitudine: "lilac", oggetti: "olive", digitale: "ink", assenza: "paper", corpo: "lilac" };
  const toneOf = item => TONES[(item.category || "").toLowerCase()] || "blue";

  const featuredIndexes = [0, 2, 3, 4, 9];
  const wearIndexes = [0, 1, 4, 7, 11];
  const wearTones = ["blue", "lilac", "olive", "paper", "blue"];

  const state = {
    coverActivated: false,
    selectedNotes: new Set(),
    guidedIndex: 0,
    guidedRead: new Set(),
    currentTrace: 0,
    visitedRooms: [],
    currentRoom: null,
    currentGesture: 0,
    scannerFound: new Set(),
    currentScanner: null,
    answers: {},
    answerLabels: {},
    currentQuestion: 0,
    furthestQuestion: 0,
    completed: false
  };

  const pad = n => String(n).padStart(2, "0");
  const shortText = (text, limit = 90) => text.length > limit ? text.slice(0, limit - 1).trim() + "…" : text;
  const motionAvailable = () => Boolean(window.gsap && window.ScrollTrigger) && !reducedMotion.matches;

  let motionMedia = null;
  let updateHouseRoute = () => {};
  let setGestureIndex = () => {};
  let refreshTimer = 0;
  const scheduleRefresh = (delay = 120) => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => window.ScrollTrigger?.refresh(), delay);
  };

  function pulse(element, className = "is-updating") {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  if (!data) {
    console.warn("[Conventional] data.js non disponibile: le sezioni dinamiche non verranno renderizzate.");
    document.documentElement.classList.add("no-data");
  }

  /* ------------------------------------------------------------------
     Copertina: impronta che rivela il titolo.
     Fallback: lo scroll oltre la metà della copertina attiva comunque.
  ------------------------------------------------------------------ */
  const cover = $("#cover");
  const plate = $("#fingerprintPlate");
  let platePressed = false;

  function activateCover() {
    if (state.coverActivated) return;
    state.coverActivated = true;
    cover.classList.add("is-activated");
    plate.classList.remove("is-pressing");
    plate.classList.add("is-imprinted");
    plate.setAttribute("aria-pressed", "true");
    plate.setAttribute("aria-label", "Impronta registrata: il volume è aperto");
    $(".fingerprint-plate__label", plate).textContent = "Impronta registrata";
    $("#coverState").textContent = "Superficie / Touched";
  }

  plate.addEventListener("pointerdown", event => {
    if (event.button != null && event.button !== 0) return;
    platePressed = true;
    plate.classList.add("is-pressing");
    if (event.pointerId != null) plate.setPointerCapture?.(event.pointerId);
  });
  plate.addEventListener("pointerup", () => { if (platePressed) { platePressed = false; activateCover(); } });
  plate.addEventListener("pointercancel", () => { platePressed = false; plate.classList.remove("is-pressing"); });
  plate.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) { event.preventDefault(); plate.classList.add("is-pressing"); }
  });
  plate.addEventListener("keyup", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activateCover(); }
  });

  /* ------------------------------------------------------------------
     Header: compatto dopo la copertina + barra di avanzamento.
  ------------------------------------------------------------------ */
  const header = $("#siteHeader");
  const headerProgress = $("#headerProgress");
  const chapterProgress = $("#chapterProgress");

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    headerProgress.style.transform = `scaleX(${progress})`;
    if (chapterProgress) chapterProgress.style.transform = `scaleY(${progress})`;
    header.classList.toggle("is-compact", scrollY > innerHeight * .55);
    if (!state.coverActivated && scrollY > cover.offsetHeight * .45) activateCover();
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Navigazione capitoli: osservatore di posizione.
  ------------------------------------------------------------------ */
  const folio = $("#headerFolio");
  const chapterObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const chapter = visible.target.dataset.chapter;
    folio.textContent = visible.target.dataset.chapterLabel || "Copertina";
    $$("[data-nav-chapter]").forEach(link =>
      link.classList.toggle("is-active", link.dataset.navChapter === chapter));
  }, { rootMargin: "-30% 0px -55%", threshold: [0, .12, .35] });
  $$(".chapter-act").forEach(section => chapterObserver.observe(section));
  chapterObserver.observe(cover);

  if (data) {

    /* ---------------- 01.2 Field notes (max 3) ---------------- */
    const notesField = $("#notesField");
    const notesCounter = $("#notesCounter");
    notesField.innerHTML = data.notes.map((note, i) =>
      `<button class="field-note" type="button" data-note="${i}" aria-pressed="false">
        <span>FN.${pad(i + 1)}</span><p>${note}</p>
      </button>`).join("");

    function updateNotesCounter() {
      notesCounter.textContent = `${state.selectedNotes.size} / 3 selezionate`;
    }
    notesField.addEventListener("click", event => {
      const note = event.target.closest(".field-note");
      if (!note) return;
      const index = Number(note.dataset.note);
      if (state.selectedNotes.has(index)) {
        state.selectedNotes.delete(index);
        note.classList.remove("is-selected");
        note.setAttribute("aria-pressed", "false");
      } else if (state.selectedNotes.size < 3) {
        state.selectedNotes.add(index);
        note.classList.add("is-selected");
        note.setAttribute("aria-pressed", "true");
      } else {
        pulse(notesField, "is-at-limit");
      }
      updateNotesCounter();
      updateReceiptEvidence();
    });

    /* ---------------- 01.3 Lettura guidata ---------------- */
    const guidedStage = $("#guidedStage");
    const guidedCounter = $("#guidedCounter");
    const guidedPrev = $("#guidedPrev");
    const guidedNext = $("#guidedNext");

    guidedStage.innerHTML = featuredIndexes.map((dataIndex, position) => {
      const item = data.inventory[dataIndex];
      return `<article class="guided-card" data-guided="${position}" data-tone="${toneOf(item)}">
        <div class="guided-card__meta">
          <span>Reperto ${item.number} · ${item.category}</span>
          <span>Lettura guidata · ${pad(position + 1)} / ${pad(featuredIndexes.length)}</span>
        </div>
        <div class="guided-card__media" aria-hidden="true">
          <span class="media-number">${item.number}</span>
          <span class="media-caption">Fig. ${pad(position + 1)}<br>Forma prodotta dall'uso</span>
        </div>
        <div class="guided-card__body">
          <h3>${item.title}</h3>
          <p class="guided-card__teaser">${shortText(item.text, 120)}</p>
          <button class="guided-card__toggle" type="button" aria-expanded="false">Leggi la scheda completa</button>
          <div class="guided-card__full"><p>${item.text}</p></div>
        </div>
      </article>`;
    }).join("");

    function showGuided(index) {
      state.guidedIndex = Math.max(0, Math.min(featuredIndexes.length - 1, index));
      $$(".guided-card", guidedStage).forEach((card, i) =>
        card.classList.toggle("is-current", i === state.guidedIndex));
      guidedCounter.textContent = `${pad(state.guidedIndex + 1)} / ${pad(featuredIndexes.length)}`;
      guidedPrev.disabled = state.guidedIndex === 0;
      guidedNext.disabled = state.guidedIndex === featuredIndexes.length - 1;
      scheduleRefresh();
    }
    guidedPrev.addEventListener("click", () => showGuided(state.guidedIndex - 1));
    guidedNext.addEventListener("click", () => showGuided(state.guidedIndex + 1));
    guidedStage.addEventListener("click", event => {
      const toggle = event.target.closest(".guided-card__toggle");
      if (!toggle) return;
      const card = toggle.closest(".guided-card");
      const open = card.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Chiudi la scheda" : "Leggi la scheda completa";
      if (open) state.guidedRead.add(card.dataset.guided);
      scheduleRefresh();
    });
    showGuided(0);

    /* ---------------- 01.3 Indice delle tracce ---------------- */
    const traceIndex = $("#traceIndex");
    const tracePreview = $("#tracePreview");

    traceIndex.innerHTML = data.inventory.map((item, i) =>
      `<article class="trace-row" data-trace-row="${i}">
        <button type="button" class="trace-row__button" aria-expanded="false">
          <span class="trace-row__number">${pad(i + 1)}</span>
          <span class="trace-row__title">${item.title}</span>
          <span class="trace-row__category">${item.category}</span>
          <span class="trace-row__archive">Rep. ${item.number}</span>
        </button>
        <div class="trace-row__description"><p>${item.text}</p></div>
      </article>`).join("");

    function selectTrace(index, expandMobile = false) {
      const item = data.inventory[index];
      if (!item) return;
      state.currentTrace = index;
      const desktop = innerWidth >= 768;
      $$(".trace-row", traceIndex).forEach((row, i) => {
        const active = i === index;
        row.classList.toggle("is-active", active);
        $(".trace-row__button", row).setAttribute("aria-expanded", String(active && (desktop || expandMobile)));
      });
      tracePreview.dataset.tone = toneOf(item);
      tracePreview.innerHTML = `
        <p class="trace-preview__eyebrow">Cassetto / ${pad(index + 1)}</p>
        <p class="trace-preview__number" aria-hidden="true">${item.number}</p>
        <div class="trace-preview__copy">
          <p>Archivio / Rep. ${item.number} · ${item.category}</p>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </div>`;
      pulse(tracePreview);
      scheduleRefresh();
    }

    traceIndex.addEventListener("click", event => {
      const row = event.target.closest(".trace-row");
      if (!row) return;
      const index = Number(row.dataset.traceRow);
      const mobile = innerWidth < 768;
      const wasOpen = row.classList.contains("is-active") &&
        $(".trace-row__button", row).getAttribute("aria-expanded") === "true";
      if (mobile && wasOpen) {
        row.classList.remove("is-active");
        $(".trace-row__button", row).setAttribute("aria-expanded", "false");
        scheduleRefresh();
      } else {
        selectTrace(index, mobile);
      }
    });
    traceIndex.addEventListener("pointerover", event => {
      if (!finePointer || innerWidth < 768) return;
      const row = event.target.closest(".trace-row");
      if (row) selectTrace(Number(row.dataset.traceRow));
    });
    traceIndex.addEventListener("focusin", event => {
      const row = event.target.closest(".trace-row");
      if (row && innerWidth >= 768) selectTrace(Number(row.dataset.traceRow));
    });
    selectTrace(0, innerWidth < 768);

    /* ---------------- 02.1 Mappa domestica ---------------- */
    const houseMap = $("#houseMap");
    const routePath = $("#houseRoutePath");
    const roomReading = $("#roomReading");

    houseMap.insertAdjacentHTML("beforeend", data.hotspots.map((room, i) =>
      `<button class="room" type="button" data-room="${i}" aria-pressed="false"
        style="left:${room.x}%; top:${room.y}%"
        aria-label="Indizio ${pad(i + 1)}: ${room.title}">
        <i>${pad(i + 1)}</i><em>${room.title}</em>
      </button>`).join(""));

    function updateHouseRoute(animate = false) {
      if (!state.visitedRooms.length) { routePath.setAttribute("d", ""); return; }
      const points = state.visitedRooms.map(i => {
        const room = data.hotspots[i];
        return [room.x * 10, room.y * 6.8];
      });
      routePath.setAttribute("d", points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" "));
      const length = routePath.getTotalLength();
      routePath.style.strokeDasharray = String(length);
      if (animate && length > 0 && !reducedMotion.matches) {
        routePath.style.strokeDashoffset = String(length);
        routePath.getBoundingClientRect();
        routePath.style.transition = "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)";
        routePath.style.strokeDashoffset = "0";
      } else {
        routePath.style.transition = "none";
        routePath.style.strokeDashoffset = "0";
      }
    }

    houseMap.addEventListener("click", event => {
      const button = event.target.closest(".room");
      if (!button) return;
      const index = Number(button.dataset.room);
      const room = data.hotspots[index];
      if (!state.visitedRooms.includes(index)) state.visitedRooms.push(index);
      state.currentRoom = index;
      $$(".room", houseMap).forEach((el, i) => {
        el.classList.toggle("is-current", i === index);
        el.classList.toggle("is-visited", state.visitedRooms.includes(i) && i !== index);
        el.setAttribute("aria-pressed", String(i === index));
      });
      roomReading.innerHTML = `<p>Indizio / ${pad(room.number)}</p><h3>${room.title}</h3><span>${room.text}</span>`;
      pulse(roomReading);
      updateHouseRoute(true);
      updateReceiptEvidence();
    });

    /* ---------------- 02.2 Gesture log ---------------- */
    const gestureSurface = $("#gestureSurface");
    gestureSurface.insertAdjacentHTML("beforeend", data.gestures.map((gesture, i) =>
      `<article class="gesture-log__phrase" data-gesture="${i}">
        <span>${pad(i + 1)} / ${pad(data.gestures.length)}</span><p>${gesture}</p>
      </article>`).join(""));
    $("#gestureList").innerHTML = data.gestures.map((gesture, i) =>
      `<li data-gesture-row="${i}"><span>${pad(i + 1)}</span><p>${gesture}</p></li>`).join("");

    setGestureIndex = function (index) {
      index = Math.max(0, Math.min(data.gestures.length - 1, index));
      if (state.currentGesture === index) return;
      state.currentGesture = index;
      $("#gestureIndex").textContent = `${pad(index + 1)} / ${pad(data.gestures.length)}`;
      $$("[data-gesture-row]").forEach((row, i) => {
        row.classList.toggle("is-current", i === index);
        row.classList.toggle("is-passed", i < index);
      });
      $$(".gesture-log__phrase").forEach((phrase, i) =>
        phrase.classList.toggle("is-active", i === index));
    };
    window.__conventionalSetGesture = setGestureIndex;

    /* ---------------- 02.3 Deviation cases ---------------- */
    const digitalItem = data.inventory.find(item => item.category.toLowerCase() === "digitale") || data.inventory[17];
    const deviationCases = [
      { type: "space", label: "Spazio fisico", title: data.inventory[4].title, text: shortText(data.inventory[4].text, 150) },
      { type: "home", label: "Comportamento domestico", title: data.gestures[1], text: data.hotspots[3].text },
      { type: "digital", label: "Interfaccia digitale", title: digitalItem.title, text: shortText(digitalItem.text, 150) }
    ];
    const deviationWrap = $("#deviationCases");
    deviationWrap.innerHTML = deviationCases.map((item, i) =>
      `<button type="button" class="deviation-case" data-case="${item.type}" aria-pressed="false">
        <span>${pad(i + 1)} / ${item.label}</span><h3>${item.title}</h3><p>${item.text}</p>
      </button>`).join("");

    function selectDeviation(type) {
      $$(".deviation-case", deviationWrap).forEach(button => {
        const active = button.dataset.case === type;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      $(".desire-diagram").dataset.activeCase = type;
    }
    deviationWrap.addEventListener("click", event => {
      const button = event.target.closest(".deviation-case");
      if (button) selectDeviation(button.dataset.case);
    });
    deviationWrap.addEventListener("pointerover", event => {
      if (!finePointer) return;
      const button = event.target.closest(".deviation-case");
      if (button) selectDeviation(button.dataset.case);
    });
    deviationWrap.addEventListener("focusin", event => {
      const button = event.target.closest(".deviation-case");
      if (button) selectDeviation(button.dataset.case);
    });
    selectDeviation("space");

    /* ---------------- 03.1 Catalogo dell'usura ---------------- */
    const tilts = [-.55, .38, -.28, .52, -.35];
    $("#wearStack").innerHTML = wearIndexes.map((dataIndex, position) => {
      const item = data.wear[dataIndex];
      return `<article class="wear-sheet" data-tone="${wearTones[position]}" style="--sheet-tilt:${tilts[position]}deg">
        <div class="wear-sheet__meta">
          <span>Reperto ${item.number} · Usura</span>
          <span>${pad(position + 1)} / ${pad(wearIndexes.length)}</span>
        </div>
        <div class="wear-sheet__media" aria-hidden="true">
          <span class="media-number">${item.number}</span>
          <span class="media-caption">Catalogo<br>Forma prodotta dall'uso</span>
        </div>
        <div class="wear-sheet__copy"><h3>${item.title}</h3><p>${item.caption}</p></div>
      </article>`;
    }).join("");

    const remainingWear = data.wear.filter((_, i) => !wearIndexes.includes(i));
    $("#wearIndex").innerHTML = remainingWear.map((item, i) =>
      `<article><span>${pad(i + 1)}</span><h4>${item.title}</h4><p>${item.caption}</p><em>Rep. ${item.number}</em></article>`
    ).join("");

    /* ---------------- 03.2 Scanner delle tracce invisibili ---------------- */
    const scanner = $("#scanner");
    const scannerHandle = $("#scannerHandle");
    const scannerReading = $("#scannerReading");
    const scannerPositions = [
      { x: .22, y: .18 }, { x: .68, y: .33 }, { x: .33, y: .49 },
      { x: .7, y: .64 }, { x: .28, y: .8 }
    ];
    $("#scannerRevealed").innerHTML = data.invisible.map(item =>
      `<article class="scanner-fragment">
        <span>${pad(item.number)} / Presenza residua</span><h3>${item.title}</h3>
        <p>${shortText(item.text, 60)}</p>
      </article>`).join("");

    const scannerMotion = { x: .5, y: .5, tx: .5, ty: .5, active: false, dragging: false, frame: 0 };

    function renderScannerReading(index) {
      const item = data.invisible[index];
      if (!item || !state.scannerFound.has(index)) return;
      state.currentScanner = index;
      scannerReading.innerHTML = `
        <p>Lettura / ${pad(item.number)}</p>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <div class="scanner-reading__tabs" aria-label="Frammenti scoperti">
          ${Array.from(state.scannerFound).sort((a, b) => a - b).map(found =>
            `<button type="button" data-scanner-tab="${found}" class="${found === index ? "is-active" : ""}"
              aria-label="Leggi il frammento ${found + 1}">${pad(found + 1)}</button>`).join("")}
        </div>`;
      pulse(scannerReading);
    }

    function updateScannerStatus() {
      $("#scannerStatus").textContent = `${state.scannerFound.size} / ${data.invisible.length} frammenti leggibili`;
    }

    function discoverScanner(index) {
      const firstDiscovery = !state.scannerFound.has(index);
      state.scannerFound.add(index);
      $$(".scanner-fragment", scanner)[index].classList.add("is-found");
      if (firstDiscovery || state.currentScanner == null) renderScannerReading(index);
      updateScannerStatus();
      updateReceiptEvidence();
    }

    function inspectScanner() {
      scannerPositions.forEach((point, index) => {
        if (Math.hypot(scannerMotion.x - point.x, scannerMotion.y - point.y) < .17) discoverScanner(index);
      });
    }

    function scannerFrame() {
      if (!scannerMotion.active) { scannerMotion.frame = 0; return; }
      const lerp = reducedMotion.matches ? 1 : .14;
      scannerMotion.x += (scannerMotion.tx - scannerMotion.x) * lerp;
      scannerMotion.y += (scannerMotion.ty - scannerMotion.y) * lerp;
      scanner.style.setProperty("--scan-x", `${scannerMotion.x * 100}%`);
      scanner.style.setProperty("--scan-y", `${scannerMotion.y * 100}%`);
      inspectScanner();
      scannerMotion.frame = requestAnimationFrame(scannerFrame);
    }
    function ensureScannerFrame() {
      if (!scannerMotion.frame && scannerMotion.active) scannerMotion.frame = requestAnimationFrame(scannerFrame);
    }
    function setScannerTarget(clientX, clientY) {
      const bounds = scanner.getBoundingClientRect();
      scannerMotion.tx = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
      scannerMotion.ty = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
      ensureScannerFrame();
    }

    if (finePointer) {
      scanner.addEventListener("pointermove", e => setScannerTarget(e.clientX, e.clientY), { passive: true });
    }
    scannerHandle.addEventListener("pointerdown", event => {
      scannerMotion.dragging = true;
      scannerHandle.setPointerCapture?.(event.pointerId);
      setScannerTarget(event.clientX, event.clientY);
      event.preventDefault();
    });
    scannerHandle.addEventListener("pointermove", event => {
      if (!scannerMotion.dragging) return;
      setScannerTarget(event.clientX, event.clientY);
      event.preventDefault();
    });
    const stopScannerDrag = () => { scannerMotion.dragging = false; };
    scannerHandle.addEventListener("pointerup", stopScannerDrag);
    scannerHandle.addEventListener("pointercancel", stopScannerDrag);

    scanner.addEventListener("keydown", event => {
      const step = event.shiftKey ? .13 : .07;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") scannerMotion.tx -= step;
      if (event.key === "ArrowRight") scannerMotion.tx += step;
      if (event.key === "ArrowUp") scannerMotion.ty -= step;
      if (event.key === "ArrowDown") scannerMotion.ty += step;
      if (event.key === "Enter" || event.key === " ") {
        let next = scannerPositions.findIndex((_, i) => !state.scannerFound.has(i));
        if (next < 0) next = state.currentScanner ?? 0;
        scannerMotion.tx = scannerPositions[next].x;
        scannerMotion.ty = scannerPositions[next].y;
      }
      scannerMotion.tx = Math.max(0, Math.min(1, scannerMotion.tx));
      scannerMotion.ty = Math.max(0, Math.min(1, scannerMotion.ty));
      ensureScannerFrame();
    });

    scannerReading.addEventListener("click", event => {
      const tab = event.target.closest("[data-scanner-tab]");
      if (tab) renderScannerReading(Number(tab.dataset.scannerTab));
    });

    new IntersectionObserver(entries => {
      scannerMotion.active = entries[0].isIntersecting;
      if (scannerMotion.active) ensureScannerFrame();
      else if (scannerMotion.frame) { cancelAnimationFrame(scannerMotion.frame); scannerMotion.frame = 0; }
    }, { rootMargin: "12% 0px" }).observe(scanner);

    /* ---------------- 03.3 Quiz & scontrino ---------------- */
    const quizSteps = $("#quizSteps");
    const quizForm = $("#quizForm");
    const receiptPaper = $("#receiptPaper");
    const receiptTitle = $("#receiptTitle");
    const receiptLines = $("#receiptLines");
    const receiptTotal = $("#receiptTotal");
    const receiptNumber = $("#receiptNumber");
    const receiptExport = $("#receiptExport");
    const receiptExportHint = $("#receiptExportHint");
    const totalQuestions = data.quiz.questions.length;

    function renderQuizSteps() {
      quizSteps.innerHTML = data.quiz.questions.map((_, i) => {
        const available = i <= state.furthestQuestion;
        const done = state.answers[`question-${i}`] != null;
        return `<button type="button" data-quiz-step="${i}"
          class="${i === state.currentQuestion ? "is-current" : ""} ${done ? "is-done" : ""}"
          ${available ? "" : "disabled"} aria-label="Domanda ${i + 1}${done ? ", risposta data" : ""}">${pad(i + 1)}</button>`;
      }).join("");
    }

    function renderCurrentQuestion(animate = true) {
      const question = data.quiz.questions[state.currentQuestion];
      const key = `question-${state.currentQuestion}`;
      quizForm.innerHTML = `<fieldset class="question ${animate ? "is-entering" : ""}" data-question="${state.currentQuestion}">
        <legend>${pad(state.currentQuestion + 1)}. ${question.text}</legend>
        <div class="answers">${question.answers.map((answer, i) =>
          `<label class="answer" style="--answer-index:${i}">
            <input type="radio" name="${key}" value="${answer[2]}" data-label="${answer[1]}"
              ${state.answerLabels[key] === answer[1] ? "checked" : ""}>
            <span>${answer[0]} — ${answer[1]}</span>
          </label>`).join("")}</div>
      </fieldset>`;
      renderQuizSteps();
    }

    function updateReceiptEvidence() {
      const evidence = [];
      if (state.selectedNotes.size) {
        evidence.push(`<div><strong>Osservazioni riconosciute / ${state.selectedNotes.size}</strong>` +
          Array.from(state.selectedNotes).sort((a, b) => a - b)
            .map(i => `<span>${shortText(data.notes[i], 52)}</span>`).join("") + "</div>");
      }
      if (state.visitedRooms.length) {
        const first = data.hotspots[state.visitedRooms[0]].title;
        const last = data.hotspots[state.visitedRooms[state.visitedRooms.length - 1]].title;
        evidence.push(`<div><strong>Rotta domestica / ${state.visitedRooms.length} stanze</strong>
          <span>Prima / ${first} · Ultima / ${last}</span>
          <i class="receipt-route" style="--route-stops:${state.visitedRooms.length}" aria-hidden="true"></i></div>`);
      }
      if (state.scannerFound.size) {
        evidence.push(`<div><strong>Tracce invisibili / ${state.scannerFound.size}</strong>` +
          Array.from(state.scannerFound).sort((a, b) => a - b)
            .map(i => `<span>${data.invisible[i].title}</span>`).join("") + "</div>");
      }
      $("#receiptEvidence").innerHTML = evidence.join("");
      $("#endingSummary").textContent =
        `${state.selectedNotes.size} osservazioni riconosciute, ${state.visitedRooms.length} stanze attraversate, ` +
        `${state.scannerFound.size} presenze invisibili lette e ${Object.keys(state.answers).length} risposte registrate. ` +
        `Il volume conserva la forma delle tue scelte.`;
    }

    function generateResult() {
      const counts = Object.values(state.answers).reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});
      const type = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const result = data.quiz.results[type];
      receiptTitle.textContent = result.title;
      receiptLines.innerHTML = result.lines.map(line =>
        `<p class="receipt-paper__line-new">${line}</p>`).join("");
      receiptTotal.textContent = result.total;
      state.completed = true;
      receiptExport.disabled = false;
      receiptExportHint.textContent = "Lo scontrino è completo: puoi esportarlo.";
    }

    function updateReceipt() {
      const answered = Object.keys(state.answers).length;
      const labels = Object.entries(state.answerLabels);
      receiptTitle.textContent = answered === totalQuestions ? "Calcolo del reperto" : `${pad(answered)} / ${pad(totalQuestions)} risposte`;
      receiptLines.innerHTML = labels.length
        ? labels.map(([key, label]) =>
            `<p class="receipt-paper__line-new">${key.replace("question-", "Q.")} × ${label}</p>`).join("")
        : "<p>La ricevuta si compone mentre rispondi.</p>";
      receiptTotal.textContent = answered ? "Risposte in registrazione." : "Nothing special.";
      receiptNumber.textContent =
        `${pad(state.selectedNotes.size)}${pad(state.visitedRooms.length)} ${pad(state.scannerFound.size)}${pad(answered)} ${pad(state.guidedRead.size)}${pad(state.currentTrace + 1)}`;
      updateReceiptEvidence();
      pulse(receiptPaper);
      if (answered === totalQuestions) generateResult();
    }

    renderCurrentQuestion(false);
    updateReceiptEvidence();

    quizSteps.addEventListener("click", event => {
      const step = event.target.closest("[data-quiz-step]");
      if (!step || step.disabled) return;
      state.currentQuestion = Number(step.dataset.quizStep);
      renderCurrentQuestion();
    });

    quizForm.addEventListener("change", event => {
      if (!event.target.matches("input[type='radio']")) return;
      const key = event.target.name;
      state.answers[key] = event.target.value;
      state.answerLabels[key] = event.target.dataset.label;
      updateReceipt();
      const answeredIndex = Number(key.split("-")[1]);
      if (answeredIndex < totalQuestions - 1) {
        state.furthestQuestion = Math.max(state.furthestQuestion, answeredIndex + 1);
        setTimeout(() => {
          if (state.currentQuestion === answeredIndex) {
            state.currentQuestion = answeredIndex + 1;
            renderCurrentQuestion();
          } else renderQuizSteps();
        }, reducedMotion.matches ? 0 : 420);
      } else renderQuizSteps();
    });

    /* ---------------- Export PNG dello scontrino (canvas 2D) ---------------- */
    function wrapLines(ctx, text, maxWidth) {
      const words = String(text).split(/\s+/);
      const lines = [];
      let line = "";
      words.forEach(word => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
        else line = test;
      });
      if (line) lines.push(line);
      return lines;
    }

    function exportReceipt() {
      if (!state.completed) return;
      const scale = 2;
      const W = 640;
      const padX = 44;
      const contentW = W - padX * 2;
      const scratch = document.createElement("canvas");
      const sctx = scratch.getContext("2d");
      const setFont = font => { sctx.font = font; };
      let y = 0;
      const ops = [];
      const draw = (font, color, text, opts = {}) => {
        setFont(font);
        wrapLines(sctx, text, contentW - (opts.indent || 0)).forEach(line =>
          ops.push({ kind: "text", font, color, text: line, ...opts }));
      };
      const rule = () => ops.push({ kind: "rule" });

      draw("600 46px 'Source Serif 4', Georgia, serif", "#263627", "Conventional");
      draw("13px 'DM Mono', monospace", "#263627", "VOL. 01 — SCONTRINO NON FISCALE / PASSAGGIO LOCALE", { gapBefore: 16 });
      rule();
      draw("400 52px 'Source Serif 4', Georgia, serif", "#263627", receiptTitle.textContent, { gapBefore: 22, lineHeight: 52 });
      $$("#receiptLines p").forEach(p =>
        draw("15px 'DM Mono', monospace", "#263627", p.textContent, { gapBefore: 8, lineHeight: 21 }));
      $$("#receiptEvidence > div").forEach(group => {
        draw("500 12px 'DM Mono', monospace", "#263627", $("strong", group)?.textContent || "", { gapBefore: 20, lineHeight: 17 });
        $$("span", group).forEach(span =>
          draw("12px 'DM Mono', monospace", "#263627", span.textContent, { gapBefore: 4, lineHeight: 17, indent: 14 }));
      });
      rule();
      draw("500 20px 'Lisu Bosa', Georgia, serif", "#263627", receiptTotal.textContent, { gapBefore: 18, lineHeight: 27 });
      ops.push({ kind: "barcode" });
      draw("13px 'DM Mono', monospace", "#263627", receiptNumber.textContent, { gapBefore: 12, center: true, lineHeight: 18 });

      /* misura altezza */
      y = 40;
      ops.forEach(op => {
        if (op.kind === "rule") y += 34;
        else if (op.kind === "barcode") y += 84;
        else y += (op.gapBefore || 0) + (op.lineHeight || 22);
      });
      y += 40;

      const canvas = document.createElement("canvas");
      canvas.width = W * scale;
      canvas.height = Math.ceil(y) * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.fillStyle = "#F7F3EA";
      ctx.fillRect(0, 0, W, y);
      ctx.strokeStyle = "#263627";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, W - 16, y - 16);

      let cy = 40;
      ops.forEach(op => {
        if (op.kind === "rule") {
          cy += 17;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(padX, cy);
          ctx.lineTo(W - padX, cy);
          ctx.stroke();
          ctx.setLineDash([]);
          cy += 17;
        } else if (op.kind === "barcode") {
          cy += 20;
          let bx = padX;
          let seed = 7;
          while (bx < W - padX) {
            seed = (seed * 16807) % 2147483647;
            const w = 1 + (seed % 4);
            if (seed % 3) { ctx.fillStyle = "#263627"; ctx.fillRect(bx, cy, w, 44); }
            bx += w + 2;
          }
          cy += 64;
        } else {
          cy += op.gapBefore || 0;
          ctx.font = op.font;
          ctx.fillStyle = op.color;
          ctx.textAlign = op.center ? "center" : "left";
          ctx.fillText(op.text, op.center ? W / 2 : padX + (op.indent || 0), cy + (op.lineHeight || 22) * .78);
          ctx.textAlign = "left";
          cy += op.lineHeight || 22;
        }
      });

      const link = document.createElement("a");
      link.download = "conventional-scontrino.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
    receiptExport.addEventListener("click", exportReceipt);
  }

  /* ==================================================================
     LIVELLO MOTION (GSAP): solo miglioramento, mai requisito.
  ================================================================== */
  async function waitForStableLayout() {
    try { await document.fonts?.ready; } catch (_) { /* font già applicati dai fallback */ }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function prepareRiseReveals() {
    $$("[data-rise]").forEach(element => {
      gsap.fromTo(element, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: .85, ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 94%", once: true }
      });
    });
  }

  function prepareHeadingReveals() {
    $$(".masked-heading").forEach(heading => {
      gsap.fromTo($$(".title-mask > span", heading),
        { autoAlpha: 0, yPercent: 112 },
        { autoAlpha: 1, yPercent: 0, duration: 1, stagger: .08, ease: "expo.out",
          scrollTrigger: { trigger: heading, start: "top 92%", once: true } });
    });
  }

  function prepareMediaFrames() {
    $$("[data-media-frame]").forEach(frame => {
      gsap.fromTo(frame, { clipPath: "inset(0 0 16% 0)", y: 24 }, {
        clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: frame, start: "top 92%", once: true }
      });
    });
  }

  function prepareChapterTransitions() {
    $$(".chapter-transition").forEach(transition => {
      const lines = $$("h2 .title-mask > span", transition);
      const rule = $(".chapter-transition__rule", transition);
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: transition, start: "top 85%", end: "bottom 45%", scrub: .5 }
      });
      timeline.fromTo(lines, { autoAlpha: 0, yPercent: 108 },
        { autoAlpha: 1, yPercent: 0, duration: .5, stagger: .06, ease: "power4.out" }, 0);
      if (rule) timeline.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: "power2.inOut" }, .2);
    });
  }

  function prepareDesireDraw() {
    const section = $("#desire-paths");
    const planned = $(".planned-path", section);
    const used = $$(".used-path", section);
    gsap.set([planned, ...used], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.timeline({
      scrollTrigger: { trigger: ".desire-diagram", start: "top 82%", end: "bottom 45%", scrub: .6 }
    })
      .to(planned, { strokeDashoffset: 0, duration: .3, ease: "power2.inOut" }, 0)
      .to(used, { strokeDashoffset: 0, duration: .4, stagger: .05, ease: "power2.inOut" }, .15);
  }

  function setupGestureScroll() {
    if (!data) return;
    const section = $("#gesti");
    const stage = $(".gestures__stage", section);
    const panels = $$(".gesture-log__phrase", stage);
    if (!panels.length) return;
    gsap.set(panels, { autoAlpha: 0 });
    gsap.set(panels[0], { autoAlpha: 1 });
    setGestureIndex(0);
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${Math.round(innerHeight * .42 * panels.length)}`,
        pin: stage,
        pinSpacing: true,
        scrub: .6,
        anticipatePin: 1,
        onUpdate: self => {
          const index = Math.min(panels.length - 1, Math.floor(self.progress * panels.length));
          window.__conventionalSetGesture?.(index);
        }
      }
    });
    panels.slice(1).forEach((panel, i) => {
      timeline.to(panels[i], { autoAlpha: 0, yPercent: -6, duration: .22, ease: "power2.in" }, i + .5)
        .fromTo(panel, { autoAlpha: 0, yPercent: 8 },
          { autoAlpha: 1, yPercent: 0, duration: .3, ease: "power3.out" }, i + .56);
    });
  }

  function setupMobileGestureReveals() {
    $$(".gesture-log__phrase").forEach(phrase => {
      gsap.fromTo(phrase, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: .8, ease: "power3.out",
        scrollTrigger: { trigger: phrase, start: "top 92%", once: true }
      });
    });
  }

  async function initMotion() {
    await waitForStableLayout();
    if (!motionAvailable()) {
      document.documentElement.classList.add("no-gsap");
      return;
    }
    try {
      gsap.registerPlugin(ScrollTrigger);
      document.documentElement.classList.add("motion-ready");
      motionMedia = gsap.matchMedia();
      motionMedia.add({
        desktop: "(min-width: 1100px) and (prefers-reduced-motion: no-preference)",
        notDesktop: "(max-width: 1099px) and (prefers-reduced-motion: no-preference)"
      }, context => {
        prepareRiseReveals();
        prepareHeadingReveals();
        prepareMediaFrames();
        prepareChapterTransitions();
        prepareDesireDraw();
        $$(".wear-sheet").forEach(sheet => {
          gsap.fromTo(sheet, { y: 56 }, {
            y: 0, duration: .9, ease: "power3.out",
            scrollTrigger: { trigger: sheet, start: "top 94%", once: true }
          });
        });
        if (context.conditions.desktop) setupGestureScroll();
        else setupMobileGestureReveals();
      });
      ScrollTrigger.refresh();
    } catch (error) {
      console.warn("[Conventional] Motion disattivato; contenuti in modalità statica.", error);
      try { motionMedia?.revert(); } catch (_) { /* noop */ }
      try { ScrollTrigger.getAll().forEach(trigger => trigger.kill()); } catch (_) { /* noop */ }
      motionMedia = null;
      document.documentElement.classList.remove("motion-ready");
      document.documentElement.classList.add("motion-failed");
      try {
        gsap.set("[data-rise], .masked-heading .title-mask > span, .chapter-transition h2 .title-mask > span, .gesture-log__phrase, .planned-path, .used-path, .wear-sheet", { clearProps: "all" });
      } catch (_) { /* noop */ }
    }
  }
  initMotion();

  addEventListener("load", () => scheduleRefresh(60), { once: true });
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (data) updateHouseRoute?.(false);
      scheduleRefresh(30);
    }, 180);
  }, { passive: true });
})();
