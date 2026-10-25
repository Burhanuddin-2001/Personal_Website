import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { profile } from '../../profile.js';
import { CLOSE } from '../motion.js';
import Stamp from '../Stamp.jsx';
import Envelope from '../Envelope.jsx';

export const MAX_TRIES = 3;

/* The desktop's own rules and words (RULES in src/pages.jsx). Copied, not
   imported: the phone never loads the desktop's components. */
const RULES = {
  name_field: (v) => (v.trim() ? '' : 'Required.'),
  contact_field: (v) => {
    const s = v.trim();
    if (!s) return 'Required — how do I reply?';
    const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
    const looksPhone = (s.match(/\d/g) || []).length >= 7;
    return looksEmail || looksPhone ? '' : 'An email address or a phone number.';
  },
  message: (v) =>
    (v.trim().length >= 10 ? '' : 'A little more, please — ten characters or more.'),
};

/* Web3Forms field name -> the draft's key. */
const DRAFT = { name_field: 'name', contact_field: 'contact', message: 'message' };

/* The transmission slip, on blue-grey carbon. */
export default function Contact({ draft, send, keyboard, h, onDraft, onPing, onUnfolded, onSent }) {
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [lift, setLift] = useState(0);
  const slip = useRef(null);
  const ping = useRef(null);
  const { status, tries, letter } = send;
  const locked = tries >= MAX_TRIES;
  const lost = status === 'lost' && !letter;

  /* With the keyboard up, the slip slides up just far enough to keep PING ME
     above the keys, but never so far that the field being typed in leaves
     the top of the paper. Measured from the layout (offsets), which the
     slide itself does not move. No scroll, ever. */
  useLayoutEffect(() => {
    const field = focused && slip.current.querySelector(`[name="${focused}"]`);
    if (!keyboard || !field) return setLift(0);
    const sheet = slip.current.offsetParent.getBoundingClientRect().top + slip.current.offsetTop;
    const frame = slip.current.closest('.m-shell').getBoundingClientRect().bottom;
    const below = sheet + ping.current.offsetTop + ping.current.offsetHeight - (frame - 8);
    const above = field.offsetTop - 8;
    setLift(Math.max(0, Math.min(below, above)));
  }, [keyboard, focused, h]);

  /* Same as the desktop: a field that is already complaining is re-asked
     on every keystroke, and one with nothing to say is left alone. */
  const edit = (e) => {
    const { name, value } = e.target;
    onDraft(DRAFT[name], value);
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      const msg = RULES[name](value);
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const next = {};
    for (const k of Object.keys(RULES)) {
      const msg = RULES[k](form[k].value);
      if (msg) next[k] = msg;
    }
    setErrors(next);
    const bad = Object.keys(RULES).find((k) => next[k]);
    if (bad) return form[bad].focus({ preventScroll: true });

    const now = new Date();
    onPing(form, {
      name: draft.name.trim(),
      contact: draft.contact.trim(),
      message: draft.message.trim(),
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
      time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const field = (name, label, props, hint) => (
    <div className={`m-field m-field--${DRAFT[name]}`}>
      <label htmlFor={`m-${name}`}>{label}{hint && <span className="m-field__hint"> {hint}</span>}</label>
      {props.rows
        ? <textarea id={`m-${name}`} name={name} value={draft[DRAFT[name]]} onChange={edit}
                    aria-invalid={errors[name] ? 'true' : undefined}
                    aria-describedby={errors[name] ? `m-e-${name}` : undefined} {...props} />
        : <input id={`m-${name}`} name={name} type="text" value={draft[DRAFT[name]]} onChange={edit}
                 aria-invalid={errors[name] ? 'true' : undefined}
                 aria-describedby={errors[name] ? `m-e-${name}` : undefined} {...props} />}
      <span className="m-err" id={`m-e-${name}`}>{errors[name]}</span>
    </div>
  );

  return (
    <>
      <motion.div className={`m-paper m-slip${letter ? ' is-sealed' : ''}`} ref={slip}
                  inert={!!letter} initial={false} animate={{ y: -lift }}
                  transition={{ duration: CLOSE, ease: 'easeOut' }}>
        <header className="m-head">
          {/* LOST needs the corner the form number sits in. */}
          <h2 className="m-sheet__title" id="title-contact" tabIndex={-1}>
            Transmission slip{!lost && ' · Form 7-C'}
          </h2>
          {lost && <Stamp kind="red" r={-5}>Lost</Stamp>}
        </header>

        <form className="m-form" noValidate onSubmit={submit}
              onFocus={(e) => setFocused(e.target.name)} onBlur={() => setFocused(null)}>
          <input type="checkbox" name="botcheck" className="m-hp" tabIndex={-1} autoComplete="off" />
          {field('name_field', 'Name', { autoComplete: 'name', enterKeyHint: 'next', placeholder: 'Your name' })}
          {field('contact_field', 'Your contact', {
            inputMode: 'email', autoComplete: 'email', enterKeyHint: 'next', placeholder: 'Email or phone',
          })}
          {field('message', 'Message', { rows: 3 }, 'ten characters or more')}

          {(lost || locked) && (
            <p className="m-note m-body">
              {locked
                ? 'Three tries did not go through. Your words are kept. The links below are the way now.'
                : 'It did not go through. Your words are kept. Try again, or use a link below.'}
            </p>
          )}

          <button type="submit" className="m-ping" ref={ping} disabled={status === 'busy' || locked}>
            {locked ? 'Channel closed' : tries ? `Ping again · ${tries} of ${MAX_TRIES}` : 'Ping me'}
          </button>
        </form>

        {/* Under the keys while typing; back the moment the keyboard goes. */}
        {!keyboard && (
          <div className="m-links">
            <a href={profile.socials.linkedin} target="_blank" rel="noopener">LinkedIn</a>
            <a href={`mailto:${profile.socials.email}`}>Email</a>
            <a href={profile.socials.github} target="_blank" rel="noopener">GitHub</a>
          </div>
        )}
      </motion.div>

      {letter && <Envelope letter={letter} status={status} onUnfolded={onUnfolded} onSent={onSent} />}
    </>
  );
}
