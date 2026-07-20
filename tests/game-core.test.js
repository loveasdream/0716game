"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../game-core.js");

test("食物形状旋转后会归一到背包坐标", () => {
  assert.deepEqual(core.shapeFor("chicken", 0), [[0, 0], [1, 0]]);
  assert.deepEqual(core.shapeFor("chicken", 1), [[0, 0], [0, 1]]);
  assert.deepEqual(core.shapeFor("cheeseBurger", 2), [[1, 1], [0, 1], [1, 0]]);
  assert.deepEqual(core.shapeFor("milkTea", 3), [[0, 0]]);
});

test("合成配方不受两个材料的点击顺序影响", () => {
  assert.equal(core.recipeFor("bread", "beefPatty")?.result, "burgerPatty");
  assert.equal(core.recipeFor("beefPatty", "bread")?.result, "burgerPatty");
  assert.equal(core.recipeFor("milkTea", "cream"), undefined);
  assert.equal(core.recipeFor("bigTea", "cream")?.result, "foamTea");
});

test("高阶成品可以替代低阶订单，但低阶原料不能越级交单", () => {
  assert.equal(core.canFulfill("burgerPatty", "cheeseBurger"), true);
  assert.equal(core.canFulfill("cheeseBurger", "cheeseCombo"), true);
  assert.equal(core.canFulfill("chickenBucket", "wholeChicken"), true);
  assert.equal(core.canFulfill("cheeseBurger", "burgerPatty"), false);
  assert.equal(core.canFulfill("chickenBucket", "chicken"), false);
  assert.equal(core.canFulfill("bigTea", "milkTea"), false);
});

test("终极菜所需基础材料数量正确且不会产生差评块", () => {
  assert.deepEqual(core.baseIngredients("wholeChicken"), ["chicken", "chicken", "chicken", "chicken"]);
  assert.deepEqual(core.baseIngredients("foamTea"), ["milkTea", "milkTea", "cream"]);
  assert.deepEqual(core.baseIngredients("cheeseCombo"), ["bread", "beefPatty", "cheese", "cola"]);
  assert.equal(core.CATCHABLE.includes("badReview"), false);
});

test("十个职业关卡具备完整且递进的通关配置", () => {
  assert.equal(core.MAX_LEVEL, 10);
  for (let level = 1; level <= core.MAX_LEVEL; level += 1) {
    const config = core.LEVEL_CONFIGS[level];
    assert.ok(config.title && config.rule);
    assert.ok(config.orders.length >= 3);
    assert.ok(config.drops.every((type) => core.CATCHABLE.includes(type)));
    assert.ok(config.quota >= 3 && config.parTime > 0 && config.reward > 0);
    if (level > 1) assert.ok(config.reward >= core.LEVEL_CONFIGS[level - 1].reward);
  }
});

test("同一天的每日挑战完全一致，跨天会重新生成", () => {
  const first = core.buildDailyConfig("2026-07-20");
  const retry = core.buildDailyConfig("2026-07-20");
  const tomorrow = core.buildDailyConfig("2026-07-21");
  assert.deepEqual(first, retry);
  assert.equal(first.orders.length, 4);
  assert.equal(first.quota, 4);
  assert.notDeepEqual(first.orders.concat(first.rule), tomorrow.orders.concat(tomorrow.rule));
});

test("日期种子使用本地自然日", () => {
  assert.equal(core.dailyKey(new Date(2026, 6, 20, 23, 59)), "2026-07-20");
  assert.equal(core.dailyKey(new Date(2026, 0, 2, 0, 1)), "2026-01-02");
});
