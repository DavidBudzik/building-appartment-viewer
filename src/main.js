import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource-variable/manrope';
import './styles.css';

import gsap from 'gsap';
import config from './project.config.js';
import { asset } from './lib/util.js';
import { FrameSequence } from './sequence.js';
import { initJourney } from './journey.js';
import { initSelector } from './selector.js';
import {
  initNav, initPlace, initResidences, initUnitDialog, initGallery, initEnquiry, initFooter, initReveals,
} from './sections.js';

document.title = `${config.brand.name} — ${config.brand.strapline}`;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

async function boot() {
  const loader = document.querySelector('.loader');
  const bar = loader.querySelector('.loader__bar i');
  loader.querySelector('.loader__brand').innerHTML =
    `${config.brand.mark[0]} <em>${config.brand.mark[1]}</em>`;

  const manifest = await fetch(asset(`${config.frames}/manifest.json`)).then((r) => r.json());
  const sequence = new FrameSequence(document.querySelector('.stage__canvas'), config.frames, manifest);

  initNav();
  initPlace();
  initResidences();
  initGallery();
  initEnquiry();
  initFooter();
  initUnitDialog();
  initSelector();
  const journey = initJourney(sequence);
  initReveals();

  // Only the opening seconds block the reveal; everything else streams in behind them.
  const first = { start: 0, end: Math.min(36, sequence.frames.length - 1) };
  await sequence.load(first.start, first.end, (p) => (bar.style.transform = `scaleX(${p})`));
  sequence.draw(0);
  journey.refresh();

  document.documentElement.classList.remove('is-loading');
  gsap.timeline()
    .to(loader, { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' })
    .from('.stage__canvas', { scale: 1.06, duration: 2.2, ease: 'power3.out' }, 0)
    .from('.caption:first-child > *', { autoAlpha: 0, y: 30, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 0.35)
    .from('.nav, .chapters, .scroll-hint', { autoAlpha: 0, duration: 0.8 }, 0.7)
    .set(loader, { display: 'none' });

  sequence.load(first.end + 1, sequence.frames.length - 1);
}

boot().catch((err) => {
  console.error(err);
  document.querySelector('.loader__status').textContent =
    'The film could not be loaded. Run "npm run frames" to generate the frame sequences.';
});
