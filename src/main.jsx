import React from 'react';
import { createRoot } from 'react-dom/client';
import './base.css';

/* Phones get the drawer, everything else gets the dossier. Decided once, at
   load: a rotate or a resize must never swap apps under the reader. Each app
   is its own chunk, so neither downloads the other. ?m=phone or ?m=desk
   overrides the rule for testing. */
const m = new URLSearchParams(location.search).get('m');
const phone = m === 'phone' || (m !== 'desk' &&
  matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 600);

(phone ? import('./mobile/Mobile.jsx') : import('./App.jsx')).then(({ default: App }) => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
