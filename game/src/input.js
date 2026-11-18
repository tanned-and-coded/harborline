// Keyboard + mouse state: held movement keys, one-shot actions, mouse aim in screen space.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 640, y: 400, down: false, clicked: false };
  window.addEventListener('keydown', (e) => {
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); mouse.down = false; });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / Math.max(1, r.width));
    mouse.y = (e.clientY - r.top) * (canvas.height / Math.max(1, r.height));
  });
  canvas.addEventListener('pointerdown', (e) => { mouse.down = true; mouse.clicked = true; canvas.focus?.(); });
  window.addEventListener('pointerup', () => { mouse.down = false; });
  return {
    keys, mouse,
    down: (...codes) => codes.some(c => keys.has(c)),
    wasPressed: (code) => pressed.has(code),
    moveVec() {
      let x = 0, y = 0;
      if (this.down('KeyA','ArrowLeft')) x -= 1;
      if (this.down('KeyD','ArrowRight')) x += 1;
      if (this.down('KeyW','ArrowUp')) y -= 1;
      if (this.down('KeyS','ArrowDown')) y += 1;
      const len = Math.hypot(x, y) || 1;
      return { x: x / len, y: y / len, active: x !== 0 || y !== 0 };
    },
    endFrame() { pressed.clear(); mouse.clicked = false; },
  };
}
