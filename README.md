# 🐸 Froggy Jump

A cross-platform endless platformer built from scratch with pure HTML5 Canvas and vanilla JavaScript — no frameworks, no dependencies, one file to run.

---

## Table of Contents

- [Running the Game](#running-the-game)
- [File Structure](#file-structure)
- [Architecture](#architecture)
  - [Canvas & Logical Size](#canvas--logical-size)
  - [Game Loop](#game-loop)
  - [Delta Time](#delta-time-dt)
  - [State Machine](#state-machine)
- [Physics](#physics)
  - [Gravity](#gravity)
  - [Jump Charge](#jump-charge)
  - [Velocity Boost](#velocity-boost)
  - [Air Drag](#air-drag)
  - [Wall Bounce](#wall-bounce)
- [Platforms](#platforms)
  - [Structure](#structure)
  - [Generation](#generation)
  - [Movement](#movement)
  - [Collision](#collision)
  - [Grounded Riding](#grounded-riding)
- [Camera](#camera)
  - [World vs Screen Space](#world-vs-screen-space)
  - [Scroll](#scroll)
- [Score & Difficulty](#score--difficulty)
- [Tuning Reference](#tuning-reference)

---

## Running the Game

Requires a local server because of ES module imports (`import/export`). Does not work from `file://`.

**VS Code — Live Server** *(recommended)*
```
Right-click index.html → Open with Live Server
```

**Node.js**
```bash
npx serve .
```

**Python**
```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

## File Structure

```
froggy-jump/
├── index.html              ← canvas + HTML stats panel
├── game.js                 ← Game class, wires all systems together
├── variables.js            ← all constants (Size, State, Physics, Platforms, Levels)
├── levels.js               ← level definitions (6 themed environments)
├── entities/
│   └── frog.js             ← Frog class, reset(), currentPlatform
├── services/
│   ├── platform.js         ← Platform class, update(), wall/vertical bounce
│   └── platformManager.js  ← generation, culling, collision
├── renderer/
│   ├── backgroundRenderer.js  ← sky, stars, clouds (changes per level)
│   ├── frogRenderer.js        ← animated frog sprite (4 frames)
│   ├── platformRenderer.js    ← 6 texture types (grass, stone, ice, cloud, lava, crystal)
│   ├── particleSystem.js      ← jump dust and landing splash
│   └── uiRenderer.js          ← bitmap font, HUD with level name
├── assets/
│   ├── frog-spritesheet.png      ← 416×50 (4 frames)
│   └── frog-spritesheet-2x.png   ← 832×100 (4 frames, used by default)
├── README.md               ← game mechanics documentation
└── RENDERING.md            ← rendering system technical docs
```

> **Key tuning files:**
> - `variables.js` — all physics constants + level thresholds
> - `levels.js` — visual themes, colors, and platform textures
> - Rendering constants are documented in `RENDERING.md`

---

## Architecture

### Canvas & Logical Size

The game always thinks in **400×650 pixels** regardless of screen size.

```js
// variables.js
Size.LOGICAL_WIDTH  = 400
Size.LOGICAL_HEIGHT = 650
```

The canvas CSS is scaled up or down using `Math.min(scaleX, scaleY)` — this keeps the aspect ratio intact. The internal coordinate system never changes so all game math is device-independent.

```js
const scale = Math.min(
  window.innerWidth  / this.width,
  window.innerHeight / this.height
);
canvas.style.width  = width  * scale + 'px';
canvas.style.height = height * scale + 'px';
```

---

### Game Loop

`requestAnimationFrame` calls `loop()` ~120 times per second (capped by the screen's refresh rate). Each call does exactly three things in order:

```
1. calculate dt   →  time since last frame in seconds
2. update(dt)     →  advance all game logic
3. draw()         →  paint the current frame
```

`update` and `draw` are fully separate — `update` only moves numbers, `draw` only paints them.

---

### Delta Time (`dt`)

Every movement is multiplied by `dt` so the game runs at the same speed on any device.

```js
// A platform at 70px/s:
// 120fps → 70 × 0.008 = 0.56px per frame
//  60fps → 70 × 0.016 = 1.12px per frame
// Same distance per second either way.

platform.x += platform.vx * dt;
```

`dt` is capped at `33ms` (`MAX_DT`) so a stalled/backgrounded tab doesn't cause a massive physics jump on resume.

---

### State Machine

The game is always in exactly one of three states:

| State | Description |
|-------|-------------|
| `IDLE` | Title screen, waiting for input |
| `PLAYING` | Active gameplay, all systems run |
| `DEAD` | Game over screen, waiting to restart |

All transitions go through `setState()` which logs every change to the console. Physics and platform logic only run in `PLAYING`.

---

## Physics

### Gravity

Measured in `px/s²`. Applied every frame the frog is airborne:

```js
frog.vy += Physics.GRAVITY * dt   // GRAVITY = 1800
```

This is acceleration — `vy` grows more positive (downward) over time, creating the natural arc of a jump. Higher gravity = snappier, more arcade feel.

---

### Jump Charge

While `Space` / touch is held **and** the frog is grounded, `charge` fills at `CHARGE_RATE`:

```js
frog.charge = Math.min(frog.charge + CHARGE_RATE * dt, JUMP_POWER_MAX)
// CHARGE_RATE = 900 px/s per second
// Full charge takes ~1.2 seconds
```

On release, charge maps linearly to launch power:

```js
t     = frog.charge / JUMP_POWER_MAX        // 0.0 → 1.0
power = JUMP_POWER_MIN + t × (MAX - MIN)    // 500 → 1100 px/s
frog.vy = -power                            // negative = upward
```

| Constant | Value | Effect |
|----------|-------|--------|
| `JUMP_POWER_MIN` | `500 px/s` | Minimum jump — tiny tap |
| `JUMP_POWER_MAX` | `1100 px/s` | Maximum jump — full charge |
| `CHARGE_RATE` | `900 px/s²` | How fast the bar fills |

---

### Velocity Boost

When jumping from a moving platform, the frog inherits the platform's horizontal velocity **multiplied by a boost factor**:

```js
// In updateJump()
const platform = frog.currentPlatform;
if (platform) {
  frog.vx = platform.vx × FROG_VELOCITY_BOOST;
}
```

This creates momentum-based gameplay — jumping from a fast platform propels you further horizontally.

**Example:**
```
Platform moving at 120 px/s
Boost factor = 2.0
Jump velocity = 120 × 2.0 = 240 px/s
```

| Constant | Value | Effect |
|----------|-------|--------|
| `FROG_VELOCITY_BOOST` | `2.0` | Multiplier applied to platform velocity on jump |

---

### Air Drag

While airborne, horizontal velocity decays each frame to bleed off the velocity inherited from a moving platform:

```js
frog.vx *= Math.max(0, 1 - AIR_DRAG * dt)
```

Without this, the frog would drift sideways indefinitely after leaving a fast-moving platform.

| Constant | Value | Effect |
|----------|-------|--------|
| `AIR_DRAG` | `3.0` | Friction coefficient — higher = more drag |

---

### Wall Bounce

Frog bounces off screen edges instead of wrapping. Behavior differs based on state:

**When Airborne:**
```js
// Hits left edge
frog.vx = Math.abs(frog.vx) × WALL_BOUNCE_DAMPING  // Reverse direction, lose energy

// Hits right edge  
frog.vx = -Math.abs(frog.vx) × WALL_BOUNCE_DAMPING  // Reverse direction, lose energy
```

**When Grounded:**
```js
// Hits edge
frog.x = clamp(frog.x, 0, width)  // Hard stop at boundary
frog.vx = 0                        // Stop moving
```

The frog cannot walk through walls while standing on a platform. If the platform carries the frog to the edge, the frog stops at the boundary and can walk off to become airborne.

| Constant | Value | Effect |
|----------|-------|--------|
| `WALL_BOUNCE_DAMPING` | `0.6` | Velocity retained after bounce (0.6 = 60%) |

---

## Platforms

### Structure

Each platform is a rectangle in world coordinates:

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | Left edge (world space) |
| `y` | `number` | Top edge (world space) |
| `width` | `number` | Variable, shrinks with difficulty |
| `height` | `number` | Fixed at `14px` |
| `vx` | `number` | Horizontal velocity `px/s` |
| `vy` | `number` | Vertical velocity `px/s` |
| `spawnY` | `number` | Y at creation — used to bound vertical movement |

---

### Generation

`PlatformManager._generateNext(difficulty)` places each new platform above the last. Three values scale with difficulty:

```js
// Width — narrower platforms are harder to land on
width = Math.max(40, 110 - difficulty * 2)

// Vertical gap — bigger gaps require more precise jumps
gapY = Math.min(90 + difficulty * 3, 160)

// Speed — faster movement is harder to track
speed = Math.min(70 + difficulty * 8, 280)
```

Platforms are pre-generated `16` deep on init. During play, new ones generate whenever:
```js
highestY > cameraY - LOGICAL_HEIGHT
```
Old platforms more than **two screens below** the camera are deleted — the world is infinite but memory stays constant.

---

### Movement

Each platform calls `update(dt)` every frame:

```js
// Horizontal — bounces off screen edges
this.x += this.vx * dt;
if (this.x <= 0)                  this.vx =  Math.abs(this.vx);  // rightward
if (this.x + width >= LOGICAL_W)  this.vx = -Math.abs(this.vx);  // leftward

// Vertical — bounded ±30px from spawnY
this.y += this.vy * dt;
if (this.y <= spawnY - 30)  this.vy =  Math.abs(this.vy);  // downward
if (this.y >= spawnY + 30)  this.vy = -Math.abs(this.vy);  // upward
```

`Math.abs()` is used instead of simple negation to prevent a platform from getting stuck vibrating on a wall if it overshoots by more than one frame.

---

### Collision

Only checked when the frog is **falling** (`vy > 0`). Three conditions must all be true:

```js
// 1. Horizontal overlap (4px inset prevents edge-pixel landings)
frogRight > platform.x + 4  &&  frogLeft < platform.right - 4

// 2. Frog bottom has reached the surface
frogBottom >= platform.top

// 3. Frog bottom hasn't passed too far through (catches fast falls)
frogBottom <= platform.top + platform.height + frog.vy * 0.017
```

The `vy * 0.017` term in condition 3 prevents fast-falling frogs from tunnelling through thin platforms in a single frame.

---

### Grounded Riding

Every frame the frog is grounded, `updateGroundedRide()` runs:

```js
const stillOn = frogRight > p.x + 4 && frogLeft < p.right - 4;

if (stillOn) {
  frog.y  = p.top - FROG_H / 2;  // snap to surface
  frog.vx = p.vx;                 // match horizontal velocity
  frog.vy = 0;                    // no vertical drift
} else {
  frog.grounded        = false;   // walked off the edge
  frog.currentPlatform = null;
}
```

This is what makes the frog visually lock to a moving platform. Without it, `platform.vy` would move the surface each frame while the frog stayed put — causing visible jitter.

---

## Camera

### World vs Screen Space

Platforms and the frog live in **world coordinates** — Y values that can be arbitrarily negative as the frog climbs higher. To draw anything on screen:

```js
screenY = worldY - cameraY
```

`cameraY` is the world Y that maps to the **top of the screen**. A lower `cameraY` means the camera has moved higher up in the world.

---

### Scroll

The camera only ever moves **upward** — it never scrolls back down.

```js
// Target: keep frog at 65% down the screen
const targetCameraY = frog.y - height * 0.65;

// Only scroll up
if (targetCameraY < cameraY) {
  cameraY += (targetCameraY - cameraY) * 0.1;  // lerp
}
```

The `× 0.1` lerp closes 10% of the gap per frame — gives a smooth chase feel instead of rigidly locking to the frog.

---

## Score & Difficulty

**Score** — how many units the frog has climbed above the starting floor:

```js
score = Math.floor((FLOOR_Y - frog.y) / 10)
// Only ever increases, even if the frog falls
```

**Difficulty** — derived from score, passed to `platformManager.update()` every frame:

```js
difficulty = Math.floor(score / 5)
// Increments every 5 score points
// At score 50 → difficulty 10
// Platforms running at 70 + (10 × 8) = 150 px/s
```

---

## Level System

The game features an **epic 6-level progression system** where each level is a distinct world with unique visuals, mechanics, and difficulty scaling. Levels require **40-80+ successful jumps** to complete, creating a deep sense of progression.

### Quick Overview

| Level | Name | Score | Sky | Platforms | Difficulty |
|-------|------|-------|-----|-----------|------------|
| **0** | Meadow | 0-119 | Purple night | Green grass | Baseline |
| **1** | Cavern | 120-279 | Dark underground | Grey stone | +8% harder |
| **2** | Frozen Peaks | 280-499 | Blue twilight | Blue ice | +15% harder |
| **3** | Cloud City | 500-799 | Pink sunset | White clouds | +25% harder |
| **4** | Volcano | 800-1199 | Red inferno | Lava (animated) | +35% harder |
| **5** | Space | 1200+ | Black void | Crystal (animated) | +50% harder |

### Key Features

**Smooth Visual Transitions:**
- Colors gradually blend between levels (no sudden snaps)
- Sky gradients, star counts, and cloud patterns change
- Platform textures transform from grass → stone → ice → clouds → lava → crystal

**Three-Layer Difficulty Scaling:**
- **difficultyMultiplier** — Makes platforms narrower
- **gapMultiplier** — Makes gaps larger
- **speedMultiplier** — Makes platforms faster
- Compounds with base difficulty for exponential challenge curve

**Visual Feedback:**
- Level progress bar at top shows current level and progress
- Level name displayed in score panel
- Console logs level transitions

---

### Complete Level System Documentation

**For full details on:**
- How difficulty scales with each level
- Visual customization (colors, stars, clouds, textures)
- Tuning multipliers and thresholds
- Adding/removing levels
- Advanced formulas and calculations

**See:** [`LEVEL_SYSTEM.md`](./LEVEL_SYSTEM.md) — Complete 400+ line guide with examples, formulas, and step-by-step instructions.

---
## Tuning Reference

All game feel constants in one place:

### `variables.js` — Physics

| Constant | Value | Effect |
|----------|-------|--------|
| `Physics.GRAVITY` | `1800 px/s²` | Higher = snappier jumps, faster falls |
| `Physics.JUMP_POWER_MIN` | `500 px/s` | Minimum jump height |
| `Physics.JUMP_POWER_MAX` | `1100 px/s` | Maximum jump height |
| `Physics.CHARGE_RATE` | `900 px/s²` | How fast the charge bar fills |
| `Physics.FROG_W` | `82 px` | Frog collision box width |
| `Physics.FROG_H` | `40 px` | Frog collision box height |
| `Physics.FROG_VELOCITY_BOOST` | `2.0` | Jump momentum multiplier from platforms |
| `Physics.WALL_BOUNCE_DAMPING` | `0.6` | Energy retained after wall bounce (60%) |
| `Physics.AIR_DRAG` | `3.0` | Horizontal friction while airborne |

### `variables.js` — Platforms

| Constant | Value | Effect |
|----------|-------|--------|
| `Platforms.WIDTH_MAX` | `120 px` | Starting platform width (10px wider) |
| `Platforms.WIDTH_MIN` | `65 px` | Minimum platform width (10px wider floor) |
| `Platforms.WIDTH_SCALE` | `0.8 px` | Width lost per difficulty (33% slower shrink) |
| `Platforms.GAP_Y_BASE` | `80 px` | Starting vertical gap (10px smaller) |
| `Platforms.GAP_Y_MAX` | `140 px` | Maximum vertical gap (20px lower cap) |
| `Platforms.GAP_Y_SCALE` | `0.02` | Gap growth rate (33% slower growth) |
| `Platforms.SPEED_X_BASE` | `50 px/s` | Horizontal speed at difficulty 0 (29% slower) |
| `Platforms.SPEED_Y_BASE` | `35 px/s` | Vertical speed at difficulty 0 (22% slower) |
| `Platforms.SPEED_SCALE` | `6 px/s` | Speed added per difficulty (25% slower growth) |
| `Platforms.SPEED_MAX` | `220 px/s` | Absolute speed ceiling (21% lower cap) |
| `Platforms.MARGIN` | `20 px` | Minimum distance from screen edges |

### `variables.js` — Levels

| Constant | Value | Effect |
|----------|-------|--------|
| `Levels.MEADOW_THRESHOLD` | `0` | Tutorial level (40 jumps, grass platforms) |
| `Levels.CAVERN_THRESHOLD` | `120` | Underground (+8% harder, stone platforms) |
| `Levels.FROZEN_THRESHOLD` | `280` | Ice mountains (+15% harder, ice platforms) |
| `Levels.CLOUD_THRESHOLD` | `500` | Sky realm (+25% harder, cloud platforms) |
| `Levels.VOLCANO_THRESHOLD` | `800` | Inferno (+35% harder, animated lava) |
| `Levels.SPACE_THRESHOLD` | `1200` | Endgame (+50% harder, animated crystal) |

### `levels.js` — Per-Level Difficulty Multipliers

Each level has three multipliers that stack with base difficulty:

| Level | Difficulty × | Gap × | Speed × | Effect |
|-------|-------------|-------|---------|--------|
| Meadow | 1.0 | 1.0 | 1.0 | Baseline (tutorial) |
| Cavern | 1.08 | 1.05 | 1.05 | 8% harder overall (was 15%) |
| Frozen | 1.15 | 1.08 | 1.1 | 15% harder (was 30%) |
| Cloud City | 1.25 | 1.12 | 1.15 | 25% harder (was 50%) |
| Volcano | 1.35 | 1.18 | 1.25 | 35% harder (was 80%) |
| Space | 1.5 | 1.25 | 1.35 | 50% harder (was 120%) |

### Example Calculations

**Platform width at different difficulties:**
```
Difficulty  0: 120px (WIDTH_MAX) - 10px wider than before
Difficulty 10: 112px (120 - 10×0.8) - stays wider longer
Difficulty 20: 104px (120 - 20×0.8) - still very comfortable
Difficulty 50: 80px  (120 - 50×0.8) - decent landing area
Difficulty 69: 65px  (hits WIDTH_MIN floor) - wider minimum
```

**Platform speed at different difficulties:**
```
Difficulty  0: 50 px/s  (SPEED_X_BASE) - 29% slower start
Difficulty 10: 110 px/s (50 + 10×6) - much more manageable
Difficulty 20: 170 px/s (50 + 20×6) - still trackable
Difficulty 28: 218 px/s (50 + 28×6) - near SPEED_MAX
Difficulty 29: 220 px/s (hits SPEED_MAX ceiling) - lower cap
```

**Vertical gaps at different difficulties:**
```
Difficulty  0: 80px (GAP_Y_BASE) - 10px smaller start
Difficulty 10: 100px (80 + 10×2) - smaller gaps
Difficulty 20: 120px (80 + 20×2) - still jumpable
Difficulty 30: 140px (hits GAP_Y_MAX) - reachable ceiling
```

**Level progression with NEW EASIER compounding difficulty:**
```
Score 0-119:    Meadow (grass, 1.0× multipliers)
  Entry: width=120px, speed=50px/s, gap=80px
  Exit:  width=101px, speed=182px/s, gap=128px
  Much easier! Wider platforms, slower speed, smaller gaps

Score 120-279:  Cavern (stone, 1.08× difficulty, 1.05× speed/gap)
  Entry: width=99px, speed=196px/s, gap=137px
  Exit:  width=72px, speed=220px/s, gap=147px
  Gentle difficulty increase, more forgiving

Score 280-499:  Frozen Peaks (ice, 1.15× difficulty, 1.1× speed)
  Entry: width=74px, speed=220px/s, gap=158px
  Exit:  width=65px(min), speed=220px/s, gap=140px(max)
  Still challenging but not extreme

Score 500-799:  Cloud City (clouds, 1.25× difficulty, 1.15× speed)
  Entry: Platforms at minimum, speed maxed, gaps at cap
  Requires skill but achievable
  
Score 800-1199: Volcano (lava, 1.35× difficulty, 1.25× speed)
  Entry: All stats capped, speed feels fast but manageable
  
Score 1200+:    Space (crystal, 1.5× difficulty, 1.35× speed)
  Entry: Endgame challenge with 50% multipliers (was 120%)
  Difficult but not impossible
```

**Key Changes - Game is Now MUCH EASIER:**
- Platforms 10px wider throughout (120px → 65px vs 110px → 55px)
- Speed 29% slower start, 21% lower cap (50-220 vs 70-280)
- Gaps 10px smaller start, 20px lower cap (80-140 vs 90-160)
- Width shrinks 33% slower (0.8 vs 1.2 per difficulty)
- Level multipliers reduced by ~40-60% across the board