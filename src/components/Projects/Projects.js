// Projects — container that composes the carousel and the details panel and
// wires the Explore action (focus + scroll to details).

import './Projects.css';
import { el } from '../../lib/dom.js';
import { createCarousel } from './Carousel.js';
import { createDetailsPanel } from './DetailsPanel.js';
import { prefersReducedMotion } from '../../lib/motion.js';

/**
 * @param {HTMLElement} mountEl - <section id="projects">
 * @param {{ projects: object[], store: object }} props
 */
export function mountProjects(mountEl, { projects, store }) {
  const title = el('h2', {
    id: 'projects-title',
    class: 'section-title section-title--centered reveal',
    html: 'Projects',
  });

  // The wrapper (not the individual cards) carries the reveal fade-up, so it
  // composes cleanly with the carousel's own per-card inline transforms.
  const carouselMount = el('div', { class: 'projects__carousel reveal' });
  const detailsMount = el('div', { class: 'projects__details' });

  const inner = el('div', { class: 'container' }, [title, carouselMount, detailsMount]);
  mountEl.replaceChildren(inner);

  const details = createDetailsPanel(detailsMount, projects, store);

  createCarousel(carouselMount, projects, store, () => {
    details.focus();
    detailsMount.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  });
}
