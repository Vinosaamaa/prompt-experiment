# Prompt — Neon Dash (Geometry Dash–style autoplay)

- **Folder:** `geometry-dash-autoplay/`
- **Status:** Original experiment prompt (saved from chat)
- **Deliverable requested:** Complete game in a **single HTML file** with embedded CSS/JS; screen record after; fix bugs found in testing

---

Create a complete Geometry Dash-style auto-playing game in a single HTML file with embedded CSS and JavaScript. The game must include the following features and systems:

**Core Mechanics:**
- A square/icon character that automatically moves to the right (auto-play mode).
- Click, spacebar, or touch input to make the character jump (single jump with proper gravity and ground collision).
- The character must bounce off the ground and obstacles with realistic physics (bounce pads that launch the character upward with variable strength).
- Yellow bounce pads (normal bounce), red bounce pads (strong bounce), blue bounce pads (anti-gravity bounce that reverses gravity temporarily).
- Orb objects: blue orbs (jump on touch), green orbs (reverse gravity), pink orbs (dash upward), yellow orbs (small hop).

**Game Modes / Forms (switched via portals):**
- **Cube mode** – standard ground-based jumping, affected by gravity, single and double jump capable.
- **Ship mode** – flies upward when holding input, descends when released (inverted gravity-style flight with momentum).
- **UFO mode** – a flying saucer that performs short upward "hops" in the air (click to bounce mid-air, limited to 3 consecutive air hops before needing to land).
- **Wave mode** – moves in a sine-wave pattern vertically, input instantly switches the wave direction (up becomes down, down becomes up), creates diagonal slash movement.
- **Ball mode** – automatically switches gravity when touching the ground or ceiling, tap flips gravity manually.
- **Robot mode** – higher jumps than cube but slower movement, can hold jump for variable height.
- **Spider mode** – teleports between floor and ceiling instantly on input, must time teleports to avoid obstacles on both surfaces.

**Portal System:**
- Colored portals placed in the level that transform the character into the corresponding mode (cube portal=blue, ship portal=green, UFO portal=orange, wave portal=pink, ball portal=red, robot portal=gray, spider portal=purple).
- Gravity portals (cyan/magenta swirl) that flip the world gravity permanently until another gravity portal.
- Size portals (mini portal shrinks character to 50% size, normal portal restores size).
- Speed portals (green arrow = 1.5x speed, red arrow = 0.5x speed, yellow arrow = normal speed).
- Mirror portals that flip the level horizontally for a short section.
- Dual portals that split the character into two for a short section (both must survive).
- All portals have glow animations and particle trails.

**Obstacles & Hazards:**
- Spikes (triangles) on floor, ceiling, and floating in various sizes – contact kills the player.
- Moving spikes that slide up/down or left/right on tracks with varying speeds.
- Rotating saw blades (circular with teeth) that spin at different RPMs.
- Fake spikes that look real but are passable (slightly different shade to hint).
- Invisible spikes that fade in and out on a timer.
- Narrow corridors requiring precise cube size (mini portals needed).
- Crumbling platforms that break after the character lands on them.
- Moving platforms that shift vertically or horizontally.
- Dash orbs placed in the air that must be collected mid-flight.
- Gravity wells that pull the character toward them.

**Complex Level Design System:**
- Multi-layered level architecture with foreground, midground, and background obstacles.
- Sync obstacles and portals to an internal rhythm/beat system (actions line up with a BPM timer).
- Pre-designed set-piece sections: straight corridors, ascending staircases of spikes, zigzag ship tunnels, wave sections with ceiling and floor spikes, UFO bounce sequences over spike pits, robot sections with high ledges, spider teleport mazes.
- Dual-mode challenge sections where portals switch mode rapidly (every 1-2 seconds) requiring the AI to chain different movement types.
- Timed sequences where a series of actions must be performed in exact rhythm (like a rhythm game segment).
- Fake-out sections where the obvious path is trapped and the real path requires using an obscure portal or gravity flip.
- Collectible coins placed in dangerous optional paths (3 per level section).
- Speed-changing sections that dramatically alter gameplay pace.
- Boss gate sections with dense obstacle clusters that test all learned mechanics.
- Secret alternate routes that bypass difficult sections for lower scores.

**Procedural Level Generation:**
- Generate an endless scrolling level procedurally as the camera moves right.
- Use chunk-based generation with difficulty-scaled templates: pre-generate sections of terrain, platforms, obstacles, orbs, and portals ahead of the player.
- Each chunk is 800-1200 pixels wide and contains a themed sequence of obstacles appropriate to the current difficulty.
- Ensure generated levels are always completable by the auto-play AI (validate each chunk by simulating AI playthrough before placing).
- Blend chunk types: calm straight sections, spike staircases, ship tunnels, UFO hop sections, wave corridors, ball ceiling/floor sections.
- Place portals strategically to force mode changes that match upcoming terrain.
- Generate variable terrain heights, gaps, and platform arrangements.
- Progressive difficulty ramp: early sections are simple, later sections introduce more complex combinations.
- Seed-based generation so the same seed produces the same level (display seed number).

**Difficulty Settings (Selectable before game start):**
- **Easy (1★-2★):** Wide gaps, sparse spikes, slow-moving obstacles, forgiving timing windows, no fake/invisible spikes, minimal mode switching (mostly cube), long safe sections, slow scroll speed.
- **Normal (3★-4★):** Moderate gaps, regular spike density, some moving obstacles, occasional mode switches, basic ship and ball sections, standard scroll speed.
- **Hard (5★-6★):** Tight gaps, dense spike clusters, fast moving saws, frequent mode switches, wave and UFO sections, faster scroll speed, some fake spikes.
- **Harder (7★-8★):** Very tight timing, rapid mode switches every 2-3 seconds, dual sections, fast saws on complex tracks, invisible spike sections, crumbling platforms, mirror portals.
- **Insane (9★):** Extreme density, micro-gaps, all mode types forced in rapid succession, complex multi-layered obstacles, speed portals changing pace constantly, dash orb chains, very fast scroll speed.
- **Extreme Demon (10★):** Maximum density, frame-perfect timing required, all mechanics at once, dual-mode sections with split characters, invisible spike mazes, boss gate clusters, fake-out paths, gravity wells, rapid spider teleport chains, extreme scroll speed, almost no safe space between obstacles.

- Difficulty selector UI: a grid of faces/buttons (Easy: smiley blue, Normal: calm green, Hard: worried orange, Harder: scared red, Insane: angry purple, Extreme Demon: demon face dark red with horns icon).
- Selected difficulty affects: obstacle density, gap size, scroll speed, timing window strictness, portal frequency, obstacle speed, number of fake/invisible hazards, dual-section frequency.

**AI Auto-Play / Pathfinding:**
- An AI controller that analyzes the upcoming terrain, obstacles, portals, and orbs within a detection range (adjustable based on difficulty: longer range on easier, shorter on harder).
- The AI raycasts or samples points ahead of the character to detect spike hitboxes, saw radii, platform edges, and portal boundaries.
- It calculates optimal trajectories for each game mode:
  - Cube: precise jump timing and height control (tap vs hold).
  - Ship: continuous altitude adjustment to fly through gaps.
  - UFO: timed mid-air hops to clear spike sequences.
  - Wave: instant direction switching to match sine wave to safe zones.
  - Ball: gravity flip timing to avoid ceiling/floor spikes.
  - Robot: variable jump hold duration for different heights.
  - Spider: teleport timing to dodge obstacles on both surfaces.
- The AI simulates multiple action sequences and selects the one that maximizes survival probability.
- Visual indicators: translucent green box showing AI detection zone ahead, thin colored line showing predicted trajectory.
- Toggle AI mode on/off with button or 'A' key (default ON for demonstration).
- AI adapts its aggressiveness to difficulty (takes safer routes on Easy, optimal routes on Extreme Demon).

**Camera & Scrolling:**
- Smooth camera that follows the character horizontally with slight vertical easing.
- The camera zooms slightly in/out based on speed portals and size changes.
- Parallax scrolling background with 3 layers: far (stars/grid), mid (geometric shapes), near (decorative blocks).
- Ground line with glow effect and pulsing to the beat.
- Screen flash on portal activation (color matching portal type).

**Visual Style:**
- Geometry Dash-inspired aesthetic: vibrant neon colors (cyan, magenta, lime, orange, pink) on deep dark backgrounds (#0a0a1a).
- Glow effects (CSS box-shadow or canvas blur) on all obstacles, portals, and the character.
- Particle effects: trail behind character, burst on jump, swirl on portal entry, explosion on death, sparkle on orb collection.
- Screen shake on death (intensity based on difficulty).
- The character changes shape and color based on current mode (cube=cyan square, ship=green triangle, UFO=orange circle, wave=pink diagonal line, ball=red circle, robot=gray square with antenna, spider=purple hexagon).
- Grid overlay on the background that slowly scrolls.
- Beat-synced pulsing on certain decorative elements.
- Death effect: character shatters into particles, screen flashes red.

**UI Elements:**
- Score counter (distance in meters, formatted with commas).
- Attempt counter with death count.
- Current mode indicator (icon + name).
- AI status indicator (ON/OFF with toggle hint).
- Difficulty badge (showing selected difficulty with star rating).
- Death screen overlay: "Game Over" in large bold text, final score, restart prompt.
- Seed display (small text in corner).
- FPS counter (optional, toggle with F key).
- Mini progress bar showing how far into the current chunk.
- Beat indicator that pulses with the internal rhythm.
- All text in bold white with black outline, pixel-style font using CSS font-family.

**Audio (Web Audio API):**
- Procedural beat/music loop: kick drum on every beat, snare on every 2nd beat, hi-hat on 8th notes, bass synth melody that changes based on difficulty (calm on Easy, intense on Extreme Demon).
- Jump sound per mode: cube=short blip, ship=whoosh, UFO=buzz, wave=sine sweep, ball=boing, robot=mechanical clank, spider=zip.
- Portal activation: ascending/descending tone depending on mode.
- Orb collection: pleasant chime.
- Bounce pad: spring reverb boing.
- Death: crash sound with low-frequency thud.
- Speed portal: pitch-shifted engine sound.
- Gravity flip: reversed cymbal.
- Difficulty-based music intensity: more layers and faster tempo on harder difficulties.
- Master volume control (slider or +/- keys).

**Controls:**
- Spacebar, mouse click, or touch to jump/act/hold for variable actions.
- Up arrow / W = also jump (alternative input).
- 'A' key to toggle AI auto-play on/off.
- 'R' key to restart after death.
- 'D' key to cycle difficulty before starting a run.
- 'F' key to toggle FPS display.
- 'M' key to mute/unmute audio.
- 'S' key to show/hide the seed number.
- Escape to pause (optional).

**Technical Requirements:**
- Everything in a single self-contained HTML file. No external libraries, fonts, or assets.
- Use Canvas 2D for all rendering.
- Use requestAnimationFrame for game loop with deltaTime for frame-independent physics.
- Use Web Audio API (AudioContext) for all sound generation.
- Ensure smooth 60fps performance on modern browsers.
- Mobile responsive: canvas scales to fit viewport, touch controls work.
- Game state management: MENU (difficulty select) → PLAYING → DEAD → restart loop.

Okay, so after you finish this task, make sure to have a screen record of the game, and I will review that. Be sure to make this workable, and when testing it, for any bugs you find, you need to fix that, okay?
