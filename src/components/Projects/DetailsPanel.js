// DetailsPanel — beneath the carousel. Always reflects the selected project
// (subscribes to the shared store). Explore moves focus here and scrolls it
// into view. Optional fields (demo, screenshots) render only when present.

import { el, clear, escapeHtml } from '../../lib/dom.js';
import { icon } from '../common/Icon.js';

/**
 * @param {HTMLElement} mountEl
 * @param {object[]} projects
 * @param {import('../../lib/store.js')} store
 * @returns {{ focus: () => void }}
 */
export function createDetailsPanel(mountEl, projects, store) {
  const panel = el('div', {
    class: 'details reveal',
    role: 'region',
    'aria-label': 'Project details',
    tabindex: '-1',
  });
  mountEl.appendChild(panel);

  function block(title, body) {
    return el('div', { class: 'details__block' }, [
      el('h4', { class: 'details__label', html: title }),
      body,
    ]);
  }

  function render() {
    const p = projects[store.getState().activeIndex];
    clear(panel);

    const links = [];
    if (p.links?.github) {
      links.push(
        el('a', {
          class: 'btn btn--secondary',
          href: p.links.github,
          target: '_blank',
          rel: 'noopener noreferrer',
          html: `${icon('github', { size: 18 })}<span class="btn__label">GitHub</span>`,
        })
      );
    }
    if (p.links?.demo) {
      links.push(
        el('a', {
          class: 'btn btn--primary',
          href: p.links.demo,
          target: '_blank',
          rel: 'noopener noreferrer',
          html: `<span class="btn__label">Live demo</span>${icon('external', { size: 16 })}`,
        })
      );
    }

    const children = [
      el('div', { class: 'details__head' }, [
        el('h3', { class: 'details__name', html: escapeHtml(p.name) }),
        el('span', { class: 'details__status', html: escapeHtml(p.status) }),
      ]),
      el('div', { class: 'details__grid' }, [
        block('Overview', el('p', { html: escapeHtml(p.overview) })),
        block('Problem solved', el('p', { html: escapeHtml(p.problem) })),
        block(
          'Key features',
          el(
            'ul',
            { class: 'details__features' },
            (p.features || []).map((f) => el('li', { html: escapeHtml(f) }))
          )
        ),
        block(
          'Technologies',
          el(
            'ul',
            { class: 'details__tech' },
            (p.tech || []).map((t) => el('li', { class: 'chip', html: escapeHtml(t) }))
          )
        ),
        block('Architecture', el('p', { html: escapeHtml(p.architecture) })),
      ]),
    ];

    if (links.length) {
      children.push(el('div', { class: 'details__links' }, links));
    }

    // Optional screenshots (lazy-loaded).
    if (p.screenshots?.length) {
      children.push(
        el(
          'div',
          { class: 'details__shots' },
          p.screenshots.map((s) =>
            el('img', {
              class: 'details__shot',
              src: s.src,
              alt: s.alt || `${p.name} screenshot`,
              loading: 'lazy',
              decoding: 'async',
            })
          )
        )
      );
    }

    panel.append(...children);
  }

  store.subscribe(render);
  render();

  return {
    focus() {
      panel.focus();
    },
  };
}
