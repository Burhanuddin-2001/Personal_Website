import { useEffect, useReducer } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { load, save } from '../storage.js';
import { sendMessage } from '../submit.js';
import { profile } from '../profile.js';
import { useViewport } from './viewport.js';
import { parseHash, titleOf } from './routes.js';
import { light } from './lamp.js';
import Drawer from './Drawer.jsx';
import Filed from './Filed.jsx';
import Resume from './papers/Resume.jsx';
import Case from './papers/Case.jsx';
import Contact from './papers/Contact.jsx';
import './mobile.css';
import './papers.css';

/* THE DRAWER - the phone version of the dossier. */

/* The lamp's warmth is set here, not in main.jsx: main.jsx stays free of
   phone code, so the desktop never fetches a phone file. Still before the
   first render. */
light();

/* Marks a history entry this page pushed, so closing a folder can step
   Back onto the drawer instead of leaving the site. */
const OURS = { drawer: true };
const ROOT = () => location.pathname + location.search;

/* A deep link opens its folder with no arrival. The address goes to the
   root first and the folder is pushed on top, so Back lands on the drawer.
   Done once at load - an effect would run twice under StrictMode. */
const START = parseHash(location.hash);
if (START) {
  history.replaceState(null, '', ROOT());
  history.pushState(OURS, '', `#${START}`);
}

const BLANK = { name: '', contact: '', message: '' };

/* Failed sends outlive a reload, but not an hour: a bad signal must not
   lock a visitor out for good. */
const HOUR = 60 * 60 * 1000;
function triesSoFar() {
  const t = load('dossier.m.tries', null);
  return t && Date.now() - t.at < HOUR ? t.n : 0;
}

/* send.status: idle, busy (in the post), sent, lost. send.letter is the slip
   as it was sent; while it is set, the slip is an envelope. filed holds the
   letter once the drawer has rolled shut on it. */
function reduce(s, a) {
  switch (a.type) {
    case 'open':
      if (!a.id || s.opened.includes(a.id)) return { ...s, folder: a.id };
      return { ...s, folder: a.id, opened: [...s.opened, a.id] };
    case 'draft':
      return { ...s, draft: { ...s.draft, [a.key]: a.value } };
    case 'interview':
      // An editable draft, never over words already typed.
      return s.draft.message.trim() ? s : { ...s, draft: { ...s.draft, message: profile.interviewDraft } };
    case 'seal':
      return { ...s, send: { ...s.send, status: 'busy', letter: a.letter } };
    case 'answer':
      return { ...s, send: { ...s.send, status: a.ok ? 'sent' : 'lost', tries: a.ok ? 0 : s.send.tries + 1 } };
    case 'unfolded':
      return { ...s, send: { ...s.send, letter: null } };
    case 'filed':
      return { ...s, filed: s.send.letter, draft: BLANK };
    case 'reopen':
      return { ...s, filed: null, send: { status: 'idle', tries: 0, letter: null } };
  }
}

export default function Mobile() {
  const { w, h, landscape, keyboard } = useViewport();
  const [s, go] = useReducer(reduce, null, () => reduce({
    folder: null,
    opened: load('dossier.m.opened', [], 'session'),
    draft: load('dossier.m.draft', BLANK, 'session'),
    send: { status: 'idle', tries: triesSoFar(), letter: null },
    filed: null,
  }, { type: 'open', id: START }));

  useEffect(() => save('dossier.m.opened', s.opened, 'session'), [s.opened]);
  useEffect(() => save('dossier.m.draft', s.draft, 'session'), [s.draft]);
  useEffect(() => { document.title = titleOf(s.folder); }, [s.folder]);

  useEffect(() => {
    const onPop = () => go({ type: 'open', id: parseHash(location.hash) });
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  /* From the drawer, a folder is a step in history: Back puts it away.
     From one folder to another it is not, so Back always reaches the drawer. */
  const open = (id, swap) => {
    history[swap ? 'replaceState' : 'pushState'](OURS, '', `#${id}`);
    go({ type: 'open', id });
  };
  const close = () => {
    if (history.state?.drawer) return history.back();   // popstate closes it
    history.replaceState(null, '', ROOT());
    go({ type: 'open', id: null });
  };

  useEffect(() => {
    if (!s.folder) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [s.folder]);

  const ping = async (form, letter) => {
    go({ type: 'seal', letter });
    const { ok } = await sendMessage(form);
    go({ type: 'answer', ok });
    // Stamped here, once per try: an effect would restart the hour at every load.
    save('dossier.m.tries', { n: ok ? 0 : s.send.tries + 1, at: Date.now() });
    if (ok) save('dossier.m.routed', letter.name);
  };

  const paper = (id) => {
    if (id === 'resume') {
      return <Resume onInterview={() => { go({ type: 'interview' }); open('contact', true); }} />;
    }
    if (id === 'contact') {
      return (
        <Contact draft={s.draft} send={s.send} keyboard={keyboard} h={h}
                 onDraft={(key, value) => go({ type: 'draft', key, value })} onPing={ping}
                 onUnfolded={() => go({ type: 'unfolded' })} onSent={() => go({ type: 'filed' })} />
      );
    }
    return <Case n={Number(id.slice(5))} />;
  };

  const { status, letter } = s.send;
  return (
    <MotionConfig reducedMotion="user">
      <div className="m-shell">
        <Drawer w={w} h={h} keyboard={keyboard} folder={s.folder} opened={s.opened}
                filing={!!letter && status !== 'lost'} inert={!!s.filed} paper={paper}
                onOpen={open} onClose={close} />
        <AnimatePresence>
          {/* The folder is put away behind the shut drawer, once it is shut. */}
          {s.filed && <Filed key="filed" h={h} letter={s.filed}
                             onShut={close} onReopen={() => go({ type: 'reopen' })} />}
        </AnimatePresence>
        {/* The one live region for the send. */}
        <p className="m-said" aria-live="polite">
          {s.filed ? 'Filed.' : status === 'sent' ? 'Sent.' : status === 'lost' ? 'Lost. Your words are kept.' : ''}
        </p>
        {/* The drawer is a portrait object; no layout is built for landscape. */}
        {landscape && (
          <div className="m-turn" role="alert">
            <p className="m-turn__slip">Turn the phone upright</p>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
