// Draws the schematic floor plans used in the demo (public/media/plans/*.svg).
// Replace the output files with your architect's plans for a real project;
// any image format works, just point `plan` in src/project.config.js at it.
import { mkdirSync, writeFileSync } from 'node:fs';

const S = 44; // pixels per metre
const PAD = 40;
const DEPTH = 11.7;
const BALCONY = 1.7;

const centre = {
  width: 7.2,
  rooms: [
    ['Hall', 0, 0, 2.2, 3.0],
    ['Bathroom', 2.2, 0, 4.4, 3.0],
    ['Bedroom 2', 4.4, 0, 7.2, 4.2],
    ['Kitchen & dining', 0, 3.0, 4.4, 6.2],
    ['Ensuite', 4.4, 4.2, 7.2, 6.4],
    ['Living', 0, 6.2, 4.4, DEPTH],
    ['Main bedroom', 4.4, 6.4, 7.2, DEPTH],
  ],
};
const corner = (width) => ({
  width,
  rooms: [
    ['Hall', 0, 0, 2.4, 3.0],
    ['Bathroom', 2.4, 0, 4.6, 3.0],
    ['Bedroom 3', 4.6, 0, 7.0, 4.2],
    ['Bedroom 2', 7.0, 0, width, 4.2],
    ['Kitchen & dining', 0, 3.0, 4.6, 6.4],
    ['Ensuite', 4.6, 4.2, 7.0, 6.4],
    ['Utility', 7.0, 4.2, width, 6.4],
    ['Living', 0, 6.4, 5.4, DEPTH],
    ['Main bedroom', 5.4, 6.4, width, DEPTH],
  ],
});
const mirror = (plan) => ({
  ...plan,
  rooms: plan.rooms.map(([n, x0, y0, x1, y1]) => [n, plan.width - x1, y0, plan.width - x0, y1]),
});

const plans = { 'type-centre': centre, 'type-west': mirror(corner(9.6)), 'type-east': corner(10.1) };

function draw({ width, rooms }) {
  const W = width * S + PAD * 2;
  const H = (DEPTH + BALCONY) * S + PAD * 2 + 30;
  const X = (m) => PAD + m * S;
  const Y = (m) => PAD + m * S;
  const label = (name, x0, y0, x1, y1) => {
    const area = ((x1 - x0) * (y1 - y0)).toFixed(1);
    const small = x1 - x0 < 2.5;
    return `<text x="${X((x0 + x1) / 2)}" y="${Y((y0 + y1) / 2) - 2}" class="n${small ? ' s' : ''}">${name.replace('&', '&amp;')}</text>
      <text x="${X((x0 + x1) / 2)}" y="${Y((y0 + y1) / 2) + 15}" class="a">${area} m²</text>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Manrope, system-ui, sans-serif">
  <style>
    .room{fill:#fbf8f2;stroke:#101614;stroke-width:3;stroke-linejoin:round}
    .out{fill:url(#deck);stroke:#101614;stroke-width:1.5;stroke-dasharray:6 5}
    .n{font-size:13px;font-weight:600;fill:#101614;text-anchor:middle}
    .n.s{font-size:11px}
    .a{font-size:11px;fill:#6d756f;text-anchor:middle}
    .glass{stroke:#c9a56a;stroke-width:6}
    .k{font-size:10px;letter-spacing:2px;fill:#6d756f;text-transform:uppercase}
  </style>
  <defs><pattern id="deck" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="#f5f0e6"/><path d="M0 0V10" stroke="#d8cfbd" stroke-width="1.5"/></pattern></defs>
  <rect class="out" x="${X(0)}" y="${Y(DEPTH)}" width="${width * S}" height="${BALCONY * S}"/>
  ${rooms.map(([n, x0, y0, x1, y1]) => `<rect class="room" x="${X(x0)}" y="${Y(y0)}" width="${(x1 - x0) * S}" height="${(y1 - y0) * S}"/>`).join('\n  ')}
  <line class="glass" x1="${X(0.3)}" y1="${Y(DEPTH)}" x2="${X(width - 0.3)}" y2="${Y(DEPTH)}"/>
  ${rooms.map((r) => label(...r)).join('\n  ')}
  <text x="${X(width / 2)}" y="${Y(DEPTH + BALCONY / 2) + 4}" class="n">Balcony / terrace</text>
  <text x="${X(0)}" y="${H - 14}" class="k">Lake side ↓</text>
  <g transform="translate(${X(width) - 2 * S}, ${H - 22})">
    <path d="M0 0H${2 * S}M0 -4V4M${S} -3V3M${2 * S} -4V4" stroke="#101614" stroke-width="1.5" fill="none"/>
    <text x="${S}" y="16" class="a">2 m</text>
  </g>
</svg>
`;
}

mkdirSync('public/media/plans', { recursive: true });
for (const [name, plan] of Object.entries(plans)) {
  writeFileSync(`public/media/plans/${name}.svg`, draw(plan));
  console.log(`public/media/plans/${name}.svg`);
}
