const test = require("node:test");
const assert = require("node:assert");

let swipe = null;

test("swipe up - loads the shared constants and helpers", async () => {
  swipe = await import("../src/services/interaction/swipeUpDismiss.js");
  assert.ok(swipe.SWIPE_UP_THRESHOLD_PX > 0);
  assert.ok(swipe.SWIPE_UP_MAX_TRAVEL_PX > swipe.SWIPE_UP_THRESHOLD_PX);
});

test("swipe up - only upward drags move the notification", async () => {
  const { clampSwipeOffset } = swipe;
  assert.strictEqual(clampSwipeOffset(-20), -20);
  assert.strictEqual(clampSwipeOffset(20), 0);
  assert.strictEqual(clampSwipeOffset(0), 0);
  assert.strictEqual(clampSwipeOffset(NaN), 0);
});

test("swipe up - the travel is capped and resists beyond the cap", async () => {
  const { clampSwipeOffset, SWIPE_UP_MAX_TRAVEL_PX } = swipe;
  assert.strictEqual(clampSwipeOffset(-SWIPE_UP_MAX_TRAVEL_PX), -SWIPE_UP_MAX_TRAVEL_PX);
  // Beyond the cap the movement is damped
  assert.ok(clampSwipeOffset(-(SWIPE_UP_MAX_TRAVEL_PX * 10)) > -(SWIPE_UP_MAX_TRAVEL_PX * 10));
  assert.ok(clampSwipeOffset(-(SWIPE_UP_MAX_TRAVEL_PX * 10)) < -SWIPE_UP_MAX_TRAVEL_PX);
});

test("swipe up - a swipe counts as a dismiss only past the threshold", async () => {
  const { isSwipeUpDismiss, SWIPE_UP_THRESHOLD_PX } = swipe;
  assert.strictEqual(isSwipeUpDismiss(-10), false);
  assert.strictEqual(isSwipeUpDismiss(0), false);
  assert.strictEqual(isSwipeUpDismiss(40), false);
  assert.strictEqual(isSwipeUpDismiss(-SWIPE_UP_THRESHOLD_PX), true);
  assert.strictEqual(isSwipeUpDismiss(-SWIPE_UP_THRESHOLD_PX - 10), true);
  assert.strictEqual(isSwipeUpDismiss(NaN), false);
});

test("swipe up - the opacity fades out while swiping", async () => {
  const { swipeOpacity } = swipe;
  assert.strictEqual(swipeOpacity(0), 1);
  assert.strictEqual(swipeOpacity(20), 1);
  assert.ok(swipeOpacity(-40) < 1);
  assert.ok(swipeOpacity(-40) > 0);
  assert.strictEqual(swipeOpacity(-10000), 0);
});
