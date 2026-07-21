// ProjectCard — a single carousel card. Contains ONLY (per spec): name,
// one-line description, tech stack, status, and an Explore button.
// Full details live in the DetailsPanel, not here.

import { el, escapeHtml } from '../../lib/dom.js';
import { icon } from '../common/Icon.js';

const STATUS_MOD = {
  Live: 'live',
  'In progress': 'progress',
  Archived: 'archived',
};

/**
 * @param {object} project
 * @param {number} index
 * @param {number} total
 * @returns {{ el: HTMLElement, exploreBtn: HTMLButtonElement }}
 */
export function createProjectCard(project, index, total) {
  const statusMod = STATUS_MOD[project.status] || 'default';

  const exploreBtn = el('button', {
    class: 'project-card__explore btn btn--primary',
    type: 'button',
    html: `<span class="btn__label">Explore</span>${icon('arrowRight', { size: 16 })}`,
    'aria-label': `Explore ${project.name}`,
  });

  const card = el(
    'article',
    {
      class: 'project-card',
      role: 'group',
      'aria-roledescription': 'slide',
      'aria-label': `Project ${index + 1} of ${total}: ${project.name}`,
      dataset: { index: String(index) },
    },
    [
      el('div', { class: 'project-card__head' }, [
        el('h3', { class: 'project-card__name', html: escapeHtml(project.name) }),
        el('span', {
          class: `project-card__status project-card__status--${statusMod}`,
          html: escapeHtml(project.status),
        }),
      ]),
      el('p', { class: 'project-card__tagline', html: escapeHtml(project.tagline) }),
      el(
        'ul',
        { class: 'project-card__tech', 'aria-label': 'Technologies' },
        project.tech.map((t) => el('li', { class: 'chip', html: escapeHtml(t) }))
      ),
      exploreBtn,
    ]
  );

  return { el: card, exploreBtn };
}
