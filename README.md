# Personal Website

> Design that defines character, not arrogance.

My personal website. It is a spy dossier you open on your desk. You leaf
through it with the bookmarks, read the file, and send me a message from the
last page. No menu, no scrolling. Just paper that falls, turns and settles.

On a phone it becomes a filing-cabinet drawer: you pull a folder up to read
it and put it back to leave it. Same file, its own object.

**Live:** https://burhanuddin2001.me/

## Run it

```
npm install
npm run dev        # http://localhost:5174
npm run build
```

- `?slow` runs every animation at one-sixth speed.
- `?m=phone` or `?m=desk` forces the phone or the desktop version.

The contact form sends through [Web3Forms](https://web3forms.com/). Put your
keys in a `.env` file:

```
VITE_WEB3FORMS_ENDPOINT=https://api.web3forms.com/submit
VITE_WEB3FORMS_ACCESS_KEY=your-access-key
```

Without them the form runs in demo mode: every send "lands", nothing is sent.

## Checks

```
npx playwright install webkit chromium   # once
npm run check                            # check:mobile, check:desktop
```

Every phone screen is checked at 390×664, 375×667 and 360×600: nothing
scrolls, text and tap targets meet their minimum sizes, and every control can
be tapped. The desktop is compared pixel by pixel with saved screenshots
(taken on Windows).

## Project layout

| File | What it does |
|---|---|
| `src/main.jsx` | Decides phone or desktop once, at load, and loads only that version. |
| `src/App.jsx` | The desktop folder: state, the drop onto the desk, the page turns, the bookmarks. |
| `src/pages.jsx` | What is printed on every desktop page. |
| `src/styles.css` | The desktop look: paper, ink, stamps, the 3D folder. |
| `src/mobile/` | The phone drawer: its own app, gestures and look. |
| `src/base.css` | Colours and fonts shared by both. |
| `src/profile.js` | My data: name, bio, links. |
| `src/projects.js` | My projects, with a shorter copy for the phone. |
| `src/submit.js` | Sends the contact form. |
| `src/storage.js` | Every browser-storage call, safe when storage is blocked. |
| `src/sound.js` | Optional sound, off by default. Delete it to remove sound. |
| `src/assets/` | Fonts and images. |
| `public/` | Files served as-is: résumé, favicon, social preview image. |
| `tests/` | The Playwright checks. |

## Make it yours

Replace everything that is mine before you publish: `src/profile.js`,
`src/projects.js`, the photo in `src/assets/`, the résumé and the preview
image in `public/assets/`, and the site address in `index.html`,
`vite.config.js`, `public/robots.txt` and `public/sitemap.xml`.

## Changelog

**Version 2.1** - A separate phone version: the filing-cabinet drawer, with
pull-to-open folders, the envelope send, sound and a desk lamp that follows
the visitor's clock.

**Version 2** - Rebuilt the plain HTML, CSS and JavaScript Version 1 in React
19 and Motion. The old project carousel is gone. The site is now a paper
dossier drawn in CSS 3D, with real page turns and bookmark navigation. All
text stays real, and selectable.

**Version 1** - A single-page carousel site.

## Usage

The style is free to use, but my data is not. You can learn from it, rebuild
it and change it for non-commercial work. Swap in your own name, photo and
content first. See [LICENSE](LICENSE) for the exact terms.
