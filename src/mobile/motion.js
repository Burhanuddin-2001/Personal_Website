/* Every phone move lives here. Add ?slow to the URL to run each one at a
   sixth speed - the same switch and factor as the desktop. */
export const SLOW = new URLSearchParams(location.search).has('slow') ? 6 : 1;

/* Reduced motion: no arrival, no overshoot, no slam, and nothing longer
   than 120 ms. The declarative moves are handled by <MotionConfig>; the
   imperative ones read this. */
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sec = (ms) => (REDUCED ? Math.min(ms, 120) : ms * SLOW) / 1000;   // Motion takes seconds

export const OPEN = sec(420);       // released past the line
export const TAP_OPEN = sec(520);   // a tap: the same rise, from rest
export const DROP = sec(260);       // released short of the line
export const CLOSE = sec(340);      // always shorter than an open

/* The release line: the pull opens past 40 % of its travel, or on a flick
   faster than 0.6 px/ms. */
export const LINE = 0.4;
export const FLICK = 0.6;

/* The arrival, one second at most: dark, the lamp clicks
   on, the drawer slides out, the folders settle back to front with a small
   thump each, and RECEIVED lands last. */
export const LAMP_AT = sec(120);
export const LAMP = sec(60);
export const SLIDE = sec(400);
export const SETTLE_AT = sec(400);
export const SETTLE_GAP = sec(60);
export const SETTLE = sec(200);
export const STAMP_AT = sec(580);
export const STAMP = sec(420);

/* The slip folds into an envelope on the desktop seal's timings: lift, the
   bottom flap, the top flap, the kraft skin, the counterfoil, then the
   stamp. Coming undone is a snap-back, about half as long. */
export const ENV_LIFT = sec(230);
export const ENV_FLAP = sec(340);
export const ENV_BOT_AT = sec(200);
export const ENV_TOP_AT = sec(470);
export const ENV_SKIN_AT = sec(790);
export const ENV_SKIN = sec(300);
export const ENV_STUB_AT = sec(1000);
export const ENV_STUB = sec(340);
export const UNFOLD = sec(280);
export const HINGE = [0.32, 0.72, 0.14, 1];

export const HOLD = (500 * SLOW) / 1000;   // time to read SENT before the envelope goes: not a move
export const SLOT = sec(480);       // the envelope slides down into the folder
export const SHUT = sec(380);       // the drawer rolls shut, with a 3 px jolt
export const TAPE = sec(300);       // the tape peels off the photo

/* Paper is not a spring. Going up it overshoots and drops back onto the
   rail; coming down it accelerates into the stop and bounces once, small. */
export function land(from, to, duration, delay = 0) {
  if (REDUCED) return [[from, to], { duration, delay, ease: 'easeOut' }];
  return to < from
    ? [[from, to - 6, to + 2, to],
       { duration, delay, times: [0, 0.72, 0.88, 1], ease: ['easeOut', 'easeInOut', 'easeOut'] }]
    : [[from, to + 4, to],
       { duration, delay, times: [0, 0.82, 1], ease: ['easeIn', 'easeOut'] }];
}

/* A stamp is slammed, never faded in: down hard from oversize, past its
   angle and back. The desktop seal's values. */
export function slam(r, duration, delay = 0) {
  if (REDUCED) return [{ scale: 1, rotate: r, opacity: 1 }, { duration: 0, delay }];
  return [
    { scale: [2.8, 0.93, 1.03, 1], rotate: [r - 19, r + 2.2, r - 1.2, r], opacity: [0, 1, 1, 1] },
    { duration, delay, times: [0, 0.42, 0.7, 1], ease: ['easeIn', 'easeOut', 'easeOut'] },
  ];
}
