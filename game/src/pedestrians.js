// Pedestrians: stroll on pavements, flee from danger, drop cash when knocked down.
import { WORLD_W } from './config.js';
import { createRandom, pick, range } from './random.js';

const SHIRTS = ['#fff','#ffd32a','#ff6b81','#48dbfb','#1dd1a1','#f368e0','#ff9f43','#54a0ff'];
export function spawnPeds(seed) {
  const rng = createRandom(seed * 17 + 3);
  const peds = [];
  for (let i = 0; i < 34; i++) {
    peds.push({
      x: range(rng, 60, WORLD_W - 60), y: range(rng, 60, 2000),
      angle: rng() * Math.PI * 2, speed: range(rng, 40, 75),
      shirt: pick(rng, SHIRTS), state: 'walk', timer: range(rng, 1, 4), alive: true, cash: 0,
    });
  }
  return peds;
}
export function updatePeds(peds, dt, world, danger) {
  const drops = [];
  for (const p of peds) {
    if (!p.alive) continue;
    const d = danger ? Math.hypot(p.x - danger.x, p.y - danger.y) : 9999;
    if (d < 170) { p.state = 'flee'; p.angle = Math.atan2(p.y - danger.y, p.x - danger.x); }
    else if (p.state === 'flee' && d > 260) p.state = 'walk';
    p.timer -= dt;
    if (p.state === 'walk' && p.timer <= 0) { p.angle = Math.random() * Math.PI * 2; p.timer = 2 + Math.random() * 3; }
    const sp = p.state === 'flee' ? 215 : p.speed;
    const nx = p.x + Math.cos(p.angle) * sp * dt;
    const ny = p.y + Math.sin(p.angle) * sp * dt;
    if (!world.collides(nx, ny, 10)) { p.x = nx; p.y = ny; }
    else p.angle += Math.PI * 0.7;
  }
  return drops;
}
export function knockPed(p, game) {
  if (!p.alive) return 0;
  p.alive = false;
  const cash = 5 + Math.floor(Math.random() * 26);
  game.cashDrops.push({ x: p.x, y: p.y, amount: cash, life: 20 });
  return cash;
}
