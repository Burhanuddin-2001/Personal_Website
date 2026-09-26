// Every section is a SPREAD: a left page and a right page that belong
// together. Nothing is meant to scroll — the content is split across the two
// halves so it fits. `Scroll` is still here, but only as a safety net for a
// window nobody should be using.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { profile } from './profile.js';
import { projects } from './projects.js';
import photoUrl from './assets/profile.avif';
import sealUrl from './assets/stanford-seal.webp';
import { sendMessage } from './submit.js';

/* ==================================================================== bits */

export function TopSecretStamp() {
  return (
    <svg className="stamp-ts" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="arcTop" d="M60,60 m-45,0 a45,45 0 1,1 90,0" />
        <path id="arcBot" d="M 13,60 A 47,47 0 0 0 107,60" />
      </defs>
      <g fill="none" stroke="#9d2b20" strokeWidth="3" opacity=".9">
        <circle cx="60" cy="60" r="54" />
        <circle cx="60" cy="60" r="46" />
      </g>
      <text fontFamily="'Special Elite',monospace" fontSize="9.5" fill="#9d2b20"
            letterSpacing="2" opacity=".9">
        <textPath href="#arcTop" startOffset="50%" textAnchor="middle">
          CLASSIFIED &#183; CLASSIFIED
        </textPath>
      </text>
      <text fontFamily="'Special Elite',monospace" fontSize="8" fill="#9d2b20"
            letterSpacing="1.4" opacity=".85">
        <textPath href="#arcBot" startOffset="50%" textAnchor="middle">
          N-77-1103 &#183; EYES ONLY
        </textPath>
      </text>
      <text x="60" y="57" textAnchor="middle" fill="#9d2b20" opacity=".95"
            fontFamily="'Special Elite',monospace" fontSize="15" letterSpacing=".5">TOP</text>
      <text x="60" y="75" textAnchor="middle" fill="#9d2b20" opacity=".95"
            fontFamily="'Special Elite',monospace" fontSize="15" letterSpacing=".5">SECRET</text>
    </svg>
  );
}

/* A scroll region that says when there is more below it. Safety net only —
   if this ever shows up, the spread has been laid out wrong. */
export function Scroll({ className = '', children }) {
  const ref = useRef(null);
  const [s, setS] = useState({ more: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setS({
      more: el.scrollHeight > el.clientHeight + 4,
      end: el.scrollTop + el.clientHeight >= el.scrollHeight - 6,
    });
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, []);

  return (
    <div className="scrollbox" data-more={String(s.more)} data-end={String(s.end)}>
      <div ref={ref} className={'sheet__scroll ' + className}>{children}</div>
    </div>
  );
}

/* No stamp lives here. A mark printed on every right page is wallpaper, not
   a mark - and it made all four spreads lopsided the same way. The file
   carries exactly two: TOP SECRET on the cover, and the one that slams onto
   the envelope when you send. */
function PageHead({ kicker, title }) {
  return (
    <div className="phead">
      <div className="phead__txt">
        <p className="page-kicker">{kicker}</p>
        <h2 className="page-title">{title}</h2>
      </div>
    </div>
  );
}

/* Not a control. The bar slides off under the pointer and slides back when it
   leaves, so there is no state to hold and nothing to press. The bar is
   aria-hidden and the alt text describes the person, so a reader is never
   shown less than a sighted visitor. */
function Photo({ className = '' }) {
  return (
    <span className={'photo ' + className}>
      <span className="photo__frame">
        <img className="photo__img" src={photoUrl} alt={profile.avatar.alt}
             width="640" height="640" decoding="async" />
        <span className="photo__bar" aria-hidden="true" />
      </span>
      <span className="photo__cap" aria-hidden="true">PHOTO 1 OF 1</span>
    </span>
  );
}

/* ================================================================== COVER */

export function Cover() {
  return (
    <>
      {/* The wallpaper the cover is printed over. Hidden from the a11y tree
          on purpose: a reader announcing CONFIDENTIAL between the stamp and
          the subject line would be noise, and the word is already stamped. */}
      <span className="cover-mark" aria-hidden="true">CONFIDENTIAL</span>

      <div className="head">
        <TopSecretStamp />
      </div>

      <div className="rule">
        <span className="rule__k">Subject</span>
        <h1 className="rule__v">{profile.name}</h1>
      </div>

      <div className="rule">
        <span className="rule__k">Function</span>
        <p className="rule__v">{profile.title}</p>
      </div>

      <div className="photo-row">
        <Photo />
        <div className="photo-side">
          <span className="label" style={{ marginTop: 0 }}>
            Status
          </span>
          <p className="body-text" style={{ marginBottom: 8 }}>
            Active — available for engagement.
          </p>

          <span className="label" style={{ marginTop: 0 }}>
            Operational remit
          </span>
          <p className="body-text">
            Offensive and defensive AI/ML operations.
          </p>
        </div>
      </div>

      <div className="summary summary--assess push">
        <p>
          Pattern observed: subject develops offensive tooling first, then
          engineers detection against it. Three artifacts enclosed.
        </p>
        <p className="summary__disp">Disposition &mdash; cleared for interview</p>
      </div>

      <span className="confidential">
        <span className="confidential__tape confidential__tape--tl" aria-hidden="true" />
        <span className="confidential__tape confidential__tape--br" aria-hidden="true" />
        <span className="confidential__scrap">HANDLE BY AUTHORIZED PERSONNEL ONLY</span>
      </span>

      <div className="foot foot--cover">
        <span className="file-no">FILE NL-02-1026</span>
        <span className="file-no file-no--mid">COPY 01 OF 01</span>
        <span className="verified">
          <span className="verified__k">VERIFIED COPY</span>
          JAR 7847 &middot; 18 NOV 26
        </span>
      </div>
    </>
  );
}

/* ============================================================ RESUME spread
   LEFT: who he is. RIGHT: the one thing this page exists to make happen. */

export function ResumeLeft() {
  return (
    <>
      <PageHead kicker="Section 01" title="Personnel Record" />
      <hr className="divider" />

      <div className="photo-row">
        <Photo className="photo--sm" />
        <div className="photo-side">
          <span className="label" style={{ marginTop: 0 }}>Name</span>
          <p className="body-text" style={{ marginBottom: 7 }}>{profile.name}</p>
          <span className="label" style={{ marginTop: 0 }}>Role</span>
          <p className="body-text" style={{ marginBottom: 7 }}>{profile.title}</p>
          <span className="label" style={{ marginTop: 0 }}>Status</span>
          <p className="body-text">Active. Open to work.</p>
        </div>
      </div>

      <div className="summary"><p>{profile.intro}</p></div>

      <span className="label">Field</span>
      <ul className="chips">
        {profile.field.map((f) => <li key={f}>{f}</li>)}
      </ul>

      <div className="push credit">
        <span className="label">Appointment</span>
        {/* The seal is floated, so it must precede the prose it displaces. The
            asset is the university's own seal, already inverted to ink on a
            transparent ground and roughened, so nothing here recolours it. */}
        <img className="seal-su" src={sealUrl} alt="" aria-hidden="true" />
        <p className="credit__org">Stanford University &mdash; Section Leader</p>
        <p className="credit__note">
          Selected by Stanford University to teach 15 beginners how to program
          from scratch. I moved them from Karel to Python and data structures.
          Instead of handing out solutions, I traced errors line-by-line until
          the logic made sense to them. 85% finished their work ahead of
          schedule.
        </p>
      </div>

      <div className="foot">
        <span className="file-no">FILE NL-02-1026</span>
      </div>
    </>
  );
}

export function ResumeRight() {
  return (
    <>
      <PageHead kicker="Enclosure" title="Full Record" />
      <hr className="divider" />

      <div className="dl">
        <span className="dl__doc" aria-hidden="true">
          <span className="dl__corner" />
          <span className="dl__line" /><span className="dl__line" />
          <span className="dl__line dl__line--short" />
          <span className="dl__line" /><span className="dl__line" />
          <span className="dl__line dl__line--short" />
          <span className="dl__badge">PDF</span>
        </span>

        <p className="dl__name">Burhanuddin_Resume.pdf</p>
        <p className="dl__sub">One page &#183; the full record &#183; opens in a new tab</p>

        <a className="ping ping--link" href={profile.resumeUrl}
           target="_blank" rel="noreferrer">
          Download the PDF
        </a>
      </div>

      <div className="push">
        <span className="label">Other channels</span>
        <ul className="socials">
          <li><a href={profile.socials.github} target="_blank" rel="noreferrer">GitHub</a></li>
          <li><a href={profile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
          <li><a href={'mailto:' + profile.socials.email}>Email</a></li>
        </ul>
      </div>

      <div className="foot">
        <span className="file-no">Released on request</span>
        <span className="stamp-classified stamp-classified--ok" aria-hidden="true">Cleared</span>
      </div>
    </>
  );
}

/* ============================================================== WORK spread
   LEFT: rain. RIGHT: the index. */

export function WorkLeft() {
  return (
    <>
      <PageHead kicker="Section 02" title="Case Index" />
      <hr className="divider" />

      <p className="body-text">
        Three closed cases. Each one is a tool that breaks something, and the
        tool that catches it again.
      </p>

      <span className="label">Enclosures</span>
      <ol className="contents__list">
        {projects.map((p, i) => (
          <li key={p.id}>
            <span className="contents__no">{String(i + 1).padStart(2, '0')}</span>
            <span className="contents__name">{p.name}</span>
            <span className="contents__dots" aria-hidden="true" />
            <span className="contents__st">{p.status}</span>
          </li>
        ))}
      </ol>

      <div className="push">
        <span className="label">On file</span>
        <p className="bignum"><span>03</span> enclosures</p>
      </div>

      <div className="foot">
        <span className="file-no">FILE NL-02-1026</span>
      </div>
    </>
  );
}

export function WorkRight({ onOpen }) {
  return (
    <>
      <PageHead kicker="Enclosures" title="Select a case" />
      <hr className="divider" />
      <ul className="case-list">
        {projects.map((p, i) => (
          <li key={p.id}>
            <button type="button" className="case-card" onClick={() => onOpen(i)}>
              <span className="case-card__no">{String(i + 1).padStart(2, '0')}</span>
              <span className="case-card__body">
                <span className="case-card__name">{p.name}</span>
                <span className="case-card__tag">{p.tagline}</span>
                <span className="case-card__tech">{p.tech.join(' · ')}</span>
              </span>
              <span className="case-card__go" aria-hidden="true">&#8250;</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="push">
        <span className="label">Note</span>
        <p className="body-text body-text--tight">
          Every case links to its source. Nothing on this file is a mock-up.
        </p>
      </div>

      <div className="foot">
        <span className="file-no">3 of 3 on file</span>
      </div>
    </>
  );
}

/* =========================================================== PROJECT spread
   Split so a case never needs scrolling: the story on the left, the findings
   and the controls on the right. */

export function ProjectLeft({ index }) {
  const p = projects[index];
  if (!p) return null;
  return (
    <>
      <PageHead kicker={'Case ' + String(index + 1).padStart(2, '0') + ' · ' + p.status}
                title={p.name} />
      <hr className="divider" />

      <p className="tagline">{p.tagline}</p>

      <span className="label">Stack</span>
      <ul className="chips">
        {p.tech.map((t) => <li key={t}>{t}</li>)}
      </ul>

      <span className="label">Overview</span>
      <p className="body-text body-text--tight">{p.overview}</p>

      <div className="push">
        <span className="label">The problem</span>
        <p className="body-text body-text--tight">{p.problem}</p>
      </div>

      <div className="foot">
        <span className="file-no">
          Case {String(index + 1).padStart(2, '0')} &#183; sheet 1 of 2
        </span>
      </div>
    </>
  );
}

export function ProjectRight({ index, onStep }) {
  const p = projects[index];
  if (!p) return null;
  return (
    <>
      <PageHead kicker="Findings" title="What it does" />
      <hr className="divider" />

      <ul className="bullets">
        {p.features.map((f) => <li key={f}>{f}</li>)}
      </ul>

      <span className="label">Architecture</span>
      <p className="body-text body-text--tight">{p.architecture}</p>

      {p.links?.github && (
        <>
          <span className="label">Evidence</span>
          <a className="linkout" href={p.links.github} target="_blank" rel="noreferrer">
            &#9656; Source on GitHub
          </a>
        </>
      )}

      <nav className="paging" aria-label="Cases">
        <button type="button" className="paging__btn" onClick={() => onStep(-1)}>
          &#8249; {index === 0 ? 'Index' : 'Prev case'}
        </button>
        <span className="paging__count">{index + 1} / {projects.length}</span>
        <button type="button" className="paging__btn" onClick={() => onStep(1)}>
          {index === projects.length - 1 ? 'Index' : 'Next case'} &#8250;
        </button>
      </nav>

      <div className="foot">
        <span className="file-no">
          Case {String(index + 1).padStart(2, '0')} &#183; sheet 2 of 2
        </span>
      </div>
    </>
  );
}

/* =========================================================== CONTACT spread
   RIGHT: the form. LEFT: the send button and the other ways in. The button
   drives the form across the spine with the HTML `form` attribute, which is
   exactly what that attribute is for. */

/* The same ?slow switch the shell reads. Two lines duplicated rather than a
   circular import between App and pages. */
const SLOW = typeof location !== 'undefined' &&
             new URLSearchParams(location.search).has('slow') ? 6 : 1;
const F = (ms) => (ms * SLOW) / 1000;

export const MAX_TRIES = 3;

/* Read here for the paper AND in App for the announcement: there is exactly
   one live region in the file, and it lives in App. Two would talk over each
   other. */
export function sendStatus({ result, tries, busy }) {
  const failed = !!result && !result.ok;
  if (busy) return 'In the post…';
  if (failed && tries >= MAX_TRIES)
    return 'Three attempts logged. Refresh the page to file a new slip.';
  return result ? result.message : '';
}

export function ContactLeft({ formId, send, onUnfold }) {
  const { letter, result, tries, busy } = send;
  const failed = !!result && !result.ok;
  const spent = failed && tries >= MAX_TRIES;

  const sent = !!result && result.ok;

  const buttonLabel =
    busy ? 'Sending…'
    : sent ? 'Sent'
    : spent ? 'Channel closed'
    : failed ? 'Send again'
    : 'Ping me';

  const status = sendStatus(send);

  return (
    <>
      <PageHead kicker="Section 03" title="Send Word" />
      <hr className="divider" />

      <p className="body-text">
        Fill the transmission slip opposite. It reaches me directly &mdash; no
        recruiter inbox in between.
      </p>

      <button type="submit" form={formId} className="ping ping--big"
              data-sent={sent ? 'true' : undefined}
              disabled={busy || spent || sent}>
        {buttonLabel}
      </button>

      <p className="form-status"
         data-tone={result ? (result.ok ? 'ok' : 'bad') : undefined}>
        {status}
      </p>

      {failed && !spent && (
        <button type="button" className="unfold" onClick={onUnfold}>
          &#8624; Unfold the slip and edit it
        </button>
      )}

      {/* The note takes the PLACE of the standing channel list rather than
          sitting under it. Nothing scrolls, so nothing is added - it is the
          same block of paper, saying something else. */}
      <div className="push">
        {failed ? (
          <motion.aside
            className="note"
            initial={{ y: '-24%', rotate: -7.5, opacity: 0 }}
            animate={{ y: ['-24%', '2%', '0%'], rotate: [-7.5, -1.4, -2.1],
                       opacity: [0, 1, 1] }}
            transition={{ duration: F(420), times: [0, 0.66, 1],
                          ease: ['easeIn', 'easeOut'] }}
          >
            <span className="note__tape" aria-hidden="true" />
            <p className="note__t">
              The slip did not get through. These two reach me directly, and
              they do not depend on this file working.
            </p>
            <div className="note__acts">
              <a className="note__btn" href={profile.socials.linkedin}
                 target="_blank" rel="noreferrer">LinkedIn</a>
              <a className="note__btn" href={'mailto:' + profile.socials.email}>
                Email
              </a>
            </div>
          </motion.aside>
        ) : (
          <>
            <hr className="divider" />
            <span className="label" style={{ marginTop: 0 }}>Other channels</span>
            <ul className="socials">
              <li><a href={profile.socials.github} target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href={profile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href={'mailto:' + profile.socials.email}>Email</a></li>
            </ul>

            <span className="label">Resume</span>
            <a className="linkout" href={profile.resumeUrl} target="_blank" rel="noreferrer">
              &#9656; Download the PDF
            </a>
          </>
        )}
      </div>

      <div className="foot">
        <span className="file-no">
          {result ? (result.ok ? 'Received' : 'No signal') : 'Channel open'}
        </span>
      </div>
    </>
  );
}

/* ------------------------------------------------------------- THE ENVELOPE

   THE MODEL: the slip is one sheet in three panels. The bottom panel folds up
   onto the middle, the top panel folds down over both, the kraft skin
   resolves over the stack, and the stamp slams.

   Each panel is an OUTER element carrying its depth and an INNER hinge
   carrying its rotation - the same split the leaves use, and for the same
   reason. Every panel has a real verso: a face with backface-visibility
   hidden, rotated 180 degrees, simply vanishes.

   This 3D context is its own. `.page` has overflow:hidden, so it is already a
   flattening boundary and the folder's perspective never reached in here.
   `.env-stage` starts a fresh one, and - exactly as with `.stage` - it is the
   perspective root, so grouping properties are safe on it and only on it. */

const HINGE = [0.32, 0.72, 0.14, 1];

/* Sealing: lift, bottom, top, skin. Unsealing runs the other way and is about
   half as long. Going in is deliberate; coming out is a snap-back. */
const liftV = {
  slip: { z: 0, transition: { duration: F(240), delay: F(340), ease: HINGE } },
  sealed: { z: 18, transition: { duration: F(230), ease: HINGE } },
};
const panelBot = {
  slip: { rotateX: 0, transition: { duration: F(280), delay: F(300), ease: HINGE } },
  sealed: { rotateX: 180, transition: { duration: F(340), delay: F(200), ease: HINGE } },
};
const panelTop = {
  slip: { rotateX: 0, transition: { duration: F(280), delay: F(150), ease: HINGE } },
  sealed: { rotateX: -180, transition: { duration: F(340), delay: F(470), ease: HINGE } },
};
const skinV = {
  slip: { opacity: 0, scale: 1.035, transition: { duration: F(160) } },
  sealed: { opacity: 1, scale: 1,
            transition: { duration: F(300), delay: F(790), ease: HINGE } },
};
const STILL = {};

/* The counterfoil slides out from under the envelope once the skin is on.
   It is the reason the sealed page is still a composed page and not an
   object floating in blank paper - and a file that posts a slip keeps its
   copy, so it is true as well as useful. */
const stubV = {
  slip: { y: '-34%', rotate: 0, opacity: 0, transition: { duration: F(150) } },
  sealed: { y: '0%', rotate: 1.1, opacity: 1,
            transition: { duration: F(340), delay: F(1000), ease: HINGE } },
};

function LetterFace({ letter }) {
  return (
    <div className="env__sheet">
      <p className="env__slug">Transmission slip &#183; N-77-1103</p>
      <hr className="env__hr" />
      <p className="env__kv"><span>From</span>{letter.name}</p>
      <p className="env__kv"><span>Reply to</span>{letter.contact}</p>
      {letter.purpose && <p className="env__kv"><span>Purpose</span>{letter.purpose}</p>}
      <p className="env__msg">{letter.message}</p>
      <p className="env__sign">Signed and dated {letter.date}</p>
    </div>
  );
}

/* One third of the sheet. The recto is a window onto a full-height copy of
   the letter, slid up by its own share, so the three panels read as one
   continuous page and the creases fall between lines of real text. */
function Panel({ part, letter, variants, depth }) {
  return (
    <div className={'env__panel env__panel--' + part}
         style={{ transform: 'translateZ(' + depth + 'px)' }}>
      <motion.div className="env__hinge" variants={variants}>
        <div className="env__face env__face--recto">
          <div className="env__win" data-part={part}><LetterFace letter={letter} /></div>
        </div>
        <div className="env__face env__face--verso" />
      </motion.div>
    </div>
  );
}

export function Envelope({ letter, result, unfolding, folded, onFolded, onUnfolded }) {
  /* Turn a page mid-send and come back: the envelope must already be shut,
     not fold a second time. Only the first envelope made for a letter folds;
     it says so the moment it exists, so any later one is born shut. Keyed on
     the answer instead, leaving before the answer came folded it twice. */
  const bornSealed = useRef(folded).current;
  useEffect(() => { onFolded(); }, [onFolded]);
  const [sealed, setSealed] = useState(bornSealed);
  const stamped = sealed && !!result && !unfolding;

  return (
    <motion.div
      className="env-stage"
      aria-hidden="true"
      animate={stamped ? { x: [0, -3, 1.6, 0], y: [0, 3.4, -1.4, 0] } : { x: 0, y: 0 }}
      transition={stamped ? { duration: F(300), ease: 'easeOut' } : { duration: 0 }}
    >
      <motion.div
        className="env"
        variants={liftV}
        initial={bornSealed ? 'sealed' : 'slip'}
        animate={unfolding ? 'slip' : 'sealed'}
        /* Only the unfold is reported from here. The SEAL is reported by the
           skin, because the skin is the last thing to move and the stamp may
           not land on a sheet that is still folding. */
        onAnimationComplete={(v) => { if (v === 'slip') onUnfolded(); }}
      >
        <Panel part="mid" letter={letter} variants={STILL} depth={0} />
        <Panel part="bot" letter={letter} variants={panelBot} depth={1} />
        <Panel part="top" letter={letter} variants={panelTop} depth={2} />

        {/* Depth on the outer box, animation on the inner one. Motion writes
            its own transform into the inline style, so a translateZ sharing
            that element is simply erased - which put the kraft BEHIND the
            paper it is supposed to cover. */}
        <div className="env__skinbox">
          <motion.div className="env__skin" variants={skinV}
                      onAnimationComplete={(v) => { if (v === 'sealed') setSealed(true); }}>
            <span className="env__seam" aria-hidden="true" />
            {/* Where a real envelope puts them: sender small, top left;
                recipient large, lower centre; and the top right corner left
                clear, because that is where the stamp is going. */}
            <div className="env__ret">
              <span className="env__ret-k">From</span>
              <span>{letter.name}</span>
              <span className="env__ret-d">{letter.contact}</span>
            </div>
            <div className="env__addr">
              <p className="env__addr-k">To</p>
              <p className="env__addr-n">Tony.</p>
              <p className="env__addr-s">FILE NL-02-1026 &#183; eyes only</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="stub" variants={stubV}
                  initial={bornSealed ? 'sealed' : 'slip'}
                  animate={unfolding ? 'slip' : 'sealed'}>
        <span className="stub__k">Retained copy</span>
        <p className="stub__msg">{letter.message}</p>
        <span className="stub__f">Filed {letter.date} &#183; NL-02-1026</span>
      </motion.div>

      {/* Outside the fold. It stays crisp 2D type, and it cannot be lost to a
          flattening boundary or turned away by a backface. */}
      <AnimatePresence>
        {stamped && (
          <motion.span
            key={result.ok ? 'sent' : 'lost'}
            className="seal"
            data-ok={String(result.ok)}
            initial={{ scale: 2.8, rotate: -27, opacity: 0 }}
            animate={{ scale: [2.8, 0.93, 1.03, 1], rotate: [-27, -5.4, -8.8, -7.6],
                       opacity: [0, 1, 1, 1] }}
            exit={{ scale: 1.55, opacity: 0, transition: { duration: F(170) } }}
            transition={{ duration: F(420), times: [0, 0.42, 0.7, 1],
                          ease: ['easeIn', 'easeOut', 'easeOut'] }}
          >
            {result.ok ? 'Sent' : 'Lost'}
          </motion.span>
        )}
      </AnimatePresence>

      {/* While the wire is still open, the envelope is simply in transit. */}
      {sealed && !result && !unfolding && (
        <span className="env__transit" aria-hidden="true" />
      )}
    </motion.div>
  );
}

/* One rule per field, in the order they are read. A rule takes the raw value
   and returns the message, or '' when the value is good. Having them here,
   rather than inline in the submit handler, is what lets a keystroke re-ask
   the same question the submit asked. */
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

export function ContactRight({ formId, send, onSeal, onResult, onFolded, onUnfolded,
                              draft, onDraft }) {
  const [errors, setErrors] = useState({});
  const { letter, result, tries, unfolding } = send;
  const sealed = !!letter;
  const spent = !!result && !result.ok && tries >= MAX_TRIES;

  /* An error is a statement about the value as it is NOW, not about the value
     as it was when you last pressed send. So every keystroke in a field that
     is already complaining re-asks that field's own rule, and the complaint
     goes the instant it is answered. Fields with nothing to say are left
     alone: an error must never appear under a field you are still filling
     in for the first time. */
  const recheck = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const msg = RULES[name](value);
      if (msg === prev[name]) return prev;
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  };
  const edit = (e) => { onDraft(e); recheck(e); };

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const next = {};
    for (const key of Object.keys(RULES)) {
      const msg = RULES[key](form[key].value);
      if (msg) next[key] = msg;
    }
    setErrors(next);

    // Send the cursor to the first thing that is wrong. Without this a
    // screen reader user is told nothing at all - the message is only
    // reachable through the field it describes.
    const firstBad = Object.keys(RULES).find((k) => next[k]);
    if (firstBad) { form[firstBad].focus(); return; }

    /* The slip is never reset. On a failure the user retries the same words,
       and on a success the envelope is lying on top of them anyway. */
    onSeal({
      name: form.name_field.value.trim(),
      purpose: form.purpose.value.trim(),
      contact: form.contact_field.value.trim(),
      message: form.message.value.trim(),
      date: new Date().toLocaleDateString('en-GB',
        { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    });

    /* The answer may beat the fold home. It is held, not shown: the stamp
       cannot land on a sheet that is still folding, so the envelope decides
       when to print it. */
    onResult(await sendMessage(form));
  }

  return (
    <>
      <PageHead kicker="Form N-77"
                title={sealed && !unfolding ? 'Sealed' : 'Transmission Slip'} />
      <hr className="divider" />

      <div className="slipwrap">
      <form id={formId} onSubmit={handleSubmit} noValidate
            aria-hidden={sealed || undefined} inert={sealed || undefined}>
        <input type="checkbox" name="botcheck" className="hp" tabIndex={-1}
               autoComplete="off" />

        <div className="field">
          <label htmlFor="f-name">Name</label>
          <input id="f-name" name="name_field" type="text" autoComplete="name"
                 required value={draft.name_field}
                 aria-invalid={errors.name_field ? 'true' : undefined}
                 aria-describedby={errors.name_field ? 'e-name' : undefined}
                 onChange={edit} />
          <span className="err" id="e-name">{errors.name_field}</span>
        </div>

        <div className="field">
          <label htmlFor="f-purpose">
            Purpose <span className="hint">optional</span>
          </label>
          <input id="f-purpose" name="purpose" type="text"
                 autoComplete="off" enterKeyHint="next"
                 placeholder="Role, project, or question"
                 value={draft.purpose} onChange={onDraft} />
          <span className="err" />
        </div>

        <div className="field">
          <label htmlFor="f-contact">
            Your contact information{' '}
            <span className="hint" id="h-contact">an email address or a phone number</span>
          </label>
          {/* Not type="email": the field takes a phone number too, and an
              email input would reject one. inputMode still asks a phone
              keyboard for the @ key, which is the part that matters. */}
          <input id="f-contact" name="contact_field" type="text"
                 inputMode="email" autoComplete="email"
                 placeholder="Email or phone"
                 required value={draft.contact_field}
                 aria-invalid={errors.contact_field ? 'true' : undefined}
                 aria-describedby={errors.contact_field ? 'e-contact' : 'h-contact'}
                 onChange={edit} />
          <span className="err" id="e-contact">{errors.contact_field}</span>
        </div>

        <div className="field">
          <label htmlFor="f-message">
            Message <span className="hint" id="h-message">ten characters or more</span>
          </label>
          <textarea id="f-message" name="message" rows={5}
                    required minLength={10} value={draft.message}
                    aria-invalid={errors.message ? 'true' : undefined}
                    aria-describedby={errors.message ? 'e-message' : 'h-message'}
                    onChange={edit} />
          <span className="err" id="e-message">{errors.message}</span>
        </div>
      </form>

      {sealed && (
        <Envelope letter={letter} result={result} unfolding={unfolding}
                  folded={send.folded} onFolded={onFolded}
                  onUnfolded={onUnfolded} />
      )}
      </div>

      <div className="foot">
        <span className="file-no">
          {spent ? 'Three attempts logged'
            : sealed ? 'Sealed \u00b7 NL-02-1026'
            : 'Signed and dated on send'}
        </span>
      </div>
    </>
  );
}
