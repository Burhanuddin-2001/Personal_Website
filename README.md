# Personal Website

> Design that defines character, not arrogance.

My personal website. It is a spy dossier you open on your desk. You leaf
through it with the bookmarks, read the file, and send me a message from the
last page. No menu, no scrolling. Just paper that falls, turns and settles.

**Live:** https://burhanuddin2001.me/

## Run it

```
npm install
npm run dev        # http://localhost:5174
```

Add `?slow` to the URL to run every animation at one-sixth speed.

## Project layout

| File | What it does |
|---|---|
| `src/App.jsx` | The folder itself: state, the drop onto the desk, the page turns, the bookmarks. |
| `src/pages.jsx` | What is printed on every page. |
| `src/styles.css` | The whole look: paper, ink, stamps, the 3D folder. |
| `src/profile.js` | My data: name, bio, links, contact settings. |
| `src/projects.js` | My projects. |
| `src/submit.js` | Sends the contact form through Web3Forms. |
| `src/assets/` | Fonts and images. |
| `public/` | Files served as-is: résumé, favicon, social preview image. |

## Changelog

**Version 2** - Rebuilt the plain HTML, CSS and JavaScript Version 1 in React
19 and Motion. The old project carousel is gone. The site is now a paper
dossier drawn in CSS 3D, with real page turns and bookmark navigation. All
text stays real, and selectable.

**Version 1** - A single-page carousel site.

## Usage

The style is free to use, but my data is not. You can learn from it, rebuild
it and change it for non-commercial work. Swap in your own name, photo and
content first. See [LICENSE](LICENSE) for the exact terms.
