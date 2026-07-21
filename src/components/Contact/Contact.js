// Contact — centred title, the form (the focus), social links, and a minimal
// Back-to-Top control. No introductory/marketing copy, per spec.

import './Contact.css';
import { el } from '../../lib/dom.js';
import { createContactForm } from './ContactForm.js';
import { createSocialLinks } from './SocialLinks.js';
import { icon } from '../common/Icon.js';
import { prefersReducedMotion } from '../../lib/motion.js';

/**
 * @param {HTMLElement} mountEl - <section id="contact">
 * @param {{ profile: object, contactConfig: object }} props
 */
export function mountContact(mountEl, { profile, contactConfig }) {
  const title = el('h2', {
    id: 'contact-title',
    class: 'section-title section-title--centered reveal',
    html: 'Want to reach me?',
  });

  const form = createContactForm(contactConfig);
  form.classList.add('reveal');

  const socials = createSocialLinks(profile.socials);
  socials.classList.add('reveal');

  const backToTop = el('a', {
    class: 'back-to-top',
    href: '#hero',
    html: `${icon('arrowUp', { size: 18 })}<span>Back to top</span>`,
    onClick: (e) => {
      // Honour reduced motion (CSS smooth scroll is disabled there anyway,
      // but this keeps behaviour explicit for the programmatic path).
      if (prefersReducedMotion()) {
        e.preventDefault();
        document.getElementById('hero')?.scrollIntoView({ behavior: 'auto' });
        history.replaceState(null, '', '#hero');
      }
    },
  });

  const inner = el('div', { class: 'container contact__inner' }, [
    title,
    el('div', { class: 'contact__form-wrap' }, [form]),
    socials,
    backToTop,
  ]);

  mountEl.replaceChildren(inner);
}
