// Welcome screen — full-screen overlay shown once per page load.
// Sequence: fade in -> brief hold -> fade away -> remove -> resolve, which
// lets main.js reveal the hero. Created in JS so no-JS users go straight to
// content and there is no risk of a stuck overlay.

import './WelcomeScreen.css';
import { el } from '../../lib/dom.js';
import { prefersReducedMotion, DURATION, EASE_STANDARD } from '../../lib/motion.js';

const HOLD_MS = 850;

/**
 * @param {{ text?: string }} [opts]
 * @returns {Promise<void>} resolves when the overlay is gone.
 */
export function runWelcome({ text = 'Welcome!' } = {}) {
  const overlay = el('div', {
    class: 'welcome',
    // Decorative: the real content is the hero. Keep it out of the a11y tree.
    'aria-hidden': 'true',
  });
  overlay.appendChild(el('span', { class: 'welcome__text', html: text }));

  document.body.appendChild(overlay);
  lockScroll(true);

  const finish = () => {
    overlay.remove();
    lockScroll(false);
  };

  // Reduced motion: no fade choreography — show the word briefly, then clear.
  if (prefersReducedMotion() || typeof overlay.animate !== 'function') {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        finish();
        resolve();
      }, 400);
    });
  }

  const anim = overlay.animate(
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.25 },
      { opacity: 1, offset: 0.75 },
      { opacity: 0 },
    ],
    {
      duration: DURATION.slow * 2 + HOLD_MS,
      easing: EASE_STANDARD,
      fill: 'forwards',
    }
  );

  return anim.finished
    .catch(() => {}) // cancelled → still clean up
    .then(finish);
}

function lockScroll(locked) {
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}
