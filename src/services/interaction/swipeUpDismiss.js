import { useCallback, useRef, useState } from "react";

/**
 * Quick Pill — Swipe-up dismiss gesture
 *
 * Notifications (the HUD banner and the rows in the notification centre) can
 * be swiped upwards to dismiss them, the same way a phone notification is
 * flicked away. The pure helpers below are unit tested (see
 * tests/swipeUpDismiss.test.js).
 */

/** How far the notification has to travel upwards to be dismissed. */
export const SWIPE_UP_THRESHOLD_PX = 36;
/** Maximum travel before the movement starts to resist. */
export const SWIPE_UP_MAX_TRAVEL_PX = 88;

/**
 * Clamp a vertical drag into a visual offset (upwards only, with resistance).
 *
 * @param {number} dy raw vertical delta in pixels
 * @returns {number} the offset that should be rendered
 */
export function clampSwipeOffset(dy) {
  if (!Number.isFinite(dy) || dy >= 0) return 0;
  const travel = Math.min(Math.abs(dy), SWIPE_UP_MAX_TRAVEL_PX);
  const overflow = Math.max(0, Math.abs(dy) - SWIPE_UP_MAX_TRAVEL_PX);
  return -(travel + overflow * 0.2);
}

/**
 * Check whether a vertical drag counts as a dismiss swipe.
 *
 * @param {number} dy raw vertical delta in pixels
 * @param {number} [threshold]
 * @returns {boolean}
 */
export function isSwipeUpDismiss(dy, threshold = SWIPE_UP_THRESHOLD_PX) {
  if (!Number.isFinite(dy)) return false;
  return dy <= -Math.abs(threshold);
}

/**
 * Opacity for an element that is being swiped away.
 *
 * @param {number} offset rendered offset
 * @returns {number} opacity between 0 and 1
 */
export function swipeOpacity(offset) {
  if (!Number.isFinite(offset) || offset >= 0) return 1;
  return Math.max(0, 1 + offset / (SWIPE_UP_MAX_TRAVEL_PX * 1.6));
}

/**
 * React hook that turns pointer events into a swipe-up dismiss gesture.
 *
 * @param {object} options
 * @param {() => void} [options.onDismiss] called when the swipe is completed
 * @param {number} [options.threshold]
 * @param {boolean} [options.enabled]
 * @returns {{ offset: number, dismissing: boolean, swipeHandlers: object }}
 */
export function useSwipeUpDismiss(options = {}) {
  const { onDismiss, threshold = SWIPE_UP_THRESHOLD_PX, enabled = true } = options;

  const [offset, setOffset] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(null);
  const activeRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const reset = useCallback(() => {
    startYRef.current = null;
    activeRef.current = false;
    setOffset(0);
    setDismissing(false);
    setIsDragging(false);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      if (!enabled) return;
      if (e?.pointerType === "mouse" && e.button !== 0) return;
      // Keep the island drag/tab-swipe gestures from stealing the gesture
      e?.stopPropagation?.();
      startYRef.current = e?.clientY ?? null;
      activeRef.current = true;
      setDismissing(false);
      setIsDragging(true);
    },
    [enabled]
  );

  const onPointerMove = useCallback((e) => {
    if (!activeRef.current || startYRef.current === null) return;
    e?.stopPropagation?.();
    const dy = (e?.clientY ?? 0) - startYRef.current;
    setOffset(clampSwipeOffset(dy));
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      if (!activeRef.current) return;
      e?.stopPropagation?.();
      const startY = startYRef.current ?? e?.clientY ?? 0;
      const dy = (e?.clientY ?? startY) - startY;
      startYRef.current = null;
      activeRef.current = false;
      setIsDragging(false);

      if (isSwipeUpDismiss(dy, threshold)) {
        setDismissing(true);
        setOffset(-(SWIPE_UP_MAX_TRAVEL_PX + 28));
        try {
          onDismissRef.current?.();
        } catch (_) {}
      } else {
        setOffset(0);
      }
    },
    [threshold]
  );

  const onPointerCancel = useCallback(() => {
    reset();
  }, [reset]);

  return {
    offset,
    dismissing,
    isDragging,
    swipeHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}

export default {
  SWIPE_UP_THRESHOLD_PX,
  SWIPE_UP_MAX_TRAVEL_PX,
  clampSwipeOffset,
  isSwipeUpDismiss,
  swipeOpacity,
  useSwipeUpDismiss,
};
