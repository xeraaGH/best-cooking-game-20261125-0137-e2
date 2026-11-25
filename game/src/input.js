// Midnight Crumb — input: mouse clicks and keyboard, mapped onto the same
// layout rectangles the renderer draws.

import { INGREDIENTS, LAYOUT } from './config.js';
import {
  addIngredient, focusedTicket, pullOven, selectTicket, serveTicket,
  startShift,
} from './world.js';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function binRect(i) {
  const { bins, binW, binH, binGap } = LAYOUT;
  return { x: bins.x + i * (binW + binGap), y: bins.y, w: binW, h: binH };
}

export function ticketRect(i) {
  const { board, ticketH } = LAYOUT;
  return { x: board.x + 10, y: board.y + 34 + i * (ticketH + 8), w: board.w - 20, h: ticketH };
}

// Map a click in logical canvas coordinates to a game action. Returns true
// when the click did something.
export function handleClick(world, x, y, sfx) {
  if (world.phase === 'title') {
    if (inside(x, y, LAYOUT.startBtn)) {
      sfx.ensure();
      startShift(world);
      return true;
    }
    return false;
  }
  if (world.phase === 'over') {
    if (inside(x, y, LAYOUT.startBtn)) {
      sfx.ensure();
      startShift(world);
      return true;
    }
    return false;
  }
  if (world.phase === 'paused') {
    if (inside(x, y, LAYOUT.startBtn)) {
      world.phase = 'playing';
      return true;
    }
    return false;
  }

  // Top bar buttons.
  if (inside(x, y, LAYOUT.muteBtn)) {
    sfx.muted = !sfx.muted;
    return true;
  }
  if (inside(x, y, LAYOUT.helpBtn)) {
    world.showHelp = !world.showHelp;
    return true;
  }
  if (world.showHelp) {
    world.showHelp = false;
    return true;
  }

  // Order board tickets.
  for (let i = 0; i < world.tickets.length; i += 1) {
    if (inside(x, y, ticketRect(i))) {
      selectTicket(world, world.tickets[i].id);
      return true;
    }
  }

  // Serve button (only when a finished plate waits on the bench).
  const benchTicket = world.tickets.find((t) => t.id === world.benchId);
  if (benchTicket && benchTicket.stage === 'ready' && inside(x, y, LAYOUT.serveBtn)) {
    serveTicket(world);
    return true;
  }
  // Clicking the plated pastry itself also serves it.
  if (benchTicket && benchTicket.stage === 'ready' && inside(x, y, LAYOUT.bench)) {
    serveTicket(world);
    return true;
  }

  // Oven: click to pull the bake.
  const ovenTicket = world.tickets.find((t) => t.id === world.ovenId);
  if (ovenTicket && ovenTicket.stage === 'baking' && inside(x, y, LAYOUT.oven)) {
    world.focusedId = ovenTicket.id;
    pullOven(world);
    return true;
  }

  // Ingredient bins.
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (inside(x, y, binRect(i))) {
      sfx.ensure();
      addIngredient(world, INGREDIENTS[i].id);
      return true;
    }
  }

  // Clicking a station focuses the ticket working there.
  const bowlTicket = world.tickets.find((t) => t.id === world.bowlId);
  if (bowlTicket && inside(x, y, LAYOUT.bowl)) {
    world.focusedId = bowlTicket.id;
    return true;
  }
  if (ovenTicket && inside(x, y, LAYOUT.oven)) {
    world.focusedId = ovenTicket.id;
    return true;
  }
  if (benchTicket && inside(x, y, LAYOUT.bench)) {
    world.focusedId = benchTicket.id;
    return true;
  }
  return false;
}

// Keyboard: 1-8 bins, Space context action, Enter start, R restart,
// Esc/P pause, M mute.
export function handleKey(world, key, sfx) {
  const k = key.toLowerCase();
  if (world.phase === 'title' && (k === 'enter' || k === ' ')) {
    sfx.ensure();
    startShift(world);
    return;
  }
  if (world.phase === 'over' && (k === 'r' || k === 'enter' || k === ' ')) {
    sfx.ensure();
    startShift(world);
    return;
  }
  if (world.phase !== 'playing' && world.phase !== 'paused') return;
  if (k === 'escape' || k === 'p') {
    world.phase = world.phase === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (world.phase !== 'playing') return;
  if (k === 'm') {
    sfx.muted = !sfx.muted;
    return;
  }
  const binIndex = ['1', '2', '3', '4', '5', '6', '7', '8'].indexOf(k);
  if (binIndex >= 0) {
    sfx.ensure();
    addIngredient(world, INGREDIENTS[binIndex].id);
    return;
  }
  if (k === ' ') {
    const t = focusedTicket(world);
    if (t && t.stage === 'baking') pullOven(world);
    else if (t && t.stage === 'ready') serveTicket(world);
    else if (world.tickets.length) selectTicket(world, world.tickets[0].id);
  }
}
