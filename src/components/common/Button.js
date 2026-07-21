// Button factory. Renders either a real <button> (actions) or an <a> styled
// as a button (navigation/links) — the correct semantics for each use.

import { el } from '../../lib/dom.js';

/**
 * @param {Object} opts
 * @param {string} opts.label - visible text
 * @param {'primary'|'secondary'|'ghost'} [opts.variant]
 * @param {string} [opts.href] - if present, renders an <a>
 * @param {boolean} [opts.external] - open in new tab (adds rel + aria hint)
 * @param {string} [opts.iconHtml] - trailing inline SVG string
 * @param {Function} [opts.onClick]
 * @param {string} [opts.type] - button type when not a link
 * @param {Object} [opts.attrs] - extra attributes
 * @returns {HTMLElement}
 */
export function Button({
  label,
  variant = 'primary',
  href,
  external = false,
  iconHtml = '',
  onClick,
  type = 'button',
  attrs = {},
}) {
  const className = `btn btn--${variant}`;
  const inner = `<span class="btn__label">${label}</span>${iconHtml}`;

  if (href) {
    return el('a', {
      class: className,
      href,
      html: inner,
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      ...(onClick ? { onClick } : {}),
      ...attrs,
    });
  }

  return el('button', {
    class: className,
    type,
    html: inner,
    ...(onClick ? { onClick } : {}),
    ...attrs,
  });
}
