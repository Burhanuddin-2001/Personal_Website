/* Every localStorage / sessionStorage call goes through here. A private
   window, blocked site data or an in-app browser can throw on the mere
   access, and the page must work without storage at all. */
const area = (where) => (where === 'session' ? sessionStorage : localStorage);

export function load(key, fallback, where = 'local') {
  try {
    const v = area(where).getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function save(key, value, where = 'local') {
  try {
    area(where).setItem(key, JSON.stringify(value));
  } catch {
    // Not remembered. Nothing else changes.
  }
}
