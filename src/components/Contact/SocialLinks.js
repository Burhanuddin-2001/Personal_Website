// SocialLinks — GitHub, LinkedIn, Email. Shown in the Contact section only.

import { el } from '../../lib/dom.js';
import { icon } from '../common/Icon.js';

/**
 * @param {{ github?: string, linkedin?: string, email?: string }} socials
 * @returns {HTMLElement}
 */
export function createSocialLinks(socials) {
  const links = [];

  if (socials.github) {
    links.push(link(socials.github, 'GitHub', icon('github', { size: 22 }), true));
  }
  if (socials.linkedin) {
    links.push(link(socials.linkedin, 'LinkedIn', icon('linkedin', { size: 22 }), true));
  }
  if (socials.email) {
    links.push(link(`mailto:${socials.email}`, 'Email', icon('mail', { size: 22 }), false));
  }

  return el('ul', { class: 'socials', 'aria-label': 'Social links' }, links);
}

function link(href, label, iconHtml, external) {
  return el('li', {}, [
    el('a', {
      class: 'socials__link',
      href,
      'aria-label': label,
      title: label,
      html: iconHtml,
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    }),
  ]);
}
