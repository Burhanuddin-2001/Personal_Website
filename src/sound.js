/* SOUND - one module, one flag. Off unless the visitor
   turns it on; the choice is remembered. Removing sound is deleting this
   file and its play() call sites.

   Nothing is built until a tap. Browsers only let a gesture start audio,
   so the AudioContext is made inside the first tap that can use it. Every
   sound is synthesised here - filtered noise and short pitched thumps - so
   there are no files to load and nothing to license. */
import { load, save } from './storage.js';

let on = load('dossier.sound', 'off') === 'on';
let ctx = null;
let noise = null;

export const isOn = () => on;

function wake() {
  if (!on) return;
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

/* A remembered "on" still waits for a touch. pointerup, not pointerdown:
   for a finger, only the lift counts as a gesture. */
if (on) {
  const first = () => {
    wake();
    for (const k of ['pointerup', 'keydown']) removeEventListener(k, first, true);
  };
  for (const k of ['pointerup', 'keydown']) addEventListener(k, first, true);
}

export function setOn(next) {
  on = next;
  save('dossier.sound', on ? 'on' : 'off');
  wake();   // called from the SOUND button's own tap
}

/* A burst of filtered noise: paper, steel, a click. */
function burst(at, { dur, type = 'bandpass', freq, q = 1, gain }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.012, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(at, Math.random() * 0.5, dur);
}

/* A short falling tone: the body of a thump. */
function thud(at, { from, to, dur, gain }) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(from, at);
  o.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + dur);
}

const SOUNDS = {
  lamp: (t) => {
    burst(t, { dur: 0.018, type: 'highpass', freq: 2500, gain: 0.5 });
    thud(t, { from: 2200, to: 900, dur: 0.012, gain: 0.08 });
  },
  rattle: (t) => {
    for (let i = 0; i < 5; i++) {
      burst(t + i * 0.06 + Math.random() * 0.02, { dur: 0.03, freq: 3200 + i * 300, q: 6, gain: 0.12 });
    }
  },
  scrape: (t) => burst(t, { dur: 0.28, freq: 1400, q: 0.8, gain: 0.1 }),
  thump: (t) => {
    thud(t, { from: 120, to: 48, dur: 0.14, gain: 0.5 });
    burst(t, { dur: 0.06, type: 'lowpass', freq: 600, gain: 0.25 });
  },
  stamp: (t) => {
    burst(t, { dur: 0.05, type: 'lowpass', freq: 1200, gain: 0.6 });
    thud(t, { from: 190, to: 60, dur: 0.09, gain: 0.45 });
  },
  slam: (t) => {
    thud(t, { from: 90, to: 32, dur: 0.32, gain: 0.7 });
    burst(t, { dur: 0.12, type: 'lowpass', freq: 800, gain: 0.5 });
    SOUNDS.rattle(t + 0.05);
  },
};

/* play('stamp'), or play('stamp', 0.18) to land it 0.18 s from now. */
export function play(name, delay = 0) {
  if (!on || !ctx) return;
  SOUNDS[name](ctx.currentTime + delay);
}
