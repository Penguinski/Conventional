(function () {
  const data = window.CONVENTIONAL_DATA;
  const tones = ["cream", "lilac", "blue", "olive", "dark"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inventoryStep = 6;
  const wearStep = 6;

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function initImageFallbacks() {
    qsa("[data-fallback-image]").forEach((img) => {
      img.addEventListener("error", () => img.classList.add("is-missing"), { once: true });
    });
  }

  function initReveals() {
    if (reducedMotion) {
      qsa(".reveal").forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    qsa(".reveal").forEach((element) => observer.observe(element));
  }

  function initMobileMenu() {
    const toggle = qs(".menu-toggle");
    const close = qs(".menu-close");
    const menu = qs("#mobileMenu");
    const scrim = qs("[data-menu-scrim]");
    const links = qsa("a", menu);

    const openMenu = () => {
      document.body.classList.add("menu-open");
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      scrim.hidden = false;
      close.focus();
    };

    const closeMenu = () => {
      document.body.classList.remove("menu-open");
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      scrim.hidden = true;
    };

    toggle.addEventListener("click", openMenu);
    close.addEventListener("click", closeMenu);
    scrim.addEventListener("click", closeMenu);
    links.forEach((link) => link.addEventListener("click", closeMenu));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
    });
  }

  function initCompactHeader() {
    const header = qs("[data-header]");
    if (!header) return;

    let ticking = false;
    const update = () => {
      header.classList.toggle("is-compact", window.scrollY > 48);
      ticking = false;
    };

    update();
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  function initSectionIndicator() {
    const indicator = qs("[data-section-indicator]");
    if (!indicator) return;

    const sectionNames = {
      cover: "VOL.1 / COVER",
      premessa: "VOL.1 / PREMESSA",
      inventario: "VOL.1 / INVENTARIO",
      casa: "VOL.1 / CASA",
      usura: "VOL.1 / USURA",
      receipt: "VOL.1 / RECEIPT",
      traccia: "VOL.1 / TRACCIA"
    };

    const sections = qsa("main > section[id]").filter((section) => sectionNames[section.id]);
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) indicator.textContent = sectionNames[visible.target.id];
    }, { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.2, 0.5] });

    sections.forEach((section) => observer.observe(section));
  }

  function initDossierHighlights() {
    const diagram = qs("#desireDiagram");
    const cards = qsa(".dossier-card");
    if (!diagram || !cards.length) return;

    const setHighlight = (highlight) => {
      diagram.classList.remove("is-prato", "is-marciapiede", "is-interfaccia");
      if (highlight) diagram.classList.add(`is-${highlight}`);
      cards.forEach((card) => card.classList.toggle("is-active", card.dataset.highlight === highlight));
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => setHighlight(card.dataset.highlight));
      card.addEventListener("mouseenter", () => setHighlight(card.dataset.highlight));
      card.addEventListener("focus", () => setHighlight(card.dataset.highlight));
    });
  }

  function renderNotes() {
    const grid = qs("#notesGrid");
    data.notes.forEach((note, index) => {
      const article = createElement("button", "note reveal");
      article.type = "button";
      article.setAttribute("aria-pressed", "false");
      article.style.setProperty("--turn", `${[-1.2, 0.7, -0.5, 1, -0.8, 0.4, -0.2][index]}deg`);
      article.append(createElement("span", "", String(index + 1).padStart(2, "0")));
      article.append(createElement("p", "", note));
      grid.append(article);
    });
  }

  function renderInventory() {
    const grid = qs("#inventoryGrid");
    data.inventory.forEach((item, index) => {
      const card = createElement("article", "inventory-card reveal");
      card.dataset.category = item.category;
      card.dataset.tone = tones[index % tones.length];

      const meta = createElement("div", "inventory-card__meta");
      meta.append(createElement("span", "", item.number));
      meta.append(createElement("span", "", item.category));
      card.append(createElement("span", "inspect-label", "traccia rilevata"));

      const figure = createElement("figure", "image-fallback");
      figure.dataset.label = item.title;
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title;
      img.loading = "lazy";
      img.dataset.fallbackImage = "";
      figure.append(img);

      card.append(meta, createElement("h3", "", item.title), figure, createElement("p", "", item.text));
      grid.append(card);
    });
  }

  function initFilters() {
    const filters = qsa(".filter");
    const cards = qsa(".inventory-card");
    const counter = qs("#inventoryCounter");
    const toggle = qs("#inventoryToggle");
    let activeFilter = "Tutte";
    let visibleCount = inventoryStep;

    const getMatchingCards = () => cards.filter((card) => activeFilter === "Tutte" || card.dataset.category === activeFilter);

    const updateInventory = () => {
      const matchingCards = getMatchingCards();
      const total = matchingCards.length;
      const cappedVisible = Math.min(visibleCount, total);

      cards.forEach((card) => card.classList.add("is-hidden"));
      matchingCards.forEach((card, index) => {
        card.classList.toggle("is-hidden", index >= cappedVisible);
      });
      cards
        .filter((card) => card.classList.contains("is-hidden"))
        .forEach((card) => {
          card.classList.remove("is-open");
        });

      counter.textContent = `${String(cappedVisible).padStart(2, "0")} / ${String(total).padStart(2, "0")} tracce visibili`;
      toggle.hidden = total <= inventoryStep;
      toggle.textContent = cappedVisible >= total ? "RIDUCI INVENTARIO" : "MOSTRA ALTRE TRACCE";
    };

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        visibleCount = inventoryStep;
        cards.forEach((card) => {
          card.classList.remove("is-open");
        });
        filters.forEach((item) => item.classList.toggle("is-active", item === button));
        updateInventory();
      });
    });

    toggle.addEventListener("click", () => {
      const total = getMatchingCards().length;
      visibleCount = visibleCount >= total ? inventoryStep : Math.min(visibleCount + inventoryStep, total);
      updateInventory();
    });

    updateInventory();
  }

  function renderHotspots() {
    const layer = qs("#hotspotLayer");
    const clueList = qs("#houseClues");
    const drawer = qs("#traceDrawer");
    const scrim = qs("[data-drawer-scrim]");
    const close = qs(".drawer-close");
    const title = qs("#drawerTitle");
    const text = qs("#drawerText");
    const number = qs("#drawerNumber");
    const status = qs("#drawerStatus");
    const surface = qs("#drawerSurface");
    const intensity = qs("#drawerIntensity");
    const prev = qs("#drawerPrev");
    const next = qs("#drawerNext");
    const intensities = ["media", "alta", "media", "bassa", "bassa", "alta", "media", "alta"];
    let activeIndex = 0;

    const setActiveClue = () => {
      qsa("[data-hotspot-index]").forEach((element) => {
        element.classList.toggle("is-active", Number(element.dataset.hotspotIndex) === activeIndex);
      });
    };

    const openDrawer = (index) => {
      const spot = data.hotspots[index];
      activeIndex = index;
      title.textContent = spot.title;
      text.textContent = spot.text;
      number.textContent = spot.number.padStart(2, "0");
      status.textContent = "rilevato";
      surface.textContent = "domestica";
      intensity.textContent = intensities[index];
      setActiveClue();
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      scrim.hidden = false;
      document.body.classList.add("drawer-open");
      close.focus();
    };

    const closeDrawer = () => {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      scrim.hidden = true;
      document.body.classList.remove("drawer-open");
      qsa("[data-hotspot-index]").forEach((element) => element.classList.remove("is-active"));
    };

    const goToClue = (direction) => {
      const nextIndex = (activeIndex + direction + data.hotspots.length) % data.hotspots.length;
      openDrawer(nextIndex);
    };

    data.hotspots.forEach((spot, index) => {
      const button = createElement("button", "hotspot", spot.number);
      const label = createElement("span", "hotspot__label", `${spot.number.padStart(2, "0")} ${spot.title}`);
      button.type = "button";
      button.style.left = `${spot.x}%`;
      button.style.top = `${spot.y}%`;
      button.dataset.hotspotIndex = index;
      if (spot.x > 64) button.classList.add("is-right");
      button.setAttribute("aria-label", `Apri indizio ${spot.number}: ${spot.title}`);
      button.append(label);
      button.addEventListener("click", () => openDrawer(index));
      layer.append(button);

      const clue = createElement("button", "house-clue", "");
      clue.type = "button";
      clue.dataset.hotspotIndex = index;
      clue.setAttribute("aria-label", `Apri indizio ${spot.number}: ${spot.title}`);
      clue.append(createElement("span", "house-clue__number", spot.number.padStart(2, "0")));
      clue.append(createElement("span", "house-clue__title", spot.title));
      clue.addEventListener("click", () => openDrawer(index));
      clueList.append(clue);
    });

    close.addEventListener("click", closeDrawer);
    scrim.addEventListener("click", closeDrawer);
    prev.addEventListener("click", () => goToClue(-1));
    next.addEventListener("click", () => goToClue(1));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
    });
  }

  function renderGestures() {
    const list = qs("#gestureList");
    data.gestures.forEach((gesture) => {
      const item = createElement("li", "reveal");
      const button = createElement("button", "gesture-button", gesture);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const marked = item.classList.toggle("is-marked");
        button.setAttribute("aria-pressed", String(marked));
      });
      item.append(button);
      list.append(item);
    });
  }

  function renderWear() {
    const grid = qs("#wearGrid");
    data.wear.forEach((item, index) => {
      const article = createElement("article", "wear-item reveal");
      article.tabIndex = 0;
      article.setAttribute("role", "button");
      article.setAttribute("aria-pressed", "false");
      article.setAttribute("aria-label", `Ispeziona reperto ${item.number}: ${item.title}`);

      const meta = createElement("div", "wear-item__meta");
      meta.append(createElement("span", "", item.number));
      meta.append(createElement("span", "", "Reperto"));
      article.append(createElement("span", "inspect-label", "segno da contatto"));
      article.append(createElement("span", "wear-meter", "usura ////"));

      const figure = createElement("figure", "image-fallback");
      figure.dataset.label = item.title;
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title;
      img.loading = "lazy";
      img.dataset.fallbackImage = "";
      figure.append(img);

      article.append(meta, figure, createElement("h3", "", item.title), createElement("p", "", item.caption));
      grid.append(article);
    });
  }

  function initWearControls() {
    const items = qsa(".wear-item");
    const counter = qs("#wearCounter");
    const toggle = qs("#wearToggle");
    let visibleCount = wearStep;

    const updateWear = () => {
      const total = items.length;
      const cappedVisible = Math.min(visibleCount, total);
      items.forEach((item, index) => item.classList.toggle("is-hidden", index >= cappedVisible));
      items
        .filter((item) => item.classList.contains("is-hidden"))
        .forEach((item) => {
          item.classList.remove("is-open", "is-selected");
          item.setAttribute("aria-pressed", "false");
        });
      counter.textContent = `${String(cappedVisible).padStart(2, "0")} / ${String(total).padStart(2, "0")} reperti visibili`;
      toggle.hidden = total <= wearStep;
      toggle.textContent = cappedVisible >= total ? "RIDUCI CATALOGO" : "MOSTRA ALTRI REPERTI";
    };

    toggle.addEventListener("click", () => {
      visibleCount = visibleCount >= items.length ? wearStep : items.length;
      updateWear();
    });

    updateWear();
  }

  function renderInvisible() {
    const stack = qs("#invisibleStack");
    data.invisible.forEach((item) => {
      const article = createElement("article", "invisible-item reveal");
      article.dataset.number = item.number;
      article.tabIndex = 0;
      article.setAttribute("role", "button");
      article.setAttribute("aria-label", `Rileva residuo: ${item.title}`);
      article.append(createElement("span", "residue-label", "presenza residua"));
      article.append(createElement("h3", "", item.title), createElement("p", "", item.text));
      stack.append(article);
    });
  }

  function renderQuiz() {
    const form = qs("#quizForm");
    data.quiz.questions.forEach((question, index) => {
      const fieldset = createElement("fieldset", "quiz-question");
      fieldset.dataset.questionIndex = index;
      fieldset.classList.add(index === 0 ? "is-visible" : "is-locked");
      const legend = createElement("legend", "quiz-question__legend");
      const label = createElement("span", "quiz-question__label", `Domanda ${String(index + 1).padStart(2, "0")}`);
      const title = createElement("span", "quiz-question__title", question.text);
      const options = createElement("div", "quiz-options");
      legend.append(label, title);

      question.answers.forEach(([letter, text, value]) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "quiz-option";
        const input = document.createElement("input");
        const marker = createElement("span", "quiz-option__marker", letter);
        const copy = createElement("span", "quiz-option__copy", text);
        input.type = "radio";
        input.name = `question-${index}`;
        input.value = value;
        input.required = true;
        input.disabled = index !== 0;
        optionLabel.append(input, marker, copy);
        options.append(optionLabel);
      });

      fieldset.append(legend, options);
      form.append(fieldset);
    });
  }

  function initEditorialMicroInteractions() {
    const mobileArchives = window.matchMedia("(max-width: 640px)");
    const toggleClass = (element, className) => {
      element.classList.toggle(className);
    };

    qsa(".note").forEach((note) => {
      note.addEventListener("click", () => {
        const marked = note.classList.toggle("is-marked");
        note.setAttribute("aria-pressed", String(marked));
      });
    });

    qsa(".inventory-card, .wear-item, .invisible-item").forEach((element) => {
      const targetClass = element.classList.contains("invisible-item") ? "has-residue" : "is-inspected";
      element.addEventListener("click", () => {
        if (mobileArchives.matches && element.matches(".inventory-card, .wear-item")) return;
        toggleClass(element, targetClass);
      });
      element.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (mobileArchives.matches && element.matches(".inventory-card, .wear-item")) return;
        toggleClass(element, targetClass);
      });
    });
  }

  function initMobileExpandableArchives() {
    const mobileArchives = window.matchMedia("(max-width: 640px)");

    const bindSelectable = (selector) => {
      const items = qsa(selector);
      const selectItem = (item) => {
        if (!mobileArchives.matches) return;
        items.forEach((candidate) => {
          const active = candidate === item && !candidate.classList.contains("is-selected");
          candidate.classList.toggle("is-selected", active);
          candidate.setAttribute("aria-pressed", String(active));
        });
      };

      items.forEach((item) => {
        item.addEventListener("click", () => selectItem(item));
        item.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          selectItem(item);
        });
      });

      mobileArchives.addEventListener("change", () => {
        if (mobileArchives.matches) return;
        items.forEach((item) => {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });
      });
    };

    bindSelectable(".wear-item");
  }

  function initReceipt() {
    const generate = qs("#generateReceipt");
    const copy = qs("#copyReceipt");
    const download = qs("#downloadReceipt");
    const lines = qs("#receiptLines");
    const receipt = qs("#paperReceipt");
    const panel = qs(".receipt-panel");
    const progress = qs("#quizProgress");
    const questions = qsa(".quiz-question");
    let currentText = "";
    let currentResult = null;
    let receiptGenerated = false;

    generate.disabled = true;
    copy.disabled = true;
    download.disabled = true;

    const isAnswered = (index) => Boolean(qs(`input[name="question-${index}"]:checked`));
    const isComplete = () => data.quiz.questions.every((_, index) => isAnswered(index));

    const updateProgress = () => {
      const answeredCount = data.quiz.questions.filter((_, index) => isAnswered(index)).length;
      const currentIndex = Math.min(answeredCount + 1, data.quiz.questions.length);
      progress.querySelector("span").textContent = `Domanda ${String(currentIndex).padStart(2, "0")} / 05`;
      progress.querySelector("i").style.setProperty("--progress", `${Math.max(20, (answeredCount / data.quiz.questions.length) * 100)}%`);
    };

    const updateQuizState = (changedIndex, shouldScroll = false) => {
      let firstNewQuestion = null;

      questions.forEach((question, index) => {
        const unlocked = index === 0 || isAnswered(index - 1);
        const answered = isAnswered(index);
        const wasLocked = question.classList.contains("is-locked");

        question.classList.toggle("is-visible", unlocked);
        question.classList.toggle("is-locked", !unlocked);
        question.classList.toggle("is-answered", answered);
        qsa("input", question).forEach((input) => {
          input.disabled = !unlocked;
          input.closest(".quiz-option").classList.toggle("is-selected", input.checked);
          input.closest(".quiz-option").classList.toggle("selected", input.checked);
        });

        if (unlocked && wasLocked && firstNewQuestion === null) firstNewQuestion = question;
      });

      const complete = isComplete();
      generate.disabled = !complete;
      panel.classList.toggle("is-ready", complete);

      if (receiptGenerated) {
        receiptGenerated = false;
        currentText = "";
        currentResult = null;
        panel.classList.remove("is-generated");
        copy.disabled = true;
        download.disabled = true;
        lines.innerHTML = complete
          ? "<p><strong>Risposte modificate.</strong></p><p>Rigenera il reperto.</p>"
          : "<p>Completa le cinque domande per generare il reperto.</p>";
      } else if (!complete) {
        currentText = "";
        currentResult = null;
        panel.classList.remove("is-generated");
        copy.disabled = true;
        download.disabled = true;
        lines.innerHTML = "<p>Completa le cinque domande per generare il reperto.</p>";
      } else {
        lines.innerHTML = "<p><strong>Reperto pronto.</strong></p><p>Genera lo scontrino.</p>";
      }
      updateProgress();

      if (shouldScroll && firstNewQuestion && window.matchMedia("(max-width: 640px)").matches && !reducedMotion) {
        firstNewQuestion.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    const pickResult = () => {
      const values = qsa("input[type='radio']:checked", qs("#quizForm")).map((input) => input.value);
      if (values.length < data.quiz.questions.length) {
        return null;
      }
      const scores = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});
      const winner = Object.keys(data.quiz.results).sort((a, b) => (scores[b] || 0) - (scores[a] || 0))[0];
      return data.quiz.results[winner];
    };

    const showResult = () => {
      const result = pickResult();
      lines.innerHTML = "";
      if (!result) {
        lines.append(createElement("p", "", "Manca ancora qualche traccia."));
        currentText = "";
        currentResult = null;
        receiptGenerated = false;
        return;
      }

      lines.append(createElement("p", "receipt-result-title", result.title));
      result.lines.forEach((line) => lines.append(createElement("p", "receipt-line", line)));
      lines.append(createElement("p", "receipt-total-line", result.total));
      currentResult = result;
      currentText = ["CONVENTIONAL / VOL. 1", result.title, ...result.lines, result.total, "Nothing special."].join("\n");
      receiptGenerated = true;
      panel.classList.add("is-generated");
      copy.disabled = false;
      download.disabled = false;
    };

    questions.forEach((question, index) => {
      qsa("input", question).forEach((input) => {
        input.addEventListener("change", () => updateQuizState(index, true));
      });
    });

    generate.addEventListener("click", () => {
      if (!isComplete()) return;
      showResult();
    });

    copy.addEventListener("click", async () => {
      if (!receiptGenerated || !currentText) {
        copy.textContent = "GENERA PRIMA";
        setTimeout(() => { copy.textContent = "COPIA TESTO"; }, 1200);
        return;
      }
      try {
        await navigator.clipboard.writeText(currentText);
        copy.textContent = "COPIATO";
        setTimeout(() => { copy.textContent = "COPIA TESTO"; }, 1200);
      } catch {
        copy.textContent = "SELEZIONA TESTO";
      }
    });

    download.addEventListener("click", () => {
      if (!receiptGenerated || !currentResult) {
        download.textContent = "GENERA PRIMA";
        setTimeout(() => { download.textContent = "SCARICA PNG"; }, 1200);
        return;
      }
      downloadReceiptPng(currentResult);
    });

    updateQuizState(0);
  }

  function downloadReceiptPng(result) {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const ctx = canvas.getContext("2d");
      const width = 1080;
      const height = 1920;
      const paperWidth = 760;
      const paperX = (width - paperWidth) / 2;
      const contentX = paperX + 64;
      const contentWidth = paperWidth - 128;
      const lineHeight = 34;
      const blockGap = 28;

      ctx.font = "26px monospace";
      const receiptExport = {
        kicker: "CONVENTIONAL / VOL. 1",
        title: "SCONTRINO NON FISCALE",
        resultTitle: result.title,
        lines: result.lines,
        total: result.total,
        footer: "Nothing special."
      };

      const wrappedLines = receiptExport.lines.map((line) => wrapTextLines(ctx, line, contentWidth));
      const totalLines = wrapTextLines(ctx, receiptExport.total, contentWidth - 44);
      const resultTitleLines = wrapTextLines(ctx, receiptExport.resultTitle, contentWidth);
      const footerLines = wrapTextLines(ctx, receiptExport.footer, contentWidth);
      const paperHeight =
        78 + 58 + 64 +
        resultTitleLines.length * lineHeight + blockGap +
        wrappedLines.reduce((sum, linesForRow) => sum + linesForRow.length * lineHeight + 12, 0) +
        blockGap +
        totalLines.length * lineHeight + 54 +
        blockGap + 46 +
        footerLines.length * lineHeight + 88;
      const paperY = Math.round((height - paperHeight) / 2) - 34;

      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#F7F3EA";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#263627";
      ctx.font = "18px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CONVENTIONAL", width / 2, 122);
      ctx.textAlign = "left";

      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(paperX, paperY, paperWidth, paperHeight);
      ctx.strokeStyle = "#263627";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.strokeRect(paperX, paperY, paperWidth, paperHeight);
      ctx.setLineDash([]);

      let y = paperY + 72;
      ctx.fillStyle = "#263627";
      ctx.font = "20px monospace";
      ctx.fillText(receiptExport.kicker, contentX, y);
      y += 58;
      ctx.font = "34px monospace";
      ctx.fillText(receiptExport.title, contentX, y);
      y += 58;
      ctx.strokeStyle = "rgba(38, 54, 39, 0.55)";
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(contentX, y);
      ctx.lineTo(contentX + contentWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 64;

      ctx.font = "26px monospace";
      y = drawTextLines(ctx, resultTitleLines, contentX, y, lineHeight) + blockGap;
      wrappedLines.forEach((lineGroup) => {
        y = drawTextLines(ctx, lineGroup, contentX, y, lineHeight) + 12;
      });

      y += blockGap;
      const totalBoxHeight = totalLines.length * lineHeight + 46;
      ctx.fillStyle = "#9F9720";
      ctx.fillRect(contentX - 22, y - 28, contentWidth + 44, totalBoxHeight);
      ctx.fillStyle = "#263627";
      y = drawTextLines(ctx, totalLines, contentX, y, lineHeight) + totalBoxHeight - (totalLines.length * lineHeight) + blockGap;

      ctx.strokeStyle = "rgba(38, 54, 39, 0.55)";
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(contentX, y);
      ctx.lineTo(contentX + contentWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 58;
      ctx.font = "24px monospace";
      ctx.fillStyle = "#263627";
      drawTextLines(ctx, footerLines, contentX, y, lineHeight);

      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Nothing special. / Lost and Found", width / 2, height - 116);
      ctx.textAlign = "left";

      const link = document.createElement("a");
      link.download = "conventional-lost-receipt.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
  }

  function wrapTextLines(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawTextLines(ctx, lines, x, y, lineHeight) {
    lines.forEach((line) => {
      ctx.fillText(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function initCursorTrail() {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    let last = 0;
    document.addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (now - last < 55) return;
      last = now;
      const dot = createElement("span", "trace-dot");
      dot.style.left = `${event.clientX}px`;
      dot.style.top = `${event.clientY}px`;
      document.body.append(dot);
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
    });
  }

  function initTraceCanvas() {
    const canvas = qs("#traceCanvas");
    const clear = qs("#clearTrace");
    const feedback = qs("#traceFeedback");
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let lastPoint = null;
    let fadeFrame;
    // Future enhancement: realtime shared canvas requires backend/realtime DB such as Supabase/Firebase; not supported on static hosting only.
    let feedbackTimer;

    const showFeedback = (message) => {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.add("is-visible");
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => feedback.classList.remove("is-visible"), 1400);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const fade = () => {
      ctx.fillStyle = "rgba(247, 243, 234, 0.018)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      fadeFrame = requestAnimationFrame(fade);
    };

    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      lastPoint = point(event);
      canvas.setPointerCapture(event.pointerId);
      showFeedback("traccia acquisita");
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const next = point(event);
      ctx.strokeStyle = event.pointerType === "touch" ? "rgba(159, 151, 32, 0.82)" : "rgba(38, 54, 39, 0.76)";
      ctx.lineWidth = event.pointerType === "touch" ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      lastPoint = next;
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
      canvas.addEventListener(type, () => { drawing = false; });
    });

    clear.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      showFeedback("superficie ripristinata");
    });

    window.addEventListener("resize", resize);
    resize();
    if (!reducedMotion) fade();
    window.addEventListener("beforeunload", () => cancelAnimationFrame(fadeFrame));
  }

  function initHiddenPhrase() {
    let buffer = "";
    const target = "nothing special";
    const line = qs("#hiddenLine");
    document.addEventListener("keydown", (event) => {
      if (event.key.length !== 1) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-target.length);
      if (buffer === target) {
        line.textContent = "Anche questo era previsto solo dopo che l'hai fatto.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderNotes();
    renderInventory();
    renderHotspots();
    renderGestures();
    renderWear();
    renderInvisible();
    renderQuiz();
    initImageFallbacks();
    initMobileMenu();
    initCompactHeader();
    initSectionIndicator();
    initDossierHighlights();
    initEditorialMicroInteractions();
    initFilters();
    initWearControls();
    initMobileExpandableArchives();
    initReceipt();
    initCursorTrail();
    initTraceCanvas();
    initHiddenPhrase();
    initReveals();
  });
})();
