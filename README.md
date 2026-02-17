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
  - [Air Drag](#air-drag)
  - [Wall Wrap](#wall-wrap)
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

**VS Code — Live Server** _(recommended)_

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
├── index.html          ← canvas + HTML stats panel
├── variables.js        ← all constants (Size, State, Physics, FPS)
├── frog.js             ← Frog class, reset(), currentPlatform
├── platform.js         ← Platform class, update(), wall/vertical bounce
├── platformManager.js  ← generation, culling, collision, drawing
└── game.js             ← Game class, wires all systems together
```

> Every number that controls game feel lives in `variables.js` or the `GEN` object at the top of `platformManager.js` — those are your two tuning files.

---

## Architecture

### Canvas & Logical Size

The game always thinks in **400×650 pixels** regardless of screen size.

```js
// variables.js
Size.LOGICAL_WIDTH = 400;
Size.LOGICAL_HEIGHT = 650;
```

The canvas CSS is scaled up or down using `Math.min(scaleX, scaleY)` — this keeps the aspect ratio intact. The internal coordinate system never changes so all game math is device-independent.

```js
const scale = Math.min(
  window.innerWidth / this.width,
  window.innerHeight / this.height,
);
canvas.style.width = width * scale + "px";
canvas.style.height = height * scale + "px";
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

| State     | Description                          |
| --------- | ------------------------------------ |
| `IDLE`    | Title screen, waiting for input      |
| `PLAYING` | Active gameplay, all systems run     |
| `DEAD`    | Game over screen, waiting to restart |

All transitions go through `setState()` which logs every change to the console. Physics and platform logic only run in `PLAYING`.

---

## Physics

### Gravity

Measured in `px/s²`. Applied every frame the frog is airborne:

```js
frog.vy += Physics.GRAVITY * dt; // GRAVITY = 1800
```

This is acceleration — `vy` grows more positive (downward) over time, creating the natural arc of a jump. Higher gravity = snappier, more arcade feel.

---

### Jump Charge

While `Space` / touch is held **and** the frog is grounded, `charge` fills at `CHARGE_RATE`:

```js
frog.charge = Math.min(frog.charge + CHARGE_RATE * dt, JUMP_POWER_MAX);
// CHARGE_RATE = 900 px/s per second
// Full charge takes ~1.2 seconds
```

On release, charge maps linearly to launch power:

```js
t     = frog.charge / JUMP_POWER_MAX        // 0.0 → 1.0
power = JUMP_POWER_MIN + t × (MAX - MIN)    // 500 → 1100 px/s
frog.vy = -power                            // negative = upward
```

| Constant         | Value       | Effect                     |
| ---------------- | ----------- | -------------------------- |
| `JUMP_POWER_MIN` | `500 px/s`  | Minimum jump — tiny tap    |
| `JUMP_POWER_MAX` | `1100 px/s` | Maximum jump — full charge |
| `CHARGE_RATE`    | `900 px/s²` | How fast the bar fills     |

---

### Air Drag

While airborne, horizontal velocity decays each frame to bleed off the velocity inherited from a moving platform:

```js
frog.vx *= Math.max(0, 1 - 3.0 * dt);
// coefficient 3.0 — feels natural without killing momentum instantly
```

Without this, the frog would drift sideways indefinitely after leaving a fast-moving platform.

---

### Wall Wrap

Only applies when **airborne**. If the frog exits either screen edge it teleports to the opposite side:

```js
if (frog.x < -hw) frog.x = width + hw;
if (frog.x > width + hw) frog.x = -hw;
```

Disabled when grounded — the platform's own wall bounce handles positioning and the frog rides along.

---

## Platforms

### Structure

Each platform is a rectangle in world coordinates:

| Property | Type     | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `x`      | `number` | Left edge (world space)                         |
| `y`      | `number` | Top edge (world space)                          |
| `width`  | `number` | Variable, shrinks with difficulty               |
| `height` | `number` | Fixed at `14px`                                 |
| `vx`     | `number` | Horizontal velocity `px/s`                      |
| `vy`     | `number` | Vertical velocity `px/s`                        |
| `spawnY` | `number` | Y at creation — used to bound vertical movement |

---

### Generation

`PlatformManager._generateNext(difficulty)` places each new platform above the last. Three values scale with difficulty:

```js
// Width — narrower platforms are harder to land on
width = Math.max(40, 110 - difficulty * 2);

// Vertical gap — bigger gaps require more precise jumps
gapY = Math.min(90 + difficulty * 3, 160);

// Speed — faster movement is harder to track
speed = Math.min(70 + difficulty * 8, 280);
```

Platforms are pre-generated `16` deep on init. During play, new ones generate whenever:

```js
highestY > cameraY - LOGICAL_HEIGHT;
```

Old platforms more than **two screens below** the camera are deleted — the world is infinite but memory stays constant.

---

### Movement

Each platform calls `update(dt)` every frame:

```js
// Horizontal — bounces off screen edges
this.x += this.vx * dt;
if (this.x <= 0) this.vx = Math.abs(this.vx); // rightward
if (this.x + width >= LOGICAL_W) this.vx = -Math.abs(this.vx); // leftward

// Vertical — bounded ±30px from spawnY
this.y += this.vy * dt;
if (this.y <= spawnY - 30) this.vy = Math.abs(this.vy); // downward
if (this.y >= spawnY + 30) this.vy = -Math.abs(this.vy); // upward
```

`Math.abs()` is used instead of simple negation to prevent a platform from getting stuck vibrating on a wall if it overshoots by more than one frame.

---

### Collision

Only checked when the frog is **falling** (`vy > 0`). Three conditions must all be true:

```js
// 1. Horizontal overlap (4px inset prevents edge-pixel landings)
frogRight > platform.x + 4 && frogLeft < platform.right - 4;

// 2. Frog bottom has reached the surface
frogBottom >= platform.top;

// 3. Frog bottom hasn't passed too far through (catches fast falls)
frogBottom <= platform.top + platform.height + frog.vy * 0.017;
```

The `vy * 0.017` term in condition 3 prevents fast-falling frogs from tunnelling through thin platforms in a single frame.

---

### Grounded Riding

Every frame the frog is grounded, `updateGroundedRide()` runs:

```js
const stillOn = frogRight > p.x + 4 && frogLeft < p.right - 4;

if (stillOn) {
  frog.y = p.top - FROG_H / 2; // snap to surface
  frog.vx = p.vx; // match horizontal velocity
  frog.vy = 0; // no vertical drift
} else {
  frog.grounded = false; // walked off the edge
  frog.currentPlatform = null;
}
```

This is what makes the frog visually lock to a moving platform. Without it, `platform.vy` would move the surface each frame while the frog stayed put — causing visible jitter.

---

## Camera

### World vs Screen Space

Platforms and the frog live in **world coordinates** — Y values that can be arbitrarily negative as the frog climbs higher. To draw anything on screen:

```js
screenY = worldY - cameraY;
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
  cameraY += (targetCameraY - cameraY) * 0.1; // lerp
}
```

The `× 0.1` lerp closes 10% of the gap per frame — gives a smooth chase feel instead of rigidly locking to the frog.

---

## Score & Difficulty

**Score** — how many units the frog has climbed above the starting floor:

```js
score = Math.floor((FLOOR_Y - frog.y) / 10);
// Only ever increases, even if the frog falls
```

**Difficulty** — derived from score, passed to `platformManager.update()` every frame:

```js
difficulty = Math.floor(score / 5);
// Increments every 5 score points
// At score 50 → difficulty 10
// Platforms running at 70 + (10 × 8) = 150 px/s
```

---

## Tuning Reference

All feel-related constants in one place:

### `variables.js`

| Constant                 | Value        | Effect                                |
| ------------------------ | ------------ | ------------------------------------- |
| `Physics.GRAVITY`        | `1800 px/s²` | Higher = snappier jumps, faster falls |
| `Physics.JUMP_POWER_MIN` | `500 px/s`   | Minimum jump height                   |
| `Physics.JUMP_POWER_MAX` | `1100 px/s`  | Maximum jump height                   |
| `Physics.CHARGE_RATE`    | `900 px/s²`  | How fast the charge bar fills         |
| `FPS.TARGET`             | `120`        | Target frame rate                     |

### `platformManager.js` — `GEN` object

| Constant       | Value      | Effect                                  |
| -------------- | ---------- | --------------------------------------- |
| `WIDTH_MAX`    | `110 px`   | Starting platform width                 |
| `WIDTH_MIN`    | `40 px`    | Narrowest a platform ever gets          |
| `GAP_Y_BASE`   | `90 px`    | Starting vertical gap between platforms |
| `GAP_Y_MAX`    | `160 px`   | Largest vertical gap                    |
| `SPEED_X_BASE` | `70 px/s`  | Horizontal speed at difficulty 0        |
| `SPEED_Y_BASE` | `45 px/s`  | Vertical speed at difficulty 0          |
| `SPEED_SCALE`  | `8 px/s`   | Speed added per difficulty level        |
| `SPEED_MAX`    | `280 px/s` | Absolute speed ceiling                  |
