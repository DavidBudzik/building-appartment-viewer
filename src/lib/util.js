import config from '../project.config.js';

/** Resolve a public asset path against the deploy base. */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const money = new Intl.NumberFormat(config.locale, {
  style: 'currency',
  currency: config.currency,
  maximumFractionDigits: 0,
});
export const formatPrice = (unit) => (unit.status === 'sold' ? '—' : money.format(unit.price));
export const formatArea = (n) => `${n} ${config.areaUnit}`;

export const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const unitById = (id) => config.units.find((u) => u.id === id);
export const statusOf = (unit) => config.statuses[unit.status];

/** Tiny pub/sub so the selector, table, dialog and form can talk without knowing each other. */
const listeners = {};
export const on = (name, fn) => ((listeners[name] ||= []).push(fn));
export const emit = (name, payload) => (listeners[name] || []).forEach((fn) => fn(payload));
