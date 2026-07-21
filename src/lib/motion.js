// Motion helpers. Centralises reduced-motion handling so every animated
// component branches on one source of truth (see plan §4).

const reduceQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener() {} };

/** @returns {boolean} true when the user prefers reduced motion. */
export function prefersReducedMotion() {
  return reduceQuery.matches;
}

/** React to changes in the reduced-motion preference at runtime. */
export function onReducedMotionChange(handler) {
  reduceQuery.addEventListener?.('change', (e) => handler(e.matches));
}

// Duration tokens mirrored from CSS so JS-driven (WAAPI) timings stay in sync.
export const DURATION = {
  fast: 150,
  base: 260,
  slow: 520,
};

export const EASE_STANDARD = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
