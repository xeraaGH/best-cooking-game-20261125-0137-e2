// Midnight Crumb — configuration: recipes, ingredients, customers, palette
// and the fixed screen layout shared by the renderer and the input handler.

export const W = 1280;
export const H = 800;
export const SHIFT_SECONDS = 180;
export const MAX_TICKETS = 3;

// Golden bake window on the 0..100 doneness meter. Pull inside it for a
// perfect bake; 50..62 and 82..92 still serve (pale / dark); past 92 burns.
export const GOLD_LO = 62;
export const GOLD_HI = 82;
export const PALE_LO = 50;
export const BURNT_AT = 92;

// One ingredient bin per entry. The first four are dough ingredients, the
// last four are toppings — the same bins serve both jobs, so the player
// reads one counter, not two.
export const INGREDIENTS = [
  { id: 'flour',    name: 'Flour',    short: 'Flr', color: '#f3ead2', dark: '#8a7a58' },
  { id: 'butter',   name: 'Butter',   short: 'Btr', color: '#ffd94d', dark: '#a67c00' },
  { id: 'sugar',    name: 'Sugar',    short: 'Sgr', color: '#ffffff', dark: '#7d8aa0' },
  { id: 'egg',      name: 'Egg',      short: 'Egg', color: '#ffb347', dark: '#8a5a1d' },
  { id: 'jam',      name: 'Jam',      short: 'Jam', color: '#e5484d', dark: '#7d1f26' },
  { id: 'choc',     name: 'Choc',     short: 'Chc', color: '#6b4226', dark: '#3d2412' },
  { id: 'cinnamon', name: 'Cinnamon', short: 'Cin', color: '#b5651d', dark: '#6e3b0e' },
  { id: 'glaze',    name: 'Glaze',    short: 'Glz', color: '#bfe9ff', dark: '#4d7d99' },
];
export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));
export const TOPPING_IDS = ['jam', 'choc', 'cinnamon', 'glaze'];

// Recipes: mix is the ordered dough sequence, toppings the finishing set.
// bake is the seconds the doneness meter needs to reach 100.
export const RECIPES = [
  { id: 'croissant', name: 'Butter Croissant', mix: ['flour', 'butter', 'egg'],       toppings: ['glaze'],            bake: 9,  base: 120 },
  { id: 'cinnamon',  name: 'Cinnamon Roll',    mix: ['flour', 'sugar', 'cinnamon'],   toppings: ['glaze'],            bake: 10, base: 130 },
  { id: 'jamtart',   name: 'Midnight Jam Tart', mix: ['flour', 'butter', 'sugar'],     toppings: ['jam', 'glaze'],     bake: 8,  base: 140 },
  { id: 'chocloaf',  name: 'Choc Loaf',        mix: ['flour', 'egg', 'choc'],         toppings: ['choc'],             bake: 11, base: 150 },
  { id: 'moonbun',   name: 'Moon Bun',         mix: ['flour', 'sugar', 'egg'],        toppings: ['jam', 'cinnamon'],  bake: 9,  base: 150 },
  { id: 'starscone', name: 'Star Scone',       mix: ['flour', 'butter', 'cinnamon'],  toppings: ['glaze', 'choc'],    bake: 10, base: 160 },
];
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// The night creatures who queue at the bakery. Original characters, drawn
// as simple vector faces — no borrowed mascots.
export const CUSTOMERS = [
  { id: 'owl',     name: 'Professor Hoot',  kind: 'owl',     fur: '#8a6d4b', belly: '#f3ead2', accent: '#ffd94d' },
  { id: 'moth',    name: 'Luna the Moth',   kind: 'moth',    fur: '#b8a7d9', belly: '#efe8ff', accent: '#ffd94d' },
  { id: 'cat',     name: 'Miso the Cat',    kind: 'cat',     fur: '#3f3f4d', belly: '#e8e8ef', accent: '#ff9fb2' },
  { id: 'raccoon', name: 'Bandit',          kind: 'raccoon', fur: '#7a7d8a', belly: '#d8d8de', accent: '#7fd4ff' },
  { id: 'fox',     name: 'Ember the Fox',   kind: 'fox',     fur: '#c96a2e', belly: '#ffe8d0', accent: '#ffd94d' },
  { id: 'bat',     name: 'Pip the Bat',     kind: 'bat',     fur: '#5b4a7a', belly: '#cfc3ea', accent: '#bfe9ff' },
];

export const PALETTE = {
  night: '#141021',
  wall: '#241a33',
  wallDark: '#1b1329',
  wood: '#7a4a2b',
  woodLight: '#96603a',
  woodDark: '#5a3419',
  counter: '#3d2b1f',
  board: '#20261f',
  chalk: '#f5f2e4',
  cream: '#fff6e0',
  gold: '#ffd94d',
  amber: '#ff9f2e',
  ovenGlow: '#ff7a2e',
  red: '#e5484d',
  green: '#7bc96f',
  ink: '#241a12',
  muted: '#b9a98c',
};

// Fixed layout rectangles (logical 1280x800). Input and render both use these.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 80, w: 292, h: 396 },
  ticketH: 118,
  customers: { x: 16, y: 492, w: 292, h: 132 },
  bowl: { x: 340, y: 392, w: 250, h: 220 },
  oven: { x: 620, y: 392, w: 300, h: 220 },
  bench: { x: 950, y: 392, w: 314, h: 220 },
  bins: { x: 16, y: 648, w: 1248, h: 136 },
  binW: 146,
  binH: 128,
  binGap: 10,
  startBtn: { x: 490, y: 560, w: 300, h: 64 },
  serveBtn: { x: 1000, y: 560, w: 214, h: 44 },
  helpBtn: { x: 1170, y: 12, w: 94, h: 40 },
  muteBtn: { x: 1064, y: 12, w: 94, h: 40 },
};
