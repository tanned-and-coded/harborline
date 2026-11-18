// Harborline — boot, game state, main loop, screens (title / play / pause / over).
import { FONT, PLAYER, WORLD_H, WORLD_W } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { spawnTraffic, updateTraffic, driveCar } from './vehicles.js';
import { spawnPeds, updatePeds } from './pedestrians.js';
import { createWanted, addCrime, updateWanted, updatePolice, makeCop } from './police.js';
import { createCombat, tryMelee, tryShoot, updateCombat } from './combat.js';
import { createMissions, currentTarget, updateMissions, MISSIONS } from './missions.js';
import { drawWorld } from './render.js';
import { drawHUD } from './hud.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(location.search);
const seed = Number.parseInt(params.get('seed') ?? '7', 10) || 7;
const shotName = params.get('shot');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();

const audio = createAudio();
const input = createInput(canvas);
const world = createWorld(seed);

function freshPlayer() {
  return { x: 1620, y: 1420, vx: 0, vy: 0, angle: 0, health: PLAYER.maxHealth, cash: 0, car: null };
}
const game = {
  world, audio, time: 0, screen: shotName ? 'play' : 'title',
  player: freshPlayer(), cars: [], peds: [], cops: [], cashDrops: [],
  wanted: createWanted(), combat: createCombat(), missions: createMissions(),
  armed: false, missionTarget: null, _copFactory: { makeCop },
  onCrime(points) { addCrime(this.wanted, points); },
  setHeat(stars) { this.wanted.stars = Math.max(this.wanted.stars, stars); this.wanted.heat = Math.max(this.wanted.heat, stars * 30); },
  currentTarget() { return currentTarget(this.missions); },
};
game.cars = spawnTraffic(seed, world);
game.peds = spawnPeds(seed);
game.missionTarget = game.currentTarget();

function newGame() {
  game.player = freshPlayer();
  game.wanted = createWanted(); game.cops = []; game.cashDrops = [];
  game.missions = createMissions(); game.armed = false;
  game.cars = spawnTraffic(seed, world); game.peds = spawnPeds(seed);
  game.missionTarget = game.currentTarget();
  game.screen = 'play'; persist();
  if (status) status.textContent = 'Harborline: first job started.';
}
function continueGame() {
  const s = loadGame();
  if (!s) return newGame();
  game.player.x = s.x ?? game.player.x; game.player.y = s.y ?? game.player.y;
  game.player.cash = s.cash ?? 0; game.player.health = s.health ?? 100;
  game.armed = !!s.armed;
  game.missions.index = Math.min(3, s.mission ?? 0);
  game.missions.phase = 'pickup'; game.missions.timer = MISSIONS[game.missions.index].time;
  if (s.mission >= 4) { game.missions.done = true; game.missions.active = false; }
  game.missionTarget = game.currentTarget();
  game.screen = 'play';
}
function persist() {
  saveGame({ x: Math.round(game.player.x), y: Math.round(game.player.y), cash: game.player.cash,
    health: Math.round(game.player.health), mission: game.missions.done ? 4 : game.missions.index, armed: game.armed });
}
let saveTimer = 0;

function enterExitCar() {
  const p = game.player;
  if (p.car) {
    p.car.isPlayerCar = false; p.car.parked = true; p.car.speed = 0;
    p.x = p.car.x + 34; p.y = p.car.y + 10; p.car = null; audio.door();
    return;
  }
  let best = null, bd = 72;
  for (const car of [...game.cars, ...game.cops]) {
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < bd) { bd = d; best = car; }
  }
  if (best) {
    if (best.police) { game.cops = game.cops.filter(c => c !== best); game.cars.push(best); best.police = false; }
    best.isPlayerCar = true; best.parked = false;
    p.car = best; audio.door();
    game.onCrime(30); // theft
    game.missions.message = 'Car taken! Wanted level up.'; game.missions.messageT = 3;
  }
}

function update(dt) {
  game.time += dt;
  const p = game.player;
  // Pause toggle
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    if (game.screen === 'play') game.screen = 'paused';
    else if (game.screen === 'paused') game.screen = 'play';
  }
  if (game.screen !== 'play') return;
  const prevX = p.x, prevY = p.y;
  if (p.car) {
    const crashed = driveCar(p.car, input, dt, world);
    p.x = p.car.x; p.y = p.car.y; p.angle = p.car.angle;
    if (crashed && Math.abs(p.car.speed) > 60) { audio.crash(); game.onCrime(8); }
    // Running over peds / hitting cars while driving
    for (const ped of game.peds) {
      if (ped.alive && Math.hypot(ped.x - p.x, ped.y - p.y) < 30 && Math.abs(p.car.speed) > 90) {
        ped.alive = false; game.cashDrops.push({ x: ped.x, y: ped.y, amount: 10 + Math.floor(Math.random() * 20), life: 20 });
        game.onCrime(34); audio.crash();
      }
    }
  } else {
    const mv = input.moveVec();
    const run = input.down('ShiftLeft', 'ShiftRight');
    const sp = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    if (mv.active) {
      p.angle = Math.atan2(mv.y, mv.x);
      const nx = p.x + mv.x * sp * dt, ny = p.y + mv.y * sp * dt;
      if (!world.collides(nx, p.y, PLAYER.radius)) p.x = nx;
      if (!world.collides(p.x, ny, PLAYER.radius)) p.y = ny;
    }
    if (input.wasPressed('KeyF')) tryMelee(game.combat, p, game.peds, game);
    if (input.mouse.down || input.mouse.clicked) {
      const cam = camera();
      tryShoot(game.combat, p, { x: input.mouse.x + cam.x, y: input.mouse.y + cam.y }, game);
    }
  }
  p.vx = (p.x - prevX) / Math.max(dt, 0.001); p.vy = (p.y - prevY) / Math.max(dt, 0.001);
  if (input.wasPressed('KeyE')) enterExitCar();
  updateTraffic(game.cars, dt, world);
  const danger = (p.car && Math.abs(p.car.speed) > 200) || game.wanted.stars >= 3 ? p : (game.combat.swing > 0 ? p : null);
  updatePeds(game.peds, dt, world, danger);
  updateCombat(game.combat, dt, game.peds, game);
  const seen = updatePolice(game.cops, dt, p, world, game.wanted);
  updateWanted(game.wanted, dt, seen);
  // Police ramming / contact damage + bust pressure
  for (const cop of game.cops) {
    if (Math.hypot(cop.x - p.x, cop.y - p.y) < 40 && cop.ramCooldown <= 0) {
      cop.ramCooldown = 1.1; p.health -= p.car ? 4 : 9; audio.hurt();
      if (game.wanted.stars >= 2 && !p.car) p.health -= 3;
    }
  }
  // Traffic collision damage on foot
  if (!p.car) for (const car of game.cars) {
    if (!car.parked && Math.hypot(car.x - p.x, car.y - p.y) < 28 && Math.abs(car.speed) > 120) { p.health -= 12 * dt * 4; }
  }
  updateMissions(game.missions, dt, p, game);
  game.missionTarget = game.currentTarget();
  saveTimer -= dt;
  if (saveTimer <= 0) { saveTimer = 4; persist(); }
  if (p.health <= 0) { p.health = 0; game.screen = 'over'; }
}

function camera() {
  const p = game.player;
  return {
    x: Math.max(0, Math.min(WORLD_W - canvas.width, p.x - canvas.width / 2)),
    y: Math.max(0, Math.min(WORLD_H - canvas.height, p.y - canvas.height / 2)),
  };
}
function panel(title, lines, prompt, accent = '#ffd94d') {
  ctx.fillStyle = 'rgba(4,14,20,0.72)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const w = 680, h = 120 + lines.length * 36 + 70, x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;
  ctx.fillStyle = 'rgba(8,26,36,0.96)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = accent; ctx.font = `bold 52px ${FONT}`; ctx.fillText(title, canvas.width / 2, y + 76);
  ctx.fillStyle = '#dfe9ee'; ctx.font = `20px ${FONT}`;
  lines.forEach((ln, i) => ctx.fillText(ln, canvas.width / 2, y + 126 + i * 36));
  ctx.fillStyle = '#7bf77b'; ctx.font = `bold 22px ${FONT}`;
  ctx.fillText(prompt, canvas.width / 2, y + h - 28);
}
function draw() {
  const cam = camera();
  drawWorld(ctx, game, cam, canvas.width, canvas.height);
  if (game.screen === 'play' || game.screen === 'paused') drawHUD(ctx, game, canvas.width, canvas.height);
  if (game.screen === 'title') {
    panel('HARBORLINE', [
      'Port Azura — a sun-soaked harbour city of easy money and bad heat.',
      'You are Jett Marlowe, courier. Four jobs. One long day.',
      hasSave() ? 'Continue picks up your saved cash, job and pistol.' : 'Steal cars, dodge the law, get paid.',
      'WASD move • E enter car • F punch • Click shoot • P pause',
    ], hasSave() ? 'Press N for New Game  •  C to Continue' : 'Press N or Enter for New Game', '#ffd94d');
  } else if (game.screen === 'paused') {
    panel('PAUSED', ['The city waits. Your heat does not cool while paused.'], 'Press P or Esc to resume', '#5eb1c9');
  } else if (game.screen === 'over') {
    panel('DOWN AND OUT', [
      `Jett ends the day with $${game.player.cash} and a long walk home.`,
      `Jobs completed: ${game.missions.done ? 4 : game.missions.index} of 4`,
    ], 'Press R to revive at the harbour clinic (-$50)', '#ff5a4d');
  }
}
function handleScreenKeys() {
  if (game.screen === 'title') {
    if (input.wasPressed('KeyN') || input.wasPressed('Enter')) { audio.unlock(); newGame(); }
    else if (input.wasPressed('KeyC') && hasSave()) { audio.unlock(); continueGame(); }
    else if (input.mouse.clicked) { audio.unlock(); hasSave() ? continueGame() : newGame(); }
  } else if (game.screen === 'over') {
    if (input.wasPressed('KeyR') || input.wasPressed('Enter')) {
      game.player.health = 70; game.player.cash = Math.max(0, game.player.cash - 50);
      game.player.x = 1100; game.player.y = 1980; game.player.car = null;
      game.wanted.stars = 0; game.wanted.heat = 0; game.cops = [];
      game.screen = 'play'; persist();
    }
  }
}
if (shotName) applyShot(game, shotName);
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  handleScreenKeys();
  if (!shotName) update(dt); // staged scenes stay exactly as posed for screenshots
  draw();
  input.endFrame();
  if (shotName && !window.__shotReady) { window.__shotReady = true; document.title = 'shot-ready'; }
}
requestAnimationFrame(frame);
