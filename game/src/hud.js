// HUD overlay: district, objective + timer, health, cash, wanted stars, minimap, banners.
import { DISTRICTS, FONT, WATER_Y, WORLD_H, WORLD_W } from './config.js';
import { districtAt, roadCentres } from './world.js';
import { objectiveText } from './missions.js';

function starsText(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
export function drawHUD(ctx, game, W, H) {
  const { player, missions, wanted } = game;
  ctx.textBaseline = 'top';
  // Top-left panel: district + objective + timer
  ctx.fillStyle = 'rgba(8,20,28,0.78)';
  ctx.fillRect(14, 14, 560, missions.active && !missions.done ? 108 : 78);
  ctx.fillStyle = '#ffd94d'; ctx.font = `bold 25px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText(districtAt(player.x, player.y).toUpperCase(), 28, 24);
  ctx.fillStyle = '#ffffff'; ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(objectiveText(missions), 28, 58);
  if (missions.active && !missions.done) {
    const t = Math.max(0, Math.ceil(missions.timer));
    ctx.fillStyle = t < 20 ? '#ff5a4d' : '#9fe870';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`Time left: ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}   •   Job ${Math.min(4, missions.index + 1)} of 4`, 28, 88);
  }
  // Top-right: cash, health, stars
  ctx.fillStyle = 'rgba(8,20,28,0.78)'; ctx.fillRect(W - 304, 14, 290, 108);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#7bf77b'; ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(`$${player.cash}`, W - 28, 22);
  ctx.fillStyle = wanted.stars > 0 ? '#ffd94d' : '#5a6a72'; ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(starsText(wanted.stars), W - 28, 58);
  // Health bar
  ctx.fillStyle = '#3a2020'; ctx.fillRect(W - 276, 100, 248, 13);
  ctx.fillStyle = player.health > 30 ? '#e8452c' : '#ff2020';
  ctx.fillRect(W - 276, 100, 248 * Math.max(0, player.health) / 100, 13);
  ctx.fillStyle = '#fff'; ctx.font = `bold 12px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText('HEALTH', W - 276, 88);
  // Message banner
  if (missions.messageT > 0 && missions.message) {
    ctx.fillStyle = 'rgba(8,20,28,0.85)';
    const w = Math.min(900, 30 + missions.message.length * 11);
    ctx.fillRect((W - w) / 2, H - 168, w, 44);
    ctx.fillStyle = '#ffd94d'; ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(missions.message, W / 2, H - 158);
  }
  // Controls hint
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = `15px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText(game.player.car ? 'Drive: WASD • Exit car: E • Pause: P' : 'Move: WASD • Run: Shift • Enter car: E • Punch: F • Shoot: click (when armed) • Pause: P', 16, H - 26);
  drawMinimap(ctx, game, W, H);
}
export function drawMinimap(ctx, game, W, H) {
  const mw = 218, mh = 178, mx = W - mw - 14, my = H - mh - 14;
  const sx = mw / WORLD_W, sy = mh / WORLD_H;
  ctx.fillStyle = 'rgba(10,26,34,0.88)'; ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
  ctx.fillStyle = '#5d9450'; ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#1e82ad'; ctx.fillRect(mx, my + WATER_Y * sy, mw, mh - WATER_Y * sy);
  ctx.strokeStyle = '#4a5058'; ctx.lineWidth = 3;
  const { xs, ys } = roadCentres();
  ctx.beginPath();
  for (const x of xs) { ctx.moveTo(mx + x * sx, my); ctx.lineTo(mx + x * sx, my + WATER_Y * sy); }
  for (const y of ys) { ctx.moveTo(mx, my + y * sy); ctx.lineTo(mx + WORLD_W * sx, my + y * sy); }
  ctx.stroke();
  // Mission marker
  const t = game.missionTarget;
  if (t) {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.arc(mx + t.x * sx, my + t.y * sy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
  }
  // Police blips
  ctx.fillStyle = '#3d8bff';
  for (const c of game.cops) { ctx.beginPath(); ctx.arc(mx + c.x * sx, my + c.y * sy, 4, 0, Math.PI * 2); ctx.fill(); }
  // Cash drops
  ctx.fillStyle = '#7bf77b';
  for (const d of game.cashDrops) ctx.fillRect(mx + d.x * sx - 2, my + d.y * sy - 2, 4, 4);
  // Player arrow
  const px = mx + game.player.x * sx, py = my + game.player.y * sy;
  const a = game.player.car ? game.player.car.angle : game.player.angle;
  ctx.save(); ctx.translate(px, py); ctx.rotate(a);
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = `bold 11px ${'system-ui, sans-serif'}`; ctx.textAlign = 'left';
  ctx.fillText('PORT AZURA', mx + 4, my + mh - 16);
}
export { DISTRICTS };
