# Bridge Horror House

A browser-based, first-person haunted-house **escape game**. You wake locked
inside an abandoned house at night. Find **three brass keys** hidden in the dark
rooms, unlock the front door, and escape — but you are not alone.

Built with **Vite + vanilla JS + Three.js (WebGL2)**. All textures are drawn on
`<canvas>` and all sound is synthesised with the Web Audio API — **zero asset
files**, works fully offline.

## Run

```bash
npm install
npm run dev      # http://localhost:5180
```

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

> Use headphones in a dark room. Click **Enter**, then click the game to lock the mouse.

## Controls

| Input | Action |
|-------|--------|
| `W A S D` | Move |
| Mouse | Look |
| `Shift` | Sprint |
| `E` | Interact / open doors / pick up |
| `F` | Toggle flashlight |
| Hold **Left-click** | Burn the entity with the beam (fills the burn meter → banish) |

## The loop

Explore dark rooms → find 3 keys (kitchen, study, bedroom — randomized each run)
→ survive scripted + ambient scares → fight back with the light → unlock the
front door and escape. Escalates across three acts: noises → stalking (after the
2nd key) → full chase (after the 3rd key). The flashlight battery drains; spare
batteries are scattered around. Getting touched during the chase = caught.

## Structure

```
bridge-horror-house/
├── SYSTEM_PROMPT.md         # design constitution
├── index.html               # UI overlays: title, HUD, note, death, win, grain/vignette
├── src/
│   ├── main.js              # boot
│   ├── Game.js              # state machine, loop, interaction, burn, postprocessing
│   ├── world/
│   │   ├── Textures.js      # procedural canvas textures (wood, wallpaper, faces…)
│   │   └── House.js         # floor plan, walls, doors, furniture, lights, items, collision
│   ├── player/Player.js     # pointer-lock controls, collision, flashlight, battery
│   ├── systems/
│   │   ├── AudioEngine.js   # synthesised drones, rain, thunder, chase music, stingers
│   │   ├── Ghost.js         # entity visuals + apparition/stalk/chase/burn/banish AI
│   │   └── ScareDirector.js # one-shot triggers, ambient scheduler, storm/lightning
│   └── ui/HUD.js            # objective, battery, burn meter, flashes, shake, screens
```

## Debug / QA hooks

For testing and demos, a small API is exposed on `window.__dev` (it does nothing
unless you call it manually from the console; it does not affect normal play):

| Call | Effect |
|------|--------|
| `__dev.key(i)` | Walk to and collect key `i` (0–2) via the real pickup path |
| `__dev.keys()` | List keys and whether taken |
| `__dev.show()` | Reveal the entity a few metres ahead in a frozen pose (to view / burn) |
| `__dev.banish()` | Fill the burn meter and banish the manifested entity |
| `__dev.chase()` | Jump straight to the finale chase |
| `__dev.win()` | Unlock + open the front door → escape screen |
| `__dev.die()` | Trigger the caught → death sequence |
| `__dev.pos()` | Print player position + current room |

## Acceptance tests

`T1` dev boots < 3s · `T2` click → pointer lock + audio + foyer in near-dark ·
`T3` flashlight reveals textured walls/floor, `F` toggles · `T4` WASD + sprint,
walls/furniture/doors block, doors creak · `T5` 3 randomized keys, HUD updates,
notes readable · `T6` scripted scares fire once · `T7` stalking + burn meter after
2nd key · `T8` chase after final key, banish → reform · `T9` caught → jumpscare →
death → restart · `T10` front door with 3 keys → escape + time · `T11` one
shadow-casting light (the flashlight).
