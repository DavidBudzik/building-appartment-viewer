import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import config from './project.config.js';
import { el, esc, emit } from './lib/util.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });

let trigger;
let timeline;
let total = 0;
const scenes = config.journey.map((s) => ({ ...s }));

/** Page scroll position that corresponds to a point on the journey timeline. */
const scrollFor = (time) => trigger.start + (time / total) * (trigger.end - trigger.start);

export function scrollToTime(time, duration = 1.6) {
  gsap.to(window, {
    scrollTo: { y: scrollFor(time), autoKill: true },
    duration,
    ease: 'power2.inOut',
    overwrite: true,
  });
}

const selectorScene = () => scenes.find((s) => s.type === 'selector');

/** Bring the building selector into view (used by "See it on the building"). */
export function goToSelector() {
  const s = selectorScene();
  scrollToTime(s.t0 + s.scroll * 0.45, 1.4);
}

/** Fly from the selector through the balcony doors into the apartment. */
export function stepInside() {
  const i = scenes.indexOf(selectorScene());
  const last = scenes[Math.min(i + (config.selector.stepInsideScenes ?? 2), scenes.length - 1)];
  scrollToTime(last.t0 + last.scroll, 5.5);
}

function captionEl(c) {
  return el(`
    <div class="caption ${c.brand ? 'caption--brand' : ''}">
      <h2 class="caption__title">${esc(c.title)} <em>${esc(c.accent || '')}</em></h2>
      ${c.text ? `<p class="caption__text">${esc(c.text)}</p>` : ''}
      ${c.cta ? `<button class="btn btn--light caption__cta" type="button">${esc(c.cta)}</button>` : ''}
    </div>`);
}

function roomEl(r) {
  return el(`
    <div class="room">
      <span class="room__kicker">Show apartment ${esc(config.selector.showApartment)}</span>
      <span class="room__name">${esc(r.name)}</span>
      <span class="room__detail">${esc(r.detail || '')}</span>
    </div>`);
}

export function initJourney(sequence) {
  const journey = document.querySelector('.journey');
  const stage = journey.querySelector('.stage');
  const captions = stage.querySelector('.captions');
  const chapters = stage.querySelector('.chapters');
  const hint = stage.querySelector('.scroll-hint');

  total = scenes.reduce((sum, s) => sum + s.scroll, 0);
  journey.style.setProperty('--scenes', total);

  const state = { frame: 0 };
  timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: journey,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.7,
    },
    onUpdate: update,
  });
  trigger = timeline.scrollTrigger;

  // Overlays fade in/out at fractions of their scene; `from: 0` on the very first
  // scene means "already there when the page opens".
  const addOverlay = (node, scene, { from = 0, to = 1 }, y = 28) => {
    captions.append(node);
    const fade = Math.min(0.22, scene.scroll * 0.18);
    const visibleAtStart = scene.t0 === 0 && from <= 0;
    gsap.set(node, { autoAlpha: visibleAtStart ? 1 : 0 });
    if (!visibleAtStart) {
      timeline.fromTo(node, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: fade, ease: 'power1.out' },
        scene.t0 + from * scene.scroll);
    }
    timeline.to(node, { autoAlpha: 0, y: -y / 2, duration: fade, ease: 'power1.in' },
      Math.min(scene.t0 + to * scene.scroll, total) - fade);
  };

  let t = 0;
  let lastFrame = 0;
  scenes.forEach((scene) => {
    scene.t0 = t;
    if (scene.type === 'clip') {
      const range = sequence.range(scene.clip);
      timeline.set(state, { frame: range.start }, t);
      timeline.to(state, { frame: range.end, duration: scene.scroll }, t);
      lastFrame = range.end;
    } else {
      // Selector: hold the camera still on the last frame of the previous clip.
      timeline.set(state, { frame: lastFrame }, t);
      timeline.to({}, { duration: scene.scroll }, t);
    }
    if (scene.caption) {
      const node = captionEl(scene.caption);
      node.querySelector('.caption__cta')?.addEventListener('click', goToSelector);
      addOverlay(node, scene, scene.caption);
    }
    if (scene.room) addOverlay(roomEl(scene.room), scene, scene.room, 14);
    t += scene.scroll;
  });

  // Chapter rail
  const chapterScenes = scenes.filter((s) => s.chapter);
  chapterScenes.forEach((scene) => {
    const b = el(`<button class="chapters__item" type="button"><span>${esc(scene.chapter)}</span><i></i></button>`);
    b.addEventListener('click', () =>
      scrollToTime(scene.type === 'selector' ? scene.t0 + scene.scroll * 0.45 : scene.t0 + 0.02));
    scene.chapterEl = b;
    chapters.append(b);
  });

  const sel = selectorScene();
  let selecting = null;
  let activeChapter = null;

  function update() {
    sequence.draw(state.frame);
    const time = timeline.time();

    const nowSelecting = time >= sel.t0 - 0.01 && time <= sel.t0 + sel.scroll - 0.01;
    if (nowSelecting !== selecting) {
      selecting = nowSelecting;
      stage.classList.toggle('is-selecting', selecting);
      emit('selector:active', selecting);
    }

    const chapter = chapterScenes.findLast((s) => time >= s.t0 - 0.01) || chapterScenes[0];
    if (chapter !== activeChapter) {
      activeChapter?.chapterEl.classList.remove('is-active');
      chapter.chapterEl.classList.add('is-active');
      activeChapter = chapter;
    }
    hint.classList.toggle('is-hidden', time > 0.08);
    stage.classList.toggle('is-inside', time > sel.t0 + sel.scroll);
  }

  update();
  return { timeline, refresh: () => ScrollTrigger.refresh() };
}
