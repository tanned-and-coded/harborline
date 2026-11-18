// World renderer: ground, roads, harbour, buildings, palms, lamps, cars, peds, player.
import { BLOCK, FONT, PALETTE, ROAD_W, WATER_Y, WORLD_H, WORLD_W } from './config.js';
import { roadCentres } from './world.js';

export function drawWorld(ctx, game, cam, W, H) {
  const { world } = game;
  ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  // Land base + sand strip by the water
  ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, WATER_Y - 60, WORLD_W, 100);
  ctx.fillStyle = PALETTE.water; ctx.fillRect(0, WATER_Y + 40, WORLD_W, WORLD_H - WATER_Y);
  ctx.fillStyle = PALETTE.waterDeep;
  for (let x = 0; x < WORLD_W; x += 220) ctx.fillRect(x, WATER_Y + 180 + ((x * 7) % 160), 120, 10);
  // Piers
  ctx.fillStyle = PALETTE.pier;
  for (const p of world.piers) ctx.fillRect(p.x, p.y, p.w, p.h);
  // Pavement blocks
  ctx.fillStyle = PALETTE.pavement;
  for (let bx = 0; bx < WORLD_W; bx += BLOCK) for (let by = 0; by < WATER_Y - 40; by += BLOCK) ctx.fillRect(bx + 56, by + 56, BLOCK - 112, BLOCK - 112);
  // Roads
  const { xs, ys } = roadCentres();
  ctx.fillStyle = PALETTE.road;
  for (const x of xs) ctx.fillRect(x - ROAD_W / 2, 0, ROAD_W, WATER_Y + 40);
  for (const y of ys) ctx.fillRect(0, y - ROAD_W / 2, WORLD_W, ROAD_W);
  ctx.strokeStyle = PALETTE.roadLine; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
  ctx.beginPath();
  for (const x of xs) { ctx.moveTo(x, 0); ctx.lineTo(x, WATER_Y + 40); }
  for (const y of ys) { ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); }
  ctx.stroke(); ctx.setLineDash([]);
  // Buildings with shadow + windows
  for (const b of world.buildings) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(b.x + 7, b.y + 9, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,220,0.75)';
    const cols = Math.floor(b.w / 34), rows = Math.floor(b.h / 34);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) ctx.fillRect(b.x + 12 + i * 34, b.y + 12 + j * 34, 13, 13);
  }
  // Palms
  for (const p of world.palms) {
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(p.x - 3, p.y - 4, 6, 14);
    ctx.fillStyle = '#2e9e4f';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * 13 * p.s, p.y - 8 + Math.sin(a) * 7 * p.s, 14 * p.s, 5, a, 0, Math.PI * 2); ctx.fill(); }
  }
  // Lamps
  ctx.fillStyle = '#444'; for (const l of world.lamps) ctx.fillRect(l.x - 2, l.y - 2, 4, 4);
  ctx.fillStyle = '#ffe9a3'; for (const l of world.lamps) { ctx.beginPath(); ctx.arc(l.x, l.y, 4, 0, Math.PI * 2); ctx.fill(); }
  // Mission marker beacon
  const t = game.missionTarget;
  if (t) {
    const pulse = 16 + Math.sin(game.time * 5) * 5;
    ctx.fillStyle = 'rgba(255,217,77,0.35)'; ctx.beginPath(); ctx.arc(t.x, t.y, pulse + 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd94d'; ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = `bold 17px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('!', t.x, t.y + 6);
    ctx.fillStyle = '#fff'; ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(t.label, t.x, t.y - 34);
  }
  // Cash drops
  for (const d of game.cashDrops) { ctx.fillStyle = '#2ecc71'; ctx.fillRect(d.x - 8, d.y - 6, 16, 12); ctx.fillStyle = '#fff'; ctx.font = `bold 10px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('$', d.x, d.y + 4); }
  // Cars
  for (const car of game.cars) drawCar(ctx, car, false);
  for (const cop of game.cops) drawCar(ctx, cop, true);
  // Peds
  for (const p of game.peds) {
    if (!p.alive) { ctx.fillStyle = 'rgba(120,30,30,0.8)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 13, 7, 0, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.shirt; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c79b'; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Bullets
  ctx.fillStyle = '#ffe66d';
  for (const b of game.combat.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2); ctx.fill(); }
  // Player (hidden while driving — drawn as the car)
  const pl = game.player;
  if (!pl.car) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(pl.x, pl.y + 10, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4757'; ctx.beginPath(); ctx.arc(pl.x, pl.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f2c79b'; ctx.beginPath(); ctx.arc(pl.x, pl.y - 3, 6.5, 0, Math.PI * 2); ctx.fill();
    // Aim / swing indicator
    if (game.combat.swing > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(pl.x, pl.y, 30, pl.angle - 0.8, pl.angle + 0.8); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('JETT', pl.x, pl.y - 26);
  }
  ctx.restore();
}
export function drawCar(ctx, car, police) {
  ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-car.w / 2 + 4, -car.h / 2 + 6, car.w, car.h);
  ctx.fillStyle = police ? '#16202c' : car.color;
  ctx.beginPath(); ctx.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 7); ctx.fill();
  if (police) { ctx.fillStyle = '#f5f6fa'; ctx.fillRect(-car.w / 2, -car.h / 2, car.w, 6); ctx.fillRect(-car.w / 2, car.h / 2 - 6, car.w, 6); }
  ctx.fillStyle = '#bfe9ff'; ctx.fillRect(-6, -car.h / 2 + 3, 15, car.h - 6);
  ctx.fillStyle = '#7fb8cc'; ctx.fillRect(12, -car.h / 2 + 3, 8, car.h - 6);
  ctx.fillStyle = '#111';
  for (const [wx, wy] of [[-15, -car.h / 2], [15, -car.h / 2], [-15, car.h / 2], [15, car.h / 2]]) ctx.fillRect(wx - 5, wy - 2, 10, 4);
  if (police) {
    const flash = Math.floor(performance.now() / 280) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2d2d' : '#2d7bff'; ctx.fillRect(-7, -5, 14, 10);
    ctx.fillStyle = '#fff'; ctx.font = `bold 9px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('POLICE', 0, 3);
  }
  ctx.restore();
}
