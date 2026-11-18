// Combat: F-key melee swing and mouse-aim pistol bullets, plus cash-drop pickups.
export function createCombat() { return { bullets: [], swing: 0, cooldown: 0 }; }
export function tryMelee(combat, player, peds, game) {
  if (combat.cooldown > 0) return false;
  combat.cooldown = 0.35; combat.swing = 0.22;
  game.audio.punch();
  let hit = false;
  for (const p of peds) {
    if (p.alive && Math.hypot(p.x - player.x, p.y - player.y) < 46) {
      p.alive = false;
      const cash = 5 + Math.floor(Math.random() * 26);
      game.cashDrops.push({ x: p.x, y: p.y, amount: cash, life: 20 });
      hit = true;
    }
  }
  if (hit) game.onCrime(22, 'assault');
  return hit;
}
export function tryShoot(combat, player, aim, game) {
  if (!game.armed || combat.cooldown > 0) return;
  combat.cooldown = 0.22;
  const a = Math.atan2(aim.y - player.y, aim.x - player.x);
  combat.bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 0.6 });
  game.audio.shoot();
  game.onCrime(14, 'shots fired');
}
export function updateCombat(combat, dt, peds, game) {
  combat.cooldown = Math.max(0, combat.cooldown - dt);
  combat.swing = Math.max(0, combat.swing - dt);
  for (const b of combat.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const p of peds) {
      if (p.alive && b.life > 0 && Math.hypot(p.x - b.x, p.y - b.y) < 14) {
        p.alive = false; b.life = 0;
        const cash = 8 + Math.floor(Math.random() * 30);
        game.cashDrops.push({ x: p.x, y: p.y, amount: cash, life: 20 });
        game.onCrime(30, 'assault');
      }
    }
  }
  combat.bullets = combat.bullets.filter(b => b.life > 0);
  // Cash pickups
  for (const d of game.cashDrops) d.life -= dt;
  game.cashDrops = game.cashDrops.filter(d => {
    if (d.life <= 0) return false;
    if (Math.hypot(d.x - game.player.x, d.y - game.player.y) < 30) { game.player.cash += d.amount; game.audio.cash(); return false; }
    return true;
  });
}
