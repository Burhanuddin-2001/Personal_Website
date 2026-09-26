import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { profile } from './src/profile.js';
import { projects } from './src/projects.js';

const SITE = 'https://burhanuddin2001.me/';

/* Most of the file is only mounted when a page is turned to, so a crawler
   reading the first render sees the cover and the personnel record and
   nothing else. This states who the subject is and what is on file, in the
   head, where nobody sees it - written from the same data the pages use, so
   a case added to projects.js lands here without being written twice. */
function jsonLd() {
  const graph = [
    { '@type': 'WebSite', '@id': SITE + '#site', url: SITE, name: profile.name },
    {
      '@type': 'Person', '@id': SITE + '#person', url: SITE,
      name: profile.name, jobTitle: profile.title, description: profile.intro,
      sameAs: [profile.socials.github, profile.socials.linkedin],
      knowsAbout: profile.field,
    },
    ...projects.map((p) => ({
      '@type': 'SoftwareSourceCode',
      name: p.name, description: p.tagline, keywords: p.tech.join(', '),
      codeRepository: p.links.github, author: { '@id': SITE + '#person' },
    })),
  ];
  // `<` escaped so no string in the data can close the script tag early.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\u003c');
  return {
    name: 'dossier-json-ld',
    transformIndexHtml: () => [
      { tag: 'script', attrs: { type: 'application/ld+json' }, children: json, injectTo: 'head' },
    ],
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), jsonLd()],
  server: { port: 5174, open: false },
});
