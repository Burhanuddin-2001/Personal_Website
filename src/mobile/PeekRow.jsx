import { useRef } from 'react';
import { motion } from 'motion/react';
import { FOLDERS } from './routes.js';

/* The rest of the drawer, peeking below an open folder: PUT BACK first,
   then the other four as real tabs. A folder already opened stands a little
   proud with a thumbprint on its tab - never a red dot, which reads as
   unread. */
export default function PeekRow({ y, height, open, opened, filing, hidden, onPick, onPutBack }) {
  // While the row slides away after a close, it keeps the slots it had.
  const last = useRef(open);
  if (open) last.current = open;

  return (
    <motion.nav className="m-peek" style={{ y, height }} aria-label="More folders"
                inert={!open || filing} hidden={hidden}>
      <p className="m-peek__caption" aria-hidden="true">{filing ? 'Filing…' : 'More folders · Tap one'}</p>
      <div className="m-peek__slots">
        {/* While a message is in the post, its slot is where the envelope goes. */}
        <button type="button" className="m-peek__back" onClick={onPutBack}>
          {filing ? 'Filing' : 'Put back'} <span aria-hidden="true">↓</span>
        </button>
        {FOLDERS.filter((f) => f.id !== last.current).map((f) => (
          <button key={f.id} type="button" aria-label={f.tab}
                  className={`m-peek__tab${opened.includes(f.id) ? ' is-opened' : ''}`}
                  onClick={() => onPick(f.id)}>
            <span className="m-peek__label">{f.peek}</span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
