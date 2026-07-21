// Progressive-reveal utility. Adds `.is-visible` when an element scrolls into
// view (one-shot), driving CSS fade-up transitions. Uses IntersectionObserver
// rather than scroll listeners for performance. Honours reduced motion by
// revealing immediately.

import { prefersReducedMotion } from './motion.js';

const REVEAL_CLASS = 'reveal';
const VISIBLE_CLASS = 'is-visible';

let observer;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add(VISIBLE_CLASS);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  return observer;
}

/**
 * Register an element (and optionally its `.reveal` descendants) for reveal.
 * @param {HTMLElement} root
 */
export function observeReveals(root) {
  const targets = root.classList.contains(REVEAL_CLASS)
    ? [root, ...root.querySelectorAll(`.${REVEAL_CLASS}`)]
    : [...root.querySelectorAll(`.${REVEAL_CLASS}`)];

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add(VISIBLE_CLASS));
    return;
  }

  const io = getObserver();
  targets.forEach((t) => io.observe(t));
}
