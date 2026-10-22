const test = require("node:test");
const assert = require("node:assert");

let hoverPolicy = null;

test("hover policy - loads the shared constants and helpers", async () => {
  hoverPolicy = await import("../src/services/hover/hoverPolicy.js");
  assert.ok(hoverPolicy.HOVER_OPEN_DELAY_MS > 0);
  assert.ok(hoverPolicy.HOVER_CLOSE_DELAY_MS > hoverPolicy.HOVER_OPEN_DELAY_MS);
  assert.ok(hoverPolicy.HOVER_EDGE_TOLERANCE_PX > 0);
});

test("hover policy - detects a pointer inside the notch", () => {
  const { isPointerInsideRect } = hoverPolicy;
  const rect = { left: 210, top: 0, right: 350, bottom: 32, width: 140, height: 32 };

  assert.strictEqual(isPointerInsideRect(rect, { x: 280, y: 16 }), true);
  assert.strictEqual(isPointerInsideRect(rect, { x: 210, y: 0 }), true);
  assert.strictEqual(isPointerInsideRect(rect, { x: 350, y: 32 }), true);
});

test("hover policy - a pointer outside the notch is not inside", () => {
  const { isPointerInsideRect } = hoverPolicy;
  const rect = { left: 210, top: 0, right: 350, bottom: 32, width: 140, height: 32 };

  assert.strictEqual(isPointerInsideRect(rect, { x: 209, y: 16 }), false);
  assert.strictEqual(isPointerInsideRect(rect, { x: 351, y: 16 }), false);
  assert.strictEqual(isPointerInsideRect(rect, { x: 280, y: 33 }), false);
  assert.strictEqual(isPointerInsideRect(rect, { x: 280, y: -1 }), false);
});

test("hover policy - padding allows a small drift outside the notch", () => {
  const { isPointerInsideRect, HOVER_EDGE_TOLERANCE_PX } = hoverPolicy;
  const rect = { left: 210, top: 0, right: 350, bottom: 32, width: 140, height: 32 };

  assert.strictEqual(isPointerInsideRect(rect, { x: 351, y: 16 }), false);
  assert.strictEqual(
    isPointerInsideRect(rect, { x: 351, y: 16 }, HOVER_EDGE_TOLERANCE_PX),
    true
  );
  assert.strictEqual(
    isPointerInsideRect(rect, { x: 380, y: 16 }, HOVER_EDGE_TOLERANCE_PX),
    false
  );
});

test("hover policy - degenerated rects and points never report a hover", () => {
  const { isPointerInsideRect } = hoverPolicy;

  assert.strictEqual(isPointerInsideRect(null, { x: 1, y: 1 }), false);
  assert.strictEqual(isPointerInsideRect({ left: 0, top: 0, width: 0, height: 0 }, { x: 1, y: 1 }), false);
  assert.strictEqual(isPointerInsideRect({ left: 0, top: 0, width: 10, height: 10 }, { x: NaN, y: 5 }), false);
  assert.strictEqual(isPointerInsideRect({ left: 0, top: 0, width: 10, height: 10 }, null), false);
});

test("hover policy - derives right/bottom when the rect only has a size", () => {
  const { isPointerInsideRect } = hoverPolicy;
  const rect = { left: 100, top: 20, width: 200, height: 40 };

  assert.strictEqual(isPointerInsideRect(rect, { x: 299, y: 59 }), true);
  assert.strictEqual(isPointerInsideRect(rect, { x: 301, y: 59 }), false);
});
