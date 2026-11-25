// Midnight Crumb — renderer. All art is drawn with canvas vector shapes at
// run time: original art, no image files, no network.

import {
  CUSTOMERS, GOLD_HI, GOLD_LO, INGREDIENTS, ING_BY_ID, LAYOUT, PALETTE,
  RECIPES, RECIPE_BY_ID, W,
} from './config.js';
import { binRect, ticketRect } from './input.js';
import { focusedTicket } from './world.js';

const CUSTOMER_BY_ID = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]));

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bakeColor(doneness) {
  // Pale -> golden -> burnt.
  if (doneness < GOLD_LO) {
    const t = doneness / GOLD_LO;
    return mixColor('#f3e2b8', '#e8a83c', t);
  }
  if (doneness <= GOLD_HI) return '#dd9430';
  const t = Math.min(1, (doneness - GOLD_HI) / (100 - GOLD_HI));
  return mixColor('#c07a24', '#2e1a0c', t);
}

function mixColor(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${out[0]},${out[1]},${out[2]})`;
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One pastry, drawn at (x, y) with radius r. doneness colours the crust;
// toppings are drawn on top.
export function drawPastry(ctx, recipeId, x, y, r, doneness = 72, toppings = []) {
  const crust = bakeColor(doneness);
  const dark = mixColor(crust, '#000000', 0.25);
  ctx.save();
  ctx.translate(x, y);
  if (recipeId === 'croissant') {
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, -r * 1.5, r, 0);
    ctx.quadraticCurveTo(0, -r * 0.4, -r, 0);
    ctx.fill();
    ctx.fillStyle = dark;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.45, -r * 0.45, r * 0.16, r * 0.34, i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (recipeId === 'cinnamon') {
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0.6, Math.PI * 1.8);
    ctx.stroke();
  } else if (recipeId === 'jamtart') {
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f3ead2';
    ctx.lineWidth = r * 0.1;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, i * r * 0.45);
      ctx.lineTo(r * 0.55, i * r * 0.45);
      ctx.stroke();
    }
  } else if (recipeId === 'chocloaf') {
    ctx.fillStyle = crust;
    rr(ctx, -r, -r * 0.62, r * 2, r * 1.24, r * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    for (let i = 0; i <= 4; i += 1) {
      const px = -r * 0.8 + i * r * 0.4;
      ctx.moveTo(px, -r * 0.3);
      ctx.lineTo(px + r * 0.2, r * 0.3);
    }
    ctx.stroke();
  } else if (recipeId === 'moonbun') {
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.25, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.arc(r * 0.05, -r * 0.4, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    for (const [sx, sy] of [[-0.6, 0.5], [0.1, 0.6], [0.6, 0.35]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else { // starscone
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.95, r * 0.7);
    ctx.lineTo(-r * 0.95, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6b4226';
    for (const [sx, sy] of [[-0.3, 0.1], [0.25, 0.3], [0, -0.3]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Toppings on top.
  for (const top of toppings) {
    const g = ING_BY_ID[top];
    if (top === 'glaze') {
      ctx.strokeStyle = '#eaf7ff';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.2);
      ctx.quadraticCurveTo(0, -r * 0.7, r * 0.7, -r * 0.15);
      ctx.stroke();
    } else if (top === 'jam') {
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(r * 0.3, r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (top === 'choc') {
      ctx.fillStyle = g.color;
      for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(-r * 0.6 + i * r * 0.26, -r * 0.5 + (i % 2) * r * 0.2, r * 0.14, r * 0.14);
      }
    } else if (top === 'cinnamon') {
      ctx.strokeStyle = g.color;
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.4);
      ctx.lineTo(r * 0.5, -r * 0.4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// One night-creature customer face. mood: 0 (furious) .. 1 (delighted).
export function drawCreature(ctx, customer, x, y, r, mood = 0.7) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = customer.fur;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  if (customer.kind === 'owl' || customer.kind === 'cat' || customer.kind === 'fox' || customer.kind === 'bat') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, -r * 0.55);
    ctx.lineTo(-r * 0.35, -r * 1.15);
    ctx.lineTo(-r * 0.05, -r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.75, -r * 0.55);
    ctx.lineTo(r * 0.35, -r * 1.15);
    ctx.lineTo(r * 0.05, -r * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  if (customer.kind === 'moth') {
    ctx.fillStyle = customer.accent;
    ctx.beginPath();
    ctx.ellipse(-r * 0.9, -r * 0.7, r * 0.45, r * 0.7, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.9, -r * 0.7, r * 0.45, r * 0.7, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = customer.fur;
  }
  if (customer.kind === 'raccoon') {
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, -r * 0.15, r * 0.42, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.4, -r * 0.15, r * 0.42, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = customer.belly;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.45, r * 0.62, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  const eyeY = -r * 0.2;
  const eyeR = r * 0.2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-r * 0.38, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.38, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1329';
  const look = mood < 0.35 ? -r * 0.06 : 0;
  ctx.beginPath(); ctx.arc(-r * 0.38 + look, eyeY, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.38 + look, eyeY, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
  // Mouth: smile, flat or frown by mood.
  ctx.strokeStyle = '#1b1329';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  if (mood > 0.6) {
    ctx.arc(0, r * 0.25, r * 0.3, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood > 0.35) {
    ctx.moveTo(-r * 0.25, r * 0.42);
    ctx.lineTo(r * 0.25, r * 0.42);
  } else {
    ctx.arc(0, r * 0.75, r * 0.3, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBackground(ctx, world) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, W, 800);
  // Brick hints.
  ctx.fillStyle = PALETTE.wallDark;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      if ((row + col) % 3 === 0) ctx.fillRect(col * 84 + (row % 2) * 40, 70 + row * 34, 70, 3);
    }
  }
  // Night window with moon, stars and rooftops.
  const wx = 340, wy = 84, ww = 560, wh = 276;
  ctx.fillStyle = '#0d0a1c';
  rr(ctx, wx, wy, ww, wh, 14);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  rr(ctx, wx, wy, ww, wh, 14);
  ctx.clip();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(wx + 430, wy + 70, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0d0a1c';
  ctx.beginPath(); ctx.arc(wx + 448, wy + 58, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  const stars = [[60, 40], [150, 90], [230, 35], [320, 70], [120, 150], [260, 130], [380, 30], [500, 130], [40, 190], [200, 200]];
  for (const [sx, sy] of stars) {
    ctx.globalAlpha = 0.5 + ((sx * sy) % 50) / 100;
    ctx.beginPath(); ctx.arc(wx + sx, wy + sy, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#171226';
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh);
  ctx.lineTo(wx, wy + 210);
  ctx.lineTo(wx + 90, wy + 180);
  ctx.lineTo(wx + 170, wy + 215);
  ctx.lineTo(wx + 260, wy + 175);
  ctx.lineTo(wx + 350, wy + 210);
  ctx.lineTo(wx + 450, wy + 185);
  ctx.lineTo(wx + ww, wy + 220);
  ctx.lineTo(wx + ww, wy + wh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 8;
  rr(ctx, wx, wy, ww, wh, 14);
  ctx.stroke();
  // String lights.
  const lights = ['#ffd94d', '#ff9fb2', '#7fd4ff', '#7bc96f'];
  for (let i = 0; i < 24; i += 1) {
    const lx = 40 + i * 53;
    const ly = 74 + Math.sin(i * 0.9) * 8;
    ctx.fillStyle = lights[i % 4];
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Tonight's specials chalk menu.
  const mx = 920, my = 84, mw = 344, mh = 276;
  ctx.fillStyle = PALETTE.board;
  rr(ctx, mx, my, mw, mh, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wood;
  ctx.lineWidth = 6;
  rr(ctx, mx, my, mw, mh, 12);
  ctx.stroke();
  text(ctx, "TONIGHT'S SPECIALS", mx + mw / 2, my + 26, 19, PALETTE.chalk, 'bold', 'center', 'Georgia, serif');
  ctx.strokeStyle = PALETTE.chalk;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx + 24, my + 44); ctx.lineTo(mx + mw - 24, my + 44); ctx.stroke();
  RECIPES.forEach((r, i) => {
    const ry = my + 66 + i * 32;
    text(ctx, r.name, mx + 20, ry, 16, PALETTE.cream);
    text(ctx, `${r.base} pts`, mx + mw - 20, ry, 15, PALETTE.gold, 'bold', 'right');
  });
  text(ctx, 'Bake it golden, top it right,', mx + mw / 2, my + mh - 16, 13, PALETTE.muted, 'normal', 'center', 'Georgia, serif');
  // Wooden counter band behind the stations.
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(0, 372, W, 16);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(0, 384, W, 4);
}

function drawTopBar(ctx, world) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#1b1329';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 64, W, 3);
  text(ctx, 'MIDNIGHT CRUMB', 20, 34, 26, PALETTE.cream, 'bold', 'left', 'Georgia, serif');
  text(ctx, 'the 3 a.m. bakery', 276, 36, 13, PALETTE.muted, 'normal', 'left', 'Georgia, serif');
  const urgent = world.timeLeft < 30 && world.phase === 'playing';
  text(ctx, `⏱ ${fmtTime(world.timeLeft)}`, 480, 34, 26, urgent ? PALETTE.red : PALETTE.cream, 'bold', 'center');
  text(ctx, `SCORE ${world.score}`, 640, 34, 20, PALETTE.gold, 'bold', 'center');
  text(ctx, `🪙 ${world.coins}`, 790, 34, 20, PALETTE.cream, 'bold', 'center');
  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, 920, 34, 20, PALETTE.amber, 'bold', 'center');
  }
  // Mute + help buttons.
  for (const [rect, label] of [[LAYOUT.muteBtn, world.sfxMuted ? '🔇 Muted' : '♪ Sound'], [LAYOUT.helpBtn, '? Help']]) {
    ctx.fillStyle = '#2c2140';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.muted;
    ctx.lineWidth = 1;
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 14, PALETTE.cream, 'bold', 'center');
  }
}

function drawTicket(ctx, world, ticket, i) {
  const r = ticketRect(i);
  const recipe = RECIPE_BY_ID[ticket.recipeId];
  const customer = CUSTOMER_BY_ID[ticket.customerId];
  const focused = world.focusedId === ticket.id;
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  ctx.save();
  if (world.shakeT > 0 && focused) ctx.translate(Math.sin(world.shakeT * 60) * 4, 0);
  ctx.fillStyle = focused ? '#3a2f1c' : '#2a2118';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = focused ? PALETTE.gold : '#5a4632';
  ctx.lineWidth = focused ? 3 : 1.5;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  drawCreature(ctx, customer, r.x + 30, r.y + 30, 20, frac);
  text(ctx, recipe.name, r.x + 58, r.y + 18, 16, PALETTE.cream);
  text(ctx, customer.name, r.x + 58, r.y + 40, 12, PALETTE.muted, 'normal');
  // Mix sequence: what goes in the bowl, in order.
  recipe.mix.forEach((ing, j) => {
    const g = ING_BY_ID[ing];
    const done = j < ticket.mixAdded.length;
    const cx = r.x + 66 + j * 34;
    ctx.fillStyle = done ? g.color : '#4a3a28';
    ctx.beginPath(); ctx.arc(cx, r.y + 66, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = done ? '#fff6e0' : '#6b5636';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, r.y + 66, 11, 0, Math.PI * 2); ctx.stroke();
    text(ctx, g.short, cx, r.y + 66, 9, done ? PALETTE.ink : '#cbb98f', 'bold', 'center');
    if (j < recipe.mix.length - 1) text(ctx, '›', cx + 17, r.y + 66, 14, PALETTE.muted, 'bold', 'center');
  });
  // Toppings needed.
  text(ctx, 'top:', r.x + 14, r.y + 92, 12, PALETTE.muted, 'normal');
  recipe.toppings.forEach((ing, j) => {
    const g = ING_BY_ID[ing];
    const done = ticket.toppingsAdded.includes(ing);
    const cx = r.x + 58 + j * 30;
    ctx.fillStyle = done ? g.color : '#4a3a28';
    ctx.beginPath(); ctx.arc(cx, r.y + 92, 10, 0, Math.PI * 2); ctx.fill();
    text(ctx, g.short, cx, r.y + 92, 8, done ? PALETTE.ink : '#cbb98f', 'bold', 'center');
  });
  // Stage label + patience bar.
  const stageLabel = {
    waiting: 'tap to start', mixing: 'MIXING…', mixed: 'to the oven…',
    baking: 'BAKING…', baked: 'on the tray…', decorating: 'DECORATE', ready: 'SERVE!',
  }[ticket.stage];
  text(ctx, stageLabel, r.x + r.w - 14, r.y + 92, 12, ticket.stage === 'ready' ? PALETTE.green : PALETTE.gold, 'bold', 'right');
  ctx.fillStyle = '#1b1329';
  rr(ctx, r.x + 12, r.y + r.h - 14, r.w - 24, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.amber : PALETTE.red;
  if (frac > 0) {
    rr(ctx, r.x + 12, r.y + r.h - 14, (r.w - 24) * frac, 7, 3.5);
    ctx.fill();
  }
  ctx.restore();
}

function drawBoard(ctx, world) {
  const b = LAYOUT.board;
  ctx.fillStyle = PALETTE.board;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wood;
  ctx.lineWidth = 6;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + b.w / 2, b.y + 20, 17, PALETTE.chalk, 'bold', 'center', 'Georgia, serif');
  if (!world.tickets.length) {
    text(ctx, 'No orders yet…', b.x + b.w / 2, b.y + 120, 15, PALETTE.muted, 'normal', 'center');
  }
  world.tickets.forEach((t, i) => drawTicket(ctx, world, t, i));
}

function stationLabel(ctx, x, y, label, sub) {
  text(ctx, label, x, y, 15, PALETTE.cream, 'bold', 'center', 'Georgia, serif');
  if (sub) text(ctx, sub, x, y + 18, 11, PALETTE.muted, 'normal', 'center');
}

function drawCustomers(ctx, world) {
  const c = LAYOUT.customers;
  ctx.fillStyle = '#241a33';
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wood;
  ctx.lineWidth = 3;
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.stroke();
  text(ctx, 'AT THE COUNTER', c.x + c.w / 2, c.y + 18, 13, PALETTE.muted, 'bold', 'center');
  if (!world.tickets.length) {
    text(ctx, 'The night is quiet…', c.x + c.w / 2, c.y + 70, 14, PALETTE.muted, 'normal', 'center');
    return;
  }
  world.tickets.forEach((t, i) => {
    const customer = CUSTOMER_BY_ID[t.customerId];
    const cx = c.x + 52 + i * 94;
    const cy = c.y + 62;
    const frac = Math.max(0, t.patience / t.maxPatience);
    drawCreature(ctx, customer, cx, cy, 28, frac);
    // Patience ring.
    ctx.strokeStyle = '#1b1329';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.amber : PALETTE.red;
    ctx.beginPath(); ctx.arc(cx, cy, 36, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    text(ctx, customer.name.split(' ')[0], cx, c.y + 112, 11, PALETTE.cream, 'bold', 'center');
  });
}

function drawBowl(ctx, world) {
  const b = LAYOUT.bowl;
  const ticket = world.tickets.find((t) => t.id === world.bowlId);
  const focused = ticket && world.focusedId === ticket.id;
  ctx.fillStyle = '#2c2140';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = focused ? PALETTE.gold : '#4a3a66';
  ctx.lineWidth = focused ? 3 : 1.5;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  stationLabel(ctx, b.x + b.w / 2, b.y + 22, '1 · MIXING BOWL', ticket ? RECIPE_BY_ID[ticket.recipeId].name : 'tap an order to start');
  // The bowl.
  const cx = b.x + b.w / 2, cy = b.y + 104;
  ctx.fillStyle = '#8a7a58';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 34, 78, 16, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#b9a98c';
  ctx.beginPath();
  ctx.moveTo(cx - 78, cy + 30);
  ctx.quadraticCurveTo(cx - 70, cy + 86, cx, cy + 88);
  ctx.quadraticCurveTo(cx + 70, cy + 86, cx + 78, cy + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f3ead2';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 32, 70, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ticket) {
    // Dough ingredients already in, as coloured blobs.
    ticket.mixAdded.forEach((ing, i) => {
      const g = ING_BY_ID[ing];
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(cx - 36 + i * 36, cy + 30, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00000033';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx - 36 + i * 36, cy + 30, 12, 0, Math.PI * 2); ctx.stroke();
    });
    const recipe = RECIPE_BY_ID[ticket.recipeId];
    text(ctx, `${ticket.mixAdded.length} / ${recipe.mix.length} in the bowl`, cx, b.y + b.h - 18, 13, PALETTE.cream, 'bold', 'center');
  } else {
    text(ctx, 'empty — waiting for dough', cx, b.y + b.h - 18, 13, PALETTE.muted, 'normal', 'center');
  }
}

function drawOven(ctx, world) {
  const o = LAYOUT.oven;
  const ticket = world.tickets.find((t) => t.id === world.ovenId);
  const focused = ticket && world.focusedId === ticket.id;
  const baking = ticket && ticket.stage === 'baking';
  const golden = baking && ticket.doneness >= GOLD_LO && ticket.doneness <= GOLD_HI;
  ctx.fillStyle = '#2c2140';
  rr(ctx, o.x, o.y, o.w, o.h, 12);
  ctx.fill();
  ctx.strokeStyle = golden ? PALETTE.gold : focused ? PALETTE.gold : '#4a3a66';
  ctx.lineWidth = golden || focused ? 3 : 1.5;
  rr(ctx, o.x, o.y, o.w, o.h, 12);
  ctx.stroke();
  stationLabel(ctx, o.x + o.w / 2, o.y + 22, '2 · THE OVEN', baking ? 'click the oven to pull!' : ticket ? 'pastry waiting on the tray' : 'dough slides in on its own');
  // Oven body.
  const ox = o.x + 30, oy = o.y + 52, ow = o.w - 60, oh = 104;
  ctx.fillStyle = '#3d3a4d';
  rr(ctx, ox, oy, ow, oh, 10);
  ctx.fill();
  ctx.fillStyle = baking ? '#ff7a2e' : '#241a33';
  rr(ctx, ox + 12, oy + 12, ow - 24, 56, 6);
  ctx.fill();
  if (ticket) {
    const d = ticket.doneness;
    ctx.fillStyle = '#ffcf8a';
    ctx.globalAlpha = 0.25 + (d / 100) * 0.6;
    rr(ctx, ox + 12, oy + 12, ow - 24, 56, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawPastry(ctx, ticket.recipeId, ox + ow / 2, oy + 40, 22, d, []);
  }
  // Doneness meter with the golden window.
  const mx = ox, my = oy + oh + 12, mw = ow, mh = 16;
  ctx.fillStyle = '#1b1329';
  rr(ctx, mx, my, mw, mh, 8);
  ctx.fill();
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(mx + (mw * GOLD_LO) / 100, my, (mw * (GOLD_HI - GOLD_LO)) / 100, mh);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(mx + (mw * GOLD_LO) / 100, my, 2, mh);
  ctx.fillRect(mx + (mw * GOLD_HI) / 100 - 2, my, 2, mh);
  if (ticket) {
    ctx.fillStyle = '#ff9f2e';
    rr(ctx, mx, my, Math.max(6, (mw * ticket.doneness) / 100), mh, 8);
    ctx.fill();
  }
  text(ctx, 'PALE', mx + 4, my + mh + 12, 10, PALETTE.muted, 'bold', 'left');
  text(ctx, 'GOLDEN', mx + mw / 2, my + mh + 12, 10, PALETTE.gold, 'bold', 'center');
  text(ctx, 'BURNT', mx + mw - 4, my + mh + 12, 10, PALETTE.red, 'bold', 'right');
  if (golden) {
    text(ctx, '★ PULL NOW! ★', o.x + o.w / 2, o.y + o.h - 6, 13, PALETTE.gold, 'bold', 'center');
  }
}

function drawBench(ctx, world) {
  const b = LAYOUT.bench;
  const ticket = world.tickets.find((t) => t.id === world.benchId);
  const focused = ticket && world.focusedId === ticket.id;
  const ready = ticket && ticket.stage === 'ready';
  ctx.fillStyle = '#2c2140';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = ready ? PALETTE.green : focused ? PALETTE.gold : '#4a3a66';
  ctx.lineWidth = ready || focused ? 3 : 1.5;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  stationLabel(ctx, b.x + b.w / 2, b.y + 22, '3 · DECORATING BENCH', ticket ? RECIPE_BY_ID[ticket.recipeId].name : 'baked pastries land here');
  // The plate.
  const cx = b.x + b.w / 2, cy = b.y + 112;
  ctx.fillStyle = '#e8e8ef';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 92, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 78, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ticket) {
    drawPastry(ctx, ticket.recipeId, cx, cy - 6, 44, ticket.doneness, ticket.toppingsAdded);
    const recipe = RECIPE_BY_ID[ticket.recipeId];
    const missing = recipe.toppings.filter((t) => !ticket.toppingsAdded.includes(t));
    if (ticket.stage === 'decorating') {
      text(ctx, `add: ${missing.map((m) => ING_BY_ID[m].name).join(' + ')}`, cx, b.y + b.h - 52, 13, PALETTE.cream, 'bold', 'center');
    }
  } else {
    text(ctx, 'no pastry yet', cx, b.y + b.h - 52, 13, PALETTE.muted, 'normal', 'center');
  }
  if (ready) {
    const s = LAYOUT.serveBtn;
    ctx.fillStyle = PALETTE.green;
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.stroke();
    text(ctx, 'SERVE  ⏎', s.x + s.w / 2, s.y + s.h / 2 + 1, 18, '#0d2b12', 'bold', 'center');
  }
}

function drawIngredientIcon(ctx, ing, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (ing.id === 'flour') {
    ctx.fillStyle = '#f3ead2';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.6);
    ctx.quadraticCurveTo(0, -r * 1.1, r * 0.7, -r * 0.6);
    ctx.lineTo(r * 0.55, r * 0.7);
    ctx.lineTo(-r * 0.55, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a7a58';
    ctx.fillRect(-r * 0.5, -r * 0.1, r, r * 0.16);
  } else if (ing.id === 'butter') {
    ctx.fillStyle = '#ffd94d';
    rr(ctx, -r * 0.8, -r * 0.4, r * 1.6, r * 0.8, r * 0.15);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.fillRect(-r * 0.8, -r * 0.4, r * 1.6, r * 0.2);
  } else if (ing.id === 'sugar') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d8aa0';
    for (const [sx, sy] of [[-0.3, -0.2], [0.25, -0.3], [0, 0.25], [-0.1, 0.4]]) {
      ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (ing.id === 'egg') {
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.55, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.2, r * 0.2, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  } else if (ing.id === 'jam') {
    ctx.fillStyle = '#e5484d';
    rr(ctx, -r * 0.55, -r * 0.4, r * 1.1, r * 1.1, r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#c9a86a';
    ctx.fillRect(-r * 0.6, -r * 0.75, r * 1.2, r * 0.35);
  } else if (ing.id === 'choc') {
    ctx.fillStyle = '#6b4226';
    rr(ctx, -r * 0.7, -r * 0.7, r * 1.4, r * 1.4, r * 0.15);
    ctx.fill();
    ctx.strokeStyle = '#3d2412';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0); ctx.stroke();
  } else if (ing.id === 'cinnamon') {
    ctx.strokeStyle = '#b5651d';
    ctx.lineWidth = r * 0.28;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.5); ctx.lineTo(r * 0.5, -r * 0.5); ctx.stroke();
    ctx.strokeStyle = '#8a4a12';
    ctx.lineWidth = r * 0.28;
    ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.65); ctx.lineTo(r * 0.65, -r * 0.3); ctx.stroke();
  } else { // glaze
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.5);
    ctx.lineTo(r * 0.6, -r * 0.5);
    ctx.lineTo(r * 0.45, r * 0.6);
    ctx.lineTo(-r * 0.45, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.6, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBins(ctx, world, hover) {
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const isHover = hover && hover.x >= r.x && hover.x <= r.x + r.w && hover.y >= r.y && hover.y <= r.y + r.h;
    const focused = focusedTicket(world);
    const usable = world.phase === 'playing' && focused
      && ((focused.stage === 'mixing' && RECIPE_BY_ID[focused.recipeId].mix.includes(ing.id))
        || (focused.stage === 'decorating' && ['jam', 'choc', 'cinnamon', 'glaze'].includes(ing.id)));
    ctx.fillStyle = isHover ? '#4a3a28' : '#2c2140';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = usable ? PALETTE.gold : '#4a3a66';
    ctx.lineWidth = usable ? 2.5 : 1.5;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    drawIngredientIcon(ctx, ing, r.x + r.w / 2, r.y + 44, 26);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 92, 14, PALETTE.cream, 'bold', 'center');
    text(ctx, `key ${i + 1}`, r.x + r.w / 2, r.y + 112, 11, PALETTE.muted, 'normal', 'center');
  });
  text(ctx, 'INGREDIENTS ON THE COUNTER — click a bin, or press 1–8', LAYOUT.bins.x + LAYOUT.bins.w / 2, LAYOUT.bins.y - 12, 12, PALETTE.muted, 'bold', 'center');
}

function drawToasts(ctx, world) {
  world.toasts.forEach((t, i) => {
    const alpha = t.age > t.max - 0.5 ? (t.max - t.age) / 0.5 : 1;
    ctx.globalAlpha = Math.max(0, alpha);
    const y = 84 + i * 34;
    ctx.fillStyle = t.kind === 'bad' ? '#5a1f26' : t.kind === 'good' ? '#1f4d2a' : '#2c2140';
    rr(ctx, (W - 420) / 2 + 40, y, 340, 28, 14);
    ctx.fill();
    text(ctx, t.text, W / 2, y + 15, 13, '#fff6e0', 'bold', 'center');
    ctx.globalAlpha = 1;
  });
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function button(ctx, rect, label, fill, fg) {
  ctx.fillStyle = fill;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff6e0';
  ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 22, fg, 'bold', 'center');
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(13,10,28,0.86)';
  ctx.fillRect(0, 0, W, 800);
  text(ctx, 'MIDNIGHT CRUMB', W / 2, 190, 64, PALETTE.gold, 'bold', 'center', 'Georgia, serif');
  text(ctx, 'the 3 a.m. bakery', W / 2, 240, 26, PALETTE.cream, 'normal', 'center', 'Georgia, serif');
  text(ctx, 'The town sleeps. The owls are hungry. You bake.', W / 2, 300, 18, PALETTE.muted, 'normal', 'center');
  const lines = [
    '1 · Tap an order ticket to start its dough.',
    '2 · Click the counter bins in recipe order to mix.',
    '3 · Pull the bake inside the GOLDEN window — too late and it burns.',
    '4 · Top it, plate it, SERVE it before patience runs out.',
    'Run the bowl, the oven and the bench at once: mix the next dough while one bakes.',
  ];
  lines.forEach((l, i) => text(ctx, l, W / 2, 350 + i * 30, 17, PALETTE.cream, 'normal', 'center'));
  button(ctx, LAYOUT.startBtn, 'START THE SHIFT  ⏎', PALETTE.amber, '#241a12');
  text(ctx, 'Mouse + keyboard 1–8 · Space pulls & serves · Esc pauses · 3-minute shift', W / 2, 664, 14, PALETTE.muted, 'normal', 'center');
}

function drawHelp(ctx, world) {
  ctx.fillStyle = 'rgba(13,10,28,0.82)';
  ctx.fillRect(0, 0, W, 800);
  const px = 340, py = 170, pw = 600, ph = 420;
  ctx.fillStyle = '#241a33';
  rr(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, px, py, pw, ph, 14);
  ctx.stroke();
  text(ctx, 'HOW TO BAKE AT 3 A.M.', px + pw / 2, py + 40, 24, PALETTE.gold, 'bold', 'center', 'Georgia, serif');
  const lines = [
    'Orders arrive on the chalkboard. Each ticket shows',
    'the dough recipe (in order) and the toppings it needs.',
    '',
    'Bowl → Oven → Bench. One order per station, so',
    'start the next dough while one bakes. Patience drains',
    'on every ticket — serve the oldest first.',
    '',
    'Golden pull (62–82 on the meter) + right toppings',
    '= PERFECT. Perfects build your combo multiplier.',
    '',
    'Click bins or press 1–8 · Space pulls / serves',
    'Esc pauses · M mutes · click anywhere to close',
  ];
  lines.forEach((l, i) => text(ctx, l, px + pw / 2, py + 84 + i * 26, 16, PALETTE.cream, 'normal', 'center'));
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(13,10,28,0.66)';
  ctx.fillRect(0, 0, W, 800);
  text(ctx, 'PAUSED', W / 2, 360, 48, PALETTE.cream, 'bold', 'center', 'Georgia, serif');
  text(ctx, 'The dough waits. Press Esc to keep baking.', W / 2, 420, 18, PALETTE.muted, 'normal', 'center');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(13,10,28,0.78)';
  ctx.fillRect(0, 0, W, 800);
  const px = 340, py = 150, pw = 600, ph = 480;
  ctx.fillStyle = '#241a33';
  rr(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, px, py, pw, ph, 14);
  ctx.stroke();
  text(ctx, 'SHIFT REPORT', px + pw / 2, py + 44, 30, PALETTE.gold, 'bold', 'center', 'Georgia, serif');
  text(ctx, 'The ovens cool. The moon sets. The crumbs remain.', px + pw / 2, py + 78, 15, PALETTE.muted, 'normal', 'center');
  const stars = '★'.repeat(world.stars) + '☆'.repeat(3 - world.stars);
  text(ctx, stars, px + pw / 2, py + 130, 44, PALETTE.gold, 'bold', 'center');
  text(ctx, `SCORE  ${world.score}`, px + pw / 2, py + 190, 30, PALETTE.cream, 'bold', 'center');
  const rows = [
    ['Pastries served', String(world.served)],
    ['Perfect bakes', String(world.perfects)],
    ['Best combo', `x${world.bestCombo}`],
    ['Customers lost', String(world.lost)],
    ['Burnt trays', String(world.burnt)],
    ['Coins earned', `🪙 ${world.coins}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = py + 240 + i * 32;
    text(ctx, k, px + 90, y, 17, PALETTE.muted, 'normal', 'left');
    text(ctx, v, px + pw - 90, y, 17, PALETTE.cream, 'bold', 'right');
  });
  button(ctx, LAYOUT.startBtn, 'BAKE ANOTHER SHIFT  (R)', PALETTE.amber, '#241a12');
}

export function render(ctx, world, hover = null) {
  ctx.clearRect(0, 0, W, 800);
  drawBackground(ctx, world);
  drawTopBar(ctx, world);
  drawBoard(ctx, world);
  drawCustomers(ctx, world);
  drawBowl(ctx, world);
  drawOven(ctx, world);
  drawBench(ctx, world);
  drawBins(ctx, world, hover);
  drawParticles(ctx, world);
  drawToasts(ctx, world);
  if (world.phase === 'title') drawTitle(ctx, world);
  if (world.showHelp) drawHelp(ctx, world);
  if (world.phase === 'paused') drawPaused(ctx);
  if (world.phase === 'over') drawOver(ctx, world);
}
