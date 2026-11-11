import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import config from './project.config.js';
import { asset, el, esc, emit, on, formatArea, formatPrice, statusOf, unitById } from './lib/util.js';
import { goToSelector } from './journey.js';

const heading = ({ eyebrow, title, accent, text }) => `
  <header class="section__head" data-reveal>
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h2 class="display">${esc(title)} <em>${esc(accent)}</em></h2>
    ${text ? `<p class="lede">${esc(text)}</p>` : ''}
  </header>`;

const pill = (unit) =>
  `<span class="pill" style="--c:${statusOf(unit).color}"><i></i>${esc(statusOf(unit).label)}</span>`;

// ── Navigation ───────────────────────────────────────────────────────────────
export function initNav() {
  const nav = document.querySelector('.nav');
  const [a, b] = config.brand.mark;
  nav.innerHTML = `
    <a class="nav__brand" href="#top">${esc(a)} <em>${esc(b)}</em></a>
    <nav class="nav__links" aria-label="Sections">
      ${config.nav.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}
    </nav>
    <a class="btn btn--light nav__cta" href="${esc(config.cta.href)}">${esc(config.cta.label)}</a>`;

  // Light-on-dark over the film, dark-on-cream once the page content starts.
  ScrollTrigger.create({
    trigger: '.journey',
    start: 'bottom top+=72',
    onEnter: () => nav.classList.add('nav--page'),
    onLeaveBack: () => nav.classList.remove('nav--page'),
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = link.getAttribute('href') === '#top' ? 0 : document.querySelector(link.getAttribute('href'));
    if (target === null) return;
    e.preventDefault();
    gsap.to(window, { scrollTo: { y: target, offsetY: 0 }, duration: 1.2, ease: 'power2.inOut' });
  });
}

// ── The place ────────────────────────────────────────────────────────────────
export function initPlace() {
  const p = config.place;
  const root = document.querySelector('#place');
  root.innerHTML = `
    <div class="wrap">
      ${heading(p)}
      <ul class="facts">
        ${p.facts.map((f) => `
          <li data-reveal>
            <strong><span class="facts__n" data-value="${f.value}" ${f.plain ? 'data-plain' : ''}>${f.value}</span>${esc(f.suffix || '')}</strong>
            <span>${esc(f.label)}</span>
          </li>`).join('')}
      </ul>
      <ul class="features">
        ${p.features.map((f) => `<li data-reveal><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></li>`).join('')}
      </ul>
    </div>`;

  root.querySelectorAll('.facts__n').forEach((node) => {
    const end = Number(node.dataset.value);
    const start = 'plain' in node.dataset ? end - 40 : 0;
    const counter = { n: start };
    gsap.to(counter, {
      n: end,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: node, start: 'top 88%', once: true },
      onUpdate: () => (node.textContent = Math.round(counter.n)),
    });
  });
}

// ── Residences: filterable availability table ────────────────────────────────
export function initResidences() {
  const root = document.querySelector('#residences');
  const units = config.units;
  const prices = units.map((u) => u.price);
  const maxPrice = Math.ceil(Math.max(...prices) / 50000) * 50000;
  const minPrice = Math.floor(Math.min(...prices) / 50000) * 50000;
  const bedOptions = [...new Set(units.map((u) => u.bedrooms))].sort();
  const floorOptions = [...new Set(units.map((u) => u.floor))].sort();
  const state = { beds: 'all', floor: 'all', max: maxPrice, availableOnly: false, sort: 'floor', dir: -1 };
  const money = (n) => formatPrice({ price: n });

  const seg = (name, options) => `
    <div class="seg" role="group" aria-label="${name}">
      ${options.map(([value, label], i) =>
        `<button type="button" data-filter="${name}" data-value="${value}" aria-pressed="${i === 0}">${label}</button>`).join('')}
    </div>`;

  root.innerHTML = `
    <div class="wrap">
      ${heading(config.residences)}
      <form class="filters" data-reveal onsubmit="return false">
        <label class="filters__group"><span>Bedrooms</span>
          ${seg('beds', [['all', 'Any'], ...bedOptions.map((b) => [b, b])])}
        </label>
        <label class="filters__group"><span>Floor</span>
          ${seg('floor', [['all', 'Any'], ...floorOptions.map((f) => [f, f === 0 ? 'Garden' : f])])}
        </label>
        <label class="filters__group filters__group--range"><span>Budget up to <output>${money(maxPrice)}</output></span>
          <input type="range" min="${minPrice}" max="${maxPrice}" step="10000" value="${maxPrice}" aria-label="Maximum price">
        </label>
        <label class="check"><input type="checkbox"> <span>Available only</span></label>
      </form>
      <p class="results" aria-live="polite"></p>
      <div class="table-wrap" data-reveal>
        <table class="units-table">
          <thead><tr>
            <th>Home</th><th>Type</th>
            <th><button type="button" data-sort="floor">Floor</button></th>
            <th>Beds</th>
            <th><button type="button" data-sort="area">Interior</button></th>
            <th>Outdoor</th>
            <th><button type="button" data-sort="price">Price</button></th>
            <th>Status</th><th><span class="sr-only">Open</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
        <p class="empty" hidden>No homes match these filters. Try a higher budget or include reserved homes.</p>
      </div>
    </div>`;

  const tbody = root.querySelector('tbody');
  const results = root.querySelector('.results');
  const empty = root.querySelector('.empty');

  function render() {
    const list = units
      .filter((u) => state.beds === 'all' || u.bedrooms === Number(state.beds))
      .filter((u) => state.floor === 'all' || u.floor === Number(state.floor))
      .filter((u) => u.status === 'sold' ? !state.availableOnly && state.max >= maxPrice : u.price <= state.max)
      .filter((u) => !state.availableOnly || u.status === 'available')
      .sort((a, b) => (a[state.sort] - b[state.sort]) * state.dir || a.id.localeCompare(b.id));

    tbody.innerHTML = list.map((u) => `
      <tr data-id="${u.id}" data-status="${u.status}" tabindex="0">
        <td data-label="Home"><b>${esc(u.id)}</b></td>
        <td data-label="Type">${esc(u.label)}</td>
        <td data-label="Floor">${esc(u.floorName)}</td>
        <td data-label="Beds">${u.bedrooms}</td>
        <td data-label="Interior">${formatArea(u.area)}</td>
        <td data-label="${esc(u.outdoorLabel)}">${formatArea(u.outdoor)}</td>
        <td data-label="Price"><b>${formatPrice(u)}</b></td>
        <td data-label="Status">${pill(u)}</td>
        <td class="units-table__go" aria-hidden="true">→</td>
      </tr>`).join('');

    const free = list.filter((u) => u.status === 'available').length;
    results.textContent = `${list.length} of ${units.length} homes shown · ${free} available`;
    empty.hidden = list.length > 0;
    root.querySelectorAll('[data-sort]').forEach((b) =>
      b.setAttribute('data-dir', b.dataset.sort === state.sort ? (state.dir > 0 ? 'asc' : 'desc') : ''));
  }

  root.addEventListener('click', (e) => {
    const filter = e.target.closest('[data-filter]');
    if (filter) {
      state[filter.dataset.filter] = filter.dataset.value;
      filter.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === filter));
      return render();
    }
    const sort = e.target.closest('[data-sort]');
    if (sort) {
      state.dir = state.sort === sort.dataset.sort ? -state.dir : 1;
      state.sort = sort.dataset.sort;
      return render();
    }
    const row = e.target.closest('tr[data-id]');
    if (row) emit('unit:open', row.dataset.id);
  });
  root.addEventListener('keydown', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row && e.key === 'Enter') emit('unit:open', row.dataset.id);
  });
  const range = root.querySelector('input[type=range]');
  range.addEventListener('input', () => {
    state.max = Number(range.value);
    root.querySelector('output').textContent = money(state.max);
    render();
  });
  root.querySelector('.check input').addEventListener('change', (e) => {
    state.availableOnly = e.target.checked;
    render();
  });

  render();
}

// ── Unit detail drawer ───────────────────────────────────────────────────────
export function initUnitDialog() {
  const dialog = document.querySelector('#unit-dialog');
  const body = dialog.querySelector('.drawer__body');
  const images = config.gallery.images.slice(0, 4);

  function open(id) {
    const u = unitById(id);
    if (!u) return;
    const sold = u.status === 'sold';
    body.style.setProperty('--c', statusOf(u).color);
    body.innerHTML = `
      <p class="eyebrow">${esc(u.label)} · ${esc(u.floorName)}</p>
      <div class="drawer__title">
        <h2 class="display">${esc(u.name)}</h2>
        ${pill(u)}
      </div>
      <p class="drawer__price">${sold ? 'Sold' : formatPrice(u)}</p>
      <p class="drawer__summary">${esc(u.summary)}</p>
      <dl class="specs">
        <div><dt>Bedrooms</dt><dd>${u.bedrooms}</dd></div>
        <div><dt>Bathrooms</dt><dd>${u.bathrooms}</dd></div>
        <div><dt>Interior</dt><dd>${formatArea(u.area)}</dd></div>
        <div><dt>${esc(u.outdoorLabel)}</dt><dd>${formatArea(u.outdoor)}</dd></div>
        <div><dt>Aspect</dt><dd>${esc(u.aspect)}</dd></div>
        <div><dt>Floor</dt><dd>${esc(u.floorName)}</dd></div>
      </dl>
      <h3 class="drawer__sub">Floor plan</h3>
      <figure class="plan"><img src="${asset(u.plan)}" alt="Floor plan of ${esc(u.name)}, ${esc(u.label)} type" loading="lazy"></figure>
      <h3 class="drawer__sub">Inside</h3>
      <div class="drawer__gallery">
        <img class="drawer__photo" src="${asset(images[0].src)}" alt="${esc(images[0].alt)}">
        <div class="drawer__thumbs">
          ${images.map((im, i) => `<button type="button" aria-label="${esc(im.caption)}" aria-pressed="${i === 0}" data-i="${i}"><img src="${asset(im.src)}" alt="" loading="lazy"></button>`).join('')}
        </div>
        <p class="drawer__note">Photographed in show apartment ${esc(config.selector.showApartment)}. Finishes are the same in every home.</p>
      </div>
      <div class="drawer__actions">
        <button class="btn btn--dark" type="button" data-act="enquire">${sold ? 'Ask about similar homes' : 'Book a viewing'}</button>
        <button class="btn btn--outline" type="button" data-act="show">See it on the building</button>
      </div>`;
    body.dataset.id = id;
    dialog.showModal();
    body.scrollTop = 0;
  }

  const close = () => dialog.close();
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) return close();
    const thumb = e.target.closest('.drawer__thumbs button');
    if (thumb) {
      const im = images[Number(thumb.dataset.i)];
      const photo = body.querySelector('.drawer__photo');
      photo.src = asset(im.src);
      photo.alt = im.alt;
      body.querySelectorAll('.drawer__thumbs button').forEach((b) => b.setAttribute('aria-pressed', b === thumb));
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'enquire') { close(); emit('unit:enquire', body.dataset.id); }
    if (act === 'show') { close(); emit('unit:show', body.dataset.id); goToSelector(); }
  });

  on('unit:open', open);
}

// ── Gallery + lightbox ───────────────────────────────────────────────────────
export function initGallery() {
  const g = config.gallery;
  const root = document.querySelector('#gallery');
  root.innerHTML = `
    <div class="wrap">
      ${heading(g)}
      <div class="gallery">
        ${g.images.map((im, i) => `
          <button class="gallery__item" type="button" data-i="${i}" data-reveal>
            <span class="gallery__frame"><img src="${asset(im.src)}" alt="${esc(im.alt)}" loading="lazy"></span>
            <span class="gallery__caption">${esc(im.caption)}</span>
          </button>`).join('')}
      </div>
    </div>`;

  // Slow drift inside each frame while it crosses the viewport.
  root.querySelectorAll('.gallery__frame img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  const box = document.querySelector('#lightbox');
  const img = box.querySelector('img');
  const cap = box.querySelector('figcaption');
  let index = 0;
  const show = (i) => {
    index = (i + g.images.length) % g.images.length;
    img.src = asset(g.images[index].src);
    img.alt = g.images[index].alt;
    cap.textContent = `${g.images[index].caption} · ${index + 1} / ${g.images.length}`;
  };
  root.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery__item');
    if (!item) return;
    show(Number(item.dataset.i));
    box.showModal();
  });
  box.addEventListener('click', (e) => {
    if (e.target.closest('[data-prev]')) return show(index - 1);
    if (e.target.closest('[data-next]')) return show(index + 1);
    if (e.target === box || e.target.closest('[data-close]')) box.close();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}

// ── Enquiry form ─────────────────────────────────────────────────────────────
export function initEnquiry() {
  const c = config.enquiry;
  const root = document.querySelector('#contact');
  const open = config.units.filter((u) => u.status !== 'sold');
  root.innerHTML = `
    <div class="wrap contact">
      <div>
        ${heading(c)}
        <address class="contact__direct" data-reveal>
          <span>${esc(c.agent)}</span>
          <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
          <a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>
        </address>
      </div>
      <form class="form" data-reveal novalidate>
        <div class="form__row">
          <label><span>Full name</span><input name="name" autocomplete="name" required></label>
          <label><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
        </div>
        <div class="form__row">
          <label><span>Phone <small>optional</small></span><input name="phone" type="tel" autocomplete="tel"></label>
          <label><span>Home you are interested in</span><select name="unit">
              <option value="">Not sure yet</option>
              ${open.map((u) => `<option value="${u.id}">${esc(u.name)} · ${u.bedrooms} bed · ${formatPrice(u)}${u.status === 'reserved' ? ' (reserved)' : ''}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="form__row">
          <label><span>Preferred viewing day <small>optional</small></span><input name="date" type="date"></label>
          <label><span>Best time to call <small>optional</small></span><select name="time"><option>Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select>
          </label>
        </div>
        <label><span>Anything we should know? <small>optional</small></span><textarea name="message" rows="3"></textarea></label>
        <label class="check"><input type="checkbox" name="consent" required> <span>I agree to be contacted about ${esc(config.brand.name)}.</span></label>
        <p class="form__error" role="alert" hidden></p>
        <button class="btn btn--dark" type="submit">Request a viewing</button>
      </form>
    </div>`;

  const form = root.querySelector('form');
  const error = root.querySelector('.form__error');

  on('unit:enquire', (id) => {
    const select = form.elements.unit;
    select.value = [...select.options].some((o) => o.value === id) ? id : '';
    gsap.to(window, { scrollTo: root, duration: 1.2, ease: 'power2.inOut' });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    const invalid = [...form.elements].find((f) => f.willValidate && !f.checkValidity());
    if (invalid) {
      error.textContent = invalid.name === 'consent'
        ? 'Please tick the box so we are allowed to reply.'
        : `Please check the ${invalid.name} field.`;
      error.hidden = false;
      return invalid.focus();
    }
    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector('button[type=submit]');
    let viaMail = false;

    if (c.endpoint) {
      button.disabled = true;
      button.textContent = 'Sending…';
      try {
        const res = await fetch(c.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...data, project: config.brand.name }),
        });
        if (!res.ok) throw new Error(res.status);
      } catch {
        button.disabled = false;
        button.textContent = 'Request a viewing';
        error.textContent = `That did not go through. Please try again or write to ${c.email}.`;
        error.hidden = false;
        return;
      }
    } else {
      // No backend configured: hand the enquiry to the visitor's mail app.
      viaMail = true;
      const lines = [
        `Name: ${data.name}`, `Email: ${data.email}`, `Phone: ${data.phone || '-'}`,
        `Home: ${data.unit ? `Apartment ${data.unit}` : 'Not sure yet'}`,
        `Preferred day: ${data.date || '-'}`, `Best time to call: ${data.time}`, '', data.message || '',
      ];
      const subject = `Viewing request — ${config.brand.name}${data.unit ? ` ${data.unit}` : ''}`;
      location.href = `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    }

    form.innerHTML = `
      <div class="form__done">
        <h3 class="display">Thank you, <em>${esc(data.name.split(' ')[0])}</em></h3>
        <p>${viaMail
          ? `Your mail app should have opened with the request ready to send. If it did not, write to <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>.`
          : 'Your request is with the sales office. We will be in touch within one working day.'}</p>
      </div>`;
  });
}

export function initFooter() {
  const [a, b] = config.brand.mark;
  document.querySelector('.footer').innerHTML = `
    <div class="wrap footer__inner">
      <span class="nav__brand">${esc(a)} <em>${esc(b)}</em></span>
      <span>${esc(config.brand.location)}</span>
      <small>${esc(config.footer.note)}</small>
    </div>`;
}

export function initReveals() {
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
  });
}
