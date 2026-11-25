// Midnight Crumb — deterministic screenshot states. `?shot=start|play|serve|end`
// poses the game for its screenshots: real renders of the game's own code,
// with the timer, the order board, ingredients on the counter, a dish
// mid-assembly and a plate ready to serve visible across the set.

import { RECIPE_BY_ID } from './config.js';
import { spawnTicket, startShift, toast } from './world.js';

function poseTicket(world, index, stage, patch) {
  const ticket = world.tickets[index];
  if (!ticket) return null;
  Object.assign(ticket, patch);
  ticket.stage = stage;
  return ticket;
}

export function applyShot(world, name) {
  startShift(world);
  // A busy, readable kitchen: three orders on the board from the start.
  spawnTicket(world);
  if (name === 'start') {
    world.phase = 'title';
    world.timeLeft = 180;
    world.score = 0;
    world.toasts = [];
    return;
  }
  if (name === 'play') {
    world.phase = 'playing';
    world.timeLeft = 134;
    world.elapsed = 46;
    world.score = 1240;
    world.coins = 118;
    world.combo = 3;
    world.bestCombo = 4;
    // Ticket 1: dough baking in the golden window.
    const bake = poseTicket(world, 0, 'baking', { doneness: 71, mixAdded: [...RECIPE_BY_ID[world.tickets[0].recipeId].mix] });
    // Ticket 2: mid-mix in the bowl, two of three ingredients in.
    const mix = poseTicket(world, 1, 'mixing', { mixAdded: RECIPE_BY_ID[world.tickets[1].recipeId].mix.slice(0, 2) });
    // Ticket 3: waiting, patience already half gone.
    poseTicket(world, 2, 'waiting', { patience: 26, maxPatience: 58 });
    if (bake) { world.ovenId = bake.id; world.focusedId = bake.id; }
    if (mix) world.bowlId = mix.id;
    toast(world, 'Golden bake! Perfect pull.', 'good');
    return;
  }
  if (name === 'serve') {
    world.phase = 'playing';
    world.timeLeft = 62;
    world.elapsed = 118;
    world.score = 2890;
    world.coins = 264;
    world.combo = 5;
    world.bestCombo = 6;
    // A finished, fully topped pastry on the bench, ready to serve.
    const done = poseTicket(world, 0, 'ready', {
      doneness: 72,
      bakeQuality: 'perfect',
      mixAdded: [...RECIPE_BY_ID[world.tickets[0].recipeId].mix],
      toppingsAdded: [...RECIPE_BY_ID[world.tickets[0].recipeId].toppings],
    });
    poseTicket(world, 1, 'waiting', { patience: 40, maxPatience: 62 });
    poseTicket(world, 2, 'waiting', { patience: 18, maxPatience: 55 });
    if (done) { world.benchId = done.id; world.focusedId = done.id; }
    toast(world, `${RECIPE_BY_ID[world.tickets[0].recipeId].name} is plated and ready to serve!`, 'good');
    return;
  }
  if (name === 'end') {
    world.phase = 'over';
    world.timeLeft = 0;
    world.score = 4310;
    world.coins = 402;
    world.served = 11;
    world.perfects = 5;
    world.bestCombo = 7;
    world.combo = 0;
    world.lost = 1;
    world.burnt = 1;
    world.stars = 3;
    world.lastServe = { points: 420, perfect: true, name: 'Moon Bun' };
    return;
  }
  // Unknown shot: just play.
  world.phase = 'playing';
}
