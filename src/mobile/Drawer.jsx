import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, motionValue, useTransform } from 'motion/react';
import { play } from '../sound.js';
import { useGesture } from './gesture.js';
import { FOLDERS } from './routes.js';
import {
  CLOSE, DROP, FLICK, LINE, OPEN, REDUCED, TAP_OPEN, land, slam,
  LAMP_AT, LAMP, SLIDE, SETTLE_AT, SETTLE_GAP, SETTLE, STAMP_AT, STAMP,
} from './motion.js';
import Cabinet from './Cabinet.jsx';
import Folder from './Folder.jsx';
import PeekRow from './PeekRow.jsx';

/* Back to front, as they hang: Resume nearest the thumb. */
const HUNG = [...FOLDERS].reverse();
const TAB = 44;    // the tab strip, and the smallest tap target

function layout(h, plate) {
  const front = Math.round(h * 0.2);   // how much of the front folder shows
  const step = (h - plate - 16 - front - TAB) / (HUNG.length - 1);
  return {
    peek: h < 640 ? 96 : 104,          // left at the bottom for the rest of the drawer
    rest: (i) => Math.round(plate + 16 + i * step),
  };
}

/* The drawer seen from above. Every folder's y is its distance from the top
   of the frame: its rest on the rail, 0 when open, below the frame while
   another folder is open. The plate, the pockets and the peek row each have
   one y for the whole set. */
export default function Drawer({ w, h, keyboard, folder, opened, filing, inert, paper, onOpen, onClose }) {
  const root = useRef(null);
  const plateRef = useRef(null);
  const stampRef = useRef(null);
  const drag = useRef(null);
  const how = useRef(null);       // how the next open should move, if not a tap
  const [arriving] = useState(folder === null && !REDUCED);
  const [plate, setPlate] = useState(214);
  const [line, setLine] = useState(null);   // the release line while pulling
  const g = layout(h, plate);
  const o = HUNG.findIndex((f) => f.id === folder);
  const geo = useRef(null);
  geo.current = { g, h, plate };

  const at = (i, open) => (open < 0 ? g.rest(i) : i === open ? 0 : h + 24);
  const place = (open) => ({
    plate: open < 0 ? 0 : -plate - 8,
    pockets: open < 0 ? 0 : h,
    peek: open < 0 ? g.peek + 16 : 0,
  });
  const [ys] = useState(() => HUNG.map((_, i) => motionValue(at(i, o))));
  const [m] = useState(() => ({
    plate: motionValue(0), pockets: motionValue(0), peek: motionValue(0),
    box: motionValue(0), dark: motionValue(arriving ? 1 : 0),
  }));

  // The lamp's pool widens as a sheet comes up into its light.
  const pool = useTransform(ys, (v) => 1 + 0.4 * Math.max(...v.map((y, i) =>
    Math.min(1, Math.max(0, 1 - y / geo.current.g.rest(i))))));

  // The plate is as tall as its card, and the card as tall as its type.
  useLayoutEffect(() => {
    const el = plateRef.current;
    const ro = new ResizeObserver(() => setPlate(el.offsetHeight));
    ro.observe(el);
    setPlate(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // A new frame or plate height puts everything where it belongs at once.
  useLayoutEffect(() => {
    const p = place(o);
    ys.forEach((y, i) => y.jump(at(i, o)));
    for (const k in p) m[k].jump(p[k]);
  }, [h, plate]);

  /* The arrival. It waits in the dark for the type (at most 600 ms), so the
     card is measured once and nothing reflows under the moves. Any touch
     skips straight to the end; every tab works from the first frame. */
  useEffect(() => {
    if (!arriving) return;
    let runs = null;
    let skipped = false;
    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]);
    fonts.then(() => {
      if (skipped) return;
      const { g, h, plate } = geo.current;
      runs = [
        animate(m.dark, 0, { delay: LAMP_AT, duration: LAMP }),
        animate(m.box, [-(h - plate) * 0.6, 0], { delay: LAMP_AT, duration: SLIDE, ease: 'easeOut' }),
        ...ys.map((y, i) => {
          const r = g.rest(i);
          return animate(y, ...land(r - 14, r, SETTLE, SETTLE_AT + i * SETTLE_GAP));
        }),
        animate(stampRef.current, ...slam(-6, STAMP, STAMP_AT)),
      ];
      Promise.all(runs).then(done);
    });
    // Completing an arrival that already ended would put every folder back
    // on its rail, so the skip is only listening while the arrival runs.
    const el = root.current;
    const done = () => el.removeEventListener('pointerdown', skip, true);
    const skip = () => {
      done();
      if (runs) return runs.forEach((r) => r.complete());
      skipped = true;
      m.dark.set(0);
      stampRef.current.style.opacity = 1;
    };
    el.addEventListener('pointerdown', skip, true);
    return () => {
      skipped = true;
      done();
      runs?.forEach((r) => r.stop());
    };
  }, []);

  /* A folder opened, closed, or swapped for another. */
  const was = useRef(o);
  useLayoutEffect(() => {
    const from = was.current;
    was.current = o;
    if (from === o) return;
    if (from >= 0 && o >= 0) {
      // The open one drops back into the drawer, then the other rises.
      animate(ys[from], ...land(ys[from].get(), h + 24, CLOSE));
      animate(ys[o], ...land(ys[o].get(), 0, OPEN, CLOSE));
      play('thump', CLOSE + OPEN * 0.72);
    } else {
      const d = o < 0 ? CLOSE : how.current ?? TAP_OPEN;
      const p = place(o);
      for (const k in p) animate(m[k], ...land(m[k].get(), p[k], d));
      ys.forEach((y, i) => animate(y, ...land(y.get(), at(i, o), d)));
      // Past the line it thumps home; put back, the folders rattle on the rails.
      play(o < 0 ? 'rattle' : 'thump', d * 0.75);
    }
    how.current = null;
    // Focus follows the paper: onto the sheet that opened, back to the tab
    // of the one put away.
    const target = o >= 0
      ? root.current.querySelector(`#title-${HUNG[o].id}`)
      : root.current.querySelector(`[aria-controls="sheet-${HUNG[from].id}"]`);
    target?.focus({ preventScroll: true });
  }, [o]);

  const grab = (el) => {
    const i = Number(el.dataset.folder);
    ys[i].stop();
    drag.current = { i, base: ys[i].get() };
  };
  const follow = (dy) => {
    const { i, base } = drag.current;
    ys[i].set(Math.min(g.rest(i), Math.max(0, base + dy)));
  };

  useGesture(root, {
    pull: {
      start: (el) => {
        grab(el);
        play('scrape');
        // Where the thumb has to bring the tab for the folder to open.
        setLine(g.rest(drag.current.i) * (1 - LINE) + TAB / 2);
      },
      move: (dx, dy) => follow(dy),
      end: (dx, dy, vy) => {
        const { i } = drag.current;
        setLine(null);
        if (1 - ys[i].get() / g.rest(i) >= LINE || vy < -FLICK) {
          how.current = OPEN;
          onOpen(HUNG[i].id);
        } else {
          animate(ys[i], ...land(ys[i].get(), g.rest(i), DROP));
          play('rattle', DROP * 0.8);
        }
      },
    },
    close: {
      start: grab,
      move: (dx, dy) => follow(dy),
      end: (dx, dy, vy) => {
        const { i } = drag.current;
        if (ys[i].get() / g.rest(i) >= LINE || vy > FLICK) onClose();
        else animate(ys[i], ...land(ys[i].get(), 0, DROP));
      },
    },
    // The tape on the photo belongs to the Resume: it is told, not moved.
    peel: {
      start: (el) => { drag.current = { el }; },
      move: (dx) => drag.current.el.dispatchEvent(new CustomEvent('peel', { detail: { dx } })),
      end: (dx, dy, vy, vx) =>
        drag.current.el.dispatchEvent(new CustomEvent('peel', { detail: { dx, vx, done: true } })),
    },
  });

  return (
    <div className="m-drawer" ref={root} inert={inert}>
      <motion.div className="m-box" style={{ y: m.box }}>
        <div className="m-rails" aria-hidden="true" />
        {/* Under every folder, so it lights the steel and the gaps and never
            the paper. */}
        <motion.div className="m-lamp" aria-hidden="true" style={{ scale: pool }} />
        {HUNG.map((f, i) => (
          // With the keyboard up the peek row goes, and the sheet has it all.
          <Folder key={f.id} f={f} i={i} y={ys[i]} rest={g.rest(i)} height={h - (keyboard ? 0 : g.peek)}
                  w={w} open={o === i} away={o >= 0} pocketY={m.pockets}
                  onTap={() => (o === i ? onClose() : onOpen(f.id))}>
            {paper(f.id)}
          </Folder>
        ))}
        <motion.div className="m-line" aria-hidden="true" style={{ top: line ?? 0 }}
                    initial={false} animate={{ scaleX: line === null ? 0 : 1 }}
                    transition={{ duration: DROP }}>
          <span>Release zone</span>
        </motion.div>
      </motion.div>

      <PeekRow y={m.peek} height={g.peek} open={folder} opened={opened} filing={filing} hidden={keyboard}
               onPick={(id) => onOpen(id, true)} onPutBack={onClose} />

      <motion.header className="m-plate" ref={plateRef} style={{ y: m.plate }}>
        <Cabinet stampRef={stampRef} arriving={arriving}
                 hint={line === null ? 'Pull a tab up · or tap it' : 'Let go past the line'} />
      </motion.header>

      <motion.div className="m-dark" aria-hidden="true" style={{ opacity: m.dark }} />
    </div>
  );
}
