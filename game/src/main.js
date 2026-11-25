// Midnight Crumb — boot and game loop. Wires the canvas, the input handler,
// the world and the sound together; renders at the display's refresh rate
// and scales the fixed 1280x800 kitchen to the window.

import { H, W } from './config.js';
import { Sfx } from './audio.js';
import { handleClick, handleKey } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { createWorld, update } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const sfx = new Sfx();

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 20261125) || 20261125;
const shot = params.get('shot');
const world = createWorld(seed);
world.sfxMuted = false;

let hover = null;

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  const p = toLogical(event);
  handleClick(world, p.x, p.y, sfx);
});
canvas.addEventListener('pointermove', (event) => {
  hover = toLogical(event);
});
canvas.addEventListener('pointerleave', () => {
  hover = null;
});
window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  handleKey(world, event.key, sfx);
});
window.addEventListener('resize', fitCanvas);

function drainSfx() {
  while (world.sfxQueue.length) {
    const name = world.sfxQueue.shift();
    if (typeof sfx[name] === 'function') sfx[name]();
  }
}

function announce() {
  if (!statusEl) return;
  const t = world.tickets.find((ticket) => ticket.id === world.focusedId);
  statusEl.textContent = world.phase === 'playing'
    ? `Time left ${Math.ceil(world.timeLeft)} seconds. Score ${world.score}. ${world.tickets.length} orders. ${t ? `Working on ${t.stage}.` : 'No order selected.'}`
    : world.phase === 'over'
      ? `Shift over. Score ${world.score}, ${world.served} pastries served.`
      : 'Midnight Crumb. Press Enter to start the shift.';
}

fitCanvas();

if (shot) {
  // Screenshot mode: pose a deterministic state and render one frame.
  applyShot(world, shot);
  world.sfxMuted = sfx.muted;
  render(ctx, world, null);
  announce();
} else {
  let last = performance.now();
  let announceT = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    update(world, dt);
    drainSfx();
    world.sfxMuted = sfx.muted;
    render(ctx, world, hover);
    announceT += dt;
    if (announceT > 1) {
      announceT = 0;
      announce();
    }
    requestAnimationFrame(frame);
  }
  render(ctx, world, hover);
  requestAnimationFrame(frame);
}
