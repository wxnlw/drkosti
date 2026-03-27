(function birthdayPlovGame() {
  "use strict";

  var config = window.APP_CONFIG || {};
  var birthday = config.birthday || {};
  var gift = config.gift || {};
  var ui = config.ui || {};
  var game = config.game || {};
  var steps = Array.isArray(game.steps) ? game.steps : [];
  var storageKey = game.storageKey || "birthday-plov-miniapp";
  var autoHintMs = game.autoHintMs || 2600;
  var foodItems = Array.isArray(game.foodItems) ? game.foodItems : [];
  var toolItems = Array.isArray(game.toolItems) ? game.toolItems : [];
  var preparedLabels = Object.assign({
    rice: "Замоченный рис",
    carrot: "Нарезанная морковь",
    onion: "Нарезанный лук",
    garlic: "Очищенный чеснок"
  }, game.preparedLabels || {});

  var refs = {};
  var holdTimer = null;
  var holdStartedAt = 0;
  var swipeStart = null;
  var stirData = null;
  var hintTimer = null;
  var toastTimer = null;
  var ignoreBoardClickUntil = 0;
  var ignoreKazanClickUntil = 0;
  var boardHoldDone = false;
  var kazanHoldDone = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function initRefs() {
    [
      "startScreen", "gameScreen", "heroLabel", "heroTitle", "heroSubtitle", "startButton", "birthdayBanner",
      "scene", "chestButton", "taskButton", "feedback", "prepBoard", "boardSurface",
      "boardEffects", "prepTray", "stove", "flame", "kazan", "kazanLid", "kazanContent",
      "kazanSteam", "plate", "plateFood", "lidTool", "ladleTool", "inventoryModal", "inventoryBackdrop",
      "inventoryClose", "inventoryGrid", "taskModal", "taskBackdrop", "taskClose", "taskModalText", "restartButton", "finalModal", "modalBackdrop", "finalBadge",
      "finalTitle", "finalSubtitle", "giftTitle", "giftDescription", "giftAdditionalMessage", "giftLinkLabel",
      "giftLink", "giftLoginLabel", "giftLogin", "giftPasswordLabel", "giftPassword", "finalGreeting",
      "giftOpenButton", "playAgainButton"
    ].forEach(function (id) {
      refs[id] = byId(id);
    });
  }

  function applyTemplate(text) {
    return String(text || "").replaceAll("{name}", birthday.celebrantName || "");
  }

  function defaultState() {
    return {
      started: false,
      completed: false,
      stepIndex: 0,
      inventoryOpen: false,
      taskOpen: false,
      inventory: foodItems.map(function (item) { return item.id; }),
      boardItem: null,
      activeProgress: 0,
      prepped: {
        rice: false,
        carrot: false,
        onion: false,
        garlic: false,
      },
      pot: {
        flameOn: false,
        lidOn: false,
        cooked: false,
        ingredients: [],
      },
      plate: {
        plated: false,
        served: false,
      },
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (error) {
      return defaultState();
    }
  }

  function normalizeState(value) {
    var base = defaultState();
    var next = Object.assign({}, base, value || {});
    next.prepped = Object.assign({}, base.prepped, (value && value.prepped) || {});
    next.pot = Object.assign({}, base.pot, (value && value.pot) || {});
    next.plate = Object.assign({}, base.plate, (value && value.plate) || {});
    next.inventory = Array.isArray(value && value.inventory) ? (value.inventory || []).slice() : base.inventory.slice();
    if (!Array.isArray(next.pot.ingredients)) next.pot.ingredients = [];
    if (typeof next.stepIndex !== "number") next.stepIndex = 0;
    return next;
  }

  var state = loadState();

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function resetState(options) {
    state = defaultState();
    if (options && options.start) state.started = true;
    saveState();
    render();
    announceCurrentStep();
  }

  function currentStep() {
    return steps[state.stepIndex] || null;
  }

  function getItemLabel(itemId, options) {
    var all = foodItems.concat(toolItems);
    for (var i = 0; i < all.length; i += 1) {
      if (all[i].id === itemId) {
        if (options && options.prepared && preparedLabels[itemId]) return preparedLabels[itemId];
        return all[i].label;
      }
    }
    return itemId;
  }

  function hasInventoryItem(itemId) {
    return state.inventory.indexOf(itemId) !== -1;
  }

  function addInventoryItem(itemId) {
    if (!hasInventoryItem(itemId)) state.inventory.push(itemId);
  }

  function removeInventoryItem(itemId) {
    state.inventory = state.inventory.filter(function (value) { return value !== itemId; });
  }

  function dataUri(svg) {
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }

  function px(color, cells) {
    return cells.map(function (pair) {
      return '<rect x="' + pair[0] + '" y="' + pair[1] + '" width="2" height="2" fill="' + color + '"/>';
    }).join('');
  }

  function rect(x, y, width, height, fill, opacity) {
    return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" fill="' + fill + '"' + (typeof opacity === "number" ? ' opacity="' + opacity + '"' : '') + '/>';
  }

  function makePlovPotSprite(ingredients, cooked) {
    if (!ingredients || !ingredients.length) return "";
    var fill = Math.min(1, 0.42 + ingredients.length * 0.09);
    var svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 56" shape-rendering="crispEdges">'];
    var rows = [
      { y: 34, half: 34, color: cooked ? '#9d5d35' : '#86522f' },
      { y: 30, half: 32, color: cooked ? '#b86f3d' : '#a16439' },
      { y: 26, half: 30, color: cooked ? '#cb8748' : '#b97540' },
      { y: 22, half: 28, color: cooked ? '#dfaa63' : '#cf9756' },
      { y: 18, half: 22, color: cooked ? '#ecd08a' : '#dfbb76' },
      { y: 14, half: 15, color: cooked ? '#f8e7af' : '#edd798' }
    ];
    svg.push(rect(22, 40, 52, 4, '#53311c', 0.42));
    rows.forEach(function (row) {
      var half = Math.max(8, Math.round(row.half * fill));
      svg.push(rect(48 - half, row.y, half * 2, 4, row.color));
    });

    var accents = {
      oil: { color: '#ffe27a', cells: [[22,28],[30,20],[64,18],[72,26]] },
      meat: { color: '#8d4a4a', cells: [[36,30],[48,26],[58,30]] },
      onion: { color: '#d7b16d', cells: [[28,24],[42,22],[62,24]] },
      carrot: { color: '#f28e33', cells: [[24,22],[36,18],[54,18],[68,22]] },
      spices: { color: '#7cc882', cells: [[32,18],[44,24],[60,20],[70,18]] },
      water: { color: '#82d9ff', cells: [[20,30],[72,30],[52,14]] },
      rice: { color: '#fff8ef', cells: [[30,14],[38,12],[46,14],[54,12],[62,14]] },
      garlic: { color: '#efe4cf', cells: [[20,24],[74,24],[50,20]] }
    };

    ingredients.forEach(function (itemId) {
      var accent = accents[itemId];
      if (!accent) return;
      accent.cells.forEach(function (cell) {
        svg.push(rect(cell[0], cell[1], 4, 4, accent.color));
      });
    });

    svg.push(px('#fffdf8', [[34,12],[42,10],[50,12],[58,10]]));
    svg.push('</svg>');
    return dataUri(svg.join(''));
  }

  function makePlovPlateSprite(ingredients, served) {
    var svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 84" shape-rendering="crispEdges">'];
    svg.push(rect(20, 60, 72, 6, '#7b4d2b', 0.32));
    var rows = [
      { y: 50, half: 34, color: served ? '#9a5c34' : '#8a5633' },
      { y: 44, half: 30, color: served ? '#b6723d' : '#aa6a38' },
      { y: 38, half: 26, color: served ? '#cc8d49' : '#c07f45' },
      { y: 32, half: 22, color: served ? '#e0ab61' : '#d39a56' },
      { y: 26, half: 17, color: served ? '#ecd088' : '#e2c27a' },
      { y: 20, half: 10, color: served ? '#f7e9b1' : '#eddc9a' }
    ];
    rows.forEach(function (row) {
      svg.push(rect(56 - row.half, row.y, row.half * 2, 6, row.color));
    });
    var accents = {
      meat: { color: '#8d4a4a', cells: [[44,46],[56,40],[66,46]] },
      carrot: { color: '#f28e33', cells: [[40,34],[52,30],[66,34]] },
      onion: { color: '#d7b16d', cells: [[34,40],[48,36],[70,40]] },
      spices: { color: '#7cc882', cells: [[46,28],[60,34],[70,30]] },
      rice: { color: '#fff8ef', cells: [[42,24],[50,22],[58,24],[66,22]] },
      garlic: { color: '#efe4cf', cells: [[34,34],[76,36]] },
      oil: { color: '#ffe27a', cells: [[30,44],[74,42]] },
      water: { color: '#8edfff', cells: [[56,18]] }
    };
    (ingredients || []).forEach(function (itemId) {
      var accent = accents[itemId];
      if (!accent) return;
      accent.cells.forEach(function (cell) {
        svg.push(rect(cell[0], cell[1], 4, 4, accent.color));
      });
    });
    svg.push(px('#fffdf8', [[44,22],[52,20],[60,22],[68,20]]));
    svg.push('</svg>');
    return dataUri(svg.join(''));
  }

  function makePixelSprite(itemId) {
    var head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">';
    var tail = '</svg>';

    var sprites = {
      rice: head +
        '<rect x="9" y="20" width="14" height="5" fill="#c6ae84"/>' +
        '<rect x="10" y="17" width="12" height="4" fill="#eee1bf"/>' +
        px('#fffaf1', [[9,15],[11,14],[13,15],[15,14],[17,15],[19,14],[21,15],[10,17],[12,16],[14,17],[16,16],[18,17],[20,16],[22,17],[11,19],[13,18],[15,19],[17,18],[19,19],[21,18]]) +
        tail,
      meat: head +
        '<rect x="9" y="9" width="14" height="14" fill="#8c3e63"/>' +
        '<rect x="11" y="11" width="10" height="10" fill="#a34b72"/>' +
        '<rect x="21" y="12" width="3" height="8" fill="#e7d7bf"/>' +
        '<rect x="24" y="13" width="2" height="6" fill="#c9b79b"/>' + tail,
      carrot: head +
        '<rect x="13" y="8" width="6" height="4" fill="#5fc77f"/>' +
        '<rect x="11" y="12" width="10" height="14" fill="#f28e33"/>' +
        '<rect x="13" y="26" width="6" height="2" fill="#d16b22"/>' + tail,
      onion: head +
        '<rect x="12" y="8" width="8" height="4" fill="#cfa56a"/>' +
        '<rect x="10" y="12" width="12" height="12" fill="#ddb67a"/>' +
        '<rect x="14" y="6" width="4" height="3" fill="#8bbf54"/>' + tail,
      garlic: head +
        '<rect x="11" y="10" width="10" height="4" fill="#caa2e7"/>' +
        '<rect x="9" y="14" width="14" height="10" fill="#d8b9ef"/>' +
        '<rect x="14" y="7" width="4" height="3" fill="#8db072"/>' + tail,
      oil: head +
        '<rect x="12" y="6" width="8" height="3" fill="#8e623f"/>' +
        '<rect x="11" y="9" width="10" height="16" fill="#9d6e46"/>' +
        '<rect x="13" y="11" width="6" height="10" fill="#c78b56"/>' + tail,
      spices: head +
        '<rect x="11" y="8" width="10" height="4" fill="#648878"/>' +
        '<rect x="9" y="12" width="14" height="10" fill="#6e977e"/>' +
        '<rect x="11" y="16" width="10" height="4" fill="#526f61"/>' + tail,
      water: head +
        '<rect x="11" y="8" width="10" height="4" fill="#5d88ac"/>' +
        '<rect x="10" y="12" width="12" height="12" fill="#4e7fb0"/>' +
        '<rect x="12" y="14" width="8" height="8" fill="#76c6ff"/>' + tail,
      lid: head +
        '<rect x="9" y="14" width="14" height="6" fill="#8da1c7"/>' +
        '<rect x="13" y="10" width="6" height="4" fill="#b9c5db"/>' + tail,
      ladle: head +
        '<rect x="8" y="15" width="12" height="3" fill="#bfd2f7"/>' +
        '<rect x="20" y="13" width="4" height="7" fill="#dbe7ff"/>' +
        '<rect x="24" y="11" width="3" height="11" fill="#a7b7d7"/>' + tail,
    };

    return dataUri(sprites[itemId] || sprites.rice);
  }

  function makePotSvg() {
    return dataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" shape-rendering="crispEdges">'
      + '<rect x="18" y="14" width="60" height="8" fill="#576985"/>'
      + '<rect x="12" y="22" width="72" height="8" fill="#43556f"/>'
      + '<rect x="8" y="30" width="80" height="22" fill="#2a3b52"/>'
      + '<rect x="14" y="52" width="68" height="8" fill="#1f2d3f"/>'
      + '<rect x="6" y="34" width="6" height="12" fill="#667a9f"/>'
      + '<rect x="84" y="34" width="6" height="12" fill="#667a9f"/>'
      + '<rect x="22" y="26" width="52" height="24" fill="#0b1623"/>'
      + '<rect x="26" y="30" width="44" height="16" fill="#050c15"/>'
      + '<rect x="18" y="60" width="10" height="4" fill="#32465f"/>'
      + '<rect x="68" y="60" width="10" height="4" fill="#32465f"/>'
      + '</svg>');
  }

  function announceCurrentStep() {
    var step = currentStep();
    if (!step || state.completed) return;
    if (refs.taskModalText) refs.taskModalText.textContent = step.prompt;
    pulse(refs.taskButton);
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () {
      if (!state.taskOpen) setToast("Открой вкладку «Задание».", "info");
    }, Math.max(1200, autoHintMs));
  }

  function setToast(text, kind) {
    clearTimeout(toastTimer);
    refs.feedback.textContent = text || "";
    refs.feedback.className = "toast" + (text ? " is-visible" : "") + (kind ? " toast--" + kind : "");
    if (text) {
      toastTimer = setTimeout(function () {
        refs.feedback.classList.remove("is-visible");
      }, 1800);
    }
  }

  function triggerEffect(name) {
    refs.boardEffects.className = "board-effects board-effects--" + name;
    window.setTimeout(function () {
      refs.boardEffects.className = "board-effects";
    }, 420);
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove("is-pulse");
    void el.offsetWidth;
    el.classList.add("is-pulse");
  }

  function animateFly(sourceEl, targetEl, itemId, callback) {
    if (!sourceEl || !targetEl) {
      if (callback) callback();
      return;
    }
    var sourceRect = sourceEl.getBoundingClientRect();
    var targetRect = targetEl.getBoundingClientRect();
    var fly = document.createElement("div");
    fly.className = "fly-sprite";
    fly.style.backgroundImage = makePixelSprite(itemId);
    fly.style.left = sourceRect.left + sourceRect.width / 2 + "px";
    fly.style.top = sourceRect.top + sourceRect.height / 2 + "px";
    document.body.appendChild(fly);

    requestAnimationFrame(function () {
      fly.style.transform = "translate(" + (targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2) + "px, " + (targetRect.top + targetRect.height / 2 - sourceRect.top - sourceRect.height / 2) + "px) scale(0.6)";
      fly.style.opacity = "0.15";
    });

    setTimeout(function () {
      fly.remove();
      if (callback) callback();
    }, 460);
  }

  function renderStartTexts() {
    var subtitle = applyTemplate(ui.heroSubtitle || "");
    refs.heroLabel.textContent = ui.heroLabel || "ПРАЗДНИЧНАЯ КУХНЯ";
    refs.heroTitle.textContent = applyTemplate(ui.heroTitle || "Приготовь праздничный плов");
    refs.heroSubtitle.textContent = subtitle;
    refs.heroSubtitle.style.display = subtitle ? "block" : "none";
    refs.startButton.textContent = ui.startButton || "Начать";
    if (refs.birthdayBanner) refs.birthdayBanner.textContent = applyTemplate(ui.bannerText || "{name}, С ДНЁМ РОЖДЕНИЯ");
  }

  function renderGift() {
    refs.finalBadge.textContent = ui.finalBadge || "ПОБЕДА";
    refs.finalTitle.textContent = ui.finalTitle || "Готово";
    refs.finalSubtitle.textContent = ui.finalSubtitle || "";
    refs.giftTitle.textContent = gift.title || "Подарок";
    refs.giftDescription.textContent = gift.description || "";
    refs.giftAdditionalMessage.textContent = gift.additionalMessage || "";
    if (refs.giftLinkLabel) refs.giftLinkLabel.textContent = ui.giftLinkLabel || "Ссылка";
    if (refs.giftLink) {
      refs.giftLink.textContent = gift.link || "";
      refs.giftLink.href = gift.link || "#";
      if (refs.giftLink.parentElement) refs.giftLink.parentElement.style.display = gift.link ? "block" : "none";
    }
    refs.giftLoginLabel.textContent = ui.giftLoginLabel || "Логин";
    refs.giftLogin.textContent = gift.login || "";
    refs.giftPasswordLabel.textContent = ui.giftPasswordLabel || "Пароль";
    refs.giftPassword.textContent = gift.password || "";
    refs.finalGreeting.textContent = applyTemplate(birthday.finalGreeting || "");
    if (refs.giftOpenButton) {
      refs.giftOpenButton.textContent = ui.openGiftButton || "Открыть подарок";
      refs.giftOpenButton.href = gift.link || "#";
      refs.giftOpenButton.style.display = gift.link ? "inline-flex" : "none";
    }
    refs.playAgainButton.textContent = ui.playAgainButton || "Пройти ещё раз";
  }

  function renderInventory() {
    refs.inventoryGrid.innerHTML = "";

    if (!state.inventory.length) {
      var empty = document.createElement("div");
      empty.className = "inventory-empty";
      empty.textContent = "Сундук пуст — все продукты уже в деле.";
      refs.inventoryGrid.appendChild(empty);
      return;
    }

    state.inventory.forEach(function (itemId) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "inventory-item";
      button.dataset.itemId = itemId;
      var sprite = document.createElement("div");
      sprite.className = "sprite sprite--inventory";
      sprite.style.backgroundImage = makePixelSprite(itemId);
      var label = document.createElement("div");
      label.className = "inventory-item__label";
      label.textContent = getItemLabel(itemId, { prepared: !!state.prepped[itemId] });
      button.appendChild(sprite);
      button.appendChild(label);
      button.addEventListener("click", onInventoryItemClick);
      refs.inventoryGrid.appendChild(button);
    });
  }

  function renderBoard() {
    refs.boardSurface.innerHTML = "";
    refs.prepBoard.classList.toggle("is-active-step", !!currentStep() && currentStep().target === "board");

    if (!state.boardItem) return;

    var item = document.createElement("button");
    item.type = "button";
    item.className = "board-item";
    item.dataset.itemId = state.boardItem;

    var sprite = document.createElement("div");
    sprite.className = "sprite sprite--board";
    sprite.style.backgroundImage = makePixelSprite(state.boardItem);

    var label = document.createElement("div");
    label.className = "board-item__label";
    label.textContent = getItemLabel(state.boardItem);

    var holdFill = document.createElement("div");
    holdFill.className = "hold-fill";

    item.appendChild(sprite);
    item.appendChild(label);
    item.appendChild(holdFill);
    item.addEventListener("click", onBoardClick);
    item.addEventListener("pointerdown", onBoardPointerDown);
    item.addEventListener("pointerup", onBoardPointerUp);
    item.addEventListener("pointercancel", onBoardPointerUp);
    item.addEventListener("lostpointercapture", onBoardPointerUp);
    item.addEventListener("pointermove", onBoardPointerMove);
    refs.boardSurface.appendChild(item);
  }

  function renderPrepTray() {
    refs.prepTray.innerHTML = "";
  }

  function renderKazan() {
    refs.stove.classList.toggle("is-active-step", !!currentStep() && (currentStep().target === "stove" || currentStep().target === "kazan"));
    refs.kazan.classList.toggle("is-active-step", !!currentStep() && currentStep().target === "kazan");
    refs.flame.classList.toggle("is-off", !state.pot.flameOn);
    refs.kazanLid.classList.toggle("is-hidden", !state.pot.lidOn);
    refs.kazanSteam.classList.toggle("is-hidden", !state.pot.cooked);
    refs.kazanContent.innerHTML = "";
    refs.kazan.style.backgroundImage = makePotSvg();
    refs.kazan.style.backgroundSize = "100% 100%";

    if (state.pot.ingredients.length) {
      var plov = document.createElement("div");
      plov.className = "plov-surface" + (state.pot.cooked ? " is-cooked" : "");
      plov.style.backgroundImage = makePlovPotSprite(state.pot.ingredients, state.pot.cooked);
      refs.kazanContent.appendChild(plov);
    }

    refs.lidTool.style.backgroundImage = makePixelSprite("lid");
    refs.ladleTool.style.backgroundImage = makePixelSprite("ladle");
    refs.lidTool.dataset.label = "Крышка";
    refs.ladleTool.dataset.label = "Половник";
    refs.lidTool.classList.toggle("is-active-step", !!currentStep() && currentStep().item === "lid");
    refs.ladleTool.classList.toggle("is-active-step", !!currentStep() && currentStep().item === "ladle");
  }

  function renderPlate() {
    refs.plate.classList.toggle("is-active-step", !!currentStep() && currentStep().item === "plate");
    refs.plateFood.classList.toggle("is-hidden", !state.plate.plated);
    refs.plateFood.classList.toggle("is-hot", !!state.plate.plated);
    refs.plateFood.classList.toggle("is-served", !!state.plate.served);
    refs.plateFood.style.backgroundImage = state.plate.plated ? makePlovPlateSprite(state.pot.ingredients, state.plate.served) : "";
  }

  function renderGameTexts() {
    refs.chestButton.textContent = "Сундук";
    refs.chestButton.classList.toggle("is-open", state.inventoryOpen);
    refs.taskButton.textContent = ui.taskButton || "Задание";
    refs.restartButton.textContent = ui.restartButton || "Сначала";
    var step = currentStep();
    if (refs.taskModalText) refs.taskModalText.textContent = step ? step.prompt : "Сначала нажми «Начать игру».";
  }

  function renderVisibility() {
    refs.startScreen.classList.toggle("is-hidden", state.started);
    refs.gameScreen.classList.toggle("is-hidden", !state.started);
    refs.inventoryModal.classList.toggle("is-hidden", !state.inventoryOpen);
    refs.taskModal.classList.toggle("is-hidden", !state.taskOpen);
    refs.finalModal.classList.toggle("is-hidden", !state.completed);
  }

  function render() {
    renderStartTexts();
    renderGift();
    renderInventory();
    renderGameTexts();
    renderBoard();
    renderPrepTray();
    renderKazan();
    renderPlate();
    renderVisibility();
  }

  function toggleInventory(force) {
    state.inventoryOpen = typeof force === "boolean" ? force : !state.inventoryOpen;
    if (state.inventoryOpen) state.taskOpen = false;
    saveState();
    renderVisibility();
  }

  function toggleTask(force) {
    state.taskOpen = typeof force === "boolean" ? force : !state.taskOpen;
    if (state.taskOpen) state.inventoryOpen = false;
    saveState();
    renderVisibility();
  }

  function beginGame() {
    state.started = true;
    saveState();
    render();
    announceCurrentStep();
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }

  function advanceStep(message) {
    state.activeProgress = 0;
    state.stepIndex += 1;
    if (state.stepIndex >= steps.length) {
      state.completed = true;
    }
    saveState();
    render();
    if (message) setToast(message, "success");
    if (!state.completed) announceCurrentStep();
  }

  function applyResult(step) {
    var result = step.result || {};
    if (result.storePrepared) {
      state.prepped[result.storePrepared] = true;
      state.boardItem = null;
      addInventoryItem(result.storePrepared);
    }
    if (result.flameOn) state.pot.flameOn = true;
    if (result.potAdd && state.pot.ingredients.indexOf(result.potAdd) === -1) {
      state.pot.ingredients.push(result.potAdd);
      if (state.boardItem === result.potAdd) state.boardItem = null;
      removeInventoryItem(result.potAdd);
      if (state.prepped[result.potAdd]) state.prepped[result.potAdd] = false;
    }
    if (result.lidOn) state.pot.lidOn = true;
    if (result.cooked) state.pot.cooked = true;
    if (result.plateFood) state.plate.plated = true;
    if (result.served) state.plate.served = true;
  }

  function completeStep(step, message) {
    applyResult(step);
    advanceStep(message || step.successText);
  }

  function onInventoryItemClick(event) {
    var step = currentStep();
    var itemId = event.currentTarget.dataset.itemId;

    if (!step) {
      setToast(ui.inventoryHint || "Сейчас нужен другой шаг.", "warn");
      return;
    }

    if (step.type === "select-item") {
      if (step.item !== itemId) {
        setToast("Сейчас нужен: " + getItemLabel(step.item) + ".", "warn");
        pulse(event.currentTarget);
        return;
      }

      animateFly(event.currentTarget, refs.prepBoard, itemId, function () {
        removeInventoryItem(itemId);
        state.boardItem = itemId;
        toggleInventory(false);
        completeStep(step);
      });
      return;
    }

    if (step.type === "inventory-to-pot") {
      if (step.item !== itemId) {
        setToast("Сейчас нужен: " + getItemLabel(step.item, { prepared: !!state.prepped[step.item] }) + ".", "warn");
        pulse(event.currentTarget);
        return;
      }

      animateFly(event.currentTarget, refs.kazan, itemId, function () {
        pulse(refs.kazan);
        toggleInventory(false);
        completeStep(step);
      });
      return;
    }

    setToast(ui.inventoryHint || "Сейчас нужен другой шаг.", "warn");
  }

  function progressTap(step, effectName) {
    state.activeProgress += 1;
    triggerEffect(effectName);
    pulse(refs.prepBoard.querySelector(".board-item"));
    saveState();
    if (state.activeProgress >= (step.count || 1)) {
      completeStep(step);
    } else {
      setToast("Ещё немного.", "info");
    }
  }

  function onBoardClick() {
    if (Date.now() < ignoreBoardClickUntil) return;
    if (refs.prepBoard.querySelector(".board-item.is-holding")) return;
    var step = currentStep();
    if (!step || !state.boardItem) return;

    if (step.type === "tap-count" && step.target === "board" && step.item === state.boardItem) {
      progressTap(step, step.effect || "tap");
      return;
    }

    if (step.type === "board-to-pot" && step.item === state.boardItem) {
      animateFly(refs.prepBoard.querySelector(".board-item"), refs.kazan, state.boardItem, function () {
        triggerEffect("pour");
        pulse(refs.kazan);
        completeStep(step);
      });
      return;
    }

    setToast("Сейчас нужно другое действие.", "warn");
  }

  function onBoardPointerDown(event) {
    var step = currentStep();
    if (!step || !state.boardItem) return;
    var targetEl = event.currentTarget;
    if (targetEl && typeof targetEl.setPointerCapture === "function" && event.pointerId !== undefined) {
      try { targetEl.setPointerCapture(event.pointerId); } catch (error) {}
    }
    pulse(targetEl);

    if (step.type === "hold" && step.target === "board" && step.item === state.boardItem) {
      event.preventDefault();
      boardHoldDone = false;
      holdStartedAt = Date.now();
      targetEl.classList.add("is-holding");
      holdTimer = setTimeout(function () {
        holdTimer = null;
        boardHoldDone = true;
        targetEl.classList.remove("is-holding");
        triggerEffect(step.effect || "wash");
        ignoreBoardClickUntil = Date.now() + 900;
        completeStep(step);
      }, step.duration || 1000);
      return;
    }

    if (step.type === "swipe-count" && step.target === "board" && step.item === state.boardItem) {
      swipeStart = { x: event.clientX, y: event.clientY };
    }
  }

  function onBoardPointerMove(event) {
    var step = currentStep();
    if (!step || step.type !== "swipe-count" || !swipeStart) return;
    var dx = Math.abs(event.clientX - swipeStart.x);
    var dy = Math.abs(event.clientY - swipeStart.y);
    if (Math.max(dx, dy) > 26) {
      swipeStart = { x: event.clientX, y: event.clientY };
      state.activeProgress += 1;
      triggerEffect(step.effect || "peel");
      pulse(refs.prepBoard.querySelector(".board-item"));
      saveState();
      if (state.activeProgress >= (step.count || 1)) {
        completeStep(step);
      }
    }
  }

  function onBoardPointerUp(event) {
    var step = currentStep();
    var targetEl = event.currentTarget;
    if (targetEl && typeof targetEl.hasPointerCapture === "function" && event.pointerId !== undefined) {
      try {
        if (targetEl.hasPointerCapture(event.pointerId)) targetEl.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      targetEl.classList.remove("is-holding");
      if (step && step.type === "hold") {
        if (Date.now() - holdStartedAt >= (step.duration || 1000)) {
          if (!boardHoldDone) {
            boardHoldDone = true;
            triggerEffect(step.effect || "wash");
            ignoreBoardClickUntil = Date.now() + 900;
            completeStep(step);
          }
        } else if (!boardHoldDone) {
          setToast("Подержи чуть дольше.", "warn");
        }
      }
    }
    swipeStart = null;
  }

  function onTrayItemClick(event) {
    var step = currentStep();
    var itemId = event.currentTarget.dataset.itemId;
    if (!step || step.type !== "tray-to-pot") {
      setToast("Этот продукт пока подождёт своего часа.", "warn");
      return;
    }
    if (step.item !== itemId) {
      setToast("Сейчас нужен: " + getItemLabel(step.item) + ".", "warn");
      return;
    }
    animateFly(event.currentTarget, refs.kazan, itemId, function () {
      pulse(refs.kazan);
      completeStep(step);
    });
  }

  function onStoveClick() {
    var step = currentStep();
    if (!step || step.target !== "stove") {
      setToast("Сейчас плита отдыхает.", "warn");
      return;
    }
    state.activeProgress += 1;
    refs.flame.classList.remove("is-off");
    pulse(refs.stove);
    setToast("Греем дальше.", "info");
    if (state.activeProgress >= (step.count || 1)) {
      completeStep(step);
    }
    saveState();
  }

  function onKazanPointerDown(event) {
    var step = currentStep();
    if (!step) return;
    var targetEl = refs.kazan;
    if (targetEl && typeof targetEl.setPointerCapture === "function" && event.pointerId !== undefined) {
      try { targetEl.setPointerCapture(event.pointerId); } catch (error) {}
    }

    if (step.type === "hold" && step.target === "kazan") {
      event.preventDefault();
      kazanHoldDone = false;
      holdStartedAt = Date.now();
      ignoreKazanClickUntil = Date.now() + (step.duration || 1000) + 900;
      refs.kazan.classList.add("is-holding");
      holdTimer = setTimeout(function () {
        holdTimer = null;
        kazanHoldDone = true;
        refs.kazan.classList.remove("is-holding");
        ignoreKazanClickUntil = Date.now() + 900;
        completeStep(step);
      }, step.duration || 1000);
      return;
    }
  }

  function onKazanPointerMove(event) {
    var step = currentStep();
    if (!step || step.type !== "stir" || !stirData) return;
    var dx = event.clientX - stirData.x;
    var dy = event.clientY - stirData.y;
    stirData.value += Math.abs(dx) + Math.abs(dy);
    stirData.x = event.clientX;
    stirData.y = event.clientY;
    if (stirData.value >= (step.threshold || 160)) {
      stirData = null;
      refs.kazan.classList.remove("is-stirring");
      completeStep(step);
    }
  }

  function onKazanPointerUp(event) {
    var targetEl = refs.kazan;
    if (targetEl && event && typeof targetEl.hasPointerCapture === "function" && event.pointerId !== undefined) {
      try {
        if (targetEl.hasPointerCapture(event.pointerId)) targetEl.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      refs.kazan.classList.remove("is-holding");
      var step = currentStep();
      if (step && step.type === "hold") {
        if (Date.now() - holdStartedAt >= (step.duration || 1000)) {
          if (!kazanHoldDone) {
            kazanHoldDone = true;
            ignoreKazanClickUntil = Date.now() + 900;
            completeStep(step);
          }
        } else if (!kazanHoldDone) {
          setToast("Подержи чуть дольше.", "warn");
        }
      }
    }
    stirData = null;
    refs.kazan.classList.remove("is-stirring");
  }

  function onKazanClick() {
    if (Date.now() < ignoreKazanClickUntil) return;
    var step = currentStep();
    if (!step) return;
    if (step.type === "tap-count" && step.target === "kazan") {
      state.activeProgress += 1;
      pulse(refs.kazan);
      triggerEffect(step.effect || "steam");
      refs.kazanSteam.classList.remove("is-hidden");
      saveState();
      if (state.activeProgress >= (step.count || 1)) {
        completeStep(step);
      } else {
        setToast("Ещё немного.", "info");
      }
      return;
    }
    if (step.type !== "hold") {
      setToast("Сейчас нужно другое действие.", "warn");
    }
  }

  function onToolClick(event) {
    var step = currentStep();
    if (!step || step.type !== "tool-tap") {
      setToast("Сейчас нужен другой шаг.", "warn");
      return;
    }
    var toolId = event.currentTarget.id === "lidTool" ? "lid" : "ladle";
    if (step.item !== toolId) {
      setToast("Сейчас нужен: " + getItemLabel(step.item) + ".", "warn");
      return;
    }

    var target = toolId === "lid" ? refs.kazan : refs.plate;
    animateFly(event.currentTarget, target, toolId, function () {
      if (toolId === "lid") refs.kazanLid.classList.remove("is-hidden");
      if (toolId === "ladle") refs.plateFood.classList.remove("is-hidden");
      pulse(target);
      completeStep(step);
    });
  }

  function onPlateClick() {
    var step = currentStep();
    if (!step || step.type !== "plate-tap") {
      setToast("Сейчас тарелка просто ждёт своего часа.", "warn");
      return;
    }
    pulse(refs.plate);
    refs.plate.classList.add("is-served");
    completeStep(step);
  }

  function bindEvents() {
    refs.startButton.addEventListener("click", beginGame);
    refs.chestButton.addEventListener("click", function () {
      toggleInventory();
      pulse(refs.chestButton);
    });
    refs.inventoryBackdrop.addEventListener("click", function () { toggleInventory(false); });
    refs.inventoryClose.addEventListener("click", function () { toggleInventory(false); });
    refs.taskBackdrop.addEventListener("click", function () { toggleTask(false); });
    refs.taskClose.addEventListener("click", function () { toggleTask(false); });
    refs.taskButton.addEventListener("click", function () { toggleTask(); pulse(refs.taskButton); });
    refs.restartButton.addEventListener("click", function () { resetState({ start: true }); });
    refs.playAgainButton.addEventListener("click", function () { resetState({ start: true }); });
    refs.modalBackdrop.addEventListener("click", function () {
      refs.finalModal.classList.add("is-hidden");
    });

    refs.stove.addEventListener("click", onStoveClick);
    refs.kazan.addEventListener("pointerdown", onKazanPointerDown);
    refs.kazan.addEventListener("pointermove", onKazanPointerMove);
    refs.kazan.addEventListener("pointerup", onKazanPointerUp);
    refs.kazan.addEventListener("pointercancel", onKazanPointerUp);
    refs.kazan.addEventListener("lostpointercapture", onKazanPointerUp);
    refs.kazan.addEventListener("click", onKazanClick);
    refs.lidTool.addEventListener("click", onToolClick);
    refs.ladleTool.addEventListener("click", onToolClick);
    refs.plate.addEventListener("click", onPlateClick);
  }

  function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }

  window.resetProgress = function resetProgress() {
    localStorage.removeItem(storageKey);
    resetState();
  };

  initRefs();
  bindEvents();
  initTelegram();
  render();
  if (state.started && !state.completed) announceCurrentStep();
})();
