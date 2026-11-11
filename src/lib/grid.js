// Helper for regular facades: describe the facade as a four-corner quad on the hero
// frame plus row/column split fractions, and get one polygon per apartment.
// For irregular buildings skip this and write `shape` polygons by hand in the config.

const lerp = (a, b, t) => a + (b - a) * t;

function pointInQuad({ tl, tr, br, bl }, u, v) {
  const top = [lerp(tl[0], tr[0], u), lerp(tl[1], tr[1], u)];
  const bottom = [lerp(bl[0], br[0], u), lerp(bl[1], br[1], u)];
  return [lerp(top[0], bottom[0], v), lerp(top[1], bottom[1], v)];
}

/**
 * @param quad   { tl, tr, br, bl } corner points in hero-frame units (0-100 on both axes)
 * @param cols   column boundaries as fractions 0..1, left to right (n columns => n+1 values)
 * @param rows   row boundaries as fractions 0..1, top to bottom
 * @param inset  shrink each cell slightly so neighbouring outlines do not touch
 * @returns shape(row, col) => [[x, y], ...]  (row 0 = top floor, col 0 = leftmost bay)
 */
export function facadeGrid({ quad, cols, rows, inset = 0.012 }) {
  return (row, col) => {
    const u0 = cols[col] + inset;
    const u1 = cols[col + 1] - inset;
    const v0 = rows[row] + inset;
    const v1 = rows[row + 1] - inset;
    return [
      pointInQuad(quad, u0, v0),
      pointInQuad(quad, u1, v0),
      pointInQuad(quad, u1, v1),
      pointInQuad(quad, u0, v1),
    ].map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]);
  };
}
