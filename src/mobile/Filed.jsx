import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { profile } from '../profile.js';
import { play } from '../sound.js';
import { useGesture } from './gesture.js';
import { CLOSE, DROP, FLICK, SHUT } from './motion.js';
import Stamp from './Stamp.jsx';

/* The handle a link goes by, read off its URL, never typed: the LinkedIn
   name, the GitHub user. */
const handle = (url) => url.replace(/\/+$/, '').split('/').pop();

/* The message is sent and the drawer has rolled shut. The cabinet face shows
   two drawers, the route slip, and the four ways to reach him directly.
   Pulling the black slot down (or tapping it) opens the drawer again. */
export default function Filed({ h, letter, onShut, onReopen }) {
  const root = useRef(null);
  const title = useRef(null);
  const pull = useMotionValue(0);

  useEffect(() => { title.current.focus({ preventScroll: true }); }, []);

  useGesture(root, {
    reopen: {
      move: (dx, dy) => pull.set(Math.max(0, dy)),
      end: (dx, dy, vy) => (dy >= 40 || vy > FLICK ? onReopen() : animate(pull, 0, { duration: DROP })),
    },
  });

  return (
    <motion.section className="m-filed" ref={root} aria-labelledby="m-filed-title"
                    initial={{ y: h }}
                    animate={{ y: [h, 0, 3, 0] }}
                    transition={{ duration: SHUT, times: [0, 0.74, 0.87, 1], ease: ['easeIn', 'easeOut', 'easeOut'] }}
                    exit={{ y: h, transition: { duration: CLOSE, ease: 'easeIn' } }}
                    onAnimationStart={(to) => Array.isArray(to.y) && play('slam', SHUT * 0.74)}
                    onAnimationComplete={onShut}>
      <div className="m-filed__drawer">
        <div className="m-holder">
          <div className="m-label-card">
            <h2 className="m-label-card__big" id="m-filed-title" ref={title} tabIndex={-1}>{profile.name}</h2>
            <p className="m-label-card__small">{profile.title}</p>
          </div>
        </div>
      </div>

      <div className="m-filed__drawer m-filed__drawer--contact">
        <div className="m-holder">
          <div className="m-label-card">
            <p className="m-label-card__big">Contact</p>
            <p className="m-label-card__small">Message sent · {letter.date}</p>
            <Stamp kind="red" r={-8}>Filed</Stamp>
          </div>
        </div>

        <p className="m-route m-filed__route">Routed:<br />{letter.name}</p>

        <p className="m-filed__k">Reach him directly</p>
        <div className="m-filed__cards">
          <a href={profile.resumeUrl} target="_blank" rel="noopener">Resume<small>PDF · one page</small></a>
          <a href={profile.socials.linkedin} target="_blank" rel="noopener">
            LinkedIn<small>{handle(profile.socials.linkedin)}</small>
          </a>
          <a href={profile.socials.github} target="_blank" rel="noopener">
            GitHub<small>/{handle(profile.socials.github)}</small>
          </a>
          <a href={`mailto:${profile.socials.email}`}>Email<small>opens your mail app</small></a>
        </div>

        <motion.button type="button" className="m-filed__pull" data-handle="reopen"
                       style={{ y: pull }} onClick={onReopen}>
          Pull to reopen
        </motion.button>
      </div>
    </motion.section>
  );
}
