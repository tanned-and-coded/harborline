// Wanted system and police pursuit: spawn off-screen, intercept, ram; heat cools unseen.
import { WANTED } from './config.js';

export function createWanted() {
  return { stars: 0, heat: 0, unseen: 0, spawnTimer: 0 };
}
export function addCrime(wanted, points) {
  wanted.heat += points;
  wanted.stars = Math.max(wanted.stars, Math.min(WANTED.maxStars, Math.floor(wanted.heat / 30)));
  wanted.unseen = 0;
}
export function updateWanted(wanted, dt, seen) {
  if (wanted.stars <= 0) return;
  if (seen) wanted.unseen = 0; else wanted.unseen += dt;
  if (wanted.unseen > WANTED.coolTime) {
    wanted.stars = Math.max(0, wanted.stars - 1);
    wanted.heat = wanted.stars * 30;
    wanted.unseen = 0;
  }
}
export function makeCop(x, y) {
  return { x, y, angle: 0, speed: 0, color: '#111827', police: true, w: 46, h: 23, ramCooldown: 0 };
}
export function updatePolice(cops, dt, target, world, wanted) {
  const wantCount = wanted.stars === 0 ? 0 : 1 + wanted.stars;
  // Spawn off-screen near the player when under strength.
  wanted.spawnTimer -= dt;
  if (cops.length < wantCount && wanted.spawnTimer <= 0) {
    wanted.spawnTimer = 2.5;
    const a = Math.random() * Math.PI * 2;
    const x = target.x + Math.cos(a) * 720, y = target.y + Math.sin(a) * 520;
    if (!world.carCollides(x, y, 22)) cops.push(makeCop(x, y));
  }
  if (wanted.stars === 0 && cops.length) cops.splice(0, cops.length);
  let seen = false;
  for (const cop of cops) {
    const dx = target.x - cop.x, dy = target.y - cop.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 620) seen = true;
    // Intercept point ahead of the target.
    const lead = Math.min(0.7, dist / 500);
    const tx = target.x + (target.vx || 0) * lead, ty = target.y + (target.vy || 0) * lead;
    const want = Math.atan2(ty - cop.y, tx - cop.x);
    let diff = want - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
    const top = 300 + wanted.stars * 32;
    cop.speed += ((dist > 46 ? top : 60) - cop.speed) * Math.min(1, dt * 1.6);
    const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
    const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
    if (!world.carCollides(nx, ny, 21)) { cop.x = nx; cop.y = ny; }
    else cop.speed = 50;
    cop.ramCooldown = Math.max(0, cop.ramCooldown - dt);
  }
  return seen;
}
