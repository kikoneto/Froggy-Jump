# Level System Guide

Complete guide to understanding and tuning the 6-level progression system in Froggy Jump.

---

## Table of Contents

1. [Overview](#overview)
2. [How Levels Work](#how-levels-work)
3. [Level Definitions](#level-definitions)
4. [Difficulty Scaling System](#difficulty-scaling-system)
5. [Visual Customization](#visual-customization)
6. [Tuning Guide](#tuning-guide)
7. [Advanced Formulas](#advanced-formulas)
8. [Examples & Calculations](#examples--calculations)

---

## Overview

The level system transforms Froggy Jump from a simple arcade game into an epic journey through 6 distinct worlds. As players climb higher, they encounter:

- **Different visual themes** (sky colors, platform textures, star counts)
- **Increasing difficulty** (narrower platforms, faster speeds, bigger gaps)
- **Smooth transitions** (colors gradually blend between levels)

**Key Files:**

- `levels.js` — Level definitions (colors, multipliers, thresholds)
- `variables.js` — Level thresholds (when each level activates)
- `backgroundRenderer.js` — Sky/stars/clouds rendering
- `platformRenderer.js` — Platform texture rendering
- `platformManager.js` — Difficulty application

---

## How Levels Work

### **1. Score-Based Activation**

Levels activate automatically when the player reaches certain score thresholds:

```javascript
// variables.js → Levels
MEADOW_THRESHOLD:   0,      // Level 0
CAVERN_THRESHOLD:   120,    // Level 1
FROZEN_THRESHOLD:   280,    // Level 2
CLOUD_THRESHOLD:    500,    // Level 3
VOLCANO_THRESHOLD:  800,    // Level 4
SPACE_THRESHOLD:    1200,   // Level 5
```

**Duration per level:**

- Meadow: 0-119 (120 points, ~40 jumps)
- Cavern: 120-279 (160 points, ~50 jumps)
- Frozen: 280-499 (220 points, ~60 jumps)
- Cloud City: 500-799 (300 points, ~70 jumps)
- Volcano: 800-1199 (400 points, ~80 jumps)
- Space: 1200+ (endless endgame)

### **2. Three-Layer Difficulty System**

Each level has **3 multipliers** that compound with base difficulty:

```javascript
// levels.js - Example: Frozen Peaks
difficultyMultiplier: 1.15,  // Platforms 15% narrower
gapMultiplier: 1.08,          // Gaps 8% larger
speedMultiplier: 1.1,         // Platforms 10% faster
```

### **3. Visual Themes**

Each level defines:

- **Sky gradient** (8-band color array)
- **Star color & count**
- **Cloud color & count**
- **Platform texture type** (grass, stone, ice, cloud, lava, crystal)
- **Platform color palette** (7-8 colors per texture)

### **4. Smooth Transitions**

Between level transitions (e.g., score 100-120), colors **gradually interpolate**:

```javascript
progress = (score - currentThreshold) / (nextThreshold - currentThreshold);
blendedColor = lerp(currentColor, nextColor, progress);
```

**Example at score 100:**

- 100 / 120 = 83% through Meadow
- Sky is 83% Meadow purple + 17% Cavern dark
- Transition feels smooth, not jarring

---

## Level Definitions

### **Level 0: Meadow**

**Theme:** Peaceful starting area, night sky, green grass

**Thresholds:**

- Activates: Score 0
- Ends: Score 119
- Duration: ~40 jumps

**Difficulty:**

```javascript
difficultyMultiplier: 1.0,  // Baseline
gapMultiplier: 1.0,          // Normal gaps
speedMultiplier: 1.0,        // Normal speed
```

**Visuals:**

- Sky: Dark purple night (`#0a0a1e` → `#181840`)
- Stars: 60 white stars
- Clouds: 8 grey clouds
- Platforms: Green grass with brown dirt

**Experience:** Tutorial phase, learn mechanics, comfortable landing.

---

### **Level 1: Cavern**

**Theme:** Underground depths, stone caverns

**Thresholds:**

- Activates: Score 120
- Ends: Score 279
- Duration: ~50 jumps

**Difficulty:**

```javascript
difficultyMultiplier: 1.08,  // 8% harder
gapMultiplier: 1.05,          // 5% bigger gaps
speedMultiplier: 1.05,        // 5% faster
```

**Visuals:**

- Sky: Darker underground atmosphere (`#1a1a2e` → `#28284a`)
- Stars: 40 blue-tinted stars (`#88aaff`)
- Clouds: 5 darker clouds
- Platforms: Grey stone with cracks

**Experience:** First challenge, noticeably harder but manageable.

**What changes:**

- Platforms ~5-10px narrower
- Speed ~5-10 px/s faster
- Gaps ~5-10px larger
- Visual: Purple → dark grey, grass → stone

---

### **Level 2: Frozen Peaks**

**Theme:** Icy mountain heights, cold atmosphere

**Thresholds:**

- Activates: Score 280
- Ends: Score 499
- Duration: ~60 jumps

**Difficulty:**

```javascript
difficultyMultiplier: 1.15,  // 15% harder
gapMultiplier: 1.08,          // 8% bigger gaps
speedMultiplier: 1.1,         // 10% faster
```

**Visuals:**

- Sky: Blue-grey twilight (`#0d1520` → `#1b2a3c`)
- Stars: 80 light blue stars (`#aaddff`)
- Clouds: 12 grey-blue clouds
- Platforms: Blue ice with white shine

**Experience:** Skill gate, precision required, longer level.

**What changes:**

- Significant narrowing of platforms
- Speed becomes noticeable
- Gaps require better charges
- Visual: Dark grey → blue, stone → ice

---

### **Level 3: Cloud City**

**Theme:** Floating sky realm, ethereal beauty

**Thresholds:**

- Activates: Score 500
- Ends: Score 799
- Duration: ~70 jumps

**Difficulty:**

```javascript
difficultyMultiplier: 1.25,  // 25% harder
gapMultiplier: 1.12,          // 12% bigger gaps
speedMultiplier: 1.15,        // 15% faster
```

**Visuals:**

- Sky: Purple-pink sunset (`#2a1540` → `#38235c`)
- Stars: 100 golden stars (`#ffddaa`)
- Clouds: 20 fluffy white clouds
- Platforms: White puffy cloud texture

**Experience:** Expert territory, sustained excellence required.

**What changes:**

- Platforms near minimum width
- Speed at or near cap
- Gaps at maximum
- Visual: Blue → purple-pink, ice → clouds

---

### **Level 4: Volcano**

**Theme:** Inferno, volcanic apocalypse

**Thresholds:**

- Activates: Score 800
- Ends: Score 1199
- Duration: ~80 jumps

**Difficulty:**

```javascript
difficultyMultiplier: 1.35,  // 35% harder
gapMultiplier: 1.18,          // 18% bigger gaps
speedMultiplier: 1.25,        // 25% faster
```

**Visuals:**

- Sky: Red-orange fiery gradient (`#2a1010` → `#622c2c`)
- Stars: Only 30 orange stars (`#ffaa44`)
- Clouds: 6 smoke clouds
- Platforms: Lava rock with **animated glowing cracks**

**Experience:** Brutal challenge, visual intensity matches mechanical intensity.

**What changes:**

- All metrics maxed or near-maxed
- Animated lava glow adds distraction
- Speed overwhelming
- Visual: Pink → red-orange, clouds → lava

---

### **Level 5: Space**

**Theme:** Cosmic endgame, the final frontier

**Thresholds:**

- Activates: Score 1200
- Never ends (endless)

**Difficulty:**

```javascript
difficultyMultiplier: 1.5,   // 50% harder
gapMultiplier: 1.25,          // 25% bigger gaps
speedMultiplier: 1.35,        // 35% faster
```

**Visuals:**

- Sky: Deep black void (`#050510` → `#13132c`)
- Stars: 150 stars everywhere (maximum)
- Clouds: Only 3 nebula wisps
- Platforms: Pink crystal with **animated shimmer**

**Experience:** Master level, only elite players survive here.

**What changes:**

- Absolute maximum difficulty
- Crystal shimmer adds visual challenge
- Endless survival mode
- Visual: Red-orange → black, lava → crystal

---

## Difficulty Scaling System

### **Formula Overview**

Difficulty compounds from **two sources**:

1. **Base Difficulty** (continuous, score-based)
2. **Level Multipliers** (discrete jumps at thresholds)

### **Base Difficulty**

```javascript
baseDifficulty = Math.floor(score / 5);
```

**Increases every 5 points** regardless of level:

- Score 0-4 → Difficulty 0
- Score 50-54 → Difficulty 10
- Score 120-124 → Difficulty 24
- Score 500-504 → Difficulty 100

### **Effective Difficulty**

```javascript
effectiveDifficulty = baseDifficulty × level.difficultyMultiplier
```

**Example at score 280 (Frozen Peaks):**

```javascript
baseDifficulty = 280 / 5 = 56
effectiveDifficulty = 56 × 1.15 = 64.4
```

### **Platform Width**

```javascript
width = WIDTH_MAX - effectiveDifficulty × WIDTH_SCALE
width = Math.max(WIDTH_MIN, width)  // Floor at minimum
```

**Example:**

```javascript
// Score 280, Frozen Peaks
width = 120 - 64.4 × 0.8 = 120 - 51.5 = 68.5px
```

### **Platform Speed**

```javascript
baseSpeed = SPEED_X_BASE + effectiveDifficulty × SPEED_SCALE
speed = baseSpeed × level.speedMultiplier
speed = Math.min(speed, SPEED_MAX × level.speedMultiplier)  // Cap
```

**Example:**

```javascript
// Score 280, Frozen Peaks
baseSpeed = 50 + 64.4 × 6 = 50 + 386.4 = 436.4 px/s
speed = 436.4 × 1.1 = 480 px/s
capped = min(480, 220 × 1.1) = 242 px/s
```

### **Vertical Gap**

```javascript
baseGap = GAP_Y_BASE + effectiveDifficulty × GAP_Y_SCALE × 100
gap = baseGap × level.gapMultiplier
gap = Math.min(gap, GAP_Y_MAX × level.gapMultiplier)  // Cap
```

**Example:**

```javascript
// Score 280, Frozen Peaks
baseGap = 80 + 64.4 × 0.02 × 100 = 80 + 128.8 = 208.8px
gap = 208.8 × 1.08 = 225.5px
capped = min(225.5, 140 × 1.08) = 151.2px
```

---

## Visual Customization

### **Sky Colors**

Each level has 8 gradient bands (top to bottom):

```javascript
sky: {
  bands: [
    '#0a0a1e',  // Darkest (top)
    '#0c0c22',
    '#0e0e28',
    '#10102e',
    '#121234',
    '#141438',
    '#16163c',
    '#181840',  // Lightest (bottom)
  ],
}
```

**How to customize:**

1. Pick theme (night, day, sunset, alien, etc.)
2. Generate 8 colors progressing light → dark or vice versa
3. Use hex color picker for consistency
4. Test in-game to ensure readability

**Tips:**

- Keep contrast low for smooth gradient
- Darker at top creates "looking up" feel
- Lighter at bottom creates "atmosphere" feel

### **Stars**

```javascript
stars: {
  color: '#ffffff',  // Hex color
  count: 60,         // Number of stars (20-150)
}
```

**Guidelines:**

- **Count:** More stars = busier sky (20-40 = sparse, 80-150 = dense)
- **Color:** Match level theme (white = normal, blue = cold, orange = warm)
- Stars twinkle automatically (built into renderer)

### **Clouds**

```javascript
clouds: {
  color: '#2a2a44',  // Hex color
  count: 8,          // Number of clouds (3-20)
}
```

**Guidelines:**

- **Count:** More clouds = fuller sky (3-6 = sparse, 15-20 = dense)
- **Color:** Darker = nighttime, lighter = daytime, red = volcanic
- Clouds have automatic parallax scrolling

### **Platform Colors**

Each platform type has 7-8 colors defining its appearance:

```javascript
platform: {
  type: 'grass',  // Type name (must match renderer)
  colors: {
    top: '#5ecf3e',        // Main surface color
    topLight: '#7eff5a',   // Highlight
    topDark: '#3a9e24',    // Shadow on surface
    body: '#8b5e3c',       // Main body color
    bodyDark: '#6b4028',   // Body shadows
    bodyLight: '#a07048',  // Body highlights
    edge: '#5a3820',       // Dark outline
  },
}
```

**Color Palettes by Type:**

- **Grass:** Green top, brown body
- **Stone:** Grey all over with highlights/shadows
- **Ice:** Blue with white shine
- **Cloud:** White/light grey with puffs
- **Lava:** Orange top, brown body, red glow
- **Crystal:** Pink/purple with shine and glow

---

## Tuning Guide

### **Making Levels Easier/Harder**

**Option 1: Adjust Base Constants** (`variables.js`)

```javascript
// EASIER:
WIDTH_MAX: 130,        // Wider platforms (+10px)
WIDTH_MIN: 75,         // Higher floor (+10px)
WIDTH_SCALE: 0.6,      // Shrink slower (-0.2)
SPEED_MAX: 200,        // Lower cap (-20 px/s)

// HARDER:
WIDTH_MAX: 110,        // Narrower (-10px)
WIDTH_MIN: 50,         // Lower floor (-15px)
WIDTH_SCALE: 1.0,      // Shrink faster (+0.2)
SPEED_MAX: 250,        // Higher cap (+30 px/s)
```

**Option 2: Adjust Level Multipliers** (`levels.js`)

```javascript
// EASIER (Cavern example):
difficultyMultiplier: 1.05,  // Was 1.08 (-3%)
gapMultiplier: 1.02,         // Was 1.05 (-3%)
speedMultiplier: 1.03,       // Was 1.05 (-2%)

// HARDER (Cavern example):
difficultyMultiplier: 1.2,   // Was 1.08 (+12%)
gapMultiplier: 1.15,         // Was 1.05 (+10%)
speedMultiplier: 1.15,       // Was 1.05 (+10%)
```

**Option 3: Adjust Thresholds** (`variables.js`)

```javascript
// FASTER PROGRESSION (reach levels sooner):
CAVERN_THRESHOLD: 80,    // Was 120 (-40)
FROZEN_THRESHOLD: 180,   // Was 280 (-100)
CLOUD_THRESHOLD: 350,    // Was 500 (-150)

// SLOWER PROGRESSION (longer levels):
CAVERN_THRESHOLD: 200,   // Was 120 (+80)
FROZEN_THRESHOLD: 400,   // Was 280 (+120)
CLOUD_THRESHOLD: 700,    // Was 500 (+200)
```

### **Adding a New Level**

**Step 1: Add threshold to `variables.js`**

```javascript
export const Levels = Object.freeze({
  // ... existing thresholds
  SPACE_THRESHOLD: 1200,
  NEBULA_THRESHOLD: 1800, // NEW LEVEL
});
```

**Step 2: Add level definition to `levels.js`**

```javascript
{
  id: 6,
  name: 'Nebula',
  scoreThreshold: Levels.NEBULA_THRESHOLD,

  difficultyMultiplier: 1.7,
  gapMultiplier: 1.35,
  speedMultiplier: 1.5,

  sky: {
    bands: ['#1a0a2e', /* ... 7 more colors */],
  },

  stars: {
    color: '#aa44ff',
    count: 200,
  },

  clouds: {
    color: '#4a2a6a',
    count: 25,
  },

  platform: {
    type: 'nebula',  // NEW TYPE - needs renderer!
    colors: {
      top: '#aa66ff',
      // ... define all colors
    },
  },
}
```

**Step 3: Add texture renderer to `platformRenderer.js`**

```javascript
case 'nebula':
  this._drawNebula(ctx, p, screenY, colors);
  break;

// Then implement _drawNebula() method
_drawNebula(ctx, p, screenY, C) {
  // Use C.top, C.body, etc. to draw texture
  // See existing methods for patterns
}
```

**Step 4: Update UI progress bar**

In `uiRenderer.js`, add color to `levelColors` array:

```javascript
const levelColors = [
  "#5ecf3e", // Meadow
  "#8899aa", // Cavern
  "#aaddff", // Frozen
  "#e8e8ff", // Cloud
  "#ff6644", // Volcano
  "#ff44ff", // Space
  "#aa66ff", // Nebula - NEW
];
```

### **Removing a Level**

1. Delete level object from `levels.js` LEVELS array
2. Remove threshold from `variables.js` Levels
3. Update progress bar dots count in `uiRenderer.js` (change `for (let i = 0; i < 6; i++)`)

---

## Advanced Formulas

### **Complete Width Calculation**

```javascript
function calculateWidth(score) {
  // Step 1: Get level
  const level = getCurrentLevel(score);

  // Step 2: Base difficulty
  const baseDiff = Math.floor(score / 5);

  // Step 3: Apply level multiplier
  const effectiveDiff = baseDiff * level.difficultyMultiplier;

  // Step 4: Calculate width
  let width = 120 - effectiveDiff * 0.8;

  // Step 5: Floor at minimum
  width = Math.max(65, width);

  return width;
}
```

### **Complete Speed Calculation**

```javascript
function calculateSpeed(score) {
  const level = getCurrentLevel(score);
  const baseDiff = Math.floor(score / 5);
  const effectiveDiff = baseDiff * level.difficultyMultiplier;

  // Base speed before multiplier
  let baseSpeed = 50 + effectiveDiff * 6;

  // Apply level speed multiplier
  let speed = baseSpeed * level.speedMultiplier;

  // Cap at maximum (also scaled by multiplier)
  speed = Math.min(speed, 220 * level.speedMultiplier);

  return speed;
}
```

### **Complete Gap Calculation**

```javascript
function calculateGap(score) {
  const level = getCurrentLevel(score);
  const baseDiff = Math.floor(score / 5);
  const effectiveDiff = baseDiff * level.difficultyMultiplier;

  // Base gap before multiplier
  let baseGap = 80 + effectiveDiff * 0.02 * 100;

  // Apply level gap multiplier
  let gap = baseGap * level.gapMultiplier;

  // Cap at maximum (also scaled by multiplier)
  gap = Math.min(gap, 140 * level.gapMultiplier);

  return gap;
}
```

### **Transition Progress**

```javascript
function getTransitionProgress(score) {
  const currentLevel = getCurrentLevel(score);
  const nextIndex = currentLevel.id + 1;

  if (nextIndex >= LEVELS.length) {
    return 1.0; // Max level reached
  }

  const nextLevel = LEVELS[nextIndex];
  const range = nextLevel.scoreThreshold - currentLevel.scoreThreshold;
  const progress = (score - currentLevel.scoreThreshold) / range;

  return Math.max(0, Math.min(1, progress));
}
```

### **Color Interpolation**

```javascript
function lerpColor(color1, color2, t) {
  // Parse hex colors
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
```

---

## Examples & Calculations

### **Example 1: Score 100 (Meadow)**

```javascript
Level: Meadow (id=0)
BaseDifficulty: 100 / 5 = 20
EffectiveDifficulty: 20 × 1.0 = 20

Width: 120 - 20 × 0.8 = 104px
Speed: (50 + 20 × 6) × 1.0 = 170 px/s
Gap: (80 + 20 × 2) × 1.0 = 120px

Transition: (100 - 0) / (120 - 0) = 83% through Meadow
Sky: 83% Meadow purple + 17% Cavern dark
```

**Comfortable tutorial phase.**

### **Example 2: Score 120 (Enter Cavern)**

```javascript
Level: Cavern (id=1)
BaseDifficulty: 120 / 5 = 24
EffectiveDifficulty: 24 × 1.08 = 25.9

Width: 120 - 25.9 × 0.8 = 99px
Speed: (50 + 25.9 × 6) × 1.05 = 214 × 1.05 = 225 px/s (capped at 220)
Gap: (80 + 25.9 × 2) × 1.05 = 132 × 1.05 = 138.5px

Transition: 0% (just entered)
Sky: 100% Cavern colors
Platforms: Stone texture appears
```

**Noticeable but gentle difficulty increase.**

### **Example 3: Score 280 (Enter Frozen)**

```javascript
Level: Frozen Peaks (id=2)
BaseDifficulty: 280 / 5 = 56
EffectiveDifficulty: 56 × 1.15 = 64.4

Width: 120 - 64.4 × 0.8 = 68.5px
Speed: (50 + 64.4 × 6) × 1.1 = 436 × 1.1 = 480 (capped at 242)
Gap: (80 + 64.4 × 2) × 1.08 = 209 × 1.08 = 226 (capped at 151)

Transition: 0% (just entered)
Sky: Blue-grey tones
Platforms: Ice with shine streaks
```

**Challenging but fair with new balance.**

### **Example 4: Score 500 (Enter Cloud City)**

```javascript
Level: Cloud City (id=3)
BaseDifficulty: 500 / 5 = 100
EffectiveDifficulty: 100 × 1.25 = 125

Width: 120 - 125 × 0.8 = 20px (floored at 65px)
Speed: Maxed at 220 × 1.15 = 253 px/s
Gap: Maxed at 140 × 1.12 = 156.8px

All stats hitting caps.
Sustained excellence required.
```

### **Example 5: Score 1200 (Enter Space)**

```javascript
Level: Space (id=5)
BaseDifficulty: 1200 / 5 = 240
EffectiveDifficulty: 240 × 1.5 = 360

Width: 65px (at floor)
Speed: 220 × 1.35 = 297 px/s (maxed)
Gap: 140 × 1.25 = 175px (maxed)

Endgame difficulty.
Crystal platforms shimmer.
150 stars fill the void.
```

---

## Quick Reference

### **Files to Edit**

| File                    | Purpose           | What to Change                |
| ----------------------- | ----------------- | ----------------------------- |
| `variables.js`          | Level thresholds  | When levels activate          |
| `levels.js`             | Level definitions | Colors, multipliers, textures |
| `platformRenderer.js`   | Platform textures | Visual appearance             |
| `backgroundRenderer.js` | Sky rendering     | (Rarely needed)               |
| `uiRenderer.js`         | Progress bar      | Add/remove level dots         |

### **Common Tweaks**

| Goal               | File           | Change                                     |
| ------------------ | -------------- | ------------------------------------------ |
| Easier game        | `variables.js` | Increase WIDTH_MAX, decrease WIDTH_SCALE   |
| Harder game        | `variables.js` | Decrease WIDTH_MIN, increase SPEED_MAX     |
| Gentler levels     | `levels.js`    | Reduce all multipliers                     |
| Faster progression | `variables.js` | Lower all thresholds                       |
| New level          | All 4 files    | Add definition + threshold + renderer + UI |
| Change colors      | `levels.js`    | Edit sky/stars/clouds/platform colors      |

### **Testing Tips**

1. **Test each level transition:** Play to each threshold (120, 280, 500, etc.)
2. **Check visual smoothness:** Colors should blend, not snap
3. **Verify difficulty curve:** Should feel progressively harder, not impossible
4. **Test edge cases:** Score exactly at threshold, just before, just after
5. **Play full runs:** Complete journey 0 → 1200+ to ensure flow

---

## Conclusion

The level system is designed to be:

- **Modular** — Easy to add/remove/modify levels
- **Visual** — Each level feels distinct
- **Balanced** — Difficulty scales predictably
- **Smooth** — Transitions are gradual, not jarring

With this guide, you have complete control over the entire progression system. Experiment, tune, and create your perfect difficulty curve!

🐸 Happy tuning! 🚀
