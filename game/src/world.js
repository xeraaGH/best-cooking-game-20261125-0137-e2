// Midnight Crumb — game state and rules.
//
// The kitchen is a three-station pipeline: the mixing bowl, the oven and the
// decorating bench. Each station holds one order at a time, so the player
// plans a route through the kitchen: start the next dough while one bakes,
// pull in the golden window, decorate, serve — while every ticket's patience
// drains. Depth comes from the queue, not from chores.

import {
  CUSTOMERS, GOLD_HI, GOLD_LO, MAX_TICKETS, PALE_LO, BURNT_AT,
  RECIPES, RECIPE_BY_ID, SHIFT_SECONDS, TOPPING_IDS,
} from './config.js';
import { makeRng } from './random.js';

export function createWorld(seed = 20261125) {
  const rng = makeRng(seed);
  const world = {
    seed,
    rng,
    phase: 'title', // title | playing | paused | over
    showHelp: false,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    perfects: 0,
    lost: 0,
    burnt: 0,
    tickets: [],
    focusedId: null,
    bowlId: null,
    ovenId: null,
    benchId: null,
    spawnIn: 12,
    nextTicketId: 1,
    toasts: [],
    particles: [],
    sfxQueue: [],
    shakeT: 0,
    stars: 0,
    lastServe: null,
  };
  return world;
}

export function toast(world, text, kind = 'info') {
  world.toasts.push({ text, age: 0, max: 2.4, kind });
  if (world.toasts.length > 4) world.toasts.shift();
}

export function sfx(world, name) {
  world.sfxQueue.push(name);
}

export function spawnTicket(world) {
  const activeCustomers = new Set(world.tickets.map((t) => t.customerId));
  const freeCustomers = CUSTOMERS.filter((c) => !activeCustomers.has(c.id));
  const customer = world.rng.pick(freeCustomers.length ? freeCustomers : CUSTOMERS);
  const recipe = world.rng.pick(RECIPES);
  // Patience tightens as the shift wears on.
  const maxPatience = Math.max(36, 56 - world.elapsed / 10 + world.rng.range(0, 14));
  const ticket = {
    id: world.nextTicketId,
    recipeId: recipe.id,
    customerId: customer.id,
    patience: maxPatience,
    maxPatience,
    stage: 'waiting', // waiting | mixing | mixed | baking | baked | decorating | ready
    mixAdded: [],
    toppingsAdded: [],
    wrongToppings: 0,
    wrongMix: 0,
    doneness: 0,
    bakeQuality: null, // perfect | good | pale
    focusPulse: 0,
  };
  world.nextTicketId += 1;
  world.tickets.push(ticket);
  return ticket;
}

export function startShift(world) {
  world.phase = 'playing';
  world.showHelp = false;
  world.timeLeft = SHIFT_SECONDS;
  world.elapsed = 0;
  world.score = 0;
  world.coins = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.served = 0;
  world.perfects = 0;
  world.lost = 0;
  world.burnt = 0;
  world.tickets = [];
  world.focusedId = null;
  world.bowlId = null;
  world.ovenId = null;
  world.benchId = null;
  world.spawnIn = 14;
  world.toasts = [];
  world.particles = [];
  world.lastServe = null;
  world.stars = 0;
  spawnTicket(world);
  spawnTicket(world);
  toast(world, 'Shift started — the night creatures are hungry!', 'good');
}

export function focusedTicket(world) {
  return world.tickets.find((t) => t.id === world.focusedId) ?? null;
}

export function ticketAt(world, station) {
  const id = station === 'bowl' ? world.bowlId : station === 'oven' ? world.ovenId : world.benchId;
  return world.tickets.find((t) => t.id === id) ?? null;
}

// Click a ticket on the order board: focus it, or start mixing it if the
// bowl is free and it is still waiting.
export function selectTicket(world, id) {
  const ticket = world.tickets.find((t) => t.id === id);
  if (!ticket || world.phase !== 'playing') return;
  if (ticket.stage === 'waiting') {
    if (world.bowlId !== null) {
      toast(world, 'The bowl is busy — finish that dough first', 'bad');
      sfx(world, 'error');
      return;
    }
    ticket.stage = 'mixing';
    world.bowlId = ticket.id;
    world.focusedId = ticket.id;
    sfx(world, 'pick');
    return;
  }
  world.focusedId = ticket.id;
  sfx(world, 'click');
}

// Add an ingredient from a counter bin. Applies to the focused ticket:
// dough ingredients while mixing, toppings while decorating.
export function addIngredient(world, ingId) {
  if (world.phase !== 'playing') return;
  const ticket = focusedTicket(world);
  if (!ticket) {
    toast(world, 'Tap an order ticket first, then the bins', 'info');
    return;
  }
  const recipe = RECIPE_BY_ID[ticket.recipeId];
  if (ticket.stage === 'mixing') {
    const want = recipe.mix[ticket.mixAdded.length];
    if (ingId === want) {
      ticket.mixAdded.push(ingId);
      sfx(world, 'plop');
      burst(world, 420, 500, '#f3ead2', 6);
      if (ticket.mixAdded.length === recipe.mix.length) {
        ticket.stage = 'mixed';
        sfx(world, 'ovenDing');
        toast(world, `${recipe.name} dough ready — into the oven!`, 'good');
      }
    } else {
      ticket.wrongMix += 1;
      world.shakeT = 0.3;
      sfx(world, 'error');
      const wantName = want.charAt(0).toUpperCase() + want.slice(1);
      toast(world, `Wrong order — the recipe wants ${wantName} next`, 'bad');
    }
    return;
  }
  if (ticket.stage === 'decorating') {
    if (!TOPPING_IDS.includes(ingId)) {
      toast(world, 'That goes in the dough, not on top', 'bad');
      sfx(world, 'error');
      return;
    }
    if (ticket.toppingsAdded.includes(ingId)) {
      toast(world, 'Already on there!', 'bad');
      sfx(world, 'error');
      return;
    }
    ticket.toppingsAdded.push(ingId);
    if (!recipe.toppings.includes(ingId)) {
      ticket.wrongToppings += 1;
      toast(world, 'Not on the ticket — the customer may mind', 'bad');
    } else {
      sfx(world, 'pick');
      burst(world, 1100, 470, '#ffd94d', 6);
    }
    if (recipe.toppings.every((t) => ticket.toppingsAdded.includes(t))) {
      ticket.stage = 'ready';
      sfx(world, 'ovenDing');
      toast(world, `${recipe.name} is plated and ready to serve!`, 'good');
    }
    return;
  }
  toast(world, 'Nothing to add right now — check the oven', 'info');
}

// Pull the dough out of the oven. The focused ticket must be baking.
export function pullOven(world) {
  if (world.phase !== 'playing') return;
  const ticket = ticketAt(world, 'oven');
  if (!ticket || ticket.stage !== 'baking') {
    toast(world, 'Nothing baking yet', 'info');
    return;
  }
  const d = ticket.doneness;
  if (d >= BURNT_AT) {
    burnTicket(world, ticket);
    return;
  }
  if (d >= GOLD_LO && d <= GOLD_HI) ticket.bakeQuality = 'perfect';
  else if (d >= PALE_LO) ticket.bakeQuality = 'good';
  else ticket.bakeQuality = 'pale';
  if (ticket.bakeQuality === 'perfect') {
    sfx(world, 'golden');
    toast(world, 'Golden bake! Perfect pull.', 'good');
    burst(world, 770, 470, '#ffd94d', 14);
  } else if (ticket.bakeQuality === 'good') {
    sfx(world, 'ovenDing');
    toast(world, ticket.doneness < GOLD_LO ? 'A little pale, but servable' : 'A little dark, but servable', 'info');
  } else {
    sfx(world, 'ovenDing');
    toast(world, 'Pale bake — serve it fast, the customer will notice', 'bad');
  }
  if (world.benchId === null) {
    ticket.stage = 'decorating';
    world.benchId = ticket.id;
    world.ovenId = null;
  } else {
    ticket.stage = 'baked';
    world.ovenId = null;
    toast(world, 'Bench is busy — the pastry waits on the tray', 'info');
  }
}

function burnTicket(world, ticket) {
  world.burnt += 1;
  world.combo = 0;
  sfx(world, 'leave');
  toast(world, `Burnt! ${RECIPE_BY_ID[ticket.recipeId].name} goes in the bin — mix it again`, 'bad');
  world.ovenId = null;
  ticket.stage = 'waiting';
  ticket.mixAdded = [];
  ticket.toppingsAdded = [];
  ticket.wrongToppings = 0;
  ticket.doneness = 0;
  ticket.bakeQuality = null;
  ticket.patience = Math.max(8, ticket.patience - 8);
  world.focusedId = ticket.id;
}

// Serve the finished, plated pastry to its customer.
export function serveTicket(world) {
  if (world.phase !== 'playing') return;
  const ticket = focusedTicket(world);
  if (!ticket || ticket.stage !== 'ready') {
    toast(world, 'Nothing plated yet — finish decorating first', 'info');
    return;
  }
  const recipe = RECIPE_BY_ID[ticket.recipeId];
  const perfectBake = ticket.bakeQuality === 'perfect';
  const clean = ticket.wrongToppings === 0 && ticket.wrongMix === 0;
  const isPerfect = perfectBake && clean;
  let pts = recipe.base;
  if (ticket.bakeQuality === 'perfect') pts += 80;
  else if (ticket.bakeQuality === 'good') pts += 30;
  pts += Math.round((ticket.patience / ticket.maxPatience) * 40);
  if (isPerfect) pts += 50;
  const mult = Math.min(2, 1 + world.combo * 0.1);
  pts = Math.round(pts * mult);
  world.combo += isPerfect ? 2 : 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.score += pts;
  world.coins += Math.round(pts / 10);
  world.served += 1;
  if (isPerfect) world.perfects += 1;
  world.lastServe = { points: pts, perfect: isPerfect, name: recipe.name };
  sfx(world, 'serve');
  burst(world, 1100, 430, '#7bc96f', 16);
  toast(world, isPerfect ? `PERFECT! ${recipe.name} +${pts}` : `${recipe.name} served +${pts}`, isPerfect ? 'good' : 'info');
  world.tickets = world.tickets.filter((t) => t.id !== ticket.id);
  world.benchId = null;
  world.focusedId = null;
}

export function burst(world, x, y, color, n) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng.next() * Math.PI * 2;
    const sp = 40 + world.rng.next() * 120;
    world.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: 0.7 + world.rng.next() * 0.5,
      age: 0,
      color,
      size: 2 + world.rng.next() * 4,
    });
  }
}

function endShift(world) {
  world.phase = 'over';
  world.timeLeft = 0;
  world.stars = world.served >= 10 && world.perfects >= 3 ? 3
    : world.served >= 7 ? 2
    : world.served >= 4 ? 1 : 0;
  sfx(world, 'serve');
}

function loseTicket(world, ticket) {
  world.tickets = world.tickets.filter((t) => t.id !== ticket.id);
  if (world.bowlId === ticket.id) world.bowlId = null;
  if (world.ovenId === ticket.id) world.ovenId = null;
  if (world.benchId === ticket.id) world.benchId = null;
  if (world.focusedId === ticket.id) world.focusedId = null;
  world.lost += 1;
  world.combo = 0;
  sfx(world, 'leave');
  toast(world, `${ticket.customerId} walked out — patience ran out`, 'bad');
}

export function update(world, dt) {
  if (world.phase !== 'playing') return;
  world.elapsed += dt;
  world.timeLeft -= dt;
  if (world.shakeT > 0) world.shakeT -= dt;
  for (const p of world.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
  }
  world.particles = world.particles.filter((p) => p.age < p.life);
  for (const t of world.toasts) t.age += dt;
  world.toasts = world.toasts.filter((t) => t.age < t.max);

  // Patience drains on every live ticket; an empty board ends no shift.
  for (const ticket of [...world.tickets]) {
    ticket.patience -= dt;
    if (ticket.focusPulse > 0) ticket.focusPulse -= dt;
    if (ticket.patience <= 0) loseTicket(world, ticket);
  }

  // The oven keeps baking whether or not the player watches it.
  const ovenTicket = ticketAt(world, 'oven');
  if (ovenTicket && ovenTicket.stage === 'baking') {
    const recipe = RECIPE_BY_ID[ovenTicket.recipeId];
    ovenTicket.doneness = Math.min(100, ovenTicket.doneness + (100 / recipe.bake) * dt);
    if (world.rng.next() < dt * 6) {
      world.particles.push({
        x: 770 + world.rng.range(-30, 30), y: 430,
        vx: world.rng.range(-8, 8), vy: -30 - world.rng.next() * 30,
        life: 0.9, age: 0, color: '#cfc3ea', size: 3,
      });
    }
    if (ovenTicket.doneness >= 100) burnTicket(world, ovenTicket);
  }

  // Stations free up: mixed dough slides into a free oven, pulled pastry
  // slides onto a free bench, all on their own.
  if (world.ovenId === null) {
    const mixed = world.tickets.find((t) => t.stage === 'mixed');
    if (mixed) {
      mixed.stage = 'baking';
      mixed.doneness = 0;
      world.ovenId = mixed.id;
      world.bowlId = null;
      sfx(world, 'plop');
    }
  }
  if (world.benchId === null) {
    const baked = world.tickets.find((t) => t.stage === 'baked');
    if (baked) {
      baked.stage = 'decorating';
      world.benchId = baked.id;
    }
  }

  // New orders arrive while the board has room.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    if (world.tickets.length < MAX_TICKETS) {
      spawnTicket(world);
      sfx(world, 'tick');
    }
    world.spawnIn = Math.max(8, 14 - world.elapsed / 30) + world.rng.range(0, 4);
  }

  if (world.timeLeft <= 0) endShift(world);
}
