import { useEffect, useRef, useState } from 'react';
import { profile } from '../profile.js';
import { load, save } from '../storage.js';
import { isOn, play, setOn } from '../sound.js';

/* The visitor's own date: the file was received today, wherever they are. */
const TODAY = new Date()
  .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();

/* A visitor who has been here before finds the file RE-OPENED, not
   RECEIVED. Read and written once, at load. */
const BACK = load('dossier.m.seen', null) !== null;
save('dossier.m.seen', new Date().toISOString().slice(0, 10));

/* The steel face of the cabinet: a brass holder with the typed index card,
   then the SOUND button and the hint. The claim appears here and nowhere
   else on the phone. */
export default function Cabinet({ hint, stampRef, arriving }) {
  const [sound, setSound] = useState(isOn);
  const [note, setNote] = useState(false);
  const told = useRef(false);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(false), 4000);
    return () => clearTimeout(t);
  }, [note]);

  const toggle = () => {
    setOn(!sound);
    setSound(!sound);
    if (sound) return;
    play('lamp');
    if (!told.current) { told.current = true; setNote(true); }
  };

  return (
    <>
      <div className="m-holder">
        <div className="m-card">
          <p className="m-card__top">
            <span className="m-card__status"><span aria-hidden="true">● </span>{profile.status}</span>
            <span>File {profile.fileNo}</span>
          </p>
          <h1 className="m-card__name">{profile.name}</h1>
          <p className="m-card__role">{profile.title}</p>
          <p className="m-card__claim m-body">{profile.intro}</p>
          <p className="m-stamp m-received" ref={stampRef} aria-hidden="true"
             style={arriving ? { opacity: 0 } : undefined}>
            {BACK ? 'Re-opened' : 'Received'} {TODAY}
          </p>
        </div>
      </div>
      <div className="m-plate__row">
        <button type="button" className="m-sound" aria-pressed={sound} onClick={toggle}>
          <span className="m-sound__lamp" aria-hidden="true" />Sound {sound ? 'on' : 'off'}
        </button>
        {/* The first time it is turned on, it says why an iPhone may stay silent. */}
        <p className="m-hint" aria-live="polite">{note ? 'Silent switch on? iPhones stay quiet.' : hint}</p>
      </div>
    </>
  );
}
