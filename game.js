"use strict";

const GRID = 4;

const FOOD = {
  bread: { name: "面包", shape: [[0, 0]], rotatable: false, tier: "基础", value: 4, desc: "松软的汉堡面包" },
  beefPatty: { name: "牛肉饼", shape: [[0, 0]], rotatable: false, tier: "基础", value: 5, desc: "汉堡的核心食材" },
  cheese: { name: "芝士片", shape: [[0, 0]], rotatable: false, tier: "基础", value: 4, desc: "让汉堡身价翻倍" },
  cola: { name: "可乐", shape: [[0, 0]], rotatable: false, tier: "基础", value: 5, desc: "必须竖直摆放" },
  milkTea: { name: "奶茶", shape: [[0, 0]], rotatable: false, tier: "基础", value: 5, desc: "必须竖直摆放" },
  cream: { name: "奶油", shape: [[0, 0]], rotatable: false, tier: "基础", value: 4, desc: "制作奶盖的材料" },
  chicken: { name: "炸鸡", shape: [[0, 0], [1, 0]], rotatable: true, tier: "半成品", value: 8, desc: "占两格，可以旋转" },
  burgerPatty: { name: "汉堡排", shape: [[0, 0], [1, 0]], rotatable: true, tier: "半成品", value: 11, desc: "1×2，可旋转" },
  bigTea: { name: "大杯奶茶", shape: [[0, 0]], rotatable: false, tier: "半成品", value: 12, desc: "更值钱但仍只占一格" },
  cheeseBurger: { name: "芝士汉堡", shape: [[0, 0], [1, 0], [0, 1]], rotatable: true, tier: "大菜", value: 22, desc: "L型大菜，可旋转" },
  chickenBucket: { name: "炸鸡桶", shape: [[0, 0], [1, 0], [0, 1], [1, 1]], rotatable: false, tier: "大菜", value: 24, desc: "完整占据2×2" },
  foamTea: { name: "奶盖奶茶", shape: [[0, 0], [0, 1]], rotatable: false, tier: "大菜", value: 24, desc: "必须竖直摆放" },
  cheeseCombo: { name: "芝士汉堡套餐", shape: [[0, 0], [1, 0], [0, 1], [1, 1]], rotatable: false, tier: "终极", value: 42, desc: "汉堡加可乐，完整2×2" },
  wholeChicken: { name: "全鸡", shape: [[0, 0], [1, 0], [0, 1], [1, 1]], rotatable: true, tier: "终极", value: 50, desc: "两个炸鸡桶合成" },
  badReview: { name: "差评块", shape: [[0, 0]], rotatable: false, tier: "差评", value: 0, desc: "原地封锁食物占过的格子" }
};

const RECIPES = [
  { a: "bread", b: "beefPatty", result: "burgerPatty" },
  { a: "burgerPatty", b: "cheese", result: "cheeseBurger" },
  { a: "cheeseBurger", b: "cola", result: "cheeseCombo" },
  { a: "chicken", b: "chicken", result: "chickenBucket" },
  { a: "chickenBucket", b: "chickenBucket", result: "wholeChicken" },
  { a: "milkTea", b: "milkTea", result: "bigTea" },
  { a: "bigTea", b: "cream", result: "foamTea" }
];

const CATCHABLE = ["bread", "beefPatty", "cheese", "cola", "milkTea", "cream", "chicken"];
const INITIAL_ORDERS = ["burgerPatty", "chickenBucket", "bigTea"];
const ORDER_POOL = [
  { type: "burgerPatty", level: 1 }, { type: "chickenBucket", level: 1 }, { type: "bigTea", level: 1 },
  { type: "cheeseBurger", level: 2 }, { type: "foamTea", level: 2 },
  { type: "cheeseCombo", level: 3 }, { type: "wholeChicken", level: 3 }
];
const DOWNGRADES = {
  burgerPatty: ["bread", "beefPatty"], chickenBucket: ["chicken"], bigTea: ["milkTea"],
  cheeseBurger: ["burgerPatty"], foamTea: ["bigTea", "milkTea"],
  cheeseCombo: ["cheeseBurger"], wholeChicken: ["chickenBucket"]
};

const state = {
  items: [], orders: [], falling: new Map(), hand: null, selectedId: null,
  level: 1, quota: 3, delivered: 0, coins: 0, shiftIncome: 0,
  insulation: 0, maxFresh: 3, uid: 1, dropUid: 1,
  running: false, paused: true, locked: false, sound: true,
  lastMessage: "点击上方正在掉落的包裹",
  scriptedDrops: ["bread", "beefPatty", "chicken", "chicken", "milkTea", "milkTea", "cheese", "cola", "cream"],
  drag: null, suppressClick: false, theme: "warm"
};

const $ = (selector) => document.querySelector(selector);
const backpack = $("#backpack");
const sky = $("#sky");
const toast = $("#toast");
let spawnTimer = null;
let toastTimer = null;
let audioContext = null;

function init() {
  loadProgress();
  buildGrid();
  state.orders = INITIAL_ORDERS.map((type, index) => createOrder(type, index));
  bindEvents();
  renderRecipes();
  render();
  spawnTimer = window.setInterval(spawnDrop, 1900);
  document.body.dataset.theme = state.theme;
  updateThemeButtons();
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("pocket-delivery-progress") || "{}");
    state.coins = Number(saved.coins) || 0;
    state.insulation = Number(saved.insulation) || 0;
    state.maxFresh = 3 + state.insulation;
    state.theme = saved.theme === "cyber" ? "cyber" : "warm";
    state.sound = saved.sound !== false;
  } catch (_) { /* A fresh save is fine. */ }
}

function saveProgress() {
  try {
    localStorage.setItem("pocket-delivery-progress", JSON.stringify({ coins: state.coins, insulation: state.insulation, theme: state.theme, sound: state.sound }));
  } catch (_) { /* Storage is optional. */ }
}

function buildGrid() {
  backpack.innerHTML = "";
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "grid-cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.style.left = `${x * 25}%`;
      cell.style.top = `${y * 25}%`;
      cell.setAttribute("aria-label", `背包第${y + 1}行第${x + 1}列`);
      backpack.appendChild(cell);
    }
  }
}

function bindEvents() {
  backpack.addEventListener("click", onBackpackClick);
  backpack.addEventListener("pointerdown", onItemPointerDown);
  window.addEventListener("pointermove", onItemPointerMove, { passive: false });
  window.addEventListener("pointerup", onItemPointerUp);
  window.addEventListener("pointercancel", onItemPointerUp);
  $("#startButton").addEventListener("click", startGame);
  $("#menuButton").addEventListener("click", () => openModal("menuModal"));
  $("#helpButton").addEventListener("click", () => openModal("startModal"));
  $("#recipeButton").addEventListener("click", () => openModal("recipeModal"));
  $("#themeButton").addEventListener("click", () => openModal("themeModal"));
  $("#rotateButton").addEventListener("click", rotateCurrent);
  $("#pickupButton").addEventListener("click", pickUpSelected);
  $("#cancelButton").addEventListener("click", cancelCurrent);
  $("#upgradeButton").addEventListener("click", buyInsulation);
  $("#eraserButton").addEventListener("click", useEraser);
  $("#soundButton").addEventListener("click", toggleSound);
  $("#shareButton").addEventListener("click", shareGame);
  $("#resultShareButton").addEventListener("click", shareGame);
  $("#nextLevelButton").addEventListener("click", nextLevel);
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModals));
  document.querySelectorAll(".modal-backdrop").forEach((modal) => modal.addEventListener("click", (event) => {
    if (event.target === modal && modal.id !== "startModal" && modal.id !== "levelModal") closeModals();
  }));
  document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => setTheme(button.dataset.themeChoice)));
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "r") rotateCurrent();
    if (event.key === "Escape") { closeModals(); cancelCurrent(); }
    if (event.code === "Space" && state.running && !state.paused) {
      event.preventDefault();
      const lowest = [...state.falling.values()].sort((a, b) => b.element.getBoundingClientRect().top - a.element.getBoundingClientRect().top)[0];
      if (lowest) catchDrop(lowest.id);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) setPaused(true);
    else if (state.running && !anyModalOpen()) setPaused(false);
  });
}

function startGame() {
  $("#startModal").hidden = true;
  if (!state.running) {
    state.running = true;
    setPaused(false);
    spawnDrop();
    window.setTimeout(spawnDrop, 900);
  }
  setPaused(false);
  showToast("包裹开始降落！点中它就能接住", "good");
  playTone(620, .08);
  window.setTimeout(() => mobileFocus(sky), 120);
}

function setPaused(value) {
  state.paused = value;
  sky.classList.toggle("paused", value);
}

function anyModalOpen() {
  return [...document.querySelectorAll(".modal-backdrop")].some((modal) => !modal.hidden);
}

function spawnDrop() {
  if (!state.running || state.paused || state.locked || state.falling.size >= 3) return;
  const type = state.scriptedDrops.length ? state.scriptedDrops.shift() : chooseHelpfulDrop();
  const id = `drop-${state.dropUid++}`;
  const laneLoads = [0, 1, 2].map((lane) => [...state.falling.values()].filter((drop) => drop.lane === lane).length);
  const lightest = Math.min(...laneLoads);
  const possibleLanes = laneLoads.map((load, lane) => load === lightest ? lane : -1).filter((lane) => lane >= 0);
  const lane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
  const element = document.createElement("button");
  element.type = "button";
  element.className = "falling-item";
  element.dataset.dropId = id;
  element.style.setProperty("--lane", lane);
  element.style.setProperty("--duration", `${6.6 + Math.random() * .9}s`);
  element.setAttribute("aria-label", `接住正在降落的${FOOD[type].name}`);
  element.innerHTML = `<span class="parachute"></span><span class="parcel">${foodArtMarkup(type)}</span><span class="falling-name">${FOOD[type].name}</span>`;
  element.addEventListener("click", () => catchDrop(id));
  element.addEventListener("animationend", (event) => {
    if (event.animationName === "drop" && state.falling.has(id)) removeDrop(id, true);
  });
  sky.appendChild(element);
  state.falling.set(id, { id, type, lane, element });
  paintSprites(element);
  renderFallCount();
}

function removeDrop(id, missed = false) {
  const drop = state.falling.get(id);
  if (!drop) return;
  state.falling.delete(id);
  if (missed) {
    drop.element.remove();
    const label = $("#missedLabel");
    label.textContent = `放过了${FOOD[drop.type].name} · 不扣分`;
    window.setTimeout(() => { label.textContent = "不需要的可以放过"; }, 1100);
  } else {
    drop.element.classList.add("caught");
    window.setTimeout(() => drop.element.remove(), 270);
  }
  renderFallCount();
}

function catchDrop(id) {
  if (!state.running || state.paused || state.locked) return;
  const drop = state.falling.get(id);
  if (!drop) return;
  if (state.hand) {
    drop.element.classList.remove("denied");
    requestAnimationFrame(() => drop.element.classList.add("denied"));
    showToast(`手里已经拿着${FOOD[state.hand.type].name}，先放下或合成`, "bad");
    playTone(120, .08);
    return;
  }
  tickExisting([]);
  state.hand = { type: drop.type, rotation: 0, timer: state.maxFresh, origin: null };
  state.selectedId = null;
  removeDrop(id, false);
  showToast(`接住${FOOD[drop.type].name}！点空格放入，或直接点发光目标`, "good");
  playTone(520, .07);
  render();
  window.setTimeout(() => mobileFocus(backpack), 80);
}

function chooseHelpfulDrop() {
  const needs = state.orders.filter((order) => !order.done).flatMap((order) => baseIngredients(order.type));
  const weighted = needs.filter((type) => CATCHABLE.includes(type));
  const pool = Math.random() < .82 && weighted.length ? weighted : CATCHABLE;
  return pool[Math.floor(Math.random() * pool.length)];
}

function baseIngredients(type, depth = 0) {
  if (depth > 6 || CATCHABLE.includes(type)) return [type];
  const recipe = RECIPES.find((candidate) => candidate.result === type);
  if (!recipe) return [type];
  return [...baseIngredients(recipe.a, depth + 1), ...baseIngredients(recipe.b, depth + 1)];
}

function createItem(type, x, y, rotation = 0, timer = state.maxFresh, extra = {}) {
  return { id: `item-${state.uid++}`, type, x, y, rotation, timer, ...extra };
}

function createOrder(type, suffix = Date.now()) {
  return { id: `order-${suffix}-${Math.random().toString(16).slice(2)}`, type, done: false };
}

function shapeFor(type, rotation = 0) {
  let points = FOOD[type].shape.map(([x, y]) => [x, y]);
  for (let turn = 0; turn < rotation % 4; turn += 1) points = points.map(([x, y]) => [-y, x]);
  const minX = Math.min(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  return points.map(([x, y]) => [x - minX, y - minY]);
}

function itemShape(item) {
  return item.shapeOverride || shapeFor(item.type, item.rotation);
}

function itemCells(item, x = item.x, y = item.y, rotation = item.rotation) {
  const shape = item.shapeOverride || shapeFor(item.type, rotation);
  return shape.map(([dx, dy]) => [x + dx, y + dy]);
}

function itemAt(x, y) {
  return state.items.find((item) => itemCells(item).some(([cx, cy]) => cx === x && cy === y));
}

function canPlace(type, x, y, rotation = 0, ignoreIds = [], shapeOverride = null) {
  const cells = (shapeOverride || shapeFor(type, rotation)).map(([dx, dy]) => [x + dx, y + dy]);
  if (cells.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= GRID || cy >= GRID)) return false;
  return cells.every(([cx, cy]) => !state.items.some((item) => !ignoreIds.includes(item.id) && itemCells(item).some(([ix, iy]) => ix === cx && iy === cy)));
}

function recipeFor(a, b) {
  return RECIPES.find((recipe) => (recipe.a === a && recipe.b === b) || (recipe.a === b && recipe.b === a));
}

function onBackpackClick(event) {
  if (state.suppressClick || state.locked || state.paused) return;
  const itemElement = event.target.closest(".bag-item");
  if (itemElement) {
    const item = state.items.find((candidate) => candidate.id === itemElement.dataset.id);
    if (item) handleItemClick(item);
    return;
  }
  const cell = event.target.closest(".grid-cell");
  if (!cell) return;
  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  if (state.hand) placeHand(x, y);
  else if (state.selectedId) moveSelected(x, y);
}

function handleItemClick(item) {
  if (state.hand) {
    attemptHandMerge(item);
    return;
  }
  if (!state.selectedId) {
    state.selectedId = item.id;
    render();
    return;
  }
  if (state.selectedId === item.id) {
    state.selectedId = null;
    render();
    return;
  }
  const selected = state.items.find((candidate) => candidate.id === state.selectedId);
  const recipe = selected && recipeFor(selected.type, item.type);
  if (recipe) mergeBagItems(selected, item, recipe.result);
  else {
    state.selectedId = item.id;
    showToast("这两个不能合成，已改为选中新的食物");
    playTone(180, .05);
    render();
  }
}

function placeHand(x, y) {
  if (!state.hand) return;
  if (!canPlace(state.hand.type, x, y, state.hand.rotation)) {
    showToast("这个位置放不下，先整理背包", "bad");
    bump(backpack);
    return;
  }
  const item = createItem(state.hand.type, x, y, state.hand.rotation, state.hand.timer);
  state.items.push(item);
  const name = FOOD[state.hand.type].name;
  state.hand = null;
  state.selectedId = item.id;
  state.lastMessage = `${name}已放入背包`;
  showToast(`${name}已放入背包，拖动它可以继续整理`, "good");
  playTone(370, .05);
  render();
  window.setTimeout(() => mobileFocus(sky), 90);
}

function attemptHandMerge(target) {
  if (!state.hand || target.type === "badReview") return;
  const recipe = recipeFor(state.hand.type, target.type);
  if (!recipe) {
    showToast(`${FOOD[state.hand.type].name}不能和${FOOD[target.type].name}合成`, "bad");
    bump(targetElement(target.id));
    return;
  }
  if (!canPlace(recipe.result, target.x, target.y, 0, [target.id])) {
    showToast(`${FOOD[recipe.result].name}会变成${shapeLabel(recipe.result)}，目标旁边空间不够`, "bad");
    bump(targetElement(target.id));
    showPreview(recipe.result, target.x, target.y, 0, [target.id]);
    window.setTimeout(clearPreview, 700);
    return;
  }
  tickExisting([target.id]);
  state.items = state.items.filter((item) => item.id !== target.id);
  const result = createItem(recipe.result, target.x, target.y, 0, state.maxFresh);
  state.items.push(result);
  const handName = FOOD[state.hand.type].name;
  state.hand = null;
  state.selectedId = result.id;
  state.lastMessage = `刚合成：${FOOD[result.type].name}`;
  showToast(`${handName}直接合成成功：${FOOD[result.type].name}！鲜度回满`, "good");
  playMergeSound();
  render();
  animateItem(result.id);
  window.setTimeout(() => mobileFocus(sky), 90);
}

function mergeBagItems(first, second, resultType) {
  if (!canPlace(resultType, second.x, second.y, 0, [first.id, second.id])) {
    showToast(`${FOOD[resultType].name}会变成${shapeLabel(resultType)}，请先给它腾位置`, "bad");
    showPreview(resultType, second.x, second.y, 0, [first.id, second.id]);
    window.setTimeout(clearPreview, 700);
    return;
  }
  tickExisting([first.id, second.id]);
  state.items = state.items.filter((item) => item.id !== first.id && item.id !== second.id);
  const result = createItem(resultType, second.x, second.y, 0, state.maxFresh);
  state.items.push(result);
  state.selectedId = result.id;
  state.lastMessage = `刚合成：${FOOD[resultType].name}`;
  showToast(`合成成功：${FOOD[resultType].name}！鲜度回满`, "good");
  playMergeSound();
  render();
  animateItem(result.id);
}

function tickExisting(ignoreIds) {
  const expired = [];
  state.items.forEach((item) => {
    if (item.type === "badReview" || ignoreIds.includes(item.id)) return;
    item.timer -= 1;
    if (item.timer <= 0) expired.push(item);
  });
  expired.forEach((item) => {
    const oldName = FOOD[item.type].name;
    item.shapeOverride = itemShape(item).map(([x, y]) => [x, y]);
    item.type = "badReview";
    item.rotation = 0;
    item.timer = null;
    if (state.selectedId === item.id) state.selectedId = null;
    showToast(`${oldName}冷掉了，原来的位置全部变成差评块！`, "bad");
    playTone(105, .17);
  });
}

function moveSelected(x, y) {
  const item = state.items.find((candidate) => candidate.id === state.selectedId);
  if (!item) return;
  if (item.type === "badReview") { showToast("差评块粘住了，只能用橡皮清除", "bad"); return; }
  if (!canPlace(item.type, x, y, item.rotation, [item.id], item.shapeOverride)) {
    showToast("移到这里会撞到其他食物", "bad");
    bump(backpack);
    return;
  }
  item.x = x;
  item.y = y;
  state.selectedId = null;
  showToast("位置已整理（不消耗鲜度）");
  playTone(280, .04);
  render();
}

function onItemPointerDown(event) {
  if (state.hand || state.paused || state.locked || event.button !== 0) return;
  const element = event.target.closest(".bag-item");
  if (!element) return;
  const item = state.items.find((candidate) => candidate.id === element.dataset.id);
  if (!item || item.type === "badReview") return;
  const rect = backpack.getBoundingClientRect();
  state.drag = { pointerId: event.pointerId, itemId: item.id, element, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false, cellSize: rect.width / GRID };
  event.target.setPointerCapture?.(event.pointerId);
}

function onItemPointerMove(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) return;
  const drag = state.drag;
  drag.dx = event.clientX - drag.startX;
  drag.dy = event.clientY - drag.startY;
  if (!drag.moved && Math.hypot(drag.dx, drag.dy) < 7) return;
  drag.moved = true;
  event.preventDefault();
  drag.element.classList.add("dragging");
  drag.element.style.transform = `translate(${drag.dx}px,${drag.dy}px)`;
  const item = state.items.find((candidate) => candidate.id === drag.itemId);
  if (!item) return;
  const x = Math.round(item.x + drag.dx / drag.cellSize);
  const y = Math.round(item.y + drag.dy / drag.cellSize);
  showPreview(item.type, x, y, item.rotation, [item.id], item.shapeOverride);
}

function onItemPointerUp(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) return;
  const drag = state.drag;
  const item = state.items.find((candidate) => candidate.id === drag.itemId);
  if (drag.moved && item) {
    const x = Math.round(item.x + drag.dx / drag.cellSize);
    const y = Math.round(item.y + drag.dy / drag.cellSize);
    if (canPlace(item.type, x, y, item.rotation, [item.id], item.shapeOverride)) {
      item.x = x;
      item.y = y;
      state.selectedId = item.id;
      showToast("拖动整理完成（不消耗鲜度）");
      playTone(290, .04);
    } else {
      showToast("那里放不下，食物弹回原位", "bad");
      playTone(120, .07);
    }
    state.suppressClick = true;
    window.setTimeout(() => { state.suppressClick = false; }, 0);
  }
  clearPreview();
  state.drag = null;
  render();
}

function showPreview(type, x, y, rotation, ignoreIds, shapeOverride = null) {
  clearPreview();
  const valid = canPlace(type, x, y, rotation, ignoreIds, shapeOverride);
  const cells = (shapeOverride || shapeFor(type, rotation)).map(([dx, dy]) => [x + dx, y + dy]);
  cells.forEach(([cx, cy]) => {
    const cell = backpack.querySelector(`.grid-cell[data-x="${cx}"][data-y="${cy}"]`);
    if (cell) cell.classList.add(valid ? "preview-good" : "preview-bad");
  });
}

function clearPreview() {
  backpack.querySelectorAll(".preview-good,.preview-bad").forEach((cell) => cell.classList.remove("preview-good", "preview-bad"));
}

function rotateCurrent() {
  if (state.paused || state.locked) return;
  if (state.hand) {
    if (!FOOD[state.hand.type].rotatable) return;
    state.hand.rotation = (state.hand.rotation + 1) % 4;
    showToast(`手上的${FOOD[state.hand.type].name}已旋转`);
    playTone(330, .04);
    render();
    return;
  }
  const item = state.items.find((candidate) => candidate.id === state.selectedId);
  if (!item || !FOOD[item.type].rotatable) return;
  const rotation = (item.rotation + 1) % 4;
  if (!canPlace(item.type, item.x, item.y, rotation, [item.id], item.shapeOverride)) {
    showToast("旋转后会碰到其他食物", "bad");
    bump(backpack);
    return;
  }
  item.rotation = rotation;
  showToast("旋转完成（不消耗鲜度）");
  playTone(330, .04);
  render();
}

function pickUpSelected() {
  if (state.hand) return;
  const item = state.items.find((candidate) => candidate.id === state.selectedId);
  if (!item || item.type === "badReview") return;
  state.hand = { type: item.type, rotation: item.rotation, timer: item.timer, origin: { ...item } };
  state.items = state.items.filter((candidate) => candidate.id !== item.id);
  state.selectedId = null;
  showToast(`${FOOD[item.type].name}拿到手上了，可以直接点配方目标`);
  render();
}

function cancelCurrent() {
  if (state.hand) {
    const wasPickedUp = Boolean(state.hand.origin);
    if (state.hand.origin) {
      const original = state.hand.origin;
      if (canPlace(original.type, original.x, original.y, original.rotation, [], original.shapeOverride)) state.items.push(original);
    }
    const name = FOOD[state.hand.type].name;
    state.hand = null;
    showToast(wasPickedUp ? `${name}已放回` : `放弃了${name}`);
  }
  state.selectedId = null;
  render();
}

function deliverOrder(orderId) {
  if (state.paused || state.locked) return;
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!order || order.done) return;
  const candidates = state.items.filter((item) => item.timer > 0 && canFulfill(order.type, item.type));
  const selectedCandidate = candidates.find((item) => item.id === state.selectedId);
  const exact = candidates.filter((item) => item.type === order.type).sort((a, b) => a.timer - b.timer)[0];
  const item = selectedCandidate || exact || candidates.sort((a, b) => a.timer - b.timer)[0];
  if (!item) {
    showToast(`背包里还没有能交付的${FOOD[order.type].name}`, "bad");
    bump($("#ordersList"));
    return;
  }
  const payout = FOOD[item.type].value;
  const downgraded = item.type !== order.type;
  state.items = state.items.filter((candidate) => candidate.id !== item.id);
  state.selectedId = null;
  state.coins += payout;
  state.shiftIncome += payout;
  state.delivered += 1;
  order.done = true;
  state.lastMessage = `已交付${FOOD[item.type].name}，收入 ¥${payout}`;
  saveProgress();
  showToast(`${downgraded ? "低配" : "完美"}送达！${FOOD[item.type].name}收入 ¥${payout}`, "good");
  playTone(760, .08); window.setTimeout(() => playTone(960, .09), 70);
  render();
  if (state.delivered >= state.quota) {
    state.locked = true;
    setPaused(true);
    const reward = 12 + state.level * 3;
    $("#shiftIncome").textContent = state.shiftIncome;
    $("#levelReward").textContent = reward;
    $("#resultText").textContent = `完成 ${state.quota} 单配送，背包里还剩 ${state.items.length} 件物品`;
    window.setTimeout(() => openModal("levelModal"), 420);
  } else {
    window.setTimeout(() => {
      const index = state.orders.indexOf(order);
      state.orders[index] = createOrder(chooseOrder(), `${Date.now()}-${index}`);
      render();
    }, 430);
  }
}

function canFulfill(orderType, itemType) {
  return orderType === itemType || (DOWNGRADES[orderType] || []).includes(itemType);
}

function chooseOrder() {
  const pool = ORDER_POOL.filter((entry) => entry.level <= state.level).map((entry) => entry.type);
  return pool[Math.floor(Math.random() * pool.length)];
}

function nextLevel() {
  const reward = 12 + state.level * 3;
  state.coins += reward;
  state.level += 1;
  state.delivered = 0;
  state.shiftIncome = 0;
  state.quota = Math.min(7, 3 + Math.floor((state.level - 1) / 2));
  state.items = state.items.filter((item) => item.type !== "badReview");
  state.orders = [0, 1, 2].map((index) => createOrder(chooseOrder(), `${state.level}-${index}`));
  state.hand = null;
  state.selectedId = null;
  state.locked = false;
  state.scriptedDrops = [];
  closeModals();
  setPaused(false);
  saveProgress();
  showToast(`第 ${state.level} 班开始：本班目标 ${state.quota} 单`, "good");
  playTone(630, .08);
  render();
}

function buyInsulation() {
  const cost = 20 + state.insulation * 15;
  if (state.coins < cost) {
    showToast(`升级需要 ¥${cost}，还差 ¥${cost - state.coins}`, "bad");
    bump($("#upgradeButton"));
    return;
  }
  state.coins -= cost;
  state.insulation += 1;
  state.maxFresh = 3 + state.insulation;
  saveProgress();
  showToast(`保温包升级！以后接到和合成的食物鲜度为 ${state.maxFresh}`, "good");
  playMergeSound();
  render();
}

function useEraser() {
  const item = state.items.find((candidate) => candidate.id === state.selectedId);
  if (!item || item.type !== "badReview") { showToast("先选中一个灰色差评块"); return; }
  if (state.coins < 12) { showToast(`需要 ¥12，目前只有 ¥${state.coins}`, "bad"); return; }
  state.coins -= 12;
  state.items = state.items.filter((candidate) => candidate.id !== item.id);
  state.selectedId = null;
  saveProgress();
  showToast("差评块已清除，原来占据的格子全部恢复", "good");
  playTone(560, .1);
  render();
}

function render() {
  renderHeader();
  renderOrders();
  renderItems();
  renderHand();
  renderControls();
  paintSprites(document);
}

function renderHeader() {
  $("#levelValue").textContent = String(state.level).padStart(2, "0");
  $("#deliveredValue").textContent = state.delivered;
  $("#quotaValue").textContent = state.quota;
  $("#coinValue").textContent = state.coins;
  $("#freshnessLabel").textContent = `鲜度${state.maxFresh}`;
  $("#upgradeCost").textContent = `¥${20 + state.insulation * 15}`;
  $("#soundButton").textContent = state.sound ? "♪" : "×";
  $("#soundButton").classList.toggle("muted", !state.sound);
}

function renderOrders() {
  const list = $("#ordersList");
  list.innerHTML = "";
  state.orders.forEach((order, index) => {
    const ready = state.items.some((item) => item.timer > 0 && canFulfill(order.type, item.type));
    const alternatives = (DOWNGRADES[order.type] || []).map((type) => FOOD[type].name).join(" / ");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `order-card${ready ? " ready" : ""}${order.done ? " done" : ""}`;
    button.innerHTML = `<span class="order-art">${foodArtMarkup(order.type)}</span><span class="order-copy"><strong>${index + 1}. ${FOOD[order.type].name} ×1</strong><span>${shapeLabel(order.type)} · ${FOOD[order.type].desc}</span><span>${alternatives ? `可低配：${alternatives}` : "点击提交订单"}</span></span><b class="order-price">¥${FOOD[order.type].value}</b>`;
    button.addEventListener("click", () => deliverOrder(order.id));
    list.appendChild(button);
  });
}

function renderItems() {
  backpack.querySelectorAll(".bag-item").forEach((element) => element.remove());
  state.items.forEach((item) => {
    const shape = itemShape(item);
    const width = Math.max(...shape.map(([x]) => x)) + 1;
    const height = Math.max(...shape.map(([, y]) => y)) + 1;
    const selected = state.selectedId === item.id;
    const handRecipe = state.hand && recipeFor(state.hand.type, item.type);
    const mergeFits = handRecipe && canPlace(handRecipe.result, item.x, item.y, 0, [item.id]);
    const element = document.createElement("button");
    element.type = "button";
    element.className = `bag-item${selected ? " selected" : ""}${handRecipe ? " compatible" : ""}${handRecipe && !mergeFits ? " merge-blocked" : ""}${item.type === "badReview" ? " bad-review" : ""}`;
    element.dataset.id = item.id;
    element.style.left = `${item.x * 25}%`;
    element.style.top = `${item.y * 25}%`;
    element.style.width = `${width * 25}%`;
    element.style.height = `${height * 25}%`;
    element.setAttribute("aria-label", `${FOOD[item.type].name}${item.timer != null ? `，鲜度${item.timer}` : "，不可移动"}`);
    const cells = shape.map(([x, y]) => `<span class="item-cell" style="left:${x / width * 100}%;top:${y / height * 100}%;width:${100 / width}%;height:${100 / height}%"></span>`).join("");
    element.innerHTML = `${cells}<span class="item-main-art">${foodArtMarkup(item.type)}</span><span class="item-name">${FOOD[item.type].name}</span>${item.timer != null ? `<span class="fresh-badge${item.timer <= 1 ? " warning" : ""}">${item.timer}</span>` : ""}`;
    backpack.appendChild(element);
  });
  backpack.querySelectorAll(".grid-cell").forEach((cell) => {
    const x = Number(cell.dataset.x); const y = Number(cell.dataset.y);
    cell.classList.toggle("hand-anchor", Boolean(state.hand && canPlace(state.hand.type, x, y, state.hand.rotation)));
  });
}

function renderHand() {
  const tray = $("#handTray");
  const visual = $("#handVisual");
  const text = $("#handText");
  if (!state.hand) {
    tray.classList.add("empty");
    visual.innerHTML = '<span class="empty-hand">✋</span>';
    text.innerHTML = `<strong>手上是空的</strong><span>${state.lastMessage}</span>`;
    $("#handHint").textContent = "点击上方包裹接住下一份外卖";
    $("#handFresh").textContent = "—";
    return;
  }
  tray.classList.remove("empty");
  visual.innerHTML = foodArtMarkup(state.hand.type);
  const recipes = RECIPES.filter((recipe) => recipe.a === state.hand.type || recipe.b === state.hand.type);
  text.innerHTML = `<strong>手持：${FOOD[state.hand.type].name}</strong><span>${shapeLabel(state.hand.type)} · ${FOOD[state.hand.type].desc}</span>`;
  $("#handHint").textContent = recipes.length
    ? recipes.map((recipe) => `${FOOD[state.hand.type].name} + ${FOOD[recipe.a === state.hand.type ? recipe.b : recipe.a].name} → ${FOOD[recipe.result].name}`).join(" / ")
    : "点击绿色空格放入背包";
  $("#handFresh").textContent = state.hand.timer;
}

function renderControls() {
  const selected = state.items.find((item) => item.id === state.selectedId);
  const rotatable = state.hand ? FOOD[state.hand.type].rotatable : selected && FOOD[selected.type].rotatable;
  $("#rotateButton").disabled = !rotatable;
  $("#pickupButton").disabled = Boolean(state.hand) || !selected || selected.type === "badReview";
  $("#cancelButton").disabled = !state.hand && !selected;
}

function renderFallCount() {
  $("#fallCount").textContent = `天空中 ${state.falling.size} 份`;
}

function renderRecipes() {
  $("#recipeList").innerHTML = RECIPES.map((recipe) => `<div class="recipe-row"><span class="recipe-food">${foodArtMarkup(recipe.a)}<span>${FOOD[recipe.a].name}<small class="shape-tag">${shapeLabel(recipe.a)}</small></span></span><b class="recipe-symbol">+</b><span class="recipe-food">${foodArtMarkup(recipe.b)}<span>${FOOD[recipe.b].name}<small class="shape-tag">${shapeLabel(recipe.b)}</small></span></span><b class="recipe-symbol">=</b><span class="recipe-food">${foodArtMarkup(recipe.result)}<span>${FOOD[recipe.result].name}<small class="shape-tag">${FOOD[recipe.result].tier} · ${shapeLabel(recipe.result)}</small></span></span></div>`).join("");
}

function shapeLabel(type) {
  const shape = FOOD[type].shape;
  if (shape.length === 3) return "L型3格";
  const width = Math.max(...shape.map(([x]) => x)) + 1;
  const height = Math.max(...shape.map(([, y]) => y)) + 1;
  return `${width}×${height} · ${shape.length}格`;
}

function targetElement(id) {
  return backpack.querySelector(`.bag-item[data-id="${id}"]`) || backpack;
}

function mobileFocus(element) {
  void element;
}

function animateItem(id) {
  requestAnimationFrame(() => targetElement(id)?.classList.add("pop"));
}

function openModal(id) {
  document.querySelectorAll(".modal-backdrop").forEach((modal) => { if (modal.id !== "levelModal") modal.hidden = true; });
  $(`#${id}`).hidden = false;
  setPaused(true);
  paintSprites($(`#${id}`));
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    const protectStart = modal.id === "startModal" && !state.running;
    if (!protectStart && (modal.id !== "levelModal" || !state.locked)) modal.hidden = true;
  });
  if (state.running && !state.locked) setPaused(false);
}

function setTheme(theme) {
  state.theme = theme === "cyber" ? "cyber" : "warm";
  document.body.dataset.theme = state.theme;
  updateThemeButtons();
  saveProgress();
  showToast(state.theme === "cyber" ? "正在预览霓虹夜送 · 纯外观" : "已换回暖阳小铺 · 纯外观", "good");
  playTone(state.theme === "cyber" ? 820 : 520, .07);
}

function updateThemeButtons() {
  document.querySelectorAll("[data-theme-choice]").forEach((button) => button.classList.toggle("active", button.dataset.themeChoice === state.theme));
}

function toggleSound() {
  state.sound = !state.sound;
  saveProgress();
  renderHeader();
  if (state.sound) playTone(540, .07);
}

async function shareGame() {
  const text = `我在《外卖落下来啦！》第${state.level}班送了${state.delivered}单，赚到¥${state.shiftIncome}。你能把4×4背包塞得更好吗？`;
  try {
    if (navigator.share) await navigator.share({ title: "外卖落下来啦！", text, url: location.href });
    else {
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      showToast("试玩链接和成绩已复制，可以发给朋友了", "good");
    }
  } catch (error) {
    if (error?.name !== "AbortError") showToast("分享没有成功，可以直接复制浏览器链接", "bad");
  }
}

function showToast(message, tone = "") {
  toast.textContent = message;
  toast.className = `toast show ${tone}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.className = "toast"; }, 2100);
}

function bump(element) {
  if (!element) return;
  element.classList.remove("shake");
  requestAnimationFrame(() => element.classList.add("shake"));
  window.setTimeout(() => element.classList.remove("shake"), 300);
}

function playMergeSound() {
  playTone(660, .07);
  window.setTimeout(() => playTone(880, .1), 75);
}

function playTone(frequency, duration) {
  if (!state.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional. */ }
}

function foodArtMarkup(type) {
  return `<span class="food-art" data-food="${type}"></span>`;
}

function paintSprites(root) {
  root.querySelectorAll?.(".food-art[data-food]").forEach((host) => {
    if (host.querySelector("canvas")) return;
    const canvas = document.createElement("canvas");
    canvas.width = 16; canvas.height = 16;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    drawFood(canvas, host.dataset.food);
  });
}

function drawFood(canvas, type) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const O = "#4b3027", D = "#743f2b", B = "#b75b31", T = "#e49a55", Y = "#f4ce55", C = "#fff0c8", W = "#fff9de", R = "#d9473f", G = "#62a561";
  const r = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const outlineBox = (x, y, w, h, fill) => { r(x, y, w, h, O); r(x + 1, y + 1, w - 2, h - 2, fill); };
  ctx.clearRect(0, 0, 16, 16);
  if (type === "bread") { r(2,5,12,9,O);r(3,4,10,10,O);r(3,6,10,7,T);r(4,5,8,2,"#f2bd6c");r(5,8,2,1,C);r(9,6,1,1,C); }
  else if (type === "beefPatty") { r(3,4,10,2,O);r(2,6,12,6,O);r(3,12,10,1,O);r(3,6,10,6,D);r(5,7,2,1,T);r(10,9,2,1,B); }
  else if (type === "cheese") { r(2,4,12,2,O);r(2,6,11,7,O);r(3,5,10,7,Y);r(11,6,2,2,O);r(5,7,2,2,"#d69c37");r(8,10,1,1,"#d69c37"); }
  else if (type === "cola") { r(6,0,2,4,O);r(7,0,2,4,R);outlineBox(3,3,10,12,R);r(4,5,8,2,C);r(6,8,4,1,C);r(6,10,4,1,C); }
  else if (type === "milkTea" || type === "bigTea" || type === "foamTea") { const big=type!=="milkTea"; r(9,0,2,5,O);r(10,0,1,5,R);outlineBox(big?2:3,3,big?12:10,12,type==="foamTea"?C:"#bd8056");r(big?3:4,5,big?10:8,2,type==="foamTea"?W:C);r(5,11,2,2,D);r(9,12,2,1,D);if(type==="foamTea"){r(3,7,10,2,"#bd8056");r(3,9,10,5,"#bd8056");} }
  else if (type === "cream") { r(5,1,6,3,O);r(6,0,4,4,W);outlineBox(3,4,10,11,C);r(5,7,6,4,W);r(6,8,4,2,"#8ecbd0"); }
  else if (type === "chicken") { r(1,5,3,6,O);r(3,4,8,9,O);r(10,9,5,3,O);r(2,6,3,4,"#efdfb5");r(4,5,6,7,B);r(5,6,4,2,T);r(11,10,3,1,"#efdfb5"); }
  else if (type === "burgerPatty" || type === "cheeseBurger") { r(2,3,12,3,O);r(3,2,10,2,T);r(2,6,12,2,O);r(3,6,10,1,G);r(2,8,12,3,O);r(3,8,10,2,D);if(type==="cheeseBurger"){r(2,10,12,2,O);r(3,10,10,1,Y);}r(2,type==="cheeseBurger"?12:11,12,3,O);r(3,type==="cheeseBurger"?12:11,10,2,T); }
  else if (type === "chickenBucket") { r(2,5,12,2,O);r(3,4,3,4,B);r(7,2,3,6,T);r(11,4,3,4,B);r(3,7,10,8,O);r(4,7,8,7,R);r(6,9,4,3,C);r(7,10,2,1,Y); }
  else if (type === "cheeseCombo") { r(0,5,9,2,O);r(1,4,7,2,T);r(0,7,9,2,O);r(1,7,7,1,Y);r(0,9,9,3,O);r(1,9,7,2,D);r(10,2,5,13,O);r(11,3,3,11,R);r(12,0,1,4,O);r(12,5,2,2,C); }
  else if (type === "wholeChicken") { r(3,3,9,2,O);r(1,5,14,7,O);r(3,12,10,2,O);r(3,5,10,8,B);r(5,5,6,3,T);r(1,10,3,3,"#efdfb5");r(12,10,3,3,"#efdfb5");r(6,9,2,1,D);r(9,11,2,1,D); }
  else if (type === "badReview") { outlineBox(2,2,12,12,"#596069");r(5,6,2,2,"#c6cbd0");r(10,6,2,2,"#c6cbd0");r(5,11,7,2,O);r(4,3,2,2,"#7e858c");r(11,2,2,3,"#7e858c"); }
}

init();
