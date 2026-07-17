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
const INITIAL_ORDERS = ["bigTea", "bigTea", "bigTea"];
const ORDER_POOL = [
  { type: "burgerPatty", level: 1 }, { type: "chickenBucket", level: 1 }, { type: "bigTea", level: 1 },
  { type: "cheeseBurger", level: 2 }, { type: "foamTea", level: 2 },
  { type: "cheeseCombo", level: 3 }, { type: "wholeChicken", level: 3 }
];
const LEVEL_CONFIGS = {
  1: {
    orders: ["bigTea", "bigTea", "bigTea"],
    drops: ["milkTea", "milkTea", "milkTea", "milkTea", "milkTea", "milkTea", "cream"],
    title: "奶茶练习班"
  },
  2: {
    orders: ["chickenBucket", "bigTea", "burgerPatty"],
    drops: ["chicken", "chicken", "milkTea", "milkTea", "bread", "beefPatty", "chicken", "chicken"],
    title: "旋转整理班"
  },
  3: {
    orders: ["burgerPatty", "chickenBucket", "bigTea"],
    drops: ["bread", "beefPatty", "chicken", "chicken", "milkTea", "milkTea", "cheese", "cola", "cream"],
    title: "午高峰综合班"
  }
};
const WAVES = [
  { id: "prep", name: "备餐期", from: 0, spawn: 1.8, fall: 1.08, maxDrops: 2 },
  { id: "rush", name: "午高峰", from: 12, spawn: 1.28, fall: .91, maxDrops: 3 },
  { id: "sprint", name: "冲单期", from: 30, spawn: .98, fall: .78, maxDrops: 4 }
];
const state = {
  items: [], orders: [], falling: new Map(), hand: null, selectedId: null,
  level: 1, quota: 3, delivered: 0, coins: 0, shiftIncome: 0,
  insulation: 0, maxFresh: 3, uid: 1, dropUid: 1,
  running: false, paused: true, locked: false, sound: true,
  lastMessage: "按住上方包裹，直接拖进背包",
  scriptedDrops: [...LEVEL_CONFIGS[1].drops],
  bagGesture: null, catchDrag: null, preview: null, dragValidity: null,
  suppressClick: false, theme: "warm", actionCount: 0, guideStep: 0,
  shiftElapsed: 0, nextSpawnIn: 0, waveId: "prep", lastFrame: 0, lastClockSecond: -1
};

const $ = (selector) => document.querySelector(selector);
const backpack = $("#backpack");
const sky = $("#sky");
const toast = $("#toast");
let toastTimer = null;
let audioContext = null;
let renderer = null;
const spriteCache = new Map();

function init() {
  loadProgress();
  buildGrid();
  configureLevel(1);
  renderer = window.createCanvasRenderer({
    skyCanvas: $("#skyCanvas"), bagCanvas: $("#bagCanvas"), dragCanvas: $("#dragCanvas"),
    getState: () => state, getFood: (type) => FOOD[type],
    getShape: (type, rotation, override) => override || shapeFor(type, rotation),
    getItemCells: (item) => itemCells(item), canPlace, recipeFor, findMergePlacement,
    getSprite: foodSprite, grid: GRID
  });
  bindEvents();
  renderRecipes();
  render();
  document.body.dataset.theme = state.theme;
  updateThemeButtons();
  window.requestAnimationFrame(gameLoop);
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
  $("#bagCanvas").setAttribute("aria-label", "四乘四配送背包，可拖动食物整理或合成");
}

function bindEvents() {
  sky.addEventListener("pointerdown", onSkyPointerDown);
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
      const lowest = [...state.falling.values()].sort((a, b) => b.progress - a.progress)[0];
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
    state.shiftElapsed = 0;
    state.nextSpawnIn = .85;
    state.waveId = "prep";
    setPaused(false);
    spawnDrop();
  }
  setPaused(false);
  showToast("按住包裹直接拖进背包，轻点接住也可以", "good");
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

function configureLevel(level) {
  const config = LEVEL_CONFIGS[level];
  state.quota = level <= 3 ? 3 : Math.min(7, 3 + Math.floor((level - 1) / 2));
  const orderTypes = config?.orders || [chooseOrder(), chooseOrder(), chooseOrder()];
  state.orders = orderTypes.map((type, index) => createOrder(type, `${level}-${index}`));
  state.scriptedDrops = [...(config?.drops || [])];
  state.shiftElapsed = 0;
  state.nextSpawnIn = .75;
  state.waveId = "prep";
  state.lastClockSecond = -1;
}

function currentWave() {
  return [...WAVES].reverse().find((wave) => state.shiftElapsed >= wave.from) || WAVES[0];
}

function gameLoop(now) {
  const elapsed = state.lastFrame ? Math.min(.05, (now - state.lastFrame) / 1000) : 0;
  state.lastFrame = now;
  if (state.running && !state.paused && !state.locked) {
    const timeScale = state.catchDrag ? .18 : 1;
    const dt = elapsed * timeScale;
    state.shiftElapsed += dt;
    state.nextSpawnIn -= dt;
    const missed = [];
    state.falling.forEach((drop) => {
      drop.progress += dt / drop.duration;
      if (drop.progress >= 1) missed.push(drop.id);
    });
    missed.forEach((id) => removeDrop(id, true));
    const wave = currentWave();
    if (wave.id !== state.waveId) {
      state.waveId = wave.id;
      showToast(wave.id === "sprint" ? "冲单期！外卖加速，稳住背包" : "午高峰来了！掉落开始加快", wave.id === "sprint" ? "bad" : "good");
      playTone(wave.id === "sprint" ? 880 : 720, .09);
      haptic(22);
    }
    if (state.nextSpawnIn <= 0) {
      spawnDrop();
      state.nextSpawnIn = wave.spawn;
    }
    const second = Math.floor(state.shiftElapsed);
    if (second !== state.lastClockSecond) {
      state.lastClockSecond = second;
      renderPressure();
    }
  }
  renderer?.frame(now);
  window.requestAnimationFrame(gameLoop);
}

function spawnDrop() {
  const wave = currentWave();
  if (!state.running || state.paused || state.locked || state.falling.size >= wave.maxDrops) return;
  const type = state.scriptedDrops.length ? state.scriptedDrops.shift() : chooseHelpfulDrop();
  const id = `drop-${state.dropUid++}`;
  const laneLoads = [0, 1, 2].map((lane) => [...state.falling.values()].filter((drop) => drop.lane === lane).length);
  const lightest = Math.min(...laneLoads);
  const possibleLanes = laneLoads.map((load, lane) => load === lightest ? lane : -1).filter((lane) => lane >= 0);
  const lane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
  const fallSeconds = Math.max(3.65, (6.25 - state.level * .13 + Math.random() * .55) * wave.fall);
  state.falling.set(id, { id, type, lane, progress: 0, duration: fallSeconds });
  renderFallCount();
}

function removeDrop(id, missed = false) {
  const drop = state.falling.get(id);
  if (!drop) return;
  state.falling.delete(id);
  if (missed) {
    const label = $("#missedLabel");
    label.textContent = `放过了${FOOD[drop.type].name} · 不扣分`;
    window.setTimeout(() => { label.textContent = "不需要的可以放过"; }, 1100);
  }
  renderFallCount();
}

function onSkyPointerDown(event) {
  if (!state.running || state.paused || state.locked) return;
  const drop = renderer?.skyDropAt(event.clientX, event.clientY);
  if (!drop) return;
  event.preventDefault();
  catchDrop(drop.id, event);
}

function catchDrop(id, gesture = null) {
  if (!state.running || state.paused || state.locked) return;
  const drop = state.falling.get(id);
  if (!drop) return;
  if (state.hand) {
    showToast(`手里已经拿着${FOOD[state.hand.type].name}，先放下或合成`, "bad");
    bump(sky);
    playTone(120, .08);
    return;
  }
  tickExisting([]);
  state.hand = { type: drop.type, rotation: 0, timer: state.maxFresh, origin: null };
  state.guideStep = Math.max(state.guideStep, 1);
  state.selectedId = null;
  removeDrop(id, false);
  if (gesture) {
    state.catchDrag = { pointerId: gesture.pointerId, x: gesture.clientX, y: gesture.clientY, startX: gesture.clientX, startY: gesture.clientY };
    state.dragValidity = null;
  }
  showToast(gesture ? `接住${FOOD[drop.type].name}！拖到绿色格松手` : `接住${FOOD[drop.type].name}！点绿色“+”放下`, "good");
  playTone(520, .07);
  haptic(12);
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

function placementDetails(type, x, y, rotation = 0, ignoreIds = [], shapeOverride = null) {
  const cells = (shapeOverride || shapeFor(type, rotation)).map(([dx, dy]) => [x + dx, y + dy]);
  const outside = cells.filter(([cx, cy]) => cx < 0 || cy < 0 || cx >= GRID || cy >= GRID);
  const blockers = state.items.filter((item) => !ignoreIds.includes(item.id) && cells.some(([cx, cy]) => itemCells(item).some(([ix, iy]) => ix === cx && iy === cy)));
  return { valid: outside.length === 0 && blockers.length === 0, cells, outside, blockers };
}

function canPlace(type, x, y, rotation = 0, ignoreIds = [], shapeOverride = null) {
  return placementDetails(type, x, y, rotation, ignoreIds, shapeOverride).valid;
}

function availableRotations(type) {
  return FOOD[type].rotatable ? [0, 1, 2, 3] : [0];
}

function validPlacements(type, ignoreIds = [], shapeOverride = null) {
  const options = [];
  availableRotations(type).forEach((rotation) => {
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID; x += 1) {
        if (canPlace(type, x, y, rotation, ignoreIds, shapeOverride)) options.push({ x, y, rotation });
      }
    }
  });
  return options;
}

function nearestPlacement(type, tapX, tapY, rotation = 0, ignoreIds = [], shapeOverride = null) {
  return validPlacements(type, ignoreIds, shapeOverride)
    .filter((option) => option.rotation === rotation)
    .sort((a, b) => Math.hypot(a.x - tapX, a.y - tapY) - Math.hypot(b.x - tapX, b.y - tapY))[0] || null;
}

function findMergePlacement(resultType, consumedItems) {
  const ignoreIds = consumedItems.map((item) => item.id);
  const centerX = consumedItems.reduce((sum, item) => sum + item.x, 0) / consumedItems.length;
  const centerY = consumedItems.reduce((sum, item) => sum + item.y, 0) / consumedItems.length;
  return validPlacements(resultType, ignoreIds)
    .sort((a, b) => {
      const distanceA = Math.hypot(a.x - centerX, a.y - centerY);
      const distanceB = Math.hypot(b.x - centerX, b.y - centerY);
      return distanceA - distanceB || a.rotation - b.rotation || a.y - b.y || a.x - b.x;
    })[0] || null;
}

function bestBlockedPlacement(resultType, consumedItems) {
  const ignoreIds = consumedItems.map((item) => item.id);
  const attempts = [];
  availableRotations(resultType).forEach((rotation) => {
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID; x += 1) {
        const details = placementDetails(resultType, x, y, rotation, ignoreIds);
        attempts.push({ x, y, rotation, details, score: details.outside.length * 5 + details.blockers.length });
      }
    }
  });
  return attempts.sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x)[0];
}

function mergeSpaceMessage(resultType, consumedItems) {
  const best = bestBlockedPlacement(resultType, consumedItems);
  if (!best) return `${FOOD[resultType].name}没有可用落点；先拖动整理背包`;
  const blockerNames = [...new Set(best.details.blockers.map((item) => FOOD[item.type].name))];
  if (best.details.outside.length === 0) showPreview(resultType, best.x, best.y, best.rotation, consumedItems.map((item) => item.id));
  const blockedBy = blockerNames.length ? `，被${blockerNames.join("、")}挡住` : "，空格太零散";
  return `${FOOD[resultType].name}需要${shapeLabel(resultType)}的连续空间${blockedBy}；先拖动整理`;
}

function recipeFor(a, b) {
  return RECIPES.find((recipe) => (recipe.a === a && recipe.b === b) || (recipe.a === b && recipe.b === a));
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
  clearPreview();
  let placement = { x, y, rotation: state.hand.rotation };
  let snapped = false;
  if (!canPlace(state.hand.type, x, y, state.hand.rotation)) {
    placement = nearestPlacement(state.hand.type, x, y, state.hand.rotation);
    snapped = Boolean(placement);
  }
  if (!placement) {
    const required = shapeLabel(state.hand.type);
    showToast(`${FOOD[state.hand.type].name}需要${required}的连续空位；拖动食物腾位置，或点“放弃”`, "bad");
    bump(backpack);
    state.lastMessage = `放不下：需要${required}连续空位`;
    render();
    return;
  }
  const item = createItem(state.hand.type, placement.x, placement.y, placement.rotation, state.hand.timer);
  state.items.push(item);
  const name = FOOD[state.hand.type].name;
  state.hand = null;
  state.selectedId = item.id;
  state.guideStep = Math.max(state.guideStep, 2);
  state.lastMessage = `${name}已放入背包`;
  showToast(snapped ? `${name}已自动贴齐最近的绿色格` : `${name}已放入背包；拖动可以整理`, "good");
  playTone(370, .05);
  haptic(10);
  render();
  window.setTimeout(() => mobileFocus(sky), 90);
}

function attemptHandMerge(target) {
  if (!state.hand || target.type === "badReview") return;
  const recipe = recipeFor(state.hand.type, target.type);
  if (!recipe) {
    const possible = RECIPES.filter((entry) => entry.a === state.hand.type || entry.b === state.hand.type)
      .map((entry) => FOOD[entry.a === state.hand.type ? entry.b : entry.a].name);
    showToast(`${FOOD[state.hand.type].name}不能和${FOOD[target.type].name}合成${possible.length ? `；请找${possible.join("或")}` : ""}`, "bad");
    bump(targetElement(target.id));
    return;
  }
  const placement = findMergePlacement(recipe.result, [target]);
  if (!placement) {
    const reason = mergeSpaceMessage(recipe.result, [target]);
    showToast(reason, "bad");
    state.lastMessage = reason;
    bump(targetElement(target.id));
    window.setTimeout(clearPreview, 1300);
    renderHand();
    return;
  }
  tickExisting([target.id]);
  state.items = state.items.filter((item) => item.id !== target.id);
  const result = createItem(recipe.result, placement.x, placement.y, placement.rotation, state.maxFresh);
  state.items.push(result);
  const handName = FOOD[state.hand.type].name;
  state.hand = null;
  state.selectedId = result.id;
  state.guideStep = Math.max(state.guideStep, 3);
  state.lastMessage = `刚合成：${FOOD[result.type].name}`;
  showToast(`${handName}直接合成成功：${FOOD[result.type].name}！鲜度回满`, "good");
  playMergeSound();
  haptic(28);
  clearPreview();
  render();
  animateItem(result.id);
  window.setTimeout(() => mobileFocus(sky), 90);
}

function mergeBagItems(first, second, resultType) {
  const placement = findMergePlacement(resultType, [first, second]);
  if (!placement) {
    const reason = mergeSpaceMessage(resultType, [first, second]);
    showToast(reason, "bad");
    state.lastMessage = reason;
    window.setTimeout(clearPreview, 1300);
    renderHand();
    return;
  }
  tickExisting([first.id, second.id]);
  state.items = state.items.filter((item) => item.id !== first.id && item.id !== second.id);
  const result = createItem(resultType, placement.x, placement.y, placement.rotation, state.maxFresh);
  state.items.push(result);
  state.selectedId = result.id;
  state.guideStep = Math.max(state.guideStep, 3);
  state.lastMessage = `刚合成：${FOOD[resultType].name}`;
  showToast(`合成成功：${FOOD[resultType].name}！鲜度回满`, "good");
  playMergeSound();
  haptic(28);
  clearPreview();
  render();
  animateItem(result.id);
}

function tickExisting(ignoreIds) {
  state.actionCount += 1;
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
  if (state.paused || state.locked || event.button !== 0 || state.catchDrag) return;
  const point = renderer?.bagPoint(event.clientX, event.clientY);
  if (!point?.inside) return;
  const item = renderer.itemAtPoint(event.clientX, event.clientY);
  state.bagGesture = {
    pointerId: event.pointerId, itemId: item?.id || null,
    startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY,
    moved: false, cellSize: point.cellSize
  };
  event.preventDefault();
}

function onItemPointerMove(event) {
  if (state.catchDrag && event.pointerId === state.catchDrag.pointerId) {
    event.preventDefault();
    state.catchDrag.x = event.clientX;
    state.catchDrag.y = event.clientY;
    previewHandAt(event.clientX, event.clientY);
    return;
  }
  const gesture = state.bagGesture;
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  event.preventDefault();
  gesture.x = event.clientX;
  gesture.y = event.clientY;
  const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
  if (state.hand) {
    gesture.moved = distance > 4;
    previewHandAt(event.clientX, event.clientY);
    return;
  }
  const item = state.items.find((candidate) => candidate.id === gesture.itemId);
  if (!item || item.type === "badReview" || distance < 7) return;
  gesture.moved = true;
  const mergeTarget = renderer.itemAtPoint(event.clientX, event.clientY);
  const mergeRecipe = mergeTarget && mergeTarget.id !== item.id && recipeFor(item.type, mergeTarget.type);
  if (mergeRecipe) {
    gesture.mergeTargetId = mergeTarget.id;
    gesture.mergeResult = mergeRecipe.result;
    const placement = findMergePlacement(mergeRecipe.result, [item, mergeTarget]);
    state.dragValidity = Boolean(placement);
    if (placement) showPreview(mergeRecipe.result, placement.x, placement.y, placement.rotation, [item.id, mergeTarget.id]);
    else {
      const best = bestBlockedPlacement(mergeRecipe.result, [item, mergeTarget]);
      if (best) showPreview(mergeRecipe.result, best.x, best.y, best.rotation, [item.id, mergeTarget.id]);
    }
    return;
  }
  gesture.mergeTargetId = null;
  gesture.mergeResult = null;
  const x = Math.round(item.x + (event.clientX - gesture.startX) / gesture.cellSize);
  const y = Math.round(item.y + (event.clientY - gesture.startY) / gesture.cellSize);
  showPreview(item.type, x, y, item.rotation, [item.id], item.shapeOverride);
}

function onItemPointerUp(event) {
  if (state.catchDrag && event.pointerId === state.catchDrag.pointerId) {
    const point = renderer.bagPoint(event.clientX, event.clientY);
    const target = point.inside ? renderer.itemAtPoint(event.clientX, event.clientY) : null;
    state.catchDrag = null;
    state.dragValidity = null;
    clearPreview();
    if (point.inside) {
      if (target && recipeFor(state.hand.type, target.type)) attemptHandMerge(target);
      else placeHand(point.x, point.y);
    } else {
      state.lastMessage = `${FOOD[state.hand.type].name}已接到手中`;
      showToast(`已接住${FOOD[state.hand.type].name}，点绿色“+”放下`, "good");
      render();
    }
    return;
  }
  const gesture = state.bagGesture;
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  const point = renderer.bagPoint(event.clientX, event.clientY);
  const target = point.inside ? renderer.itemAtPoint(event.clientX, event.clientY) : null;
  state.bagGesture = null;
  state.dragValidity = null;
  clearPreview();
  if (state.hand) {
    if (target) attemptHandMerge(target);
    else if (point.inside) placeHand(point.x, point.y);
    return;
  }
  const item = state.items.find((candidate) => candidate.id === gesture.itemId);
  if (gesture.moved && item) {
    const mergeTarget = state.items.find((candidate) => candidate.id === gesture.mergeTargetId);
    if (mergeTarget && gesture.mergeResult) {
      mergeBagItems(item, mergeTarget, gesture.mergeResult);
      return;
    }
    const x = Math.round(item.x + (event.clientX - gesture.startX) / gesture.cellSize);
    const y = Math.round(item.y + (event.clientY - gesture.startY) / gesture.cellSize);
    if (canPlace(item.type, x, y, item.rotation, [item.id], item.shapeOverride)) {
      item.x = x;
      item.y = y;
      state.selectedId = item.id;
      showToast("吸附完成（整理不消耗鲜度）", "good");
      playTone(290, .04);
      haptic(8);
    } else {
      showToast("那里放不下，食物已弹回原位", "bad");
      playTone(120, .07);
    }
    render();
  } else if (item) handleItemClick(item);
  else if (point.inside && state.selectedId) moveSelected(point.x, point.y);
}

function previewHandAt(clientX, clientY) {
  if (!state.hand) return;
  const point = renderer.bagPoint(clientX, clientY);
  if (!point.inside) {
    state.dragValidity = null;
    clearPreview();
    return;
  }
  const target = renderer.itemAtPoint(clientX, clientY);
  const recipe = target && recipeFor(state.hand.type, target.type);
  if (recipe) {
    const placement = findMergePlacement(recipe.result, [target]);
    state.dragValidity = Boolean(placement);
    if (placement) showPreview(recipe.result, placement.x, placement.y, placement.rotation, [target.id]);
    else {
      const best = bestBlockedPlacement(recipe.result, [target]);
      if (best) showPreview(recipe.result, best.x, best.y, best.rotation, [target.id]);
    }
    return;
  }
  showPreview(state.hand.type, point.x, point.y, state.hand.rotation, []);
}

function showPreview(type, x, y, rotation, ignoreIds, shapeOverride = null) {
  const valid = canPlace(type, x, y, rotation, ignoreIds, shapeOverride);
  state.preview = { type, x, y, rotation, ignoreIds, shapeOverride, valid };
  state.dragValidity = valid;
}

function clearPreview() {
  state.preview = null;
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
  const item = selectedCandidate || exact || candidates.sort((a, b) => FOOD[a.type].value - FOOD[b.type].value || a.timer - b.timer)[0];
  if (!item) {
    showToast(explainOrderFailure(order.type), "bad");
    bump($("#ordersList"));
    return;
  }
  const waveBonus = currentWave().id === "sprint" ? 1.25 : 1;
  const payout = Math.round(FOOD[item.type].value * waveBonus);
  const upgraded = item.type !== order.type;
  state.items = state.items.filter((candidate) => candidate.id !== item.id);
  state.selectedId = null;
  state.coins += payout;
  state.shiftIncome += payout;
  state.delivered += 1;
  state.guideStep = Math.max(state.guideStep, 4);
  order.done = true;
  state.lastMessage = `已交付${FOOD[item.type].name}，收入 ¥${payout}`;
  saveProgress();
  showToast(`${upgraded ? "高阶替代" : "精准"}送达！${FOOD[item.type].name}收入 ¥${payout}${waveBonus > 1 ? "（冲单加成）" : ""}`, "good");
  playTone(760, .08); window.setTimeout(() => playTone(960, .09), 70);
  haptic(35);
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
    const remainingNeed = state.quota - state.delivered;
    const remainingVisible = state.orders.filter((candidate) => !candidate.done).length;
    if (remainingNeed > remainingVisible) window.setTimeout(() => {
      const index = state.orders.indexOf(order);
      state.orders[index] = createOrder(chooseOrder(), `${Date.now()}-${index}`);
      render();
    }, 430);
  }
}

function canFulfill(orderType, itemType) {
  if (orderType === itemType) return true;
  if (FOOD[itemType].value <= FOOD[orderType].value) return false;
  const visited = new Set([orderType]);
  const queue = [orderType];
  while (queue.length) {
    const current = queue.shift();
    const next = RECIPES.filter((recipe) => recipe.a === current || recipe.b === current).map((recipe) => recipe.result);
    for (const result of next) {
      if (result === itemType) return true;
      if (!visited.has(result)) { visited.add(result); queue.push(result); }
    }
  }
  return false;
}

function orderUpgrades(orderType) {
  return Object.keys(FOOD).filter((type) => type !== "badReview" && canFulfill(orderType, type) && type !== orderType)
    .sort((a, b) => FOOD[a].value - FOOD[b].value);
}

function explainOrderFailure(orderType) {
  if (state.hand && canFulfill(orderType, state.hand.type)) return `${FOOD[state.hand.type].name}还在手上；先点绿色“+”放进背包，再点订单`;
  const ingredient = state.items.find((item) => item.timer > 0 && item.type !== orderType && baseIngredients(orderType).includes(item.type));
  if (ingredient) return `不能直接交：${FOOD[ingredient.type].name}只是${FOOD[orderType].name}的原料，必须先合成`;
  const lower = state.items.find((item) => item.timer > 0 && FOOD[item.type].value < FOOD[orderType].value);
  if (lower) return `${FOOD[lower.type].name}等级低于${FOOD[orderType].name}，不能越级交单；高阶成品可以替代低阶订单`;
  return `背包里还没有${FOOD[orderType].name}；也可以交更高阶的${orderUpgrades(orderType).map((type) => FOOD[type].name).join("或") || "同系列成品"}`;
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
  state.items = state.items.filter((item) => item.type !== "badReview");
  state.falling.clear();
  state.hand = null;
  state.selectedId = null;
  state.catchDrag = null;
  state.bagGesture = null;
  clearPreview();
  state.locked = false;
  configureLevel(state.level);
  closeModals();
  setPaused(false);
  saveProgress();
  showToast(`${LEVEL_CONFIGS[state.level]?.title || `第 ${state.level} 班`}开始：目标 ${state.quota} 单`, "good");
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
  renderPressure();
  renderControls();
  paintSprites(document);
}

function renderHeader() {
  $("#levelValue").textContent = String(state.level).padStart(2, "0");
  $("#deliveredValue").textContent = state.delivered;
  $("#quotaValue").textContent = state.quota;
  $("#coinValue").textContent = state.coins;
  const danger = state.items.some((item) => item.timer === 1);
  $("#freshnessLabel").textContent = danger ? "有餐将冷" : `鲜度${state.maxFresh}`;
  $("#upgradeCost").textContent = `¥${20 + state.insulation * 15}`;
  $("#soundButton").textContent = state.sound ? "♪" : "×";
  $("#soundButton").classList.toggle("muted", !state.sound);
}

function renderOrders() {
  const list = $("#ordersList");
  const firstUndone = state.orders.findIndex((order) => !order.done);
  state.orders.forEach((order, index) => {
    const ready = !order.done && state.items.some((item) => item.timer > 0 && canFulfill(order.type, item.type));
    const upgrades = orderUpgrades(order.type).map((type) => FOOD[type].name).join(" / ");
    let button = list.children[index];
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", () => deliverOrder(button.dataset.orderId));
      list.appendChild(button);
    }
    button.dataset.orderId = order.id;
    button.className = `order-card${ready ? " ready" : ""}${order.done ? " done" : ""}${state.level <= 2 && index === firstUndone ? " focus-order" : ""}${state.level <= 2 && index > firstUndone && !order.done ? " queued" : ""}`;
    const signature = `${order.type}-${order.done}-${index}`;
    if (button.dataset.signature !== signature) {
      button.dataset.signature = signature;
      button.innerHTML = `<span class="order-art">${foodArtMarkup(order.type)}</span><span class="order-copy"><strong>${index + 1}. ${FOOD[order.type].name} ×1</strong><span>${shapeLabel(order.type)} · ${FOOD[order.type].desc}</span><span>${upgrades ? `可用高阶：${upgrades}` : "只收同款成品"}</span></span><b class="order-price">¥${FOOD[order.type].value}</b>`;
    }
  });
  while (list.children.length > state.orders.length) list.lastElementChild.remove();
}

function renderItems() {
  renderer?.frame(performance.now());
}

function renderHand() {
  const tray = $("#handTray");
  const visual = $("#handVisual");
  const text = $("#handText");
  const situation = currentSituation();
  tray.classList.remove("success", "blocked");
  if (situation.tone) tray.classList.add(situation.tone);
  if (!state.hand) {
    tray.classList.add("empty");
    visual.innerHTML = '<span class="empty-hand">✋</span>';
    text.innerHTML = `<strong>${situation.headline}</strong><span>${situation.subline}</span>`;
    $("#handHint").textContent = situation.hint;
    $("#handFresh").innerHTML = situation.badge || "—";
    return;
  }
  tray.classList.remove("empty");
  visual.innerHTML = foodArtMarkup(state.hand.type);
  text.innerHTML = `<strong>${situation.headline}</strong><span>${situation.subline}</span>`;
  $("#handHint").textContent = situation.hint;
  $("#handFresh").innerHTML = `${state.hand.timer}<small>鲜度</small>`;
}

function currentSituation() {
  if (state.hand) {
    const matches = state.items.map((item) => ({ item, recipe: recipeFor(state.hand.type, item.type) })).filter((entry) => entry.recipe);
    const ready = matches.find((entry) => findMergePlacement(entry.recipe.result, [entry.item]));
    if (ready) return {
      tone: "success", headline: `手持${FOOD[state.hand.type].name} · 可以合成`,
      subline: `背包中的${FOOD[ready.item.type].name}正在发绿光`,
      hint: `拖到绿色“合”上松手 → ${FOOD[ready.recipe.result].name}`
    };
    if (matches.length) {
      const recipe = matches[0].recipe;
      return {
        tone: "blocked", headline: `配方正确，但${FOOD[recipe.result].name}放不下`,
        subline: `成品会占${shapeLabel(recipe.result)}`,
        hint: `红色“!”不是失灵：先拖动食物，腾出连续空间`
      };
    }
    const placements = validPlacements(state.hand.type).filter((option) => option.rotation === state.hand.rotation);
    if (placements.length) {
      const partners = RECIPES.filter((recipe) => recipe.a === state.hand.type || recipe.b === state.hand.type)
        .map((recipe) => FOOD[recipe.a === state.hand.type ? recipe.b : recipe.a].name);
      return {
        tone: "", headline: `手持${FOOD[state.hand.type].name} · 找绿色“+”`,
        subline: `${shapeLabel(state.hand.type)}，有${placements.length}个位置能放`,
        hint: partners.length ? `拖到绿色“+”松手；遇到${partners.join("或")}可直接合成` : "拖到任意绿色“+”松手放下"
      };
    }
    return {
      tone: "blocked", headline: `手持${FOOD[state.hand.type].name} · 背包已卡住`,
      subline: `缺少${shapeLabel(state.hand.type)}的连续空位`,
      hint: "先点“放弃”，再拖动整理；整理和旋转不扣鲜度"
    };
  }
  const danger = state.items.filter((item) => item.timer === 1);
  const readyOrder = state.orders.find((order) => state.items.some((item) => item.timer > 0 && canFulfill(order.type, item.type)));
  if (danger.length) return {
    tone: "blocked", headline: `危险：${FOOD[danger[0].type].name}只剩1步`,
    subline: "再接一份或再合成一次，它就会冷掉",
    hint: readyOrder ? `先点顶部${FOOD[readyOrder.type].name}订单交货；交单和整理不扣鲜度` : "先整理或准备交单；不要急着接下一份",
    badge: "1<small>步</small>"
  };
  if (readyOrder) return {
    tone: "success", headline: `${FOOD[readyOrder.type].name}订单已亮绿`,
    subline: state.lastMessage,
    hint: "点顶部绿色订单立即交货；高阶成品也能交低阶订单",
    badge: "✓"
  };
  const selected = state.items.find((item) => item.id === state.selectedId);
  if (selected) {
    const partner = state.items.find((item) => item.id !== selected.id && recipeFor(selected.type, item.type));
    return {
      tone: partner ? "success" : "", headline: `已选${FOOD[selected.type].name}`,
      subline: partner ? `${FOOD[partner.type].name}可以和它合成` : "可拖动整理，也可拿到手上",
      hint: partner ? `再点${FOOD[partner.type].name}直接合成` : "拖到空格整理；旋转与移动都不扣鲜度",
      badge: selected.timer != null ? String(selected.timer) : "—"
    };
  }
  return {
    tone: "", headline: state.falling.size ? `天空正落下${state.falling.size}份外卖` : "下一份外卖马上到",
    subline: state.lastMessage,
    hint: "按住包裹直接拖进背包；不需要的放过去不会扣分",
    badge: "—"
  };
}

function renderPressure() {
  const danger = state.items.find((item) => item.timer === 1);
  const situation = currentSituation();
  const wave = currentWave();
  $(".game-screen").classList.toggle("danger", Boolean(danger));
  backpack.classList.toggle("awaiting-placement", Boolean(state.hand));
  $("#pressureStrip").classList.toggle("danger", Boolean(danger));
  $("#pressureStrip").textContent = danger
    ? `⚠ ${FOOD[danger.type].name}再接/合成1次就冷掉`
    : `${wave.name} ${Math.floor(state.shiftElapsed)}秒 · 行动${state.actionCount}`;
  $("#skyPrompt").textContent = state.hand ? `拖入绿色格放下${FOOD[state.hand.type].name}` : "按住包裹拖进背包";
  $("#bagGuide").textContent = situation.hint;
  $("#bagGuide").classList.toggle("danger", situation.tone === "blocked");
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
  void id;
  return backpack;
}

function mobileFocus(element) {
  void element;
}

function animateItem(id) {
  void id;
  backpack.classList.remove("pop");
  requestAnimationFrame(() => backpack.classList.add("pop"));
  window.setTimeout(() => backpack.classList.remove("pop"), 300);
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
  renderer?.refreshPalette();
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

function haptic(duration = 12) {
  try { navigator.vibrate?.(duration); } catch (_) { /* Haptics are optional. */ }
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

function foodSprite(type) {
  if (spriteCache.has(type)) return spriteCache.get(type);
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  drawFood(canvas, type);
  spriteCache.set(type, canvas);
  return canvas;
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
