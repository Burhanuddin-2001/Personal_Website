# Developer Portfolio

A minimalist, dark-themed, single-page developer portfolio. The centerpiece is
a PlayStation-style **projects carousel**. Built with vanilla JavaScript + CSS
and bundled by **Vite**, deliberately structured for a low-friction future
migration to React. Zero runtime UI dependencies.

## Requirements

- **Node.js 18+** and npm (Vite needs Node; this project does not run by opening
  `index.html` directly because it uses ES module + CSS imports).

## Getting started

```bash
npm install
npm run dev      # start the dev server (opens the browser)
npm run build    # production build to /dist
npm run preview  # preview the production build
```

## Make it yours

Content is separated from code:

- **`src/data/profile.js`** — your name, title, intro, avatar, resume path, and
  social links (GitHub / LinkedIn / Email).
- **`src/data/projects.js`** — the project dataset that drives the carousel and
  details panel (see the schema documented at the top of the file).
- **`public/assets/`** — your photo and résumé PDF live here; referenced by
  `avatar.src` / `resumeUrl` in `src/data/profile.js`. Add project
  `screenshots/` if desired.
- **Contact form** — set `VITE_WEB3FORMS_ENDPOINT` and
  `VITE_WEB3FORMS_ACCESS_KEY` in `.env` (get both from your
  [Web3Forms](https://web3forms.com) dashboard). Endpoint should be
  `https://api.web3forms.com/submit` (fixed), and the access key is a
  UUID-like string you'll find in your Web3Forms account. Left empty, the
  form runs in a client-side demo mode (validates + shows success, delivers
  nothing).
  - The honeypot field is named `botcheck` — that's Web3Forms' specific
    reserved spam-protection field name.
  - Success/failure is read from the JSON response body (`{ success, message }`),
    not just the HTTP status — Web3Forms can return `200 OK` with
    `success: false` for some rejections.
- **Theme** — all colors, spacing, type, and motion live as CSS custom properties
  in **`src/styles/tokens.css`**.

## Architecture

```
index.html                 # entry; semantic section shells + skip link
src/
  main.js                  # bootstrap: mount sections, run welcome, arm reveals
  data/                    # projects.js, profile.js (single source of truth)
  styles/                  # tokens.css, base.css, layout.css (global)
  lib/                     # store, dom, motion, reveal, announcer (framework-free)
  components/
    WelcomeScreen/         # once-per-load full-screen intro (WAAPI)
    Hero/                  # reversed 2-col: image left, text + 3 actions right
    Projects/              # Carousel + ProjectCard + DetailsPanel (the centerpiece)
    Contact/               # ContactForm + SocialLinks + Back-to-Top
    common/                # Button, Icon (inline SVG)
```

**Conventions (React-migration-ready):**

- Each component is a factory that takes props/data as arguments and owns its DOM
  subtree — a direct analog of a React function component.
- Cross-component state lives in a tiny observable store (`src/lib/store.js`),
  the single source of truth for the selected project. Data flows down; events
  flow up through the store. Swap it for `useState`/context on migration.
- Styles are co-located per component and use component-prefixed class names, so
  each block can become a CSS Module later.
- Animations use native Web APIs only (Web Animations API, IntersectionObserver,
  Pointer Events) and honor `prefers-reduced-motion` throughout.

## Accessibility notes

- Full keyboard support on the carousel (Arrow keys, Home/End, Prev/Next, dots);
  only the centered card is interactive and exposed to assistive tech, and
  navigation is announced via a polite live region.
- Skip link, visible focus rings, labelled form fields with inline errors, and
  AA-targeted contrast on the dark theme.

## Migrating to React later

1. Each `components/*/*.js` factory becomes a React component (JSX replaces the
   `el()` DOM helper).
2. `lib/store.js` → `useState`/`useReducer` + context.
3. `data/*.js` already returns plain objects — import directly or fetch from an API.
4. Co-located `*.css` files convert to CSS Modules with minimal churn.
