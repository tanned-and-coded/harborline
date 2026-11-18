// Deterministic staged scenes for screenshots: ?shot=cover|city|drive|chase&seed=7
// Each scene positions the player, traffic, peds, police, wanted level and mission
// instantly so a single frame shows several systems at once.
export function applyShot(game, name) {
  const p = game.player;
  game.screen = 'play';
  if (name === 'city') {
    p.x = 600; p.y = 1000; p.cash = 240; game.missions.index = 0; game.missions.phase = 'pickup';
    game.armed = false;
    scatter(game, p.x, p.y);
  } else if (name === 'drive') {
    p.x = 1800; p.y = 1400; p.cash = 450; game.missions.index = 1; game.missions.phase = 'drop';
    game.armed = true;
    const car = game.cars.find(c => !c.parked) || game.cars[0];
    car.x = p.x; car.y = p.y; car.angle = 0; car.speed = 300; car.isPlayerCar = true; car.color = '#e84118';
    p.car = car; p.x = car.x; p.y = car.y;
    scatter(game, p.x, p.y);
  } else if (name === 'chase') {
    p.x = 2380; p.y = 1400; p.cash = 780; p.health = 64;
    game.missions.index = 2; game.missions.phase = 'drop'; game.missions.timer = 74;
    game.armed = true;
    game.wanted.stars = 4; game.wanted.heat = 130;
    const car = game.cars.find(c => !c.parked) || game.cars[0];
    car.x = p.x; car.y = p.y; car.angle = 0; car.speed = 330; car.isPlayerCar = true; car.color = '#e84118';
    p.car = car; p.x = car.x; p.y = car.y;
    const { makeCop } = game._copFactory;
    game.cops.push(makeCop(p.x - 210, p.y - 26), makeCop(p.x - 340, p.y + 28), makeCop(p.x - 120, p.y - 130), makeCop(p.x + 430, p.y + 4));
    for (const c of game.cops) c.angle = 0;
    scatter(game, p.x, p.y);
  } else { // cover
    p.x = 1620; p.y = 1290; p.cash = 120; game.missions.index = 0; game.missions.phase = 'pickup';
    scatter(game, p.x, p.y);
  }
  game.missionTarget = game.currentTarget();
}
function scatter(game, cx, cy) {
  // Pull a lively crowd of peds and traffic near the camera, retrying any spot
  // that lands inside a building so nothing sits on a rooftop.
  let placed = 0;
  for (const ped of game.peds) {
    if (placed >= 14) break;
    for (let tries = 0; tries < 12; tries++) {
      const x = cx + ((placed * 137 + tries * 61) % 620) - 310;
      const y = cy + ((placed * 211 + tries * 47) % 420) - 210;
      if (!game.world.collides(x, y, 10)) { ped.x = x; ped.y = y; placed++; break; }
    }
  }
  let done = 0;
  for (const car of game.cars) {
    if (car.isPlayerCar || done >= 7) continue;
    for (let tries = 0; tries < 12; tries++) {
      const x = cx + ((done * 173 + tries * 83) % 680) - 340;
      const y = cy + ((done * 149 + tries * 59) % 340) - 170;
      if (!game.world.carCollides(x, y, 22)) { car.x = x; car.y = y; car.parked = false; done++; break; }
    }
  }
}
