/**
 * Topographic contour lines for the page background.
 *
 * A smooth height field (about 70 gaussian hills and pits, lightly
 * domain-warped) is sampled on a grid, traced with marching squares at
 * evenly spaced levels, and the segments are chained into polylines.
 * The seed is fixed, so the same viewport always gets the same map.
 */

const SEED = 20261109;
const BLOBS = 70;
const CELL = 8;
const LEVELS = 15;

type Blob = { x: number; y: number; s: number; a: number };

function makeBlobs(): Blob[] {
  // Park–Miller LCG: tiny, deterministic, good enough for scenery.
  let seed = SEED;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const blobs: Blob[] = [];
  for (let k = 0; k < BLOBS; k++) {
    blobs.push({
      x: rnd() * 2400 - 150,
      y: rnd() * 1600 - 150,
      s: 60 + rnd() * 90, // sigma between 60 and 150px
      a: (rnd() < 0.5 ? -1 : 1) * (0.4 + rnd() * 0.8),
    });
  }
  return blobs;
}

// Marching squares: for each corner mask, which cell edges the line joins.
// Edges: 0 top, 1 right, 2 bottom, 3 left.
const EDGE_PAIRS: Record<number, [number, number][]> = {
  1: [[3, 2]],
  2: [[2, 1]],
  3: [[3, 1]],
  4: [[0, 1]],
  5: [[0, 1], [3, 2]],
  6: [[0, 2]],
  7: [[0, 3]],
  8: [[0, 3]],
  9: [[0, 2]],
  10: [[0, 3], [2, 1]],
  11: [[0, 1]],
  12: [[3, 1]],
  13: [[2, 1]],
  14: [[3, 2]],
};

function heightField(width: number, height: number) {
  const blobs = makeBlobs();
  const nx = Math.ceil(width / CELL) + 2;
  const ny = Math.ceil(height / CELL) + 2;
  const field = new Float32Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = i * CELL;
      const y = j * CELL;
      const wx = x + 28 * Math.sin(y * 0.019 + 1.3) + 14 * Math.sin(y * 0.041);
      const wy = y + 28 * Math.cos(x * 0.017) + 14 * Math.cos(x * 0.037 + 0.7);
      let v =
        0.25 * Math.sin(wx * 0.009 + 1.7 * Math.sin(wy * 0.006)) * Math.cos(wy * 0.01 + 1.1 * Math.sin(wx * 0.007));
      for (const b of blobs) {
        const dx = wx - b.x;
        const dy = wy - b.y;
        v += b.a * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s));
      }
      field[j * nx + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { field, nx, ny, min, max };
}

type Point = [id: string, x: number, y: number];

function traceLevel(field: Float32Array, nx: number, ny: number, level: number): string {
  const points = new Map<string, Point>();
  const segments: [string, string][] = [];
  const adjacent = new Map<string, number[]>();

  const link = (id: string, seg: number) => {
    const list = adjacent.get(id);
    if (list) list.push(seg);
    else adjacent.set(id, [seg]);
  };

  for (let cj = 0; cj < ny - 1; cj++) {
    for (let ci = 0; ci < nx - 1; ci++) {
      const tl = field[cj * nx + ci];
      const tr = field[cj * nx + ci + 1];
      const br = field[(cj + 1) * nx + ci + 1];
      const bl = field[(cj + 1) * nx + ci];
      const mask = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (mask === 0 || mask === 15) continue;

      const x0 = ci * CELL;
      const y0 = cj * CELL;
      // Edge points are keyed by grid edge so neighbouring cells share them.
      const edges: Point[] = [
        [`h${ci},${cj}`, x0 + (CELL * (level - tl)) / (tr - tl), y0],
        [`v${ci + 1},${cj}`, x0 + CELL, y0 + (CELL * (level - tr)) / (br - tr)],
        [`h${ci},${cj + 1}`, x0 + (CELL * (level - bl)) / (br - bl), y0 + CELL],
        [`v${ci},${cj}`, x0, y0 + (CELL * (level - tl)) / (bl - tl)],
      ];
      for (const [from, to] of EDGE_PAIRS[mask]) {
        const a = edges[from];
        const b = edges[to];
        points.set(a[0], a);
        points.set(b[0], b);
        const seg = segments.length;
        segments.push([a[0], b[0]]);
        link(a[0], seg);
        link(b[0], seg);
      }
    }
  }

  // Chain segments that share an endpoint into long polylines.
  const used = new Uint8Array(segments.length);
  const other = (seg: number, id: string) => (segments[seg][0] === id ? segments[seg][1] : segments[seg][0]);
  const walk = (start: string) => {
    const chain: string[] = [];
    let current = start;
    for (;;) {
      const next = adjacent.get(current)!.find((s) => !used[s]);
      if (next === undefined) break;
      used[next] = 1;
      current = other(next, current);
      chain.push(current);
    }
    return chain;
  };

  let d = "";
  for (let s = 0; s < segments.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const forward = walk(segments[s][1]);
    const back = walk(segments[s][0]).reverse();
    const chain = [...back, segments[s][0], segments[s][1], ...forward];
    chain.forEach((id, z) => {
      const p = points.get(id)!;
      d += `${z === 0 ? "M" : "L"}${p[1].toFixed(1)} ${p[2].toFixed(1)}`;
    });
  }
  return d;
}

/** SVG path data, one string per contour level. */
export function contourPaths(width: number, height: number): string[] {
  if (width <= 0 || height <= 0) return [];
  const { field, nx, ny, min, max } = heightField(width, height);
  const paths: string[] = [];
  for (let l = 1; l < LEVELS; l++) {
    const d = traceLevel(field, nx, ny, min + ((max - min) * l) / LEVELS);
    if (d) paths.push(d);
  }
  return paths;
}

const cache = new Map<string, string[]>();

/** contourPaths, remembered per viewport size. */
export function cachedContourPaths(width: number, height: number): string[] {
  const key = `${Math.round(width)}x${Math.round(height)}`;
  let paths = cache.get(key);
  if (!paths) {
    paths = contourPaths(Math.round(width), Math.round(height));
    if (cache.size > 8) cache.delete(cache.keys().next().value!);
    cache.set(key, paths);
  }
  return paths;
}
