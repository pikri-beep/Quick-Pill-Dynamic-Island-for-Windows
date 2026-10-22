/**
 * Quick Pill — "Dust Burst" delete effect
 *
 * An iOS/macOS style dissolve used whenever a row is removed: the element
 * crumbles into a cloud of tiny particles that drift away while the element
 * itself blurs out.
 *
 * The engine is DOM based (not React) so it can be triggered from any
 * component — tasks, quick notes and notifications — without prop drilling
 * or shared state.
 */

const LAYER_CLASS = "qp-dust-layer";
const PARTICLE_CLASS = "qp-dust-particle";
const PUFF_CLASS = "qp-dust-puff";
const DISSOLVE_CLASS = "qp-dust-dissolve";

/** Duration of the element dissolve (ms). Keep in sync with App.css. */
export const DUST_DISSOLVE_MS = 280;

const DEFAULTS = {
  particleCount: 26,
  duration: 620,
  gravity: 34,
  sizeMin: 1.8,
  sizeMax: 5,
  colors: ["#ffffff", "#e9e9ec", "#b8b8c0", "#d8d8dd", "#8e8e99"],
};

let layerEl = null;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function prefersReducedMotion() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch (_) {
    return false;
  }
}

/** Lazily create (once) the fixed overlay that hosts every particle. */
function ensureLayer() {
  if (typeof document === "undefined" || !document.body) return null;
  if (layerEl && layerEl.isConnected) return layerEl;
  layerEl = document.createElement("div");
  layerEl.className = LAYER_CLASS;
  layerEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(layerEl);
  return layerEl;
}

/**
 * Spawn a dust particle burst over a viewport rect.
 * @param {{left:number, top:number, width:number, height:number}} rect
 * @param {object} [options]
 * @returns {number} amount of particles spawned
 */
export function spawnDustBurst(rect, options = {}) {
  if (!rect) return 0;
  if (prefersReducedMotion()) return 0;

  const layer = ensureLayer();
  if (!layer) return 0;

  const opts = { ...DEFAULTS, ...options };
  const count = Math.max(0, Math.round(opts.particleCount));
  if (!count) return 0;

  const width = Math.max(1, rect.width || 1);
  const height = Math.max(1, rect.height || 1);
  const nodes = [];

  // Soft dust cloud behind the particles for a puffier silhouette
  const puff = document.createElement("div");
  puff.className = PUFF_CLASS;
  const spread = Math.max(width, height) * 1.15;
  puff.style.left = `${(rect.left || 0) + width / 2}px`;
  puff.style.top = `${(rect.top || 0) + height / 2}px`;
  puff.style.width = `${spread}px`;
  puff.style.height = `${spread}px`;
  layer.appendChild(puff);
  nodes.push(puff);

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.className = PARTICLE_CLASS;

    const size = rand(opts.sizeMin, opts.sizeMax);
    const angle = rand(0, Math.PI * 2);
    const distance = rand(10, 32);
    const dx = Math.cos(angle) * distance;
    // Slight upward pop before gravity takes over
    const dy = Math.sin(angle) * distance * 0.55 - rand(3, 16);

    particle.style.left = `${(rect.left || 0) + Math.random() * width}px`;
    particle.style.top = `${(rect.top || 0) + Math.random() * height}px`;
    particle.style.width = `${size.toFixed(2)}px`;
    particle.style.height = `${size.toFixed(2)}px`;
    particle.style.background = pick(opts.colors);
    particle.style.setProperty("--qp-dx", `${dx.toFixed(2)}px`);
    particle.style.setProperty("--qp-dy", `${(dy + opts.gravity).toFixed(2)}px`);
    particle.style.setProperty("--qp-rot", `${rand(-260, 260).toFixed(1)}deg`);
    particle.style.setProperty("--qp-dur", `${(opts.duration * rand(0.7, 1.2)).toFixed(0)}ms`);
    particle.style.setProperty("--qp-delay", `${rand(0, 90).toFixed(0)}ms`);

    layer.appendChild(particle);
    nodes.push(particle);
  }

  window.setTimeout(() => {
    nodes.forEach((node) => node.remove());
  }, opts.duration * 1.25 + 260);

  return count;
}

/**
 * Dissolve an element into dust: particles burst from its current position
 * while the element itself blurs away.
 * @param {HTMLElement|null} element
 * @param {object} [options]
 * @returns {Promise<boolean>} resolves when the dissolve animation finished
 */
export function dissolveElement(element, options = {}) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return Promise.resolve(false);
  }

  const rect = element.getBoundingClientRect();
  if (!rect || (rect.width <= 0 && rect.height <= 0)) {
    return Promise.resolve(false);
  }

  spawnDustBurst(rect, options);
  element.classList.add(DISSOLVE_CLASS);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      element.classList.remove(DISSOLVE_CLASS);
      resolve(true);
    }, DUST_DISSOLVE_MS);
  });
}

export default { spawnDustBurst, dissolveElement, DUST_DISSOLVE_MS };
