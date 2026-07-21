// App bootstrap — mounts each section in journey order, runs the welcome
// sequence once, then reveals the hero and arms scroll reveals.

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './components/common/common.css';

import { projects } from './data/projects.js';
import { profile, contactConfig } from './data/profile.js';
import { createStore } from './lib/store.js';
import { observeReveals } from './lib/reveal.js';

import { runWelcome } from './components/WelcomeScreen/WelcomeScreen.js';
import { mountHero } from './components/Hero/Hero.js';
import { mountProjects } from './components/Projects/Projects.js';
import { mountContact } from './components/Contact/Contact.js';

function init() {
  const heroEl = document.getElementById('hero');
  const projectsEl = document.getElementById('projects');
  const contactEl = document.getElementById('contact');

  // Shared state: the selected project index, read by carousel + details.
  const store = createStore({ activeIndex: 0 });

  const hero = mountHero(heroEl, { profile });
  mountProjects(projectsEl, { projects, store });
  mountContact(contactEl, { profile, contactConfig });

  // Welcome plays once per load, then hands off to the hero.
  runWelcome().then(() => {
    hero.reveal();
    // Move focus into the page so keyboard users start at the top of content.
    document.getElementById('main')?.setAttribute('tabindex', '-1');
    document.getElementById('main')?.focus({ preventScroll: true });

    // Arm scroll-triggered reveals for the lower sections.
    observeReveals(projectsEl);
    observeReveals(contactEl);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
