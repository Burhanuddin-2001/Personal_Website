import { profile } from '../profile.js';
import { projects } from '../projects.js';

/* The five folders, in reading order: the peek row's order. The drawer hangs
   them the other way round, Resume at the front. */
export const FOLDERS = [
  { id: 'resume', tab: 'Resume', peek: 'Resume', paper: 'record' },
  ...projects.map((p, i) => ({
    id: `case-${i + 1}`,
    tab: `Case 0${i + 1} · ${p.tab}`,
    peek: p.peek,
    paper: 'ledger',
  })),
  { id: 'contact', tab: 'Contact', peek: 'Contact', paper: 'carbon' },
];

/* Every folder has its own address, so a shared link opens that sheet.
   The desktop's own forms are understood too: a link copied on a laptop
   still lands on the right folder on a phone. Returns null for the drawer. */
export function parseHash(h) {
  const id = h.slice(1);
  if (FOLDERS.some((f) => f.id === id)) return id;
  const m = h.match(/^#case\/(.+)$/);
  const i = m ? projects.findIndex((p) => p.slug === m[1]) : -1;
  return i >= 0 ? `case-${i + 1}` : null;
}

/* The same titles the desktop gives its spreads. */
export function titleOf(id) {
  if (!id) return `${profile.name} - ${profile.title}`;
  if (id === 'resume') return `Personnel Record · ${profile.name}`;
  if (id === 'contact') return `Send Word · ${profile.name}`;
  const n = Number(id.slice(5));
  return `Case ${String(n).padStart(2, '0')} · ${projects[n - 1].name} · ${profile.name}`;
}
