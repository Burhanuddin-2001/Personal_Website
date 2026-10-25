import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { profile } from '../../profile.js';
import photo from '../../assets/profile.avif';
import { play } from '../../sound.js';
import { DROP, FLICK, TAPE } from '../motion.js';
import Stamp from '../Stamp.jsx';

const PEEL = 36;   // px of sideways drag that takes the tape off

/* The personnel record, on cream. Name and role first, then the photo with
   tape over the eyes, then the field. The PDF is the main way out. */
export default function Resume({ onInterview }) {
  const [taped, setTaped] = useState(true);
  const [requested, setRequested] = useState(false);
  const print = useRef(null);
  const tx = useMotionValue(0);
  const tilt = useTransform(tx, (x) => -2 + x * 0.08);

  const peel = (dir) => {
    setTaped(false);
    play('scrape');
    animate(tx, dir * print.current.offsetWidth * 1.15, { duration: TAPE, ease: 'easeIn' });
  };

  /* The flick: the drawer's one gesture machine tells the photo how far the
     finger has gone. The tape follows it, then comes off or lies back down. */
  useEffect(() => {
    const el = print.current;
    const on = ({ detail: { dx, vx, done } }) => {
      if (!done) return tx.set(dx);
      if (Math.abs(dx) >= PEEL || Math.abs(vx) > FLICK) peel(Math.sign(dx || vx));
      else animate(tx, 0, { duration: DROP });
    };
    el.addEventListener('peel', on);
    return () => el.removeEventListener('peel', on);
  }, []);

  return (
    <div className="m-paper">
      <header className="m-head">
        <h2 className="m-sheet__title" id="title-resume" tabIndex={-1}>Personnel Record</h2>
        {/* One stamp per screen: REQUESTED takes TOP SECRET's place. */}
        {requested
          ? <Stamp key="req" kind="red" r={-4} onLanded={onInterview}>Requested</Stamp>
          : <Stamp key="top" kind="red" r={-4} still>Top secret</Stamp>}
      </header>

      <h3 className="m-rec__name">{profile.name}</h3>
      <p className="m-rec__role">{profile.title}</p>

      <div className="m-rec__id">
        {/* Flick the tape off, or tap the photo: the whole print is its button. */}
        <button type="button" className="m-photo" ref={print} disabled={!taped}
                data-handle={taped ? 'tape' : undefined}
                aria-label="Peel the tape off the photo" onClick={() => peel(1)}>
          <span className="m-photo__frame">
            {/* Not draggable: an image drag cancels the flick mid-move. */}
            <img src={photo} alt={profile.avatar.alt} draggable={false} />
            <motion.span className="m-tape" aria-hidden="true" style={{ x: tx, rotate: tilt }} />
          </span>
          {taped && <span className="m-photo__cap" aria-hidden="true">Flick the tape</span>}
        </button>
        <dl className="m-rec__facts">
          <dt>Status</dt><dd className="m-body">{profile.status}</dd>
          <dt>Appointed</dt><dd className="m-body">{profile.appointed}</dd>
        </dl>
      </div>

      <div className="m-chips">
        <p className="m-label" id="m-field">Field</p>
        <ul aria-labelledby="m-field">
          {profile.field.map((f) => <li key={f} data-chip>{f}</li>)}
        </ul>
      </div>

      <div className="m-acts">
        {/* Stamped once; after that it goes straight to the slip. */}
        <button type="button" className="m-btn m-btn--line"
                onClick={requested ? onInterview : () => setRequested(true)}>
          Request an interview <span aria-hidden="true">→</span>
        </button>
        <a className="m-btn m-btn--main" href={profile.resumeUrl} target="_blank" rel="noopener">
          Download the PDF
          <small>Opens in a new tab · one page</small>
        </a>
      </div>
    </div>
  );
}
