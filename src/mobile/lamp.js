/* The desk lamp over the drawer keeps the visitor's hours: cool daylight
   08-17, warm amber 17-22, low and orange 22-08. It lights the steel and the
   gaps between the folders, never the paper. */
const LAMPS = {
  day: { color: 'rgba(214,228,255,.34)', size: '1' },
  evening: { color: 'rgba(255,184,96,.44)', size: '.95' },
  night: { color: 'rgba(255,118,38,.38)', size: '.75' },
};

/* Set before the first render, so the first frame is already lit right. */
export function light() {
  const hour = new Date().getHours();
  const lamp = hour >= 8 && hour < 17 ? LAMPS.day : hour >= 17 && hour < 22 ? LAMPS.evening : LAMPS.night;
  const root = document.documentElement.style;
  root.setProperty('--lamp', lamp.color);
  root.setProperty('--lamp-size', lamp.size);
}
