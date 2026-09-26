// The shell.
//
// THE MODEL:
//
//   A folder is ONE sheet folded at the spine. Closed, the front half lies on
//   the back half and you see one page. Open it and the front half swings LEFT
//   about the spine, so the inside of the front cover becomes the left page.
//
//   After that it behaves like a book. A leaf has two faces: its FRONT is a
//   right page and its BACK is the left page of the NEXT spread. One leaf
//   straddles two spreads, exactly like paper.
//
//   Forward  (Resume -> Work): a leaf lifts off the right, turns, and lands on
//   the left pile, delivering the new left page on its back.
//   Backward (Contact -> Resume): the leaf lying on the left lifts, turns the
//   other way, and lands back on the right, delivering the old right page on
//   its front. The left page you were reading swings away with it.
//
//   Under a leaf in the air, the LEFT half always shows its `front` and the
//   RIGHT half always shows its `back`. That one rule holds in both
//   directions, and it is why nothing ever appears from nowhere.
//
// THE BUG THAT MADE IT JANK, and why it is gone:
//
//   The turning sheet used to be a different element from the sheet resting on
//   the left. At the end of the turn one was deleted and the other was created
//   in the same commit, so React tore down and rebuilt the left page at the
//   exact moment it landed. That is the "refresh" you could see.
//
//   Now there is ONE list. The sheet you turn is pushed onto it, animates, and
//   simply STAYS. Nothing is created at the landing frame. The sheets
//   underneath are dropped in the same commit, but they are fully covered by
//   the one on top, so removing them is invisible.
//
// Depth ladder (translateZ — z-index is ignored inside preserve-3d):
//   right page 1  <  right cast shade 1.5  <  cover 10
//     <  resting sheet 14  <  left cast shade 15
//   a forward sheet runs 6 -> 16: over the right page on the way up, then
//   down onto the top of the left pile. It has to END above the left cast
//   shade, or the shadow it is throwing gets painted on top of it.
//   a backward sheet runs 14 -> 16 -> 2. It lifts off the pile and clears the
//   cover while it is over the LEFT half, then drops to just above the right
//   page before it lands, because nothing on the right side is above 2. Pinned
//   at a flat 16 it read as a decal on the way back, and the 15px it had to
//   give up when it was unmounted was a visible size pop.

import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig, motion, useMotionValue, useTransform } from 'motion/react';
import { profile } from './profile.js';
import { projects } from './projects.js';
import {
  Cover,
  ResumeLeft, ResumeRight,
  WorkLeft, WorkRight,
  ProjectLeft, ProjectRight,
  ContactLeft, ContactRight,
  sendStatus,
} from './pages.jsx';

const FORM_ID = 'send-word';
const LAST = projects.length - 1;

/* Where each spread sits in the file, front to back:
   Resume, Work, Case 01..03, Contact. A turn to a LOWER rank is a turn
   backwards, and the sheet has to travel the other way. */
const CONTACT_RANK = 2 + projects.length;
const rank = (s, i) =>
  s === 'project' ? 2 + i : { resume: 0, work: 1, contact: CONTACT_RANK }[s];

const TABS = [
  { id: 'resume', label: 'Resume' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
];

/* ------------------------------------------------------------ THE ADDRESS
   Every spread has one - #resume, #work, #contact, #case/<slug> - and a shut
   file has none. Slugs rather than numbers, so a link someone was sent still
   finds its case after the cases are reordered. null means the hash is not
   one of ours (the skip link's #file, say) and must be left alone. */
const hashOf = (open, s, i) =>
  !open ? '' : s === 'project' ? `#case/${projects[i].slug}` : `#${s}`;
function parseHash(h) {
  if (!h || h === '#') return { open: false };
  if (['#resume', '#work', '#contact'].includes(h)) return { open: true, s: h.slice(1), i: 0 };
  const m = h.match(/^#case\/(.+)$/);
  const i = m ? projects.findIndex((p) => p.slug === m[1]) : -1;
  return i >= 0 ? { open: true, s: 'project', i } : null;
}

const TITLES = { resume: 'Personnel Record', work: 'Case Index', contact: 'Send Word' };
const titleOf = (open, s, i) => !open
  ? `${profile.name} - ${profile.title}`
  : `${TITLES[s] ?? `Case ${String(i + 1).padStart(2, '0')} · ${projects[i].name}`} · ${profile.name}`;

/* Add ?slow to the URL to run every move at a sixth speed. A 820ms turn
   cannot be judged at full speed, and a screenshot cannot catch it at all. */
const SLOW = typeof location !== 'undefined' &&
             new URLSearchParams(location.search).has('slow') ? 6 : 1;

const OPEN_MS = 980 * SLOW;
const TURN_MS = 820 * SLOW;
const NUDGE_MS = 900 * SLOW;

/* .book__shadow and the faces' own shadows ride CSS transitions, so they
   cannot read these or ?slow on their own. Publish the numbers instead of
   stating them twice. */
if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--open-ms', `${OPEN_MS}ms`);
  document.documentElement.style.setProperty('--turn-ms', `${TURN_MS}ms`);
  document.documentElement.style.setProperty('--nudge-ms', `${NUDGE_MS}ms`);
}

/* ------------------------------------------------------------- THE THUMP */
const THUMP = 0.42;
const DROP_MS = 1150 * SLOW;
/* How long a shut file may sit untouched before the tabs are tugged. */
const IDLE_MS = 3500 * SLOW;

const dropKeyframes = {
  rotateX: [58, 0, -6.5, 2.2, 0],
  y: ['-46%', '0%', '-4.5%', '1.4%', '0%'],
  z: [260, 0, 34, -6, 0],
  rotateZ: [-7, 0.8, -1.4, 0.4, 0],
};

/* The fade and the defocus ride on .stage, never on the folder.
   A filter, or an opacity below 1, forces transform-style:flat on whatever
   element carries it. Anywhere between the perspective and the leaves that
   kills the perspective for the whole folder. Motion writes the LAST keyframe
   into the inline style and leaves it there, so a trailing blur(0px) is
   enough to flatten the scene permanently - which is exactly what it did.
   .stage is the perspective root itself, so grouping properties are safe on
   it and only on it. */
const arriveKeyframes = {
  opacity: [0, 1, 1, 1, 1],
  filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
};
const dropTransition = {
  duration: DROP_MS / 1000,
  delay: 0.16,
  times: [0, THUMP, 0.56, 0.74, 1],
  ease: ['easeIn', 'easeOut', 'easeIn', 'easeOut'],
};
const shadowKeyframes = {
  opacity: [0, 0.28, 1, 0.72, 1],
  scaleX: [2.9, 2.9, 1, 1.16, 1],
  scaleY: [2.9, 2.9, 1, 1.16, 1],
};
const shakeKeyframes = { y: [0, 0, 5, -2.5, 1, 0], x: [0, 0, -2, 1.5, -0.5, 0] };
const shakeTransition = {
  duration: DROP_MS / 1000,
  delay: 0.16,
  times: [0, THUMP - 0.001, THUMP + 0.03, THUMP + 0.09, THUMP + 0.16, 1],
  ease: 'easeOut',
};

/* ------------------------------------------------------- the hinge motion
   Paper is not a spring. It lifts slowly against its own weight, falls
   through the vertical fast, and lands with about four degrees of give.

   The give must tip TOWARD you, never past flat. Past flat the free edge sits
   about 43px BEHIND the sheet's own plane, and the depth ladder is only 2-6px
   wide - so the page it just landed on paints over it and the previous page
   flashes back for the last fifth of the turn. Real paper cannot rotate into
   the pile it is landing on either. */
const FWD = [0, -92, -176, -180];
const BACK = [-180, -88, -4, 0];
const hingeTime = (ms) => ({
  duration: ms / 1000,
  times: [0, 0.46, 0.88, 1],
  ease: ['easeIn', 'easeOut', 'easeOut'],
});
const NOW = { duration: 0 };

/* All of these are module constants so Motion sees an unchanged reference
   and a re-render mid-turn cannot restart the depth handoff from zero. */
const Z_TURN = { z: [6, 6, 16, 16] };
const Z_BACK = { z: [14, 16, 2, 2] };
const Z_SHUT = { z: [14, 14, 8, 8] };
/* The backward lift is over in 82ms on purpose: the sheet is still almost
   flat and hides the pile with its own body, so the one moment the depth
   change could be seen is the one moment it cannot be. */
const zTurnTime = { duration: TURN_MS / 1000, times: [0, 0.48, 0.62, 1], ease: 'linear' };
const zBackTime = { duration: TURN_MS / 1000, times: [0, 0.1, 0.64, 1], ease: 'linear' };

/* ------------------------------------------------------ light and shadow
   Every light and every shadow is a function of the hinge's own angle, read
   off the hinge on every frame. They used to run on keyframes of their own,
   on a different clock from the sheet, and matched it only where they had
   been hand-tuned - everywhere else the shadow led or lagged the paper.

   `a` is how far the sheet has lifted: 0 lying on the right, PI on the left. */
const lifted = (deg) => (-deg * Math.PI) / 180;

/* The shadow a sheet throws onto the paper UNDER it. A face's own box-shadow
   is painted in the face's plane and rotates with it, which paper does not
   do - so a turning face drops it (styles.css) and these two layers, one per
   half and anchored at the spine, do the job instead.
   Width is the sheet's footprint plus a penumbra that grows as the free edge
   rises, so on landing the shadow runs OUT with the edge, not back to the
   spine. Darkness is nil flat - the sheet hides it - and nil upright, where
   the footprint is a line, and peaks half way between. */
const PENUMBRA = 0.3;
const SHADE_PEAK = 0.8;
const shadeWidth = (deg) => {
  const a = lifted(deg);
  return Math.min(1, Math.abs(Math.cos(a)) + PENUMBRA * Math.sin(a));
};
const shadeRight = (deg) => SHADE_PEAK * Math.max(0, Math.sin(2 * lifted(deg)));
const shadeLeft = (deg) => SHADE_PEAK * Math.max(0, -Math.sin(2 * lifted(deg)));

/* Paper is matte: it darkens as it turns away from the light, it does not
   flash. The front faces you lying on the right, the back lying on the left,
   and each goes darkest edge-on - where it cannot be seen anyway. */
const DIM = 0.42;
const dimFront = (deg) => DIM * (1 - Math.cos(lifted(deg)));
const dimBack = (deg) => DIM * (1 + Math.cos(lifted(deg)));

let seq = 0;

export default function App() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('resume');
  const [index, setIndex] = useState(0);
  /* THE SEND, in one object because both halves of the contact spread read
     it. `letter` is what was typed and is what the envelope is made of, so a
     non-null letter IS a sealed envelope. `tries` counts answered sends and
     never resets on a page turn - three is three for the visit. `folded`
     says an envelope has already been shown folding for this letter. */
  const [send, setSend] = useState({
    letter: null, result: null, tries: 0, busy: false, unfolding: false,
    folded: false,
  });

  /* What is typed on the slip. It lives here and not in the form because the
     form unmounts whenever you turn away from Contact. */
  const [draft, setDraft] = useState({
    name_field: '', purpose: '', contact_field: '', message: '',
  });
  const onDraft = useCallback((e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  }, []);

  const onSeal = useCallback((letter) => {
    setSend((s) => ({ ...s, letter, result: null, busy: true, unfolding: false,
                      folded: false }));
  }, []);
  const onFolded = useCallback(() => {
    setSend((s) => (s.folded ? s : { ...s, folded: true }));
  }, []);
  const onResult = useCallback((result) => {
    setSend((s) => ({ ...s, result, busy: false, tries: s.tries + 1 }));
  }, []);
  const onUnfold = useCallback(() => {
    setSend((s) => ({ ...s, unfolding: true }));
  }, []);
  const onUnfolded = useCallback(() => {
    setSend((s) => (s.unfolding
      ? { ...s, letter: null, result: null, unfolding: false }
      : s));
  }, []);

  /* Sheets lying on the left, oldest first. The last one is what you read.
     A sheet is `{ key, front, back, entering }` — front is the page it was,
     back is the page it delivered. */
  const [left, setLeft] = useState([]);
  const [cover, setCover] = useState(null);   // 'fwd' | 'back' | null

  const rightRef = useRef(null);
  const wasOpen = useRef(false);

  /* Nothing says the tabs open the file, and a first visitor clicks the
     cover. The cover stays shut - the bookmarks are the navigation - but the
     tabs are tugged once when it has sat idle, and again whenever the cover
     is clicked. Once the file has been opened the hint is never needed. */
  const [nudge, setNudge] = useState(false);

  /* Mobile is not built yet (rule 10). A touch-first screen gets told so,
     plainly, before the file drops. It can still go on. */
  const [phone, setPhone] = useState(() =>
    matchMedia('(hover: none) and (pointer: coarse)').matches);
  const foundTabs = useRef(false);
  const nudgeTabs = useCallback(() => {
    setNudge(true);
    setTimeout(() => setNudge(false), NUDGE_MS * 1.3);   // last tab starts at .24
  }, []);
  useEffect(() => {
    if (open) { foundTabs.current = true; return; }
    if (foundTabs.current) return;
    const id = setTimeout(nudgeTabs, 160 + DROP_MS + IDLE_MS);
    return () => clearTimeout(id);
  }, [open, nudgeTabs]);

  /* The angle of whichever sheet is in the air, and of the cover. Two turns
     never overlap, so one value serves every sheet. */
  const turn = useMotionValue(0);
  const coverTurn = useMotionValue(0);
  const shadeL = useTransform(turn, shadeLeft);
  const shadeR = useTransform(turn, shadeRight);
  const shadeW = useTransform(turn, shadeWidth);
  const sheetDimF = useTransform(turn, dimFront);
  const sheetDimB = useTransform(turn, dimBack);
  const coverDimF = useTransform(coverTurn, dimFront);
  const coverDimB = useTransform(coverTurn, dimBack);

  const moving = cover !== null || left.some((s) => s.entering);

  /* An address the file has been asked to reach but has not yet - the one it
     was opened with, or one Back or Forward moved to. It waits for the drop
     to land and for any turn in progress to finish; it is cleared the moment
     any turn starts, so a click made while it waits wins. */
  const [landed, setLanded] = useState(false);
  const [pending, setPending] = useState(() => {
    const r = parseHash(location.hash);
    return r && r.open ? r : null;
  });
  const shown = useRef('');   // the address the file was last put at

  /* ------------------------------------------- when a move is over

     A move is over when MOTION says it is over, never when a timer guesses.
     The old code started a setTimeout inside the click handler, but Motion
     does not start until the next frame after React has committed - and that
     commit mounts two whole page subtrees, so it is not cheap. The timer won
     the race and snapped the hinge before it had finished.

     Both handlers hang off onAnimationComplete on the hinge doing the work,
     and both must survive being called twice: settling a move sets a new
     target with a zero-length transition, and that fires the callback again. */

  const land = useCallback(() => {
    setLeft((prev) => {
      const top = prev[prev.length - 1];
      if (!top || !top.entering) return prev;
      // Backwards: the sheet now lies on the RIGHT, and the right half is
      // already drawing that same page underneath it, so dropping it is
      // invisible. The cover's back becomes the left page again.
      if (top.dir === 'back') return [];
      // Forwards: stop the animation and drop everything it covers. The
      // sheet itself is NEVER unmounted, which is what removes the flash.
      return [{ ...top, entering: false }];
    });
  }, []);

  const settleCover = useCallback(() => {
    if (!cover) return;
    if (cover === 'back') setLeft([]);   // the papers went back inside
    setCover(null);
  }, [cover]);

  /* ------------------------------------------------------------ actions */

  const openTo = useCallback((next, i = 0) => {
    if (moving) return;                                 // one turn at a time
    setPending(null);
    if (!open) {
      setSection(next); setIndex(i);
      setLeft([]);                       // the cover's own back is the left page
      setCover('fwd');
      setOpen(true);                     // settleCover finishes the job
      return;
    }
    if (next === section && i === index) return;

    const backwards = rank(next, i) < rank(section, index);
    setSection(next); setIndex(i);

    if (backwards) {
      // Send the sheet already lying on the left back to the right. Reuse it
      // rather than build one: it is already on screen and its back is the
      // page you are leaving. Only its front changes, and the front is turned
      // away at this moment, so the swap cannot be seen.
      setLeft((prev) => {
        const top = prev[prev.length - 1];
        return [top
          ? { ...top, front: { s: next, i }, entering: true, dir: 'back' }
          : { key: ++seq, front: { s: next, i },
              back: { s: section, i: index }, entering: true, dir: 'back' }];
      });
    } else {
      setLeft((prev) => [...prev, {
        key: ++seq,
        front: { s: section, i: index },   // the page you are leaving
        back: { s: next, i },              // the page it delivers to the left
        entering: true,
        dir: 'fwd',
      }]);
    }
    // land(), on the hinge's own onAnimationComplete, closes the turn out
  }, [open, section, index, moving]);

  const closeFile = useCallback(() => {
    if (!open || moving) return;
    setPending(null);
    setCover('back');
    setOpen(false);                      // settleCover finishes the job
  }, [open, moving]);

  const step = useCallback((delta) => {
    const n = index + delta;
    if (n < 0 || n > LAST) openTo('work');
    else openTo('project', n);
  }, [index, openTo]);

  useEffect(() => {
    const onKey = (e) => {
      /* Escape is how you dismiss autofill or an IME, and arrows move the
         caret. Neither may shut the file or turn a page under you. */
      if (e.isComposing ||
          e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'Escape') closeFile();
      if (open && section === 'project') {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, section, step, closeFile]);

  useEffect(() => {
    const onPop = () => {
      const r = parseHash(location.hash);
      if (r) setPending(r);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!pending || !landed || moving) return;
    if (!pending.open) {
      if (open) closeFile(); else setPending(null);
    } else if (open && pending.s === section && pending.i === index) {
      setPending(null);
    } else {
      openTo(pending.s, pending.i);
    }
  }, [pending, landed, moving, open, section, index, openTo, closeFile]);

  /* Every turn the reader makes is a step in the browser's history, so Back
     turns the page back. A turn made to REACH an address changes nothing:
     the address bar already says it. */
  useEffect(() => {
    document.title = titleOf(open, section, index);
    const h = hashOf(open, section, index);
    if (pending || h === shown.current) return;
    shown.current = h;
    if (h !== location.hash) history.pushState(null, '', h || location.pathname + location.search);
  }, [open, section, index, pending]);

  /* This effect also runs on every turn, and a turn is TURN_MS, not OPEN_MS.
     Only the cover swing off a shut file costs OPEN_MS. */
  useEffect(() => {
    const delay = !open ? 0 : wasOpen.current ? TURN_MS : OPEN_MS;
    wasOpen.current = open;
    const id = setTimeout(
      () => rightRef.current?.focus({ preventScroll: true }),
      delay
    );
    return () => clearTimeout(id);
  }, [open, section, index]);

  /* ------------------------------------------------------------ content */

  const leftOf = (s, i) => {
    if (s === 'resume') return <ResumeLeft />;
    if (s === 'work') return <WorkLeft />;
    if (s === 'project') return <ProjectLeft index={i} />;
    if (s === 'contact')
      return <ContactLeft formId={FORM_ID} send={send} onUnfold={onUnfold} />;
    return null;
  };

  const rightOf = (s, i) => {
    if (s === 'resume') return <ResumeRight />;
    if (s === 'work') return <WorkRight onOpen={(n) => openTo('project', n)} />;
    if (s === 'project') return <ProjectRight index={i} onStep={step} />;
    if (s === 'contact') {
      return (
        <ContactRight formId={FORM_ID} send={send} onSeal={onSeal}
                      onResult={onResult} onFolded={onFolded}
                      onUnfolded={onUnfolded} draft={draft} onDraft={onDraft} />
      );
    }
    return null;
  };

  const pageLabel = open
    ? (section === 'project'
        ? `Case ${index + 1} of ${projects.length}: ${projects[index]?.name}.`
        : { resume: 'Personnel record.', work: 'Case index.',
            contact: 'Send word.' }[section])
    : `Closed file. ${profile.name}, ${profile.title}.`;
  const label = (section === 'contact' && sendStatus(send)) || pageLabel;

  const closing = cover === 'back';

  /* While a sheet is in the air the cover's back must keep showing the page
     you are LEAVING. Otherwise, on the first turn after opening (when the
     cover's back IS the left page), the new left page appears before the
     sheet has delivered it. */
  const inAir = left.find((sh) => sh.entering);
  const coverBack = inAir ? inAir.front : { s: section, i: index };

  /* ...and the right half must keep showing the page the sheet carries away on
     its back. Going backwards that is the page you are LEAVING, so without
     this the destination would pop onto the right on the first frame, before
     the sheet had turned at all. */
  const rightUnder = inAir ? inAir.back : { s: section, i: index };

  /* The CSS media query only reaches CSS transitions; every move here is
     Motion. Under reduced motion Motion jumps transforms to their last frame
     and still reports completion, so land() and settleCover() still run. */
  return (
    <MotionConfig reducedMotion="user">
      {phone && (
        <div className="mobile-note" role="alertdialog" aria-modal="true"
             aria-labelledby="mobile-note-text">
          <div className="mobile-note__slip">
            <p id="mobile-note-text">
              This site is not optimized for mobile devices.
              Please open it on a desktop.
            </p>
            <button type="button" onClick={() => setPhone(false)} autoFocus>
              Open anyway
            </button>
          </div>
        </div>
      )}
      <a className="skip" href="#file">Skip to the file</a>

      <div className="backdrop" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <motion.main className="stage"
                   animate={arriveKeyframes} transition={dropTransition}>
        <motion.div className="shaker" animate={shakeKeyframes} transition={shakeTransition}>
          <motion.div
            className="book"
            id="file"
            data-open={String(open)}
            animate={dropKeyframes}
            transition={dropTransition}
            onAnimationComplete={() => setLanded(true)}
          >
            <motion.div
              className="book__slide"
              animate={{ x: open ? '0%' : '-25%' }}
              transition={{ duration: OPEN_MS / 1000, ease: [0.32, 0.72, 0.14, 1] }}
            >
              <motion.div className="book__shadow" aria-hidden="true"
                          animate={shadowKeyframes} transition={dropTransition} />

              {/* There is NO left board. Until the cover lands there, the left
                  half is genuinely empty — that is what opening a folder looks
                  like. A board faded in here was the dark panel that appeared
                  before the cover had even started to move. */}
              <div className="interior interior--right" aria-hidden="true" />

              {/* ------------------------------------------- the right page */}
              <div className="half half--right">
                <section
                  className="page page--right"
                  ref={rightRef}
                  tabIndex={-1}
                  aria-label={label}
                  aria-hidden={!open}
                  inert={!open}
                >
                  {rightOf(rightUnder.s, rightUnder.i)}
                </section>
              </div>

              <div className="gutter" aria-hidden="true" />
              <div className="spine" aria-hidden="true" />

              {/* Both of these carry an opacity below 1, which forces
                  transform-style:flat on them. That is safe HERE and only
                  here: they are leaves of the 3D tree, nothing hangs under
                  them. Never make one the parent of a leaf. They cover a
                  whole half each, so pointer-events:none is not optional.
                  Always mounted and nil at rest, so the first frame of a
                  turn - the one the eye is on - creates nothing. */}
              <motion.div className="castshade castshade--left" aria-hidden="true"
                          style={{ z: 15, opacity: shadeL, scaleX: shadeW }} />
              <motion.div className="castshade castshade--right" aria-hidden="true"
                          style={{ z: 1.5, opacity: shadeR, scaleX: shadeW }} />


              {/* --------------------------------------- the sheets on the left
                  One list. A sheet is pushed on, animates, and stays put. */}
              {left.map((sh, i) => {
                const top = i === left.length - 1;
                /* Shutting: the paper rides back with the cover, and it has to
                   end up UNDER it. The cover face it was resting on points up
                   while the file is open and points down once the cover has
                   turned, so what sat on top ends up sandwiched underneath.
                   It must drop through the cover's depth of 10 BEFORE the pair
                   reach vertical at 0.46 - hence z is already 8 by 0.45. Leave
                   it late and the paper's front face swings into view on top
                   of the cover, and you watch the file shut onto the last
                   right page instead of onto the cover. */
                const shut = closing && top;
                const rev = sh.dir === 'back';      // travelling left -> right
                /* A shutting sheet rides the cover's own keyframes, so the
                   cover's angle is its angle too. */
                const lit = sh.entering || shut;
                const dimF = shut ? coverDimF : sheetDimF;
                const dimB = shut ? coverDimB : sheetDimB;
                return (
                  <motion.div
                    key={sh.key}
                    className={'leaf leaf--rest' + (sh.entering ? ' leaf--turn' : '')}
                    initial={{ z: sh.entering && !rev ? 6 : 14 }}
                    animate={
                      shut ? Z_SHUT
                      : sh.entering ? (rev ? Z_BACK : Z_TURN)
                      : { z: 14 }
                    }
                    transition={
                      shut ? { duration: OPEN_MS / 1000,
                               times: [0, 0.4, 0.45, 1], ease: 'linear' }
                      : sh.entering ? (rev ? zBackTime : zTurnTime)
                      : NOW
                    }
                  >
                    <motion.div
                      className="leaf__hinge"
                      initial={{ rotateY: sh.entering && !rev ? 0 : -180 }}
                      animate={{ rotateY: shut ? BACK
                                        : sh.entering ? (rev ? BACK : FWD) : -180 }}
                      transition={shut ? hingeTime(OPEN_MS)
                                       : sh.entering ? hingeTime(TURN_MS) : NOW}
                      onUpdate={(v) => { if (sh.entering) turn.set(v.rotateY); }}
                      onAnimationComplete={() => { if (sh.entering) land(); }}
                    >
                      <div className="leaf__face leaf__face--front page page--right"
                           aria-hidden="true" inert>
                        {rightOf(sh.front.s, sh.front.i)}
                        {lit && <motion.span className="dim" style={{ opacity: dimF }} />}
                      </div>
                      <div className="leaf__face leaf__face--back page page--left"
                           aria-hidden={!(top && open)}
                           inert={!(top && open)}>
                        {leftOf(sh.back.s, sh.back.i)}
                        {lit && <motion.span className="dim" style={{ opacity: dimB }} />}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* --------------------------------- the cover, always mounted
                  Its back face is the left page until a sheet lands on it. */}
              <div className="leaf leaf--cover">
                <motion.div
                  className="leaf__hinge"
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: cover ? (cover === 'fwd' ? FWD : BACK) : (open ? -180 : 0),
                  }}
                  transition={cover ? hingeTime(OPEN_MS) : NOW}
                  onUpdate={(v) => coverTurn.set(v.rotateY)}
                  onAnimationComplete={settleCover}
                >
                  {/* The cover carries no open button. It used to, stretched
                      over the whole face, and it swallowed every click and
                      hover meant for the redaction bar: z-index cannot lift
                      the photo over it, because the leaf above is
                      preserve-3d and z-index is ignored in there. The
                      bookmarks are the navigation - rule 3 - so opening the
                      file was never this button's job. */}
                  <div className="leaf__face leaf__face--front page page--cover"
                       aria-hidden={open}
                       inert={open}
                       onClick={nudgeTabs}>
                    <Cover />
                    <motion.span className="dim" style={{ opacity: coverDimF }} />
                  </div>

                  <div className="leaf__face leaf__face--back page page--left"
                       aria-hidden={left.length > 0 || !open}
                       inert={left.length > 0 || !open}>
                    {leftOf(coverBack.s, coverBack.i)}
                    <motion.span className="dim" style={{ opacity: coverDimB }} />
                  </div>
                </motion.div>
              </div>

              {/* ------------------------------------------- the bookmarks */}
              <nav className="tabs" aria-label="Sections"
                   data-nudge={nudge && !open ? 'true' : undefined}>
                {TABS.map((t) => {
                  const current = open && (t.id === section ||
                    (t.id === 'work' && section === 'project'));
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="tab"
                      aria-current={current ? 'page' : undefined}
                      onClick={() => openTo(t.id)}
                    >
                      <span className="tab__label">{t.label}</span>
                    </button>
                  );
                })}
                {open && (
                  <button type="button" className="tab tab--close" onClick={closeFile}>
                    <span className="tab__label">Close</span>
                  </button>
                )}
              </nav>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.main>

      <p className="vh" role="status" aria-live="polite">{label}</p>
    </MotionConfig>
  );
}
