/**
 * Quick Pill — Notch hover policy
 *
 * The notch floats above every window and resizes while the cursor is on it.
 * These pure helpers describe when the notch opens and when it may collapse,
 * so the behaviour can be unit tested (see tests/hoverPolicy.test.js).
 */

/** The cursor has to rest on the notch for this long before it opens. */
export const HOVER_OPEN_DELAY_MS = 140;
/** Grace period before the notch collapses again. */
export const HOVER_CLOSE_DELAY_MS = 280;
/** How far the cursor may drift outside the notch before it collapses. */
export const HOVER_EDGE_TOLERANCE_PX = 8;

/**
 * Check whether a point lies inside a rectangle (with optional padding).
 *
 * @param {{left:number, top:number, right:number, bottom:number, width:number, height:number}} rect
 * @param {{x:number, y:number}} point
 * @param {number} [padding] extra tolerance in pixels
 * @returns {boolean}
 */
export function isPointerInsideRect(rect, point, padding = 0) {
  if (!rect || !point) return false;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;

  const width = Number(rect.width) || 0;
  const height = Number(rect.height) || 0;
  if (width <= 0 && height <= 0) return false;

  const left = Number(rect.left) || 0;
  const top = Number(rect.top) || 0;
  const right = Number.isFinite(rect.right) ? rect.right : left + width;
  const bottom = Number.isFinite(rect.bottom) ? rect.bottom : top + height;

  const tol = Number(padding) || 0;
  return (
    point.x >= left - tol &&
    point.x <= right + tol &&
    point.y >= top - tol &&
    point.y <= bottom + tol
  );
}

export default {
  HOVER_OPEN_DELAY_MS,
  HOVER_CLOSE_DELAY_MS,
  HOVER_EDGE_TOLERANCE_PX,
  isPointerInsideRect,
};
