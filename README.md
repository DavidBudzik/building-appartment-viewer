# Building apartment viewer

A scroll-driven sales site for a residential development, built with GSAP ScrollTrigger.
Scrolling flies the camera from the lake to the building, stops on an interactive view where
each apartment can be highlighted and selected, then flies through the balcony doors into a
show apartment. Below the film: live availability table with filters, unit details with floor
plans, gallery and a viewing-request form.

Live demo: https://davidbudzik.github.io/building-appartment-viewer/

The demo project ("Halden Shore") is fictional. Its footage was generated with Higgsfield.

## Run it

```bash
npm install
npm run dev      # local preview
npm run build    # static site in dist/, deployable to any static host
```

## Re-skin it for another development

Everything a marketer changes is in **`src/project.config.js`**: brand, texts, journey
scenes, units (price, status, area, floor plan), gallery and enquiry settings.

### 1. Replace the film

1. Put your clips in `media-src/clips/`, named in playback order
   (`01-approach.mp4`, `02-arrival.mp4`, …). Each clip should start on the frame the
   previous one ended on. The clip *before* the selector must end on a still, clear view of
   the building.
2. Run `npm run frames` (needs `ffmpeg`). This writes WebP frame sequences in two sizes to
   `public/media/frames/` plus a `manifest.json`.
3. List the clips in `journey` in the config. `scroll` is the length of each scene in
   screen heights: larger means a slower camera.

`media-src/` is git-ignored; only the extracted frames are committed.

### 2. Outline the apartments

Each unit has a `shape`: a polygon in percentages of the hero frame (x 0–100, y 0–100).
For a regular facade use the `facadeGrid` helper (four facade corners plus row and column
splits), as the demo does. For anything irregular write the points by hand.

Open the site with **`?calibrate`** in the URL to keep all outlines visible in magenta while
you tune the numbers.

### 3. Units, prices, availability

Edit the `units` array. `status` is `available`, `reserved` or `sold`; colours and labels
come from `statuses`. The selector, table, drawer and form all read from this one list.

### 4. Enquiries

Set `enquiry.endpoint` to a URL that accepts a JSON `POST` (CRM webhook, Formspree,
serverless function). While it is empty, the form opens the visitor's mail app addressed to
`enquiry.email` instead; nothing is stored or sent by the site itself.

## Structure

```
src/project.config.js   all content and settings
src/journey.js          scroll timeline: frames, captions, chapters, selector hold
src/sequence.js         canvas frame-sequence player
src/selector.js         apartment outlines, hover tag, unit card
src/sections.js         nav, facts, availability table, drawer, gallery, form
scripts/extract-frames.mjs   clips -> frame sequences
scripts/make-plans.mjs       schematic demo floor plans
```

## Deploy

`.github/workflows/pages.yml` builds the site and publishes `dist/` to GitHub Pages on every
push. Pages must be switched on once: repository **Settings → Pages → Source: GitHub Actions**.
