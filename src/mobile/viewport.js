import { useEffect, useState } from 'react';

/* The frame is sized from the VISUAL viewport, never from vh. On a phone, vh
   ignores the browser bars and the keyboard, so a frame built on it hangs off
   the bottom of the screen and the page scrolls. --vvh and --vvt carry the
   real box to the CSS. */
let tallest = 0;
let turned = null;

function read() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : innerHeight;
  // The screen, not the viewport: an Android keyboard makes the viewport
  // wider than it is tall without the phone being turned.
  const landscape = screen.orientation
    ? screen.orientation.type.startsWith('landscape')
    : matchMedia('(orientation: landscape)').matches;
  // The keyboard is up when the frame is far shorter than it has been. Not
  // innerHeight: with interactive-widget=resizes-content, Android shrinks it
  // with the keyboard. The browser bars move less than 120 px.
  if (landscape !== turned) { turned = landscape; tallest = 0; }
  tallest = Math.max(tallest, h);
  return {
    keyboard: tallest - h > 120,
    w: Math.round(vv ? vv.width : innerWidth),
    h: Math.round(h),
    top: Math.round(vv ? vv.offsetTop : 0),
    landscape,
  };
}

export function useViewport() {
  const [v, setV] = useState(read);

  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement.style;
    const update = () => {
      const n = read();
      root.setProperty('--vvh', `${n.h}px`);
      root.setProperty('--vvt', `${n.top}px`);
      setV((o) => (o.w === n.w && o.h === n.h && o.top === n.top &&
                   o.landscape === n.landscape && o.keyboard === n.keyboard ? o : n));
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    screen.orientation?.addEventListener('change', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      screen.orientation?.removeEventListener('change', update);
    };
  }, []);

  return v;
}
