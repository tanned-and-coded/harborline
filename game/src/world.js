// City generation for Port Azura: seeded road grid, buildings, palms, lamps, harbour.
import { BLOCK, DISTRICTS, PALETTE, ROAD_W, WATER_Y, WORLD_H, WORLD_W } from './config.js';
import { createRandom, pick, range } from './random.js';

export function roadCentres() {
  const xs = [], ys = [];
  for (let x = BLOCK / 2; x < WORLD_W; x += BLOCK) xs.push(x);
  for (let y = BLOCK / 2; y < WATER_Y; y += BLOCK) ys.push(y);
  return { xs, ys };
}
export function isOnRoad(x, y) {
  if (y >= WATER_Y - 30) return false;
  const { xs, ys } = roadCentres();
  return xs.some(c => Math.abs(x - c) < ROAD_W / 2) || ys.some(c => Math.abs(y - c) < ROAD_W / 2);
}
export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  return 'Port Azura';
}
export function createWorld(seed) {
  const rng = createRandom(seed * 7919 + 13);
  const buildings = [], palms = [], lamps = [];
  const { xs, ys } = roadCentres();
  // Two buildings per block, tucked into opposite corners of the block so they
  // never spill onto the cross roads through the block centre.
  const corners = [
    { x: 58, y: 58 }, { x: 252, y: 58 }, { x: 58, y: 252 }, { x: 252, y: 252 },
  ];
  for (let bx = 0; bx < WORLD_W; bx += BLOCK) {
    for (let by = 0; by < WATER_Y - 60; by += BLOCK) {
      const start = Math.floor(rng() * 4);
      for (let i = 0; i < 2; i++) {
        const c = corners[(start + i * 2) % 4];
        const w = range(rng, 96, 128), h = range(rng, 92, 126);
        buildings.push({ x: bx + c.x + range(rng, -6, 6), y: by + c.y + range(rng, -6, 6), w, h, color: pick(rng, PALETTE.roofs), floors: 2 + Math.floor(rng() * 5) });
      }
    }
  }
  for (let i = 0; i < 130; i++) {
    const x = range(rng, 30, WORLD_W - 30), y = range(rng, 30, WATER_Y - 20);
    if (!isOnRoad(x, y)) palms.push({ x, y, s: range(rng, 0.8, 1.3) });
  }
  for (const cx of xs) for (let y = 60; y < WATER_Y - 40; y += 180) lamps.push({ x: cx + ROAD_W / 2 + 8, y });
  for (const cy of ys) for (let x = 60; x < WORLD_W - 40; x += 220) lamps.push({ x, y: cy + ROAD_W / 2 + 8 });
  const piers = [];
  for (let i = 0; i < 4; i++) piers.push({ x: 420 + i * 680, y: WATER_Y + 40, w: 54, h: 260 });
  function collides(x, y, r) {
    if (x < r || y < r || x > WORLD_W - r || y > WORLD_H - r) return true;
    if (y > WATER_Y + 30) return true; // water blocks movement (piers are visual walkways at edges)
    for (const b of buildings) if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
    return false;
  }
  function carCollides(x, y, r) {
    if (x < r || y < r || x > WORLD_W - r || y > WATER_Y + 10) return true;
    for (const b of buildings) if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
    return false;
  }
  return { buildings, palms, lamps, piers, collides, carCollides, seed };
}
