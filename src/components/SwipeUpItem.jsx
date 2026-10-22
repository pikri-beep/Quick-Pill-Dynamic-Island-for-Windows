import React from "react";
import { useSwipeUpDismiss, swipeOpacity } from "../services/interaction/swipeUpDismiss";

/**
 * Quick Pill — Swipe-up dismiss wrapper
 *
 * Wraps a notification (the HUD banner or a row of the notification centre)
 * so it can be flicked upwards to dismiss it.
 *
 * `overlay` positions the wrapper like a full size layer (used for the HUD
 * banner, which is centred inside the notch), otherwise the wrapper stays in
 * the normal flow (used for the rows of the notification centre).
 */
export default function SwipeUpItem({
  children,
  onDismiss,
  overlay = false,
  className = "",
  style = {},
  ...rest
}) {
  const { offset, dismissing, isDragging, swipeHandlers } = useSwipeUpDismiss({ onDismiss });

  const motionStyle = {
    transform: `translateY(${offset}px)`,
    opacity: dismissing ? 0 : swipeOpacity(offset),
    transition: isDragging
      ? "none"
      : "transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
  };

  const wrapperStyle = overlay
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 3,
        ...motionStyle,
      }
    : {
        position: "relative",
        ...motionStyle,
      };

  return (
    <div
      className={className}
      style={{ ...wrapperStyle, ...style }}
      {...swipeHandlers}
      {...rest}
    >
      {children}
    </div>
  );
}
