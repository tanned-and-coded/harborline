// Cars: parked cars, traffic AI following the road grid, and arcade driving physics.
import { CAR, WORLD_W } from './config.js';
import { createRandom, pick, range } from './random.js';
import { roadCentres } from './world.js';

const COLORS = ['#e74c3c','#3498db','#f1c40f','#ecf0f1','#9b59b6','#1abc9c','#e67e22','#fd79a8','#636e72'];
let nextId = 1;
export function makeCar(x, y, angle, color, parked = false) {
  return { id: nextId++, x, y, angle, speed: 0, color, parked, driver: !parked, w: 44, h: 22, targetX: x, targetY: y, stuck: 0 };
}
export function spawnTraffic(seed, world) {
  const rng = createRandom(seed * 31 + 7);
  const { xs, ys } = roadCentres();
  const cars = [];
  for (let i = 0; i < 26; i++) {
    const horiz = rng() > 0.5;
    const x = horiz ? range(rng, 80, WORLD_W - 80) : pick(rng, xs) + range(rng, -14, 14);
    const y = horiz ? pick(rng, ys) + range(rng, -14, 14) : range(rng, 80, 1900);
    cars.push(makeCar(x, y, horiz ? (rng() > 0.5 ? 0 : Math.PI) : (rng() > 0.5 ? Math.PI / 2 : -Math.PI / 2), pick(rng, COLORS)));
  }
  for (let i = 0; i < 14; i++) {
    const b = pick(rng, world.buildings);
    cars.push(makeCar(b.x + b.w / 2, b.y + b.h + 26, 0, pick(rng, COLORS), true));
  }
  return cars;
}
function nearestRoadTarget(car) {
  const { xs, ys } = roadCentres();
  const onV = xs.some(c => Math.abs(car.x - c) < 50);
  const onH = ys.some(c => Math.abs(car.y - c) < 50);
  // At an intersection, sometimes turn.
  if (onV && onH && Math.random() < 0.012) {
    car.angle = pick(Math.random, [0, Math.PI, Math.PI / 2, -Math.PI / 2]);
  }
  const dist = 260;
  return { x: car.x + Math.cos(car.angle) * dist, y: car.y + Math.sin(car.angle) * dist };
}
export function updateTraffic(cars, dt, world) {
  for (const car of cars) {
    if (car.parked || car.isPlayerCar) continue;
    const t = nearestRoadTarget(car);
    const want = Math.atan2(t.y - car.y, t.x - car.x);
    let diff = want - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
    const cruise = 150;
    car.speed += (cruise - car.speed) * Math.min(1, dt * 1.5);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!world.carCollides(nx, ny, 20)) { car.x = nx; car.y = ny; car.stuck = 0; }
    else { car.stuck += dt; car.speed = 40; if (car.stuck > 0.6) { car.angle += Math.PI * 0.9; car.stuck = 0; } }
  }
}
export function driveCar(car, input, dt, world) {
  const up = input.down('KeyW', 'ArrowUp'), down = input.down('KeyS', 'ArrowDown');
  const left = input.down('KeyA', 'ArrowLeft'), right = input.down('KeyD', 'ArrowRight');
  if (up) car.speed += CAR.accel * dt;
  else if (down) car.speed -= (car.speed > 10 ? CAR.brake : CAR.accel * 0.6) * dt;
  else car.speed -= car.speed * 1.4 * dt;
  car.speed = Math.max(-CAR.reverse, Math.min(CAR.maxSpeed, car.speed));
  if (Math.abs(car.speed) > 4) {
    const dir = car.speed > 0 ? 1 : -1;
    if (left) car.angle -= CAR.turnRate * dt * dir * Math.min(1, Math.abs(car.speed) / 160);
    if (right) car.angle += CAR.turnRate * dt * dir * Math.min(1, Math.abs(car.speed) / 160);
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (!world.carCollides(nx, ny, 20)) { car.x = nx; car.y = ny; return false; }
  car.speed *= -0.25;
  return true; // crashed
}
