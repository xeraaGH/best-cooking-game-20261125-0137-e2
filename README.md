[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/xeraaGH/best-cooking-game-20261125-0137-e2/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/xeraaGH/best-cooking-game-20261125-0137-e2/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Midnight Crumb — the 3 a.m. bakery

An original cooking game for the make.fun best-cooking-game bounty. A tiny
bakery that only opens after midnight, serving night creatures: an owl
professor, a moth, a cat, a raccoon, a fox, a bat. One three-minute shift,
six original recipes, and a three-station pipeline — mixing bowl, oven,
decorating bench — with one order per station, so the skill is planning the
queue, not fetching.

## How it plays

- **Start an order:** tap a ticket to start its dough.
- **Mix:** click the 8 counter bins in the recipe's exact order (keys 1–8 work too).
- **Bake:** pull the bake inside the golden window (62–82 on the meter). Pull
  early and it is pale; leave it late and it burns, and the dough must be
  remixed.
- **Top and serve:** finish the pastry from the same bins and serve it before
  the customer's patience ring runs out.
- **Scoring:** perfect bakes build a combo multiplier; patience tightens as the
  shift wears on. Seeded RNG, so a shift is fully reproducible.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server). No network request is made at any point; all art is drawn on canvas
and all sound is synthesized with WebAudio.

- **Mouse:** click tickets, bins, the oven, and plated pastries.
- **Keyboard:** 1–8 pick bins, Space is the context action, Enter starts,
  R restarts, Up/Down move between tickets.
