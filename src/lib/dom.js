// Minimal DOM helpers. Kept tiny and framework-free; a React migration
// simply drops these in favour of JSX.

/**
 * Create an element with attributes/props and children.
 * @param {string} tag
 * @param {Object} [attrs] - html attributes; `class`, `dataset`, `on*` handlers,
 *                           `html` (innerHTML), and boolean/string props supported.
 * @param {(Node|string|null|Array)} [children]
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;

    if (key === 'class') {
      node.className = value;
    } else if (key === 'html') {
      node.innerHTML = value;
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node && key !== 'list') {
      // Prefer property assignment (value, disabled, etc.).
      node[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  append(node, children);
  return node;
}

/** Append a child, array of children, or text to a parent. */
export function append(parent, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return parent;
}

/** Replace all children of a node. */
export function clear(node) {
  node.replaceChildren();
  return node;
}

/** Escape untrusted text for safe innerHTML interpolation. */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
