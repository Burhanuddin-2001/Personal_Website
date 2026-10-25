import { useEffect, useRef } from 'react';

/* ONE pointer state machine for the whole phone. Only one gesture owns a
   touch at a time. A touch on a handle is a tap until it has moved SLOP px;
   then its axis is locked, and if that axis means nothing on that handle the
   touch is given back. step() is pure, so it can be tested without a page.

     idle -down on a handle-> pending -moved SLOP-> pull | close | reopen | peel
     pending -up-> idle (a tap: the button's own click does the work) */
export const SLOP = 12;
export const IDLE = { mode: 'idle' };

/* Release speed is measured over the last 100 ms, not the last event: a
   browser may coalesce moves, or send one more at the same spot just before
   the finger lifts, and a single sample would read that as a dead stop. */
const TRAIL_MS = 100;

const AXES = {
  'tab-closed': { y: 'pull' },
  'tab-open': { y: 'close' },
  reopen: { y: 'reopen' },
  tape: { x: 'peel' },
};

export function step(s, e) {
  if (e.type === 'down') {
    return s.mode === 'idle' && e.handle
      ? { mode: 'pending', id: e.id, handle: e.handle, x0: e.x, y0: e.y, trail: [{ x: e.x, y: e.y, t: e.t }], vx: 0, vy: 0 }
      : s;
  }
  if (s.mode === 'idle' || e.id !== s.id) return s;
  if (e.type !== 'move') return IDLE;   // up or cancel

  const dx = e.x - s.x0;
  const dy = e.y - s.y0;
  const trail = [...s.trail, { x: e.x, y: e.y, t: e.t }].filter((p) => e.t - p.t <= TRAIL_MS);
  const span = Math.max(1, e.t - trail[0].t);
  const next = { ...s, dx, dy, trail, vx: (e.x - trail[0].x) / span, vy: (e.y - trail[0].y) / span };
  if (s.mode !== 'pending') return next;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SLOP) return s;
  const mode = AXES[s.handle]?.[Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x'];
  return mode ? { ...next, mode } : IDLE;
}

/* A gesture never starts on something that takes its own touch. */
const OWN_TOUCH = 'input, textarea, select, a, [data-chip]';

/* handlers: { pull: { start(el), move(dx, dy), end(dx, dy, vy, vx) }, close: ... }
   end() is also called on pointercancel, with no speed, so a call or a
   system swipe settles the paper at whichever rest it is nearest. */
export function useGesture(ref, handlers) {
  const live = useRef(handlers);
  useEffect(() => { live.current = handlers; });

  useEffect(() => {
    const root = ref.current;
    let s = IDLE;
    let el = null;
    let swallow = false;

    const feed = (type) => (e) => {
      let hit = null;
      if (type === 'down') {
        if (!e.isPrimary || e.button !== 0 || e.target.closest(OWN_TOUCH)) return;
        hit = e.target.closest('[data-handle]');
        swallow = false;
      }
      const prev = s;
      s = step(s, { type, id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp,
                    handle: hit?.dataset.handle });
      if (s === prev) return;
      if (prev.mode === 'idle') { el = hit; return; }

      if (prev.mode === 'pending') {
        if (s.mode === 'idle') {
          // Moved past the slop on an axis this handle does not use: not a tap.
          if (type === 'move') swallow = true;
          return;
        }
        el.setPointerCapture(e.pointerId);
        live.current[s.mode].start?.(el);
      }
      if (s.mode !== 'idle') {
        live.current[s.mode].move(s.dx, s.dy);
      } else {
        // A finger that stopped before it lifted sends no more moves, so the
        // last speed it had would still read as a flick. It is not one.
        const held = e.timeStamp - prev.trail.at(-1).t > TRAIL_MS;
        const still = type === 'cancel' || held;
        live.current[prev.mode].end(prev.dx, prev.dy, still ? 0 : prev.vy, still ? 0 : prev.vx);
        swallow = true;
      }
    };

    // A drag must never also count as a tap on the button it started on.
    const onClick = (e) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    };

    const on = {
      pointerdown: feed('down'), pointermove: feed('move'),
      pointerup: feed('up'), pointercancel: feed('cancel'),
    };
    for (const k in on) root.addEventListener(k, on[k]);
    root.addEventListener('click', onClick, true);
    return () => {
      for (const k in on) root.removeEventListener(k, on[k]);
      root.removeEventListener('click', onClick, true);
    };
  }, [ref]);
}
