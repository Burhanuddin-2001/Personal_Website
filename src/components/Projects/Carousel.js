// Carousel — the signature interaction. PlayStation-style coverflow: one
// centered card, larger than its neighbours, which are scaled/faded/rotated
// back. Transform-based (not scroll-snap) for full control over the recessed
// look and reliable sync with the details panel via the shared store.
//
// Inputs: Prev/Next buttons, Arrow/Home/End keys, click a side card to select,
// pointer swipe. Accessibility: only the centre card is interactive and in the
// a11y tree; off-centre cards are hidden from AT. Navigation is announced.

import { createProjectCard } from './ProjectCard.js';
import { announce } from '../../lib/announcer.js';
import { icon } from '../common/Icon.js';
import { el } from '../../lib/dom.js';

const VISIBLE_RANGE = 2; // cards shown either side of centre (windowing)
const SWIPE_THRESHOLD = 40; // px of horizontal travel to commit a swipe

/**
 * @param {HTMLElement} mountEl
 * @param {object[]} projects
 * @param {import('../../lib/store.js')} store - shared store with { activeIndex }
 * @param {(index:number) => void} onExplore
 */
export function createCarousel(mountEl, projects, store, onExplore) {
  const total = projects.length;

  const track = el('div', { class: 'carousel__track' });
  const cards = projects.map((project, i) => {
    const { el: cardEl, exploreBtn } = createProjectCard(project, i, total);
    cardEl.addEventListener('click', (e) => {
      // Clicking a side card selects it; Explore handles the centre card.
      if (i !== store.getState().activeIndex && !e.target.closest('.project-card__explore')) {
        select(i);
      }
    });
    exploreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onExplore(store.getState().activeIndex);
    });
    track.appendChild(cardEl);
    return cardEl;
  });

  const viewport = el('div', { class: 'carousel__viewport' }, [track]);

  const prevBtn = el('button', {
    class: 'carousel__nav carousel__nav--prev',
    type: 'button',
    'aria-label': 'Previous project',
    html: icon('arrowLeft', { size: 22 }),
    onClick: () => step(-1),
  });
  const nextBtn = el('button', {
    class: 'carousel__nav carousel__nav--next',
    type: 'button',
    'aria-label': 'Next project',
    html: icon('arrowRight', { size: 22 }),
    onClick: () => step(1),
  });

  // Pagination dots — plain accessible buttons (not a fake ARIA tablist:
  // role="tablist" requires role="tab" children, and hiding a wrapper full
  // of otherwise-focusable buttons via aria-hidden leaves them reachable by
  // keyboard while invisible to assistive tech — both are real violations).
  // Each dot keeps its own descriptive label and announces current position
  // via aria-current, updated in layout().
  const dots = projects.map((p, i) =>
    el('button', {
      class: 'carousel__dot',
      type: 'button',
      'aria-label': `Go to project ${i + 1}: ${p.name}`,
      onClick: () => select(i),
    })
  );
  const dotsWrap = el('div', { class: 'carousel__dots', role: 'group', 'aria-label': 'Select project' }, dots);

  const region = el(
    'div',
    {
      class: 'carousel',
      role: 'group',
      'aria-roledescription': 'carousel',
      'aria-label': 'Projects carousel',
      tabindex: '0',
    },
    [prevBtn, viewport, nextBtn]
  );

  region.addEventListener('keydown', onKeydown);
  attachSwipe(viewport);

  mountEl.append(region, dotsWrap);

  // --- state transitions -------------------------------------------------
  function clampIndex(i) {
    return Math.max(0, Math.min(total - 1, i));
  }

  function step(dir) {
    select(store.getState().activeIndex + dir);
  }

  function select(i) {
    const next = clampIndex(i);
    store.setState({ activeIndex: next });
  }

  function onKeydown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        step(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        step(1);
        break;
      case 'Home':
        e.preventDefault();
        select(0);
        break;
      case 'End':
        e.preventDefault();
        select(total - 1);
        break;
      default:
        break;
    }
  }

  // --- swipe (pointer events; horizontal-only to avoid hijacking scroll) --
  function attachSwipe(node) {
    let startX = 0;
    let startY = 0;
    let active = false;

    node.addEventListener(
      'pointerdown',
      (e) => {
        active = true;
        startX = e.clientX;
        startY = e.clientY;
      },
      { passive: true }
    );

    node.addEventListener(
      'pointerup',
      (e) => {
        if (!active) return;
        active = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // Only treat as a swipe when the gesture is dominantly horizontal.
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          step(dx < 0 ? 1 : -1);
        }
      },
      { passive: true }
    );
  }

  // --- layout: position every card relative to the active index ----------
  let step_px = 0;

  function measure() {
    const centerCard = cards[store.getState().activeIndex] || cards[0];
    // Neighbours peek at ~62% of the centre card width.
    step_px = (centerCard?.offsetWidth || 320) * 0.62;
  }

  function layout(announceChange = false) {
    const active = store.getState().activeIndex;

    cards.forEach((card, i) => {
      const offset = i - active;
      const dist = Math.abs(offset);
      const isCenter = offset === 0;
      const outOfRange = dist > VISIBLE_RANGE;

      const scale = Math.max(1 - dist * 0.14, 0.62);
      const opacity = outOfRange ? 0 : 1 - dist * 0.32;
      const rot = offset * -6;

      card.style.transform = `translate(calc(-50% + ${offset * step_px}px), -50%) scale(${scale}) rotateY(${rot}deg)`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 - dist);
      card.style.pointerEvents = outOfRange ? 'none' : 'auto';

      card.classList.toggle('is-center', isCenter);
      // Only the centre card is exposed to assistive tech / tab order.
      // Cards fully outside the windowed range are already non-interactive
      // (pointer-events: none, opacity: 0) — `inert` on those is a pure,
      // zero-behaviour-change hardening that removes them from focus/AT too.
      // It is NOT applied to in-range side cards (dist 1-2): those remain
      // click-to-select, and `inert` would suppress that click entirely.
      card.inert = outOfRange;
      card.setAttribute('aria-hidden', isCenter ? 'false' : 'true');
      const explore = card.querySelector('.project-card__explore');
      if (explore) explore.tabIndex = isCenter ? 0 : -1;
    });

    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === total - 1;
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === active);
      d.setAttribute('aria-current', i === active ? 'true' : 'false');
    });

    if (announceChange) {
      announce(`Project ${active + 1} of ${total}: ${projects[active].name}`);
    }
  }

  // Re-render on state changes.
  store.subscribe(() => layout(true));

  // Reposition on resize (step depends on card width).
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      measure();
      layout(false);
    });
  });

  // Initial paint — begins centred on the first card (activeIndex = 0).
  measure();
  layout(false);
  // Re-measure once fonts/layout settle to avoid a first-frame miscalc.
  requestAnimationFrame(() => {
    measure();
    layout(false);
  });

  return { focusCenter: () => region.focus() };
}
