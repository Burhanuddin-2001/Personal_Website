import { useState } from 'react';
import { motion } from 'motion/react';
import { profile } from '../profile.js';
import {
  ENV_LIFT, ENV_FLAP, ENV_BOT_AT, ENV_TOP_AT, ENV_SKIN_AT, ENV_SKIN, ENV_STUB_AT, ENV_STUB,
  UNFOLD, HINGE, HOLD, SLOT,
} from './motion.js';
import Stamp from './Stamp.jsx';

/* THE PHONE FOLD. The slip is one sheet in three panels: the bottom folds
   up, the top folds down over both, the kraft skin settles on the stack, and
   the stamp slams. The same model as the desktop envelope (src/pages.jsx),
   drawn at phone size.

   .m-env-stage is its own perspective root, and the 3D traps hold
   inside it: every panel is an outer box with its depth and an inner hinge
   with its rotation, every hinge has a real back face, and nothing between
   the root and a face carries a filter, an opacity below 1 or an overflow. */

const lift = {
  slip: { z: 0, transition: { duration: UNFOLD, delay: UNFOLD, ease: HINGE } },
  sealed: { z: 18, transition: { duration: ENV_LIFT, ease: HINGE } },
};
const bottom = {
  slip: { rotateX: 0, transition: { duration: UNFOLD, delay: UNFOLD, ease: HINGE } },
  sealed: { rotateX: 180, transition: { duration: ENV_FLAP, delay: ENV_BOT_AT, ease: HINGE } },
};
const top = {
  slip: { rotateX: 0, transition: { duration: UNFOLD, delay: UNFOLD / 2, ease: HINGE } },
  sealed: { rotateX: -180, transition: { duration: ENV_FLAP, delay: ENV_TOP_AT, ease: HINGE } },
};
const skin = {
  slip: { opacity: 0, scale: 1.035, transition: { duration: UNFOLD / 2 } },
  sealed: { opacity: 1, scale: 1, transition: { duration: ENV_SKIN, delay: ENV_SKIN_AT, ease: HINGE } },
};
const stub = {
  slip: { y: -40, opacity: 0, transition: { duration: UNFOLD / 2 } },
  sealed: { y: 0, rotate: 1.1, opacity: 1, transition: { duration: ENV_STUB, delay: ENV_STUB_AT, ease: HINGE } },
};

/* The slip as it was sent, typed out once for all three panels. */
function Letter({ letter }) {
  return (
    <div className="m-env__sheet">
      <p className="m-env__k">Name</p>
      <p className="m-env__v">{letter.name}</p>
      <p className="m-env__k">Your contact</p>
      <p className="m-env__v">{letter.contact}</p>
      <p className="m-env__k">Message</p>
      <p className="m-env__msg">{letter.message}</p>
    </div>
  );
}

/* One third of the sheet: a window onto the full letter, slid up by its own
   share, so the three panels read as one page. */
function Panel({ part, letter, variants, depth }) {
  return (
    <div className={`m-env__panel m-env__panel--${part}`} style={{ transform: `translateZ(${depth}px)` }}>
      <motion.div className="m-env__hinge" variants={variants}>
        <div className="m-env__face m-env__face--recto">
          <div className="m-env__win" data-part={part}><Letter letter={letter} /></div>
        </div>
        <div className="m-env__face m-env__face--verso" />
      </motion.div>
    </div>
  );
}

/* status: 'busy' while the wire is open, then 'sent' or 'lost'. An answer
   that beats the fold home waits for it: no stamp lands on a sheet that is
   still folding. */
export default function Envelope({ letter, status, onUnfolded, onSent }) {
  const [sealed, setSealed] = useState(false);
  const [filing, setFiling] = useState(false);
  const sent = sealed && status === 'sent';
  const lost = sealed && status === 'lost';

  return (
    /* The slot clips the envelope as it goes down into the folder. It sits
       outside the 3D chain, so its overflow flattens nothing. */
    <div className="m-env-slot" aria-hidden="true">
      <motion.div className="m-env-stage"
                  animate={filing ? { y: '105%' }
                    : sent ? { x: [0, -3, 1.6, 0], y: [0, 3.4, -1.4, 0] }
                    : lost ? { y: [0, -12, 3, 0] } : undefined}
                  transition={filing ? { duration: SLOT, delay: HOLD, ease: 'easeIn' }
                    : { duration: ENV_LIFT, ease: 'easeOut' }}
                  onAnimationComplete={() => filing && onSent()}>
        <motion.div className="m-env" variants={lift} initial="slip" animate={lost ? 'slip' : 'sealed'}
                    onAnimationComplete={(v) => v === 'slip' && lost && onUnfolded()}>
          <Panel part="mid" letter={letter} variants={{}} depth={0} />
          <Panel part="bot" letter={letter} variants={bottom} depth={1} />
          <Panel part="top" letter={letter} variants={top} depth={2} />

          {/* Depth on the box, animation on the skin inside it: Motion writes
              its own transform inline, and a translateZ beside it is erased. */}
          <div className="m-env__skinbox">
            <motion.div className="m-env__skin" variants={skin}
                        onAnimationComplete={(v) => v === 'sealed' && setSealed(true)}>
              <p className="m-env__post">Line 07<br />{letter.date}<br />{letter.time}</p>
              <p className="m-env__addr">To: Tony<br />From: {letter.name}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* The retained copy: a file that posts a slip keeps its counterfoil. */}
        <motion.div className="m-stub" variants={stub} initial="slip" animate={lost ? 'slip' : 'sealed'}>
          <p className="m-stub__k">Retained copy</p>
          <p>Reply to: {letter.contact}</p>
          <p>Sent: {letter.date} · {letter.time}</p>
        </motion.div>

        {/* Outside the fold, so it stays crisp 2D type. */}
        {sent && <Stamp kind="green" r={-7} onLanded={() => setFiling(true)}>Sent</Stamp>}
        {sent && <p className="m-env__filing">Filing into contact <span aria-hidden="true">↓</span></p>}
      </motion.div>
    </div>
  );
}
