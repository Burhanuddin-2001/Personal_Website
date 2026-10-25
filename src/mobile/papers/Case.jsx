import { projects } from '../../projects.js';
import Stamp from '../Stamp.jsx';

/* A case, on ledger paper. The tagline comes first and the architecture
   last, with its label. The copy is the phone's shorter form of the same
   facts (projects[i].short). */
export default function Case({ n }) {
  const p = projects[n - 1];
  const no = (k) => String(k).padStart(2, '0');

  return (
    <div className="m-paper">
      <header className="m-head">
        <h2 className="m-sheet__title" id={`title-case-${n}`} tabIndex={-1}>
          Case {no(n)} of {no(projects.length)}
        </h2>
        <Stamp kind="red" r={3} still>{p.status}</Stamp>
      </header>

      <h3 className="m-case__name">{p.name}</h3>
      <p className="m-case__tech">{p.tech.join(' · ')}</p>
      <p className="m-case__line m-body">{p.tagline}</p>

      <p className="m-label">The problem</p>
      <p className="m-body">{p.short.problem}</p>

      <p className="m-label">What I built</p>
      <ul className="m-case__built m-body">
        {p.short.built.map((b) => <li key={b}>{b}</li>)}
      </ul>

      <p className="m-case__arch">
        <span className="m-label">Architecture</span>{' '}
        <span className="m-body">{p.short.architecture}</span>
      </p>

      <div className="m-acts">
        <a className="m-btn m-btn--main" href={p.links.github} target="_blank" rel="noopener">
          View the source
          <small>GitHub · new tab</small>
        </a>
      </div>
    </div>
  );
}
