// Hero — LOCKED reversed two-column layout.
// Left column: circular profile image. Right column: name, title, intro, and
// exactly three actions (View Projects, Resume, Contact Me). GitHub is
// intentionally NOT here — socials live in the Contact section only.

import './Hero.css';
import { el, escapeHtml } from '../../lib/dom.js';
import { Button } from '../common/Button.js';
import { icon } from '../common/Icon.js';

/**
 * @param {HTMLElement} mountEl - the <section id="hero">
 * @param {{ profile: object }} props
 * @returns {{ reveal: () => void }}
 */
export function mountHero(mountEl, { profile }) {
  // The `alt` text is fixed branding/personality copy and is intentionally
  // left as-is. `aria-describedby` supplements it with a real description
  // of the photo (name + title, kept in sync with profile.js) without
  // touching the accessible *name* the alt text provides.
  const avatarDescId = 'hero-avatar-desc';
  const imageCol = el('div', { class: 'hero__col hero__col--image reveal' }, [
    el('div', { class: 'hero__avatar' }, [
      el('img', {
        class: 'hero__avatar-img',
        src: profile.avatar.src,
        alt: profile.avatar.alt,
        'aria-describedby': avatarDescId,
        width: 320,
        height: 320,
        decoding: 'async',
      }),
      el('span', {
        id: avatarDescId,
        class: 'visually-hidden',
        html: `Portrait of ${escapeHtml(profile.name)}, ${escapeHtml(profile.title)}.`,
      }),
    ]),
  ]);

  const actions = el('div', { class: 'hero__actions' }, [
    Button({
      label: 'View Projects',
      variant: 'primary',
      href: '#projects',
      iconHtml: icon('arrowRight', { size: 18 }),
    }),
    Button({ label: 'Resume', variant: 'secondary', href: profile.resumeUrl, external: true }),
    Button({ label: 'Contact Me', variant: 'ghost', href: '#contact' }),
  ]);

  const textCol = el('div', { class: 'hero__col hero__col--text' }, [
    el('h1', {
      id: 'hero-name',
      class: 'hero__name reveal',
      html: escapeHtml(profile.name),
    }),
    el('p', { class: 'hero__title reveal', html: escapeHtml(profile.title) }),
    el('p', { class: 'hero__intro reveal', html: escapeHtml(profile.intro) }),
    (actions.classList.add('reveal'), actions),
  ]);

  const inner = el('div', { class: 'container hero__grid' }, [imageCol, textCol]);
  mountEl.replaceChildren(inner);

  // The reveal is triggered by main.js once the welcome overlay finishes,
  // so the hero animates into an empty stage rather than behind the overlay.
  return {
    reveal() {
      mountEl.classList.add('is-revealed');
    },
  };
}
