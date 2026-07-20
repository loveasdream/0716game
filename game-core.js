(function initDeliveryCore(root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  else root.DeliveryCore = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDeliveryCore() {
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
  const ORDER_POOL = [
    { type: "burgerPatty", level: 1 }, { type: "chickenBucket", level: 1 }, { type: "bigTea", level: 1 },
    { type: "cheeseBurger", level: 4 }, { type: "foamTea", level: 5 },
    { type: "cheeseCombo", level: 6 }, { type: "wholeChicken", level: 7 }
  ];
  const LEVEL_CONFIGS = {
    1: { orders: ["bigTea", "bigTea", "bigTea"], drops: ["milkTea", "milkTea"], title: "奶茶练习班", rule: "完成第一次接取、合成与交单", quota: 3, parTime: 55, reward: 15 },
    2: { orders: ["chickenBucket", "bigTea", "burgerPatty"], drops: ["chicken", "chicken"], title: "旋转整理班", rule: "学会安排1×2与2×2食物", quota: 3, parTime: 70, reward: 18 },
    3: { orders: ["burgerPatty", "chickenBucket", "bigTea"], drops: ["bread", "beefPatty"], title: "午高峰综合班", rule: "三条基础配方混合出现", quota: 3, parTime: 75, reward: 21 },
    4: { orders: ["cheeseBurger", "burgerPatty", "bigTea"], drops: ["bread", "beefPatty", "cheese"], title: "L型汉堡班", rule: "第一次制作L型芝士汉堡", quota: 4, parTime: 95, reward: 25 },
    5: { orders: ["foamTea", "bigTea", "chickenBucket"], drops: ["milkTea", "milkTea", "cream"], title: "奶盖下午茶", rule: "大杯奶茶继续升级为奶盖", quota: 4, parTime: 105, reward: 28 },
    6: { orders: ["cheeseCombo", "burgerPatty", "chickenBucket"], drops: ["bread", "beefPatty", "cheese", "cola"], title: "套餐装箱班", rule: "为2×2套餐预留完整空间", quota: 4, parTime: 115, reward: 32 },
    7: { orders: ["wholeChicken", "chickenBucket", "bigTea"], drops: ["chicken", "chicken", "chicken", "chicken"], title: "全鸡挑战班", rule: "连续两次炸鸡桶合成全鸡", quota: 5, parTime: 135, reward: 36 },
    8: { orders: ["foamTea", "cheeseBurger", "chickenBucket"], drops: ["milkTea", "milkTea", "cream"], title: "晚餐混合高峰", rule: "三种形状同时争夺背包空间", quota: 5, parTime: 145, reward: 40 },
    9: { orders: ["cheeseCombo", "wholeChicken", "foamTea"], drops: ["bread", "beefPatty", "cheese", "cola"], title: "极限背包班", rule: "终极套餐与全鸡连续出单", quota: 6, parTime: 170, reward: 45 },
    10: { orders: ["wholeChicken", "cheeseCombo", "foamTea"], drops: ["chicken", "chicken", "chicken", "chicken"], title: "金牌骑手考核", rule: "完成快餐篇最终综合考核", quota: 6, parTime: 185, reward: 55 }
  };
  const MAX_LEVEL = Object.keys(LEVEL_CONFIGS).length;
  const WAVES = [
    { id: "prep", name: "备餐期", from: 0, spawn: 1.8, fall: 1.08, maxDrops: 2 },
    { id: "rush", name: "午高峰", from: 12, spawn: 1.28, fall: .91, maxDrops: 3 },
    { id: "sprint", name: "冲单期", from: 30, spawn: .98, fall: .78, maxDrops: 4 }
  ];

  function shapeFor(type, rotation = 0) {
    let points = FOOD[type].shape.map(([x, y]) => [x, y]);
    for (let turn = 0; turn < rotation % 4; turn += 1) points = points.map(([x, y]) => [-y, x]);
    const minX = Math.min(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([, y]) => y));
    return points.map(([x, y]) => [x - minX, y - minY]);
  }

  function baseIngredients(type, depth = 0) {
    if (depth > 6 || CATCHABLE.includes(type)) return [type];
    const recipe = RECIPES.find((candidate) => candidate.result === type);
    if (!recipe) return [type];
    return [...baseIngredients(recipe.a, depth + 1), ...baseIngredients(recipe.b, depth + 1)];
  }

  function recipeFor(a, b) {
    return RECIPES.find((recipe) => (recipe.a === a && recipe.b === b) || (recipe.a === b && recipe.b === a));
  }

  function canFulfill(orderType, itemType) {
    if (orderType === itemType) return true;
    if (!FOOD[orderType] || !FOOD[itemType] || FOOD[itemType].value <= FOOD[orderType].value) return false;
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
    return Object.keys(FOOD).filter((type) => type !== "badReview" && type !== orderType && canFulfill(orderType, type))
      .sort((a, b) => FOOD[a].value - FOOD[b].value);
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

  function buildDailyConfig(key = dailyKey()) {
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

  return {
    GRID, FOOD, RECIPES, CATCHABLE, ORDER_POOL, LEVEL_CONFIGS, MAX_LEVEL, WAVES,
    shapeFor, baseIngredients, recipeFor, canFulfill, orderUpgrades,
    dailyKey, seededRandom, buildDailyConfig
  };
});
