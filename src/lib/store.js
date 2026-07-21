// Tiny observable store — the single source of truth for cross-component
// state (currently the selected project index). Mirrors the shape of a
// React reducer/context so migration is mechanical.

/**
 * @template T
 * @param {T} initialState
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState() {
      return state;
    },

    /** Merge a partial state and notify subscribers if something changed. */
    setState(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      const merged = { ...state, ...next };

      // Shallow-equal short-circuit to avoid redundant renders.
      const changed = Object.keys(merged).some((k) => merged[k] !== state[k]);
      if (!changed) return;

      state = merged;
      for (const listener of listeners) listener(state);
    },

    /** Subscribe to changes; returns an unsubscribe function. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
