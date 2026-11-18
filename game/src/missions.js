// Four-mission story chain for courier Jett Marlowe in Port Azura.
export const MISSIONS = [
  { title: 'First Run', brief: 'Pick up the parcel at Old Market, then deliver it to Marina Row.',
    pickup: { x: 620, y: 620, label: 'Parcel — Old Market' }, drop: { x: 620, y: 1420, label: 'Drop — Marina Row' },
    time: 110, pay: 150, needCar: false },
  { title: 'Borrowed Wheels', brief: 'Take the marked car in Palm Heights and deliver it to North Yards.',
    pickup: { x: 1620, y: 620, label: 'Marked car — Palm Heights' }, drop: { x: 2620, y: 620, label: 'Garage — North Yards' },
    time: 120, pay: 300, needCar: true },
  { title: 'Hot Cargo', brief: 'Collect the crate at City Centre and make the dockside drop while the heat is on.',
    pickup: { x: 1620, y: 1320, label: 'Crate — City Centre' }, drop: { x: 2620, y: 1420, label: 'Drop — Dockside' },
    time: 115, pay: 500, needCar: false, heat: 2 },
  { title: 'Harborline Finale', brief: 'Grab the last package at Dockside and escape to the pier at The Harbour.',
    pickup: { x: 2620, y: 1420, label: 'Package — Dockside' }, drop: { x: 1100, y: 1980, label: 'Pier — The Harbour' },
    time: 130, pay: 900, needCar: false, heat: 3 },
];
export function createMissions() {
  return { index: 0, phase: 'pickup', timer: MISSIONS[0].time, active: true, done: false, message: '', messageT: 0 };
}
export function currentTarget(m) {
  if (!m.active || m.done) return null;
  const def = MISSIONS[m.index];
  return m.phase === 'pickup' ? def.pickup : def.drop;
}
export function updateMissions(m, dt, player, game) {
  if (!m.active || m.done) return;
  m.messageT = Math.max(0, m.messageT - dt);
  m.timer -= dt;
  if (m.timer <= 0) { // fail: restart current mission with fresh time, small cash penalty
    m.phase = 'pickup'; m.timer = MISSIONS[m.index].time;
    player.cash = Math.max(0, player.cash - 25);
    m.message = 'Time up — the job restarts. -$25'; m.messageT = 4;
    return;
  }
  const t = currentTarget(m);
  if (!t) return;
  const inCar = !!player.car;
  if (Math.hypot(player.x - t.x, player.y - t.y) < 58 && (!MISSIONS[m.index].needCar || m.phase === 'pickup' || inCar)) {
    const def = MISSIONS[m.index];
    if (m.phase === 'pickup') {
      m.phase = 'drop'; m.timer = def.time;
      m.message = def.needCar ? 'Car secured — deliver it!' : 'Picked up — get to the drop!';
      m.messageT = 4;
      if (def.heat) game.setHeat(def.heat);
      game.audio.success();
    } else {
      player.cash += def.pay;
      m.message = `Job done: +$${def.pay} — ${def.title} complete!`;
      m.messageT = 5;
      game.audio.success();
      if (m.index === 1) { game.armed = true; m.message += ' Pistol earned — click to shoot.'; }
      m.index += 1;
      if (m.index >= MISSIONS.length) { m.done = true; m.active = false; m.message = 'All jobs done — Port Azura is yours. Free roam!'; m.messageT = 8; }
      else { m.phase = 'pickup'; m.timer = MISSIONS[m.index].time; }
    }
  }
}
export function objectiveText(m) {
  if (m.done) return 'Free roam — Port Azura is yours';
  if (!m.active) return 'No active job';
  const def = MISSIONS[m.index];
  const t = currentTarget(m);
  return `${def.title}: ${m.phase === 'pickup' ? 'Go to' : 'Deliver to'} ${t.label}`;
}
