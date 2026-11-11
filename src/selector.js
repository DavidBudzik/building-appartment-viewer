import config from './project.config.js';
import { el, esc, emit, on, formatArea, formatPrice, statusOf, unitById } from './lib/util.js';
import { stepInside } from './journey.js';

// The overlay SVG uses the same 16:9 box and "cover" fit as the canvas underneath,
// so polygons stay glued to the building at any window size.
const W = 1600;
const H = 900;
const NS = 'http://www.w3.org/2000/svg';
const toPx = ([x, y]) => [(x / 100) * W, (y / 100) * H];
const pts = (list) => list.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');

/** A smaller copy of the outline, nudged sideways: reads as the back wall of the volume. */
function backFace(points) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => [cx + (x - cx) * 0.8 - W * 0.008, cy + (y - cy) * 0.8 - H * 0.004]);
}

export function initSelector() {
  const stage = document.querySelector('.stage');
  const svg = stage.querySelector('.units');
  const ui = stage.querySelector('.selector');
  const tag = ui.querySelector('.unit-tag');
  const card = ui.querySelector('.unit-card');

  ui.querySelector('.selector__title').innerHTML =
    `${esc(config.selector.title)} <em>${esc(config.selector.accent)}</em>`;
  ui.querySelector('.selector__legend').innerHTML = Object.entries(config.statuses)
    .map(([key, s]) => {
      const n = config.units.filter((u) => u.status === key).length;
      return `<li><i style="--c:${s.color}"></i>${esc(s.label)} <b>${n}</b></li>`;
    })
    .join('');

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (new URLSearchParams(location.search).has('calibrate')) stage.classList.add('is-calibrating');

  let selected = null;
  let hovered = null;
  let cardKey = null;
  const groups = new Map();

  config.units.forEach((unit) => {
    if (!unit.shape) return;
    const front = unit.shape.map(toPx);
    const back = backFace(front);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'unit');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label',
      `${unit.name}, ${unit.bedrooms} bedrooms, ${formatArea(unit.area)}, ${statusOf(unit).label}`);
    g.dataset.status = unit.status;
    g.style.setProperty('--c', statusOf(unit).color);
    g.innerHTML = `
      <polygon class="unit__back" points="${pts(back)}"/>
      ${front.map((p, i) => `<line class="unit__edge" x1="${p[0]}" y1="${p[1]}" x2="${back[i][0]}" y2="${back[i][1]}"/>`).join('')}
      <polygon class="unit__face" points="${pts(front)}"/>`;
    g.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && hover(unit));
    g.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && hover(null));
    g.addEventListener('focus', () => hover(unit));
    g.addEventListener('blur', () => hover(null));
    g.addEventListener('click', (e) => { e.stopPropagation(); select(selected === unit ? null : unit); });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(unit); }
    });
    svg.append(g);
    groups.set(unit.id, g);
  });

  // Click on the scenery clears the selection.
  svg.addEventListener('click', () => select(null));

  function hover(unit) {
    hovered = unit;
    render();
  }

  function select(unit) {
    selected = unit;
    render();
  }

  function placeTag(unit) {
    const g = groups.get(unit.id);
    const box = g.querySelector('.unit__face').getBoundingClientRect();
    const host = ui.getBoundingClientRect();
    tag.style.left = `${box.left + box.width / 2 - host.left}px`;
    tag.style.top = `${box.top - host.top}px`;
  }

  function render() {
    const unit = hovered || selected;
    groups.forEach((g, id) => {
      g.classList.toggle('is-hover', hovered?.id === id);
      g.classList.toggle('is-selected', selected?.id === id);
    });

    // Only rebuild the card when its content changes: rebuilding on every focus/hover
    // event would destroy a button halfway through a click.
    const key = unit ? `${unit.id}:${selected === unit}` : '';
    if (unit) placeTag(unit);
    if (key === cardKey) return;
    cardKey = key;

    if (!unit) {
      tag.classList.remove('is-visible');
      card.classList.remove('has-unit');
      card.innerHTML = `<p class="unit-card__hint">${esc(config.selector.hint)}</p>`;
      return;
    }

    const s = statusOf(unit);
    tag.innerHTML = `<b>${esc(unit.id)}</b> ${unit.bedrooms} bed · ${formatArea(unit.area)}`;
    tag.style.setProperty('--c', s.color);
    placeTag(unit);
    tag.classList.add('is-visible');

    card.classList.add('has-unit');
    card.style.setProperty('--c', s.color);
    card.innerHTML = `
      <div class="unit-card__head">
        <div>
          <h3>${esc(unit.name)}</h3>
          <p>${esc(unit.label)} · ${esc(unit.floorName)}</p>
        </div>
        <span class="pill"><i></i>${esc(s.label)}</span>
      </div>
      <dl class="unit-card__stats">
        <div><dt>Bedrooms</dt><dd>${unit.bedrooms}</dd></div>
        <div><dt>Interior</dt><dd>${formatArea(unit.area)}</dd></div>
        <div><dt>${esc(unit.outdoorLabel)}</dt><dd>${formatArea(unit.outdoor)}</dd></div>
      </dl>
      <div class="unit-card__foot">
        <strong>${unit.status === 'sold' ? 'Sold' : formatPrice(unit)}</strong>
        ${selected === unit ? `
          <div class="unit-card__actions">
            <button class="btn btn--ghost" type="button" data-act="details">Plan &amp; details</button>
            <button class="btn btn--light" type="button" data-act="inside">Step inside</button>
          </div>` : '<span class="unit-card__cue">Click to select</span>'}
      </div>`;
  }

  card.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'details' && selected) emit('unit:open', selected.id);
    if (act === 'inside') stepInside();
  });

  on('selector:active', (active) => {
    if (!active) { hovered = null; render(); }
    else if (selected) requestAnimationFrame(render);
  });
  on('unit:show', (id) => select(unitById(id)));
  window.addEventListener('resize', () => (hovered || selected) && placeTag(hovered || selected));

  render();
}
