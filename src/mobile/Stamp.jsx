import { motion } from 'motion/react';
import { play } from '../sound.js';
import { STAMP, slam } from './motion.js';

/* A rubber stamp. Printed on the paper it already sits on (still), or
   slammed down the moment it appears. Never on text, never in the way of a
   touch, and one per screen. */
export default function Stamp({ children, kind, r = -6, still, onLanded }) {
  const [to, how] = slam(r, STAMP);
  return (
    <motion.p className={`m-stamp m-stamp--${kind}`} aria-hidden="true"
              initial={still ? false : undefined} animate={to} transition={how}
              onAnimationStart={() => !still && play('stamp', STAMP * 0.42)}   /* the moment it hits */
              onAnimationComplete={onLanded}>
      {children}
    </motion.p>
  );
}
