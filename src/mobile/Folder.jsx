import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { profile } from '../profile.js';

const TAB = 44;

/* Per hanging place, back to front: where the tab sits along the folder,
   its tilt, and how much narrower and darker the folder looks at its depth. */
const TAB_X = [0.58, 0.03, 0.34, 0.4, 0.03];
const TILT = [1.4, -1.2, 0.9, -0.8, -1.1];
const DEPTH = [
  { scale: 0.86, shade: 0.52 },
  { scale: 0.9, shade: 0.38 },
  { scale: 0.94, shade: 0.24 },
  { scale: 0.97, shade: 0.11 },
  { scale: 1, shade: 0 },
];

/* One hanging folder: the part that lifts (tab, back, sheet) and the front
   pocket that stays in the drawer. The sheet that rises under the thumb IS
   the open sheet - nothing swaps on release. The pocket stays behind while
   the sheet comes up out of it. */
export default function Folder({ f, i, y, rest, height, w, open, away, pocketY, onTap, children }) {
  // Read live by the transforms below; a closure would keep the first rest.
  const restAt = useRef(rest);
  restAt.current = rest;

  const lift = useTransform(y, (v) => Math.min(1, Math.max(0, 1 - v / restAt.current)));
  const rotate = useTransform(lift, (p) => 8 * p * (1 - p) * Math.sign(TILT[i]));
  const back = useTransform(lift, (p) => DEPTH[i].scale + (1 - DEPTH[i].scale) * p);
  const shade = useTransform(lift, (p) => DEPTH[i].shade * (1 - p));
  const shadow = useTransform(lift, (p) => Math.min(1, p * 3));
  const resume = f.id === 'resume';

  return (
    <>
      <motion.section className={`m-folder m-folder--${f.paper}`}
                      style={{ y, rotate, height, zIndex: 2 * i + 1 }} inert={away && !open}>
        <motion.div className="m-folder__shadow" style={{ opacity: shadow }} />
        <motion.div className="m-folder__back" style={{ scaleX: back }}>
          <motion.div className="m-folder__shade" style={{ opacity: shade }} />
        </motion.div>
        <motion.button type="button" className="m-tab" data-handle={open ? 'tab-open' : 'tab-closed'}
                       data-folder={i} aria-expanded={open} aria-controls={`sheet-${f.id}`}
                       initial={false} animate={{ x: open ? 0 : TAB_X[i] * (w - 24) }}
                       onClick={onTap}>
          <span className="m-tab__paper" style={{ transform: `rotate(${TILT[i]}deg)` }}>
            {resume && <span className="m-tab__dot" aria-hidden="true">● </span>}
            {f.tab}
          </span>
        </motion.button>
        {/* Narrowed with its folder while it hangs out of sight in the
            drawer, full width - no scale at all - once it is up. */}
        <motion.div className={`m-sheet m-sheet--${f.paper}`} id={`sheet-${f.id}`} role="region"
                    aria-labelledby={`title-${f.id}`} inert={!open} style={{ scaleX: back }}>
          {children}
        </motion.div>
      </motion.section>

      <motion.div className="m-pocket" inert={away}
                  style={{ y: pocketY, top: rest + TAB + (resume ? 36 : 4), zIndex: 2 * i + 2,
                           scaleX: DEPTH[i].scale, '--shade': DEPTH[i].shade }}>
        {resume && (
          <>
            <a className="m-pdf" href={profile.resumeUrl} target="_blank" rel="noopener"
               aria-label="Resume, PDF, opens in a new tab">
              PDF <span aria-hidden="true">↓</span>
            </a>
            <p className="m-pocket__no" aria-hidden="true">{profile.fileNo}</p>
            <p className="m-route" aria-hidden="true">Route to:<br />Hiring manager</p>
          </>
        )}
      </motion.div>
    </>
  );
}
