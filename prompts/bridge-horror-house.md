# Prompt — Bridge Horror House

- **Folder:** `bridge-horror-house/`
- **Status:** Archived (best available source)
- **Note:** The original chat prompt for this experiment was created before the current agent session. What follows is reconstructed from `bridge-horror-house/SYSTEM_PROMPT.md` and the project README — the design constitution that drove the build.

---

## Mission

You wake up locked inside an abandoned house at night. Every exit is sealed. Three brass keys are hidden in the dark rooms of the house. Find them, unlock the front door, and escape — but you are not alone in here.

Core loop: **explore dark rooms → find keys → survive scares → fight back with the light → escape**.

Priority order (non-negotiable):

1. **GRAPHICS / ATMOSPHERE** — the game must *look* terrifying before anything else
2. **FUNCTIONALITY** — movement, interaction, objective, scares, combat, win/lose
3. Everything else

## Graphics mandate

1. Darkness as a mechanic — near-black ambient; world seen through flashlight cone.
2. Flashlight — SpotLight bound to camera with lag/sway, penumbra, lens cookie, PCF soft shadows. Only shadow-casting light.
3. Tone mapping — ACES Filmic, sRGB output.
4. Fog — exponential black fog.
5. Bloom — subtle UnrealBloomPass on flames, glints, eyes.
6. Texture detail — every surface procedurally textured on `<canvas>`.
7. Moonlight + storm — cold blue window lights; lightning + synced thunder; warm flickering bulbs.
8. Post atmosphere — vignette + film grain, red/white flashes, screen shake.
9. Dust motes — additive particles in the beam.
10. Set dressing — furniture, creepy portraits, cobwebs, candles, swinging doors.
11. The Entity — tall gaunt figure, tattered strips, claws, animated faces, black vapor, glowing eyes.

## Horror design

- Anticipation beats the scare. Escalate across three acts.
- Sound is half the horror (all synthesized Web Audio).
- Scripted scares are one-shot.
- The monster is scarier unseen.
- Player can fight back with the beam (burn meter → banish).
- Resource tension (battery drain, spare batteries).
- Punish but respawn fast. Player always has agency (sprint).

## Tech stack (fixed)

- Vite + vanilla JavaScript ES modules
- Three.js (WebGL2) + postprocessing (EffectComposer, UnrealBloomPass)
- Procedural canvas textures, procedural Web Audio — zero asset files
- UI/HUD in plain HTML/CSS overlays

## Gameplay summary (from README)

Find **three brass keys** (kitchen, study, bedroom — randomized each run), survive scripted + ambient scares, fight back with the light, unlock the front door and escape. Escalates across three acts: noises → stalking (after the 2nd key) → full chase (after the 3rd key). Flashlight battery drains; spare batteries are scattered. Getting touched during the chase = caught.

Controls: WASD move, mouse look, Shift sprint, E interact, F flashlight, hold left-click to burn the entity.
