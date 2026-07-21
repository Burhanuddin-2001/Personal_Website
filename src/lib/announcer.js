// A single polite aria-live region for screen-reader announcements
// (carousel navigation, form status). One shared region avoids duplicate
// live regions competing for the SR's attention.

let region;

function getRegion() {
  if (region) return region;
  region = document.createElement('div');
  region.className = 'visually-hidden';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', 'status');
  document.body.appendChild(region);
  return region;
}

/** Announce a message to assistive technology. */
export function announce(message) {
  const node = getRegion();
  // Clearing first guarantees repeat messages are re-announced.
  node.textContent = '';
  // Microtask defer so the DOM mutation registers as a change.
  window.requestAnimationFrame(() => {
    node.textContent = message;
  });
}
