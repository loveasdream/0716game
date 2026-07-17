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
  { type: "cheeseBurger", level: 4 }, { type: "foamTea", level: 5 },
  { type: "cheeseCombo", level: 6 }, { type: "wholeChicken", level: 7 }
];
const LEVEL_CONFIGS = {
  1: {
    orders: ["bigTea", "bigTea", "bigTea"],
    drops: ["milkTea", "milkTea"],
    title: "奶茶练习班", rule: "完成第一次接取、合成与交单", quota: 3, parTime: 55, reward: 15
  },
  2: {
    orders: ["chickenBucket", "bigTea", "burgerPatty"],
    drops: ["chicken", "chicken"],
    title: "旋转整理班", rule: "学会安排1×2与2×2食物", quota: 3, parTime: 70, reward: 18
  },
  3: {
    orders: ["burgerPatty", "chickenBucket", "bigTea"],
    drops: ["bread", "beefPatty"],
    title: "午高峰综合班", rule: "三条基础配方混合出现", quota: 3, parTime: 75, reward: 21
  },
  4: {
    orders: ["cheeseBurger", "burgerPatty", "bigTea"],
    drops: ["bread", "beefPatty", "cheese"],
    title: "L型汉堡班", rule: "第一次制作L型芝士汉堡", quota: 4, parTime: 95, reward: 25
  },
  5: {
    orders: ["foamTea", "bigTea", "chickenBucket"],
    drops: ["milkTea", "milkTea", "cream"],
    title: "奶盖下午茶", rule: "大杯奶茶继续升级为奶盖", quota: 4, parTime: 105, reward: 28
  },
  6: {
    orders: ["cheeseCombo", "burgerPatty", "chickenBucket"],
    drops: ["bread", "beefPatty", "cheese", "cola"],
    title: "套餐装箱班", rule: "为2×2套餐预留完整空间", quota: 4, parTime: 115, reward: 32
  },
  7: {
    orders: ["wholeChicken", "chickenBucket", "bigTea"],
    drops: ["chicken", "chicken", "chicken", "chicken"],
    title: "全鸡挑战班", rule: "连续两次炸鸡桶合成全鸡", quota: 5, parTime: 135, reward: 36
  },
  8: {
    orders: ["foamTea", "cheeseBurger", "chickenBucket"],
    drops: ["milkTea", "milkTea", "cream"],
    title: "晚餐混合高峰", rule: "三种形状同时争夺背包空间", quota: 5, parTime: 145, reward: 40
  },
  9: {
    orders: ["cheeseCombo", "wholeChicken", "foamTea"],
    drops: ["bread", "beefPatty", "cheese", "cola"],
    title: "极限背包班", rule: "终极套餐与全鸡连续出单", quota: 6, parTime: 170, reward: 45
  },
  10: {
    orders: ["wholeChicken", "cheeseCombo", "foamTea"],
    drops: ["chicken", "chicken", "chicken", "chicken"],
    title: "金牌骑手考核", rule: "完成快餐篇最终综合考核", quota: 6, parTime: 185, reward: 55
  }
};
const MAX_LEVEL = Object.keys(LEVEL_CONFIGS).length;
const WAVES = [
  { id: "prep", name: "备餐期", from: 0, spawn: 1.8, fall: 1.08, maxDrops: 2 },
  { id: "rush", name: "午高峰", from: 12, spawn: 1.28, fall: .91, maxDrops: 3 },
  { id: "sprint", name: "冲单期", from: 30, spawn: .98, fall: .78, maxDrops: 4 }
];
const PLAYTEST_KEY = "pocket-delivery-playtest-v1";
const playtest = {
  sessionId: globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  startedAt: Date.now()
};
const state = {
  items: [], orders: [], falling: new Map(), hand: null, selectedId: null,
  level: 1, quota: 3, delivered: 0, coins: 0, shiftIncome: 0, levelReward: 0,
  mode: "career", dailyConfig: null, dailyRefills: [],
  insulation: 0, maxFresh: 3, uid: 1, dropUid: 1,
  running: false, paused: true, locked: false, sound: true,
  lastMessage: "按住上方包裹，直接拖进背包",
  scriptedDrops: [...LEVEL_CONFIGS[1].drops],
  bagGesture: null, catchDrag: null, preview: null, dragValidity: null,
  suppressClick: false, theme: "warm", actionCount: 0, guideStep: 0,
  tutorialActive: false, tutorialComplete: false, tutorialStartedAt: 0,
  progress: {
    unlockedLevel: 1, currentLevel: 1, bestStars: {}, bestTimes: {}, completedLevels: {},
    totalDeliveries: 0, dailyClaimed: {}, dailyBestStars: {}, dailyBestTimes: {}
  },
  shiftStats: { expired: 0, merges: 0, failures: 0, neededMisses: 0 },
  director: {
    assistLevel: 0, missStreak: 0, failureStreak: 0, successStreak: 0,
    recentDrops: [], nextNeed: null, lastAdjustment: "", lastMissAssistAt: 0
  },
  shiftElapsed: 0, nextSpawnIn: 0, waveId: "prep", lastFrame: 0, lastClockSecond: -1, runId: 1
};

const $ = (selector) => document.querySelector(selector);
const backpack = $("#backpack");
const sky = $("#sky");
const toast = $("#toast");
let toastTimer = null;
let audioContext = null;
let renderer = null;
let initialized = false;
const spriteCache = new Map();

function ensureCanvasStructure() {
  if (!sky || !backpack) throw new Error("页面缺少游戏主区域，请重新上传 index.html");

  let skyPrompt = $("#skyPrompt");
  if (!skyPrompt) {
    skyPrompt = sky.querySelector(".sky-title strong") || document.createElement("strong");
    skyPrompt.id = "skyPrompt";
    if (!skyPrompt.parentElement) sky.prepend(skyPrompt);
  }

  let pressureStrip = $("#pressureStrip");
  if (!pressureStrip) {
    pressureStrip = document.createElement("div");
    pressureStrip.id = "pressureStrip";
    pressureStrip.className = "pressure-strip";
    pressureStrip.textContent = "接取或合成 = 背包鲜度 -1";
    sky.appendChild(pressureStrip);
  }

  const bagTopline = document.querySelector(".bag-topline");
  let bagTitle = $("#bagTitle");
  if (!bagTitle && bagTopline) {
    bagTitle = bagTopline.querySelector("span") || document.createElement("span");
    bagTitle.id = "bagTitle";
    if (!bagTitle.parentElement) bagTopline.appendChild(bagTitle);
  }
  let bagGuide = $("#bagGuide");
  if (!bagGuide && bagTopline) {
    bagGuide = bagTopline.querySelector("b") || document.createElement("b");
    bagGuide.id = "bagGuide";
    if (!bagGuide.parentElement) bagTopline.appendChild(bagGuide);
  }

  const handTray = $("#handTray");
  let coachBadge = $("#coachBadge");
  if (!coachBadge && handTray) {
    coachBadge = document.createElement("div");
    coachBadge.id = "coachBadge";
    coachBadge.className = "coach-badge";
    coachBadge.hidden = true;
    handTray.appendChild(coachBadge);
  }

  const resultModal = $("#levelModal .result-modal");
  let resultStars = $("#resultStars") || resultModal?.querySelector(".result-star");
  if (resultStars) resultStars.id = "resultStars";
  let resultGoals = $("#resultGoals");
  if (!resultGoals && resultModal) {
    resultGoals = document.createElement("div");
    resultGoals.id = "resultGoals";
    resultGoals.className = "result-goals";
    const stats = resultModal.querySelector(".result-stats");
    resultModal.insertBefore(resultGoals, stats || resultModal.lastElementChild);
  }

  let skyCanvas = $("#skyCanvas");
  if (!skyCanvas) {
    skyCanvas = document.createElement("canvas");
    skyCanvas.id = "skyCanvas";
    skyCanvas.className = "sky-canvas";
    skyCanvas.setAttribute("aria-hidden", "true");
    sky.insertBefore(skyCanvas, sky.firstChild);
  }

  let bagCanvas = $("#bagCanvas");
  if (!bagCanvas) {
    bagCanvas = document.createElement("canvas");
    bagCanvas.id = "bagCanvas";
    bagCanvas.className = "bag-canvas";
    backpack.appendChild(bagCanvas);
  }

  let dragCanvas = $("#dragCanvas");
  if (!dragCanvas) {
    dragCanvas = document.createElement("canvas");
    dragCanvas.id = "dragCanvas";
    dragCanvas.className = "drag-canvas";
    dragCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(dragCanvas);
  }

  // Inline fallbacks keep mixed old/new deployments playable even before the
  // browser refreshes a cached stylesheet.
  Object.assign(skyCanvas.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%",
    zIndex: "3", imageRendering: "pixelated", touchAction: "none"
  });
  Object.assign(bagCanvas.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%",
    zIndex: "5", imageRendering: "pixelated", touchAction: "none"
  });
  Object.assign(dragCanvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100dvh",
    zIndex: "450", imageRendering: "pixelated", pointerEvents: "none"
  });
  Object.assign(pressureStrip.style, {
    position: "absolute", left: "8px", right: "8px", bottom: "6px", zIndex: "6"
  });
  sky.style.touchAction = "none";
  if (window.getComputedStyle(sky).position === "static") sky.style.position = "relative";
  if (window.getComputedStyle(backpack).position === "static") backpack.style.position = "relative";

  return { skyCanvas, bagCanvas, dragCanvas };
}

function init() {
  if (initialized) return;
  initialized = true;
  const canvases = ensureCanvasStructure();
  loadProgress();
  state.level = state.tutorialComplete
    ? Math.min(state.progress.unlockedLevel, Math.max(1, state.progress.currentLevel))
    : 1;
  updateStartModal();
  buildGrid();
  configureLevel(state.level);
  renderer = window.createCanvasRenderer({
    skyCanvas: canvases.skyCanvas, bagCanvas: canvases.bagCanvas, dragCanvas: canvases.dragCanvas,
    getState: () => state, getFood: (type) => FOOD[type],
    getShape: (type, rotation, override) => override || shapeFor(type, rotation),
    getItemCells: (item) => itemCells(item), canPlace, recipeFor, findMergePlacement,
    getSprite: foodSprite, grid: GRID
  });
  bindEvents();
  renderRecipes();
  render();
  trackEvent("session_start", { returning: state.tutorialComplete });
  document.body.dataset.theme = state.theme;
  updateThemeButtons();
  window.requestAnimationFrame(gameLoop);
}

function updateStartModal() {
  if (!state.tutorialComplete) return;
  $("#startTitle").textContent = "准备开始今天的配送";
  $("#startButton").textContent = `继续第${state.level}班`;
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("pocket-delivery-progress") || "{}");
    state.coins = Number(saved.coins) || 0;
    state.insulation = Number(saved.insulation) || 0;
    state.maxFresh = 3 + state.insulation;
    state.theme = saved.theme === "cyber" ? "cyber" : "warm";
    state.sound = saved.sound !== false;
    state.tutorialComplete = saved.tutorialComplete === true;
    const progress = saved.progress || {};
    state.progress.unlockedLevel = Math.min(MAX_LEVEL, Math.max(1, Number(progress.unlockedLevel) || 1));
    state.progress.currentLevel = Math.min(state.progress.unlockedLevel, Math.max(1, Number(progress.currentLevel) || 1));
    state.progress.bestStars = progress.bestStars && typeof progress.bestStars === "object" ? progress.bestStars : {};
    state.progress.bestTimes = progress.bestTimes && typeof progress.bestTimes === "object" ? progress.bestTimes : {};
    state.progress.completedLevels = progress.completedLevels && typeof progress.completedLevels === "object" ? progress.completedLevels : {};
    state.progress.totalDeliveries = Number(progress.totalDeliveries) || 0;
    state.progress.dailyClaimed = progress.dailyClaimed && typeof progress.dailyClaimed === "object" ? progress.dailyClaimed : {};
    state.progress.dailyBestStars = progress.dailyBestStars && typeof progress.dailyBestStars === "object" ? progress.dailyBestStars : {};
    state.progress.dailyBestTimes = progress.dailyBestTimes && typeof progress.dailyBestTimes === "object" ? progress.dailyBestTimes : {};
  } catch (_) { /* A fresh save is fine. */ }
}

function saveProgress() {
  try {
    localStorage.setItem("pocket-delivery-progress", JSON.stringify({
      coins: state.coins, insulation: state.insulation, theme: state.theme,
      sound: state.sound, tutorialComplete: state.tutorialComplete,
      progress: state.progress
    }));
  } catch (_) { /* Storage is optional. */ }
}

function trackEvent(name, details = {}) {
  const event = {
    name, at: Date.now(), elapsed: Math.round((Date.now() - playtest.startedAt) / 1000),
    sessionId: playtest.sessionId, level: state.level, guideStep: state.guideStep,
    delivered: state.delivered, actions: state.actionCount, ...details
  };
  try {
    const events = JSON.parse(localStorage.getItem(PLAYTEST_KEY) || "[]");
    events.push(event);
    localStorage.setItem(PLAYTEST_KEY, JSON.stringify(events.slice(-400)));
  } catch (_) { /* Playtest logging must never interrupt the game. */ }
}

function currentSessionEvents() {
  try {
    return JSON.parse(localStorage.getItem(PLAYTEST_KEY) || "[]")
      .filter((event) => event.sessionId === playtest.sessionId);
  } catch (_) { return []; }
}

function playtestReportText() {
  const events = currentSessionEvents();
  const count = (name) => events.filter((event) => event.name === name).length;
  const last = events.at(-1);
  const completion = events.find((event) => event.name === "tutorial_complete");
  return [
    "《外卖落下来啦》匿名试玩报告",
    `会话：${playtest.sessionId.slice(0, 8)}`,
    `时长：${last?.elapsed || 0}秒｜到达关卡：${state.level}｜送达：${state.delivered}`,
    `接取：${count("drop_caught")}｜成功放置：${count("placement_success")}｜放置失败：${count("placement_failed")}`,
    `合成成功：${count("merge_success")}｜合成失败：${count("merge_failed")}｜交单失败：${count("delivery_failed")}`,
    `冷餐：${count("food_expired")}｜漏接：${count("drop_missed")}`,
    `互动教学：${completion ? `${completion.duration}秒完成` : `未完成（步骤${state.guideStep}/5）`}`,
    "报告只包含游戏步骤和结果，不包含姓名、手机号或聊天内容。"
  ].join("\n");
}

async function sharePlaytestReport() {
  trackEvent("report_opened");
  const text = playtestReportText();
  try {
    if (navigator.share) await navigator.share({ title: "外卖小游戏试玩报告", text });
    else {
      await navigator.clipboard.writeText(text);
      showToast("试玩报告已复制，可以直接发给开发者", "good");
    }
  } catch (error) {
    if (error?.name !== "AbortError") {
      try {
        await navigator.clipboard.writeText(text);
        showToast("试玩报告已复制，可以直接粘贴发送", "good");
      } catch (_) { showToast("报告生成成功，但浏览器不允许复制", "bad"); }
    }
  }
}

function buildGrid() {
  const { bagCanvas } = ensureCanvasStructure();
  bagCanvas.setAttribute("aria-label", "四乘四配送背包，可拖动食物整理或合成");
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
  $("#reportButton")?.addEventListener("click", sharePlaytestReport);
  $("#levelsButton")?.addEventListener("click", openLevelMap);
  $("#dailyButton")?.addEventListener("click", openLevelMap);
  $("#dailyMapButton")?.addEventListener("click", startDailyChallenge);
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
    state.tutorialActive = state.level === 1 && !state.tutorialComplete;
    state.guideStep = state.tutorialActive ? 0 : 5;
    state.tutorialStartedAt = state.tutorialActive ? Date.now() : 0;
    state.shiftElapsed = 0;
    state.nextSpawnIn = .85;
    state.waveId = "prep";
    setPaused(false);
    spawnDrop();
    trackEvent("game_start", { tutorial: state.tutorialActive });
  }
  setPaused(false);
  render();
  showToast("按住包裹直接拖进背包，轻点接住也可以", "good");
  playTone(620, .08);
  window.setTimeout(() => mobileFocus(sky), 120);
}

function advanceTutorial(step) {
  if (!state.tutorialActive || step <= state.guideStep) return;
  state.guideStep = step;
  trackEvent("tutorial_step", { step });
  if (step === 2) state.nextSpawnIn = .45;
  if (step === 5) {
    state.tutorialActive = false;
    state.tutorialComplete = true;
    state.nextSpawnIn = .75;
    const duration = Math.max(1, Math.round((Date.now() - state.tutorialStartedAt) / 1000));
    trackEvent("tutorial_complete", { duration });
    saveProgress();
    showToast(`上岗教学完成，用时${duration}秒！接下来自己完成另外两单`, "good");
  }
}

function setPaused(value) {
  state.paused = value;
  sky.classList.toggle("paused", value);
}

function anyModalOpen() {
  return [...document.querySelectorAll(".modal-backdrop")].some((modal) => !modal.hidden);
}

function currentLevelConfig() {
  return state.mode === "daily" ? state.dailyConfig : LEVEL_CONFIGS[state.level];
}

function resetShiftMetrics(config) {
  state.shiftElapsed = 0;
  state.nextSpawnIn = .75;
  state.waveId = "prep";
  state.lastClockSecond = -1;
  state.actionCount = 0;
  state.levelReward = 0;
  state.shiftStats = { expired: 0, merges: 0, failures: 0, neededMisses: 0 };
  state.lastMessage = config.rule || "按住上方包裹，直接拖进背包";
  state.director.assistLevel = Math.max(0, state.director.assistLevel - 1);
  state.director.missStreak = 0;
  state.director.failureStreak = 0;
  state.director.successStreak = 0;
  state.director.recentDrops = [];
  state.director.nextNeed = null;
  state.director.lastMissAssistAt = 0;
}

function configureLevel(level) {
  const config = LEVEL_CONFIGS[level];
  state.mode = "career";
  state.dailyConfig = null;
  state.dailyRefills = [];
  state.quota = config.quota;
  const orderTypes = config?.orders || [chooseOrder(), chooseOrder(), chooseOrder()];
  state.orders = orderTypes.map((type, index) => createOrder(type, `${level}-${index}`));
  state.scriptedDrops = [...(config?.drops || [])];
  resetShiftMetrics(config);
}

function dailyKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seededRandom(seedText) {
  let seed = [...seedText].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 2654435761) >>> 0, 2166136261);
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function buildDailyConfig() {
  const key = dailyKey();
  const random = seededRandom(key);
  const pool = ["bigTea", "burgerPatty", "chickenBucket", "cheeseBurger", "foamTea"];
  const orders = Array.from({ length: 4 }, () => pool[Math.floor(random() * pool.length)]);
  const rules = [
    "今日同一套订单：比拼最快送达时间",
    "今日整洁挑战：无冷餐可获得第三颗星",
    "今日高峰挑战：稳定整理比盲目接取更重要"
  ];
  return {
    key, title: `今日特送 · ${key.slice(5)}`, rule: rules[Math.floor(random() * rules.length)],
    orders, drops: baseIngredients(orders[0]).filter((type) => CATCHABLE.includes(type)).slice(0, 4),
    quota: 4, parTime: 105, reward: 30
  };
}

function configureDailyChallenge() {
  state.mode = "daily";
  state.dailyConfig = buildDailyConfig();
  state.quota = state.dailyConfig.quota;
  state.orders = state.dailyConfig.orders.slice(0, 3).map((type, index) => createOrder(type, `daily-${state.dailyConfig.key}-${index}`));
  state.dailyRefills = state.dailyConfig.orders.slice(3);
  state.scriptedDrops = [...state.dailyConfig.drops];
  resetShiftMetrics(state.dailyConfig);
}

function currentWave() {
  return [...WAVES].reverse().find((wave) => state.shiftElapsed >= wave.from) || WAVES[0];
}

function difficultyProfile(wave = currentWave()) {
  if (state.tutorialActive) return { spawnInterval: 99, fallMultiplier: 1.65, maxDrops: 1 };
  const assist = state.director.assistLevel;
  const mastery = Math.min(.12, state.director.successStreak * .015);
  return {
    spawnInterval: wave.spawn * (1 + assist * .18) * (1 - mastery * .35),
    fallMultiplier: Math.max(.88, 1 + assist * .2 - mastery),
    maxDrops: Math.max(1, wave.maxDrops - (assist >= 1 ? 1 : 0))
  };
}

function recordOutcome(kind, details = {}) {
  const director = state.director;
  const before = director.assistLevel;
  if (kind === "miss") {
    director.missStreak += 1;
    director.failureStreak += 1;
    director.successStreak = 0;
    const now = Date.now();
    if (now - director.lastMissAssistAt >= 3500) {
      director.assistLevel = Math.min(3, director.assistLevel + 1);
      director.lastMissAssistAt = now;
    }
  } else if (kind === "failure") {
    director.failureStreak += 1;
    director.successStreak = Math.max(0, director.successStreak - 1);
    if (director.failureStreak >= 2) {
      director.assistLevel = Math.min(3, director.assistLevel + 1);
      director.failureStreak = 0;
    }
  } else if (kind === "expired") {
    director.failureStreak = 0;
    director.successStreak = 0;
    director.assistLevel = Math.min(3, director.assistLevel + 1);
  } else if (kind === "success") {
    director.successStreak += 1;
    director.missStreak = Math.max(0, director.missStreak - 1);
    director.failureStreak = Math.max(0, director.failureStreak - 1);
    if (director.successStreak % 2 === 0) director.assistLevel = Math.max(0, director.assistLevel - 1);
  }
  if (before !== director.assistLevel) {
    director.lastAdjustment = kind;
    trackEvent("difficulty_adjusted", { from: before, to: director.assistLevel, reason: kind, ...details });
  }
}

function activeSupplySources(includeFalling = true) {
  const sources = state.items
    .filter((item) => item.type !== "badReview" && item.timer > 0)
    .map((item) => ({ type: item.type, kind: "bag", id: item.id }));
  if (state.hand) sources.push({ type: state.hand.type, kind: "hand", id: "hand" });
  if (includeFalling) state.falling.forEach((drop) => sources.push({ type: drop.type, kind: "falling", id: drop.id }));
  return sources;
}

function solvabilityPlan({ includeFalling = true } = {}) {
  const pending = state.orders
    .map((order, orderIndex) => ({ order, orderIndex }))
    .filter(({ order }) => !order.done);
  const sources = activeSupplySources(includeFalling);
  const unresolved = [];

  pending.forEach((entry) => {
    let sourceIndex = sources.findIndex((source) => source.type === entry.order.type);
    if (sourceIndex < 0) sourceIndex = sources.findIndex((source) => canFulfill(entry.order.type, source.type));
    if (sourceIndex >= 0) sources.splice(sourceIndex, 1);
    else unresolved.push(entry);
  });

  const supply = new Map();
  sources.forEach((source) => baseIngredients(source.type).forEach((type) => {
    if (CATCHABLE.includes(type)) supply.set(type, (supply.get(type) || 0) + 1);
  }));

  const missing = [];
  unresolved.forEach(({ order, orderIndex }) => {
    baseIngredients(order.type).forEach((type) => {
      const available = supply.get(type) || 0;
      if (available > 0) supply.set(type, available - 1);
      else if (CATCHABLE.includes(type)) missing.push({ type, orderIndex, orderType: order.type });
    });
  });
  return { pending, unresolved, missing, readyCount: pending.length - unresolved.length };
}

function chooseDirectedDrop() {
  const plan = solvabilityPlan();
  const earliestOrder = plan.missing.length ? Math.min(...plan.missing.map((need) => need.orderIndex)) : -1;
  const urgent = earliestOrder >= 0 ? plan.missing.filter((need) => need.orderIndex === earliestOrder) : [];
  const scripted = state.scriptedDrops[0];
  if (scripted && (!urgent.length || urgent.some((need) => need.type === scripted))) {
    state.scriptedDrops.shift();
    state.director.nextNeed = urgent.find((need) => need.type === scripted) || null;
    return { type: scripted, source: "scripted", plan };
  }

  if (urgent.length) {
    const counts = new Map();
    urgent.forEach((need) => counts.set(need.type, (counts.get(need.type) || 0) + 1));
    const recent = state.director.recentDrops;
    const options = [...counts.keys()].sort((a, b) => {
      const countDiff = counts.get(b) - counts.get(a);
      if (countDiff) return countDiff;
      const lastA = recent.lastIndexOf(a);
      const lastB = recent.lastIndexOf(b);
      return lastA - lastB;
    });
    const lastTwo = recent.slice(-2);
    const type = options.find((option) => options.length === 1 || !lastTwo.every((recentType) => recentType === option)) || options[0];
    state.director.nextNeed = urgent.find((need) => need.type === type) || null;
    return { type, source: "guaranteed", plan };
  }

  if (scripted) {
    state.scriptedDrops.shift();
    state.director.nextNeed = null;
    return { type: scripted, source: "scripted", plan };
  }

  const firstOrder = plan.pending[0]?.order;
  const useful = firstOrder ? baseIngredients(firstOrder.type).filter((type) => CATCHABLE.includes(type)) : CATCHABLE;
  const pool = useful.length ? useful : CATCHABLE;
  const type = pool[Math.floor(Math.random() * pool.length)];
  state.director.nextNeed = null;
  return { type, source: "support", plan };
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
    if (!state.tutorialActive && wave.id !== state.waveId) {
      state.waveId = wave.id;
      showToast(wave.id === "sprint" ? "冲单期！外卖加速，稳住背包" : "午高峰来了！掉落开始加快", wave.id === "sprint" ? "bad" : "good");
      playTone(wave.id === "sprint" ? 880 : 720, .09);
      haptic(22);
    }
    if (state.nextSpawnIn <= 0) {
      if (state.tutorialActive) {
        const tutorialNeedsDrop = !state.hand && state.falling.size === 0 && (state.guideStep === 0 || state.guideStep === 2);
        if (tutorialNeedsDrop) spawnDrop();
        state.nextSpawnIn = tutorialNeedsDrop ? 99 : .18;
      } else {
        spawnDrop();
        state.nextSpawnIn = difficultyProfile(wave).spawnInterval;
      }
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
  const profile = difficultyProfile(wave);
  if (!state.running || state.paused || state.locked || state.falling.size >= profile.maxDrops) return;
  const choice = chooseDirectedDrop();
  const type = choice.type;
  const id = `drop-${state.dropUid++}`;
  const laneLoads = [0, 1, 2].map((lane) => [...state.falling.values()].filter((drop) => drop.lane === lane).length);
  const lightest = Math.min(...laneLoads);
  const possibleLanes = laneLoads.map((load, lane) => load === lightest ? lane : -1).filter((lane) => lane >= 0);
  const lane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
  const fallSeconds = state.tutorialActive
    ? 11
    : Math.max(3.65, (6.25 - state.level * .13 + Math.random() * .55) * wave.fall * profile.fallMultiplier);
  state.falling.set(id, { id, type, lane, progress: 0, duration: fallSeconds });
  state.director.recentDrops.push(type);
  state.director.recentDrops = state.director.recentDrops.slice(-8);
  trackEvent("drop_spawned", {
    type, tutorial: state.tutorialActive, source: choice.source,
    assist: state.director.assistLevel, neededFor: state.director.nextNeed?.orderType || null
  });
  renderFallCount();
  renderHand();
  renderPressure();
}

function removeDrop(id, missed = false) {
  const drop = state.falling.get(id);
  if (!drop) return;
  state.falling.delete(id);
  if (missed) {
    const stillNeeded = solvabilityPlan().missing.some((need) => need.type === drop.type);
    trackEvent("drop_missed", { type: drop.type, tutorial: state.tutorialActive, needed: stillNeeded });
    if (!state.tutorialActive && stillNeeded) {
      state.shiftStats.neededMisses += 1;
      recordOutcome("miss", { type: drop.type });
    }
    const label = $("#missedLabel");
    label.textContent = `放过了${FOOD[drop.type].name} · 不扣分`;
    window.setTimeout(() => { label.textContent = "不需要的可以放过"; }, 1100);
  }
  renderFallCount();
  renderHand();
  renderPressure();
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
  if (state.tutorialActive && state.guideStep === 0) advanceTutorial(1);
  else if (state.tutorialActive && state.guideStep === 2) advanceTutorial(3);
  state.selectedId = null;
  trackEvent("drop_caught", { type: drop.type, dragged: Boolean(gesture), tutorial: state.tutorialActive });
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
    state.shiftStats.failures += 1;
    trackEvent("placement_failed", { type: state.hand.type, reason: "no_space", required });
    recordOutcome("failure", { action: "placement", reason: "no_space" });
    showToast(`${FOOD[state.hand.type].name}需要${required}的连续空位；拖动食物腾位置，或点“放弃”`, "bad");
    bump(backpack);
    state.lastMessage = `放不下：需要${required}连续空位`;
    render();
    return;
  }
  const item = createItem(state.hand.type, placement.x, placement.y, placement.rotation, state.hand.timer);
  state.items.push(item);
  const name = FOOD[state.hand.type].name;
  trackEvent("placement_success", { type: state.hand.type, x: placement.x, y: placement.y, snapped });
  state.hand = null;
  state.selectedId = item.id;
  if (state.tutorialActive && state.guideStep === 1) advanceTutorial(2);
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
    state.shiftStats.failures += 1;
    trackEvent("merge_failed", { source: state.hand.type, target: target.type, reason: "no_recipe" });
    recordOutcome("failure", { action: "merge", reason: "no_recipe" });
    showToast(`${FOOD[state.hand.type].name}不能和${FOOD[target.type].name}合成${possible.length ? `；请找${possible.join("或")}` : ""}`, "bad");
    bump(targetElement(target.id));
    return;
  }
  const placement = findMergePlacement(recipe.result, [target]);
  if (!placement) {
    const reason = mergeSpaceMessage(recipe.result, [target]);
    state.shiftStats.failures += 1;
    trackEvent("merge_failed", { source: state.hand.type, target: target.type, result: recipe.result, reason: "no_space" });
    recordOutcome("failure", { action: "merge", reason: "no_space" });
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
  state.shiftStats.merges += 1;
  trackEvent("merge_success", { source: state.hand.type, target: target.type, result: recipe.result, mode: "hand" });
  recordOutcome("success", { action: "merge" });
  state.hand = null;
  state.selectedId = result.id;
  if (state.tutorialActive && state.guideStep === 3) advanceTutorial(4);
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
    state.shiftStats.failures += 1;
    trackEvent("merge_failed", { source: first.type, target: second.type, result: resultType, reason: "no_space", mode: "bag" });
    recordOutcome("failure", { action: "merge", reason: "no_space" });
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
  state.shiftStats.merges += 1;
  state.selectedId = result.id;
  trackEvent("merge_success", { source: first.type, target: second.type, result: resultType, mode: "bag" });
  recordOutcome("success", { action: "merge" });
  if (state.tutorialActive && state.guideStep === 3) advanceTutorial(4);
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
    state.shiftStats.expired += 1;
    trackEvent("food_expired", { type: oldName, cells: item.shapeOverride.length });
    recordOutcome("expired", { type: oldName });
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
    state.shiftStats.failures += 1;
    trackEvent("delivery_failed", { order: order.type, reason: "missing_item" });
    recordOutcome("failure", { action: "delivery", order: order.type });
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
  state.progress.totalDeliveries += 1;
  trackEvent("delivery_success", { order: order.type, item: item.type, payout, upgraded });
  recordOutcome("success", { action: "delivery" });
  order.done = true;
  state.lastMessage = `已交付${FOOD[item.type].name}，收入 ¥${payout}`;
  saveProgress();
  showToast(`${upgraded ? "高阶替代" : "精准"}送达！${FOOD[item.type].name}收入 ¥${payout}${waveBonus > 1 ? "（冲单加成）" : ""}`, "good");
  playTone(760, .08); window.setTimeout(() => playTone(960, .09), 70);
  haptic(35);
  if (state.tutorialActive && state.guideStep === 4) advanceTutorial(5);
  render();
  if (state.delivered >= state.quota) {
    completeShift();
  } else {
    const remainingNeed = state.quota - state.delivered;
    const remainingVisible = state.orders.filter((candidate) => !candidate.done).length;
    const activeRun = state.runId;
    if (remainingNeed > remainingVisible) window.setTimeout(() => {
      if (state.runId !== activeRun) return;
      const index = state.orders.indexOf(order);
      if (index < 0) return;
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
  if (state.mode === "daily" && state.dailyRefills.length) return state.dailyRefills.shift();
  const difficultyLevel = state.mode === "daily" ? Math.max(2, state.progress.unlockedLevel) : state.level;
  const pool = ORDER_POOL.filter((entry) => entry.level <= difficultyLevel).map((entry) => entry.type);
  return pool[Math.floor(Math.random() * pool.length)];
}

function evaluateShift() {
  const config = currentLevelConfig();
  const elapsed = Math.max(1, Math.round(state.shiftElapsed));
  const onTime = elapsed <= config.parTime;
  const clean = state.shiftStats.expired === 0;
  return { elapsed, onTime, clean, stars: 1 + Number(onTime) + Number(clean), config };
}

function completeShift() {
  if (state.locked) return;
  state.locked = true;
  setPaused(true);
  const result = evaluateShift();
  let firstClear = false;
  let reward = 0;

  if (state.mode === "career") {
    const key = String(state.level);
    firstClear = !state.progress.completedLevels[key];
    state.progress.completedLevels[key] = true;
    state.progress.bestStars[key] = Math.max(Number(state.progress.bestStars[key]) || 0, result.stars);
    const previousTime = Number(state.progress.bestTimes[key]) || Infinity;
    state.progress.bestTimes[key] = Math.min(previousTime, result.elapsed);
    state.progress.unlockedLevel = Math.min(MAX_LEVEL, Math.max(state.progress.unlockedLevel, state.level + 1));
    state.progress.currentLevel = Math.min(MAX_LEVEL, state.level < MAX_LEVEL ? state.level + 1 : state.level);
    reward = firstClear ? result.config.reward : Math.max(5, Math.round(result.config.reward * .25));
  } else {
    const key = state.dailyConfig.key;
    firstClear = !state.progress.dailyClaimed[key];
    state.progress.dailyClaimed[key] = true;
    state.progress.dailyBestStars[key] = Math.max(Number(state.progress.dailyBestStars[key]) || 0, result.stars);
    const previousTime = Number(state.progress.dailyBestTimes[key]) || Infinity;
    state.progress.dailyBestTimes[key] = Math.min(previousTime, result.elapsed);
    reward = firstClear ? result.config.reward : 0;
  }

  state.levelReward = reward;
  state.coins += reward;
  $("#shiftIncome").textContent = state.shiftIncome;
  $("#levelReward").textContent = reward;
  $("#resultStars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
  $("#resultText").textContent = `${result.config.title}完成：${state.quota}单 · ${result.elapsed}秒`;
  $("#resultGoals").innerHTML = [
    `<span class="goal done">✓ 完成${state.quota}单</span>`,
    `<span class="goal ${result.onTime ? "done" : "miss"}">${result.onTime ? "✓" : "○"} 准时 ${result.elapsed}/${result.config.parTime}秒</span>`,
    `<span class="goal ${result.clean ? "done" : "miss"}">${result.clean ? "✓" : "○"} 无冷餐${result.clean ? "" : `（${state.shiftStats.expired}份）`}</span>`
  ].join("");
  $("#nextLevelButton").textContent = state.mode === "career" && state.level < MAX_LEVEL ? "进入下一班" : "返回配送地图";
  saveProgress();
  renderHeader();
  trackEvent("level_complete", {
    mode: state.mode, duration: result.elapsed, income: state.shiftIncome,
    stars: result.stars, firstClear, reward
  });
  window.setTimeout(() => openModal("levelModal"), 420);
}

function resetRunBoard() {
  state.runId += 1;
  state.delivered = 0;
  state.shiftIncome = 0;
  state.items = [];
  state.falling.clear();
  state.hand = null;
  state.selectedId = null;
  state.catchDrag = null;
  state.bagGesture = null;
  state.tutorialActive = false;
  state.guideStep = 5;
  clearPreview();
  state.locked = false;
}

function startCareerLevel(level) {
  if (level < 1 || level > state.progress.unlockedLevel || level > MAX_LEVEL) return;
  resetRunBoard();
  state.level = level;
  state.progress.currentLevel = level;
  configureLevel(level);
  state.running = true;
  closeModals();
  setPaused(false);
  saveProgress();
  spawnDrop();
  showToast(`${LEVEL_CONFIGS[level].title}：目标${state.quota}单`, "good");
  trackEvent("level_started", { level, title: LEVEL_CONFIGS[level].title });
  playTone(630, .08);
  render();
}

function startDailyChallenge() {
  if (!state.tutorialComplete) {
    closeModals();
    setPaused(false);
    showToast("先完成30秒上岗教学，再参加今日特送", "bad");
    return;
  }
  resetRunBoard();
  configureDailyChallenge();
  state.running = true;
  closeModals();
  setPaused(false);
  spawnDrop();
  showToast(`${state.dailyConfig.title}：同一天所有玩家订单相同`, "good");
  trackEvent("daily_started", { key: state.dailyConfig.key, orders: state.dailyConfig.orders.join(",") });
  render();
}

function nextLevel() {
  if (state.mode === "career" && state.level < MAX_LEVEL) {
    startCareerLevel(Math.min(state.level + 1, state.progress.unlockedLevel));
    return;
  }
  state.running = false;
  state.locked = false;
  closeModals();
  openLevelMap();
}

function totalCareerStars() {
  return Object.values(state.progress.bestStars).reduce((sum, stars) => sum + (Number(stars) || 0), 0);
}

function renderLevelMap() {
  const grid = $("#levelGrid");
  if (!grid) return;
  const stars = totalCareerStars();
  $("#careerSummary").innerHTML = `<b>${stars}/${MAX_LEVEL * 3} ★</b><span>已解锁 ${state.progress.unlockedLevel}/${MAX_LEVEL} 班 · 累计送达 ${state.progress.totalDeliveries} 单</span>`;
  grid.innerHTML = "";
  Object.entries(LEVEL_CONFIGS).forEach(([levelText, config]) => {
    const level = Number(levelText);
    const unlocked = level <= state.progress.unlockedLevel;
    const bestStars = Number(state.progress.bestStars[levelText]) || 0;
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = !unlocked;
    button.className = `level-card${unlocked ? "" : " locked"}${state.mode === "career" && level === state.level ? " current" : ""}`;
    button.innerHTML = `<span class="level-number">${String(level).padStart(2, "0")}</span><span><strong>${config.title}</strong><small>${config.rule}</small><i>${bestStars ? `${"★".repeat(bestStars)}${"☆".repeat(3 - bestStars)}` : unlocked ? "未通关" : "未解锁"}</i></span><b>${config.quota}单</b>`;
    if (unlocked) button.addEventListener("click", () => startCareerLevel(level));
    grid.appendChild(button);
  });
  const today = dailyKey();
  const dailyDone = Boolean(state.progress.dailyClaimed[today]);
  const dailyStars = Number(state.progress.dailyBestStars[today]) || 0;
  const dailyTime = Number(state.progress.dailyBestTimes[today]) || 0;
  $("#dailyMapButton").innerHTML = `<i>☀</i><span><strong>今日特送 · ${today.slice(5)}</strong><small>${dailyStars ? `${"★".repeat(dailyStars)}${"☆".repeat(3 - dailyStars)} · 最快${dailyTime}秒` : "每日固定订单 · 可重复刷新星级"}</small></span><b>${dailyDone ? "已领奖" : "¥30"}</b>`;
}

function openLevelMap() {
  if (!state.tutorialComplete) {
    closeModals();
    setPaused(false);
    showToast("完成第一单教学后解锁配送地图", "bad");
    return;
  }
  closeModals();
  renderLevelMap();
  openModal("mapModal");
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
  $("#levelValue").textContent = state.mode === "daily" ? "今" : String(state.level).padStart(2, "0");
  $("#deliveredValue").textContent = state.delivered;
  $("#quotaValue").textContent = state.quota;
  $("#coinValue").textContent = state.coins;
  const danger = state.items.some((item) => item.timer === 1);
  $("#freshnessLabel").textContent = danger ? "有餐将冷" : `鲜度${state.maxFresh}`;
  $("#upgradeCost").textContent = `¥${20 + state.insulation * 15}`;
  $("#soundButton").textContent = state.sound ? "♪" : "×";
  $("#soundButton").classList.toggle("muted", !state.sound);
  if ($("#levelsStatus")) $("#levelsStatus").textContent = `${state.progress.unlockedLevel}/${MAX_LEVEL}`;
  if ($("#dailyStatus")) $("#dailyStatus").textContent = state.progress.dailyClaimed[dailyKey()] ? "已领奖" : "¥30";
  if ($("#bagTitle")) $("#bagTitle").textContent = `4×4 · ${currentLevelConfig()?.title || "配送背包"}`;
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
  const tutorial = tutorialSituation();
  if (tutorial) return tutorial;
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
  const plan = solvabilityPlan({ includeFalling: false });
  const urgent = plan.missing[0];
  return {
    tone: "", headline: state.falling.size ? `天空正落下${state.falling.size}份外卖` : "下一份外卖马上到",
    subline: state.lastMessage,
    hint: urgent
      ? `调度站会持续补发第${urgent.orderIndex + 1}单缺少的${FOOD[urgent.type].name}；漏接也会重算`
      : "当前订单材料已齐；先整理、合成或点绿色订单交货",
    badge: "—"
  };
}

function tutorialSituation() {
  if (!state.tutorialActive) return null;
  if (state.guideStep === 0) return {
    tone: "success", headline: "第1步：接住第一杯奶茶",
    subline: "空中的包裹已经放慢，不会突然消失",
    hint: "按住正在下落的奶茶，直接拖向背包",
    badge: "1/5"
  };
  if (state.guideStep === 1) return {
    tone: "success", headline: "第2步：把奶茶放进背包",
    subline: "背包里所有绿色“+”都能放",
    hint: "拖到任意绿色“+”松手，食物会自动吸附",
    badge: "2/5"
  };
  if (state.guideStep === 2) return {
    tone: "success", headline: "第3步：再接一杯奶茶",
    subline: "第一杯已经放好，第二杯正在天空出现",
    hint: "按住第二杯往背包拖，这次准备直接合成",
    badge: "3/5"
  };
  if (state.guideStep === 3) {
    const holding = Boolean(state.hand);
    return {
      tone: "success", headline: "第4步：两杯奶茶合成大杯",
      subline: holding ? "第一杯正在背包里发绿色“合”光" : "两杯都在背包里，也可以互相拖动",
      hint: holding ? "把手上的奶茶拖到绿色“合”上松手" : "按住一杯奶茶，拖到另一杯上松手",
      badge: "4/5"
    };
  }
  return {
    tone: "success", headline: "最后一步：交付大杯奶茶",
    subline: "顶部第一张订单已经亮绿",
    hint: "点顶部发光的“大杯奶茶”订单完成配送",
    badge: "5/5"
  };
}

function renderTutorialFocus() {
  const active = state.tutorialActive;
  const coach = $("#coachBadge");
  if (coach) {
    coach.hidden = !active;
    coach.textContent = active ? `互动上岗 ${Math.min(5, state.guideStep + 1)}/5` : "";
  }
  document.body.classList.toggle("tutorial-active", active);
  sky.classList.toggle("guide-focus", active && (state.guideStep === 0 || state.guideStep === 2));
  backpack.classList.toggle("guide-focus", active && (state.guideStep === 1 || state.guideStep === 3));
  $(".orders-bar")?.classList.toggle("guide-focus", active && state.guideStep === 4);
}

function renderPressure() {
  const danger = state.items.find((item) => item.timer === 1);
  const situation = currentSituation();
  const wave = currentWave();
  const assist = state.director.assistLevel;
  const urgent = solvabilityPlan({ includeFalling: false }).missing[0];
  $(".game-screen").classList.toggle("danger", Boolean(danger));
  backpack.classList.toggle("awaiting-placement", Boolean(state.hand));
  $("#pressureStrip").classList.toggle("danger", Boolean(danger));
  $("#pressureStrip").textContent = state.tutorialActive
    ? `互动教学 ${Math.min(5, state.guideStep + 1)}/5 · 按发光位置操作`
    : danger
    ? `⚠ ${FOOD[danger.type].name}再接/合成1次就冷掉`
    : assist > 0
    ? `智能放缓 ${"■".repeat(assist)}${"□".repeat(3 - assist)} · ${urgent ? `优先补${FOOD[urgent.type].name}` : "材料已齐"}`
    : `${wave.name} ${Math.floor(state.shiftElapsed)}秒 · 行动${state.actionCount}`;
  $("#skyPrompt").textContent = state.hand
    ? `拖入绿色格放下${FOOD[state.hand.type].name}`
    : assist > 0 ? "节奏已放缓，优先补订单材料" : "按住包裹拖进背包";
  $("#bagGuide").textContent = situation.hint;
  $("#bagGuide").classList.toggle("danger", situation.tone === "blocked");
  renderTutorialFocus();
}

function renderControls() {
  const selected = state.items.find((item) => item.id === state.selectedId);
  const rotatable = state.hand ? FOOD[state.hand.type].rotatable : selected && FOOD[selected.type].rotatable;
  $("#rotateButton").disabled = state.tutorialActive || !rotatable;
  $("#pickupButton").disabled = state.tutorialActive || Boolean(state.hand) || !selected || selected.type === "badReview";
  $("#cancelButton").disabled = state.tutorialActive || (!state.hand && !selected);
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
  const result = state.delivered >= state.quota ? evaluateShift() : null;
  const challenge = state.mode === "daily" ? state.dailyConfig?.title || "今日特送" : `第${state.level}班${LEVEL_CONFIGS[state.level].title}`;
  const score = result ? `拿到${result.stars}星，用时${result.elapsed}秒` : `已经送了${state.delivered}/${state.quota}单`;
  const text = `我在《外卖落下来啦！》${challenge}${score}，赚到¥${state.shiftIncome}。你能把4×4背包塞得更好吗？`;
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

function showBootError(error) {
  console.error("游戏启动失败", error);
  const message = "游戏资源没有加载完整，请刷新页面；如果仍失败，请重新上传 renderer.js";
  if (toast) {
    toast.textContent = message;
    toast.className = "toast show bad";
  } else {
    const warning = document.createElement("div");
    warning.textContent = message;
    Object.assign(warning.style, {
      position: "fixed", left: "12px", right: "12px", top: "12px", zIndex: "9999",
      padding: "14px", color: "#fff", background: "#9f2f32", fontSize: "16px",
      textAlign: "center", border: "3px solid #fff"
    });
    document.body.appendChild(warning);
  }
}

function bootGame() {
  try {
    ensureCanvasStructure();
    if (typeof window.createCanvasRenderer === "function") {
      init();
      return;
    }

    // An older cached index.html may not contain renderer.js at all. Replace a
    // failed/stale tag with a cache-busted loader so the game can self-repair.
    document.querySelectorAll('script[src*="renderer.js"]').forEach((script) => script.remove());
    const loader = document.createElement("script");
    loader.src = "renderer.js?v=20260717h";
    loader.onload = () => {
      if (typeof window.createCanvasRenderer !== "function") {
        showBootError(new Error("renderer.js 未注册渲染器"));
        return;
      }
      init();
    };
    loader.onerror = () => showBootError(new Error("renderer.js 加载失败"));
    document.head.appendChild(loader);
  } catch (error) {
    showBootError(error);
  }
}

bootGame();
