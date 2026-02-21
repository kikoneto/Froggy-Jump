# Power-Up System Guide

Complete guide to the extensible power-up system in Froggy Jump.

---

## Overview

The power-up system allows players to choose between 3 random power-ups every **200 points**. Power-ups can be:

- **Timed** (active for N seconds)
- **Instant** (immediate one-time effect)
- **Persistent** (until consumed, like shield)

**Architecture:** Fully extensible — add new power-ups without modifying game logic, just add to registry.

**Trigger:** Power-ups appear at score milestones: 200, 400, 600, 800, 1000, 1200, etc. The system waits for your next landing to show the selection (never interrupts mid-jump!). This creates smooth gameplay flow while perfectly aligning with difficulty progression!

---

## 8 Built-In Power-Ups

| Power-Up         | Icon | Duration | Effect                 |
| ---------------- | ---- | -------- | ---------------------- |
| **Double Jump**  | ↟    | 15s      | Jump twice in air      |
| **Shield**       | ◉    | Persist  | Survive one fall       |
| **Slow Motion**  | ◷    | 10s      | Time moves 60% slower  |
| **Mega Jump**    | ⇈    | 12s      | +50% jump power        |
| **Magnet**       | ⬌    | 15s      | Platforms 30px wider   |
| **Ghost Mode**   | ◌    | 8s       | Pass through platforms |
| **Score Boost**  | ★    | Instant  | +50 points immediately |
| **Spring Shoes** | ⌃    | 10s      | Auto max charge        |

---

## How to Add a New Power-Up

### **Step 1: Add to Registry**

Open `powerups.js` and add your power-up to `POWERUP_REGISTRY`:

```javascript
export const POWERUP_REGISTRY = [
  // ... existing power-ups ...

  {
    id: "triple_jump", // Unique identifier
    name: "Triple Jump", // Display name
    description: "Jump 3 times", // Short description
    icon: "⇡", // Emoji or symbol
    color: "#ff44ff", // Hex color for UI
    duration: 12, // Seconds (null = instant)

    apply: (game) => {
      // Code to activate power-up
      game.powerupState.tripleJumpEnabled = true;
      game.powerupState.jumpsRemaining = 3;
    },

    remove: (game) => {
      // Code to deactivate (called when timer expires)
      game.powerupState.tripleJumpEnabled = false;
      game.powerupState.jumpsRemaining = 0;
    },
  },
];
```

### **Step 2: Implement Logic in game.js**

Add the power-up logic to the appropriate sections:

```javascript
// In updateJump() method:
if (
  this.powerupState.tripleJumpEnabled &&
  this.powerupState.jumpsRemaining > 0
) {
  // Allow jump even if not grounded
  if (inputState.justPressed && !this.frog.grounded) {
    this.frog.vy = -this.frog.charge;
    this.powerupState.jumpsRemaining--;

    if (this.powerupState.jumpsRemaining === 0) {
      // Last jump consumed, disable until landing
    }
  }
}

// In collision/landing:
if (landed) {
  this.powerupState.jumpsRemaining = 3; // Reset
}
```

### **Step 3: Done!**

That's it! The system automatically:

- ✅ Shows it in selection screen when player reaches score milestones
- ✅ Tracks timer if duration-based
- ✅ Displays it in active power-ups UI
- ✅ Calls apply/remove at correct times

No game loop modifications needed — the power-up trigger system handles everything!

---

## Power-Up Types

### **Type 1: Timed Effect**

**Example:** Double Jump (active for 15 seconds)

```javascript
{
  id: 'double_jump',
  duration: 15,  // Seconds
  apply: (game) => {
    game.powerupState.doubleJumpEnabled = true;
  },
  remove: (game) => {
    game.powerupState.doubleJumpEnabled = false;
  },
}
```

**How it works:**

1. Player selects it
2. `apply()` is called immediately
3. Timer starts counting down
4. `remove()` is called after 15 seconds

---

### **Type 2: Instant Effect**

**Example:** Score Boost (+50 points immediately)

```javascript
{
  id: 'score_boost',
  duration: null,  // Instant, no timer
  apply: (game) => {
    game.score += 50;
    // Update best score if needed
    if (game.score > game.bestScore) {
      game.bestScore = game.score;
      localStorage.setItem('froggyJumpBest', game.bestScore);
    }
  },
  remove: (game) => {
    // Nothing to remove, instant effect
  },
}
```

**How it works:**

1. Player selects it
2. `apply()` is called, effect happens
3. No timer, no `remove()` call

---

### **Type 3: Persistent (One-Time Use)**

**Example:** Shield (protects until consumed)

```javascript
{
  id: 'shield',
  duration: null,  // No time limit
  apply: (game) => {
    game.powerupState.shieldActive = true;
  },
  remove: (game) => {
    // Called manually when shield is consumed
  },
}
```

**How it works:**

1. Player selects it
2. `apply()` sets shieldActive = true
3. Stays active until death
4. On death, game logic checks shield and manually calls remove

---

## Power-Up State Management

### **powerupState Object**

Every power-up stores its state in `game.powerupState`:

```javascript
this.powerupState = {
  // Timers (managed automatically)
  timers: {
    double_jump: 10.5, // Time remaining in seconds
    mega_jump: 3.2,
  },

  // Active effects (set by apply/remove)
  doubleJumpEnabled: true,
  doubleJumpAvailable: true,
  shieldActive: false,
  slowMotionActive: false,
  timeScale: 1.0,
  jumpMultiplier: 1.0,
  platformWidthBonus: 0,
  ghostActive: false,
  megaJumpActive: false,
  magnetActive: false,
  springActive: false,

  // Custom state for new power-ups
  // Add whatever you need here
};
```

### **Using powerupState in Game Logic**

```javascript
// Example: Mega Jump (jump power multiplier)
if (this.powerupState.megaJumpActive) {
  const boostedPower = this.frog.charge * this.powerupState.jumpMultiplier;
  this.frog.vy = -boostedPower;
} else {
  this.frog.vy = -this.frog.charge;
}

// Example: Magnet (wider platforms)
const finalWidth = baseWidth + this.powerupState.platformWidthBonus;

// Example: Slow Motion (time scale)
const effectiveDt = dt * this.powerupState.timeScale;
```

---

## Power-Up Timing

### **When Power-Ups Appear**

Power-ups are offered every **200 points**. Configure in `game.js`:

```javascript
const POWERUP_SCORE_INTERVAL = 200; // Every 200 points

if (this.score >= this.scoreUntilPowerup) {
  this.showPowerupSelection();
}
```

### **How Selection Works**

1. Player reaches score milestone (200, 400, 600, etc.) — **may be mid-air**
2. System sets `powerupReady` flag (doesn't pause yet!)
3. Player continues current jump (no interruption)
4. When frog lands on next platform → selection appears
5. Game pauses at a natural, safe moment (grounded)
6. `getRandomPowerups()` picks 3 random power-ups from registry
7. Excludes currently active power-ups (no duplicates)
8. Player clicks/taps to choose
9. Chosen power-up's `apply()` is called
10. Next milestone set (+200 points)
11. Game resumes from platform

**Score Milestones:**

- **200** → 1st power-up (Cavern level)
- **400** → 2nd power-up (Late Frozen)
- **600** → 3rd power-up (Cloud City)
- **800** → 4th power-up (Volcano entry)
- **1000** → 5th power-up (Mid Volcano)
- **1200** → 6th power-up (Space entry)
- **Every 200 after...**

### **Strategic Considerations**

**Early Game (Score 200):**

- Shield is valuable (saves from first major mistake)
- Mega Jump helps reach higher levels faster
- Double Jump gives safety net

**Mid Game (Score 400-600):**

- Slow Motion useful in Frozen/Cloud transition
- Magnet helps with narrower platforms
- Spring Shoes speeds up progression

**Late Game (Score 800+):**

- Any power-up is critical for survival in Volcano/Space
- Stack multiple for compound effects
- Time them for difficult sections

### **Player Progression Table**

| Player Skill     | Typical Max Score | Power-Ups Earned | Strategy                                           |
| ---------------- | ----------------- | ---------------- | -------------------------------------------------- |
| **Beginner**     | 100-200           | 0-1              | First power-up is crucial, usually dies soon after |
| **Casual**       | 200-400           | 1-2              | Gets first taste of power-ups, learning combos     |
| **Intermediate** | 400-600           | 2-3              | Strategic choices matter, can reach Cloud City     |
| **Advanced**     | 600-800           | 3-4              | Chaining power-ups, survives Cloud City            |
| **Expert**       | 800-1200          | 4-6              | Multiple active power-ups, reaches Space           |
| **Master**       | 1200+             | 6+               | Power-up combos mastered, endless runs             |

**Note:** Each power-up earned represents significant skill progression — climbing 200 points is no small feat!

---

## Advanced Features

### **Power-Up Stacking**

By default, power-ups **DON'T stack** (can't have 2 double jumps active).

**To allow stacking:**

```javascript
// Don't exclude active power-ups
const powerups = getRandomPowerups(); // No exclusions
```

### **Power-Up Synergies**

Power-ups can interact:

```javascript
// Example: Mega Jump + Slow Motion = More control
apply: (game) => {
  let multiplier = 1.5;

  // Bonus if slow motion active
  if (game.powerupState.slowMotionActive) {
    multiplier = 1.8; // Even stronger!
  }

  game.powerupState.jumpMultiplier = multiplier;
};
```

### **Conditional Power-Ups**

Power-ups that only appear at certain score ranges or levels:

```javascript
// In powerups.js, add condition
{
  id: 'lava_immunity',
  name: 'Lava Shield',
  description: 'Walk on lava',
  icon: '🔥',
  color: '#ff4400',
  duration: 15,

  // Only available in Volcano level (score 800+)
  availableInLevels: [4], // Level ID 4 = Volcano
  minScore: 800,           // Only appears at score 800+

  apply: (game) => {
    game.powerupState.lavaImmunity = true;
  },
  remove: (game) => {
    game.powerupState.lavaImmunity = false;
  },
}

// In getRandomPowerups(), filter by level and score:
export function getRandomPowerups(excludeIds = [], currentLevel = 0, currentScore = 0) {
  const available = POWERUP_REGISTRY.filter(p =>
    !excludeIds.includes(p.id) &&
    (!p.availableInLevels || p.availableInLevels.includes(currentLevel)) &&
    (!p.minScore || currentScore >= p.minScore)
  );
  // ... rest of logic
}
```

---

## Examples

### **Example 1: Teleport (Instant)**

```javascript
{
  id: 'teleport',
  name: 'Teleport',
  description: 'Jump 200px up',
  icon: '⚡',
  color: '#44ddff',
  duration: null, // Instant
  apply: (game) => {
    game.frog.y -= 200; // Move frog up 200px
    game.particles.spawnJump(game.frog.x, game.frog.y); // Particle effect
  },
  remove: (game) => {},
}
```

### **Example 2: Size Change (Timed)**

```javascript
{
  id: 'tiny',
  name: 'Tiny Frog',
  description: 'Smaller hitbox',
  icon: '◦',
  color: '#88ff88',
  duration: 15,
  apply: (game) => {
    game.powerupState.sizeMultiplier = 0.5; // 50% size
    // Adjust collision box
    game.powerupState.originalWidth = Physics.FROG_W;
    Physics.FROG_W = Physics.FROG_W * 0.5;
  },
  remove: (game) => {
    game.powerupState.sizeMultiplier = 1.0;
    // Restore original size
    Physics.FROG_W = game.powerupState.originalWidth;
  },
}
```

### **Example 3: Freeze Platforms (Timed)**

```javascript
{
  id: 'freeze',
  name: 'Time Freeze',
  description: 'Platforms stop',
  icon: '❄',
  color: '#aaddff',
  duration: 8,
  apply: (game) => {
    game.powerupState.platformsFrozen = true;
    // Store original velocities
    game.powerupState.frozenVelocities = new Map();
    game.platforms.platforms.forEach(p => {
      game.powerupState.frozenVelocities.set(p, { vx: p.vx, vy: p.vy });
      p.vx = 0;
      p.vy = 0;
    });
  },
  remove: (game) => {
    game.powerupState.platformsFrozen = false;
    // Restore velocities
    game.platforms.platforms.forEach(p => {
      const vel = game.powerupState.frozenVelocities.get(p);
      if (vel) {
        p.vx = vel.vx;
        p.vy = vel.vy;
      }
    });
  },
}
```

---

## Testing New Power-Ups

### **Quick Test Flow:**

1. **Add to registry** with short duration (3s)
2. **Set POWERUP_SCORE_INTERVAL to 50** (appears every 50 points)
3. **Play and reach 50 points**
4. **Verify:**
   - Does `apply()` activate correctly?
   - Does the effect work?
   - Does `remove()` deactivate correctly?
   - Does UI show timer/icon?
5. **Restore normal duration and interval**

### **Debug Tips:**

```javascript
// Add console logs in apply/remove:
apply: (game) => {
  console.log('TRIPLE JUMP ACTIVATED');
  game.powerupState.tripleJumpEnabled = true;
},

remove: (game) => {
  console.log('TRIPLE JUMP EXPIRED');
  game.powerupState.tripleJumpEnabled = false;
},
```

---

## Common Patterns

### **Pattern 1: Multiplier Effect**

```javascript
apply: (game) => {
  game.powerupState.someMultiplier = 2.0; // 2x effect
},
remove: (game) => {
  game.powerupState.someMultiplier = 1.0; // Back to normal
},
```

### **Pattern 2: Boolean Flag**

```javascript
apply: (game) => {
  game.powerupState.someFeatureEnabled = true;
},
remove: (game) => {
  game.powerupState.someFeatureEnabled = false;
},
```

### **Pattern 3: Bonus Value**

```javascript
apply: (game) => {
  game.powerupState.someBonus = 50; // +50 to something
},
remove: (game) => {
  game.powerupState.someBonus = 0; // Remove bonus
},
```

### **Pattern 4: State Storage**

```javascript
apply: (game) => {
  // Store original value
  game.powerupState.originalGravity = Physics.GRAVITY;
  // Modify
  Physics.GRAVITY = 900; // Half gravity
},
remove: (game) => {
  // Restore
  Physics.GRAVITY = game.powerupState.originalGravity;
},
```

---

## Configuration Examples

### **Easier Game (More Frequent Power-Ups)**

```javascript
// In game.js constructor:
this.POWERUP_SCORE_INTERVAL = 150; // Every 150 points instead of 250
```

**Result:**

- Score 150 → 1st power-up
- Score 300 → 2nd power-up
- Score 450 → 3rd power-up
- More forgiving for beginners

### **Harder Game (Less Frequent Power-Ups)**

```javascript
this.POWERUP_SCORE_INTERVAL = 400; // Every 400 points
```

**Result:**

- Score 400 → 1st power-up
- Score 800 → 2nd power-up
- Score 1200 → 3rd power-up
- Expert mode, power-ups are rare and precious

### **Dynamic Scaling (Progressive Difficulty)**

```javascript
// In selectPowerup() method:
selectPowerup(index) {
  // ... apply power-up

  // Increase interval each time (gets harder)
  this.POWERUP_SCORE_INTERVAL += 50;
  this.scoreUntilPowerup = this.score + this.POWERUP_SCORE_INTERVAL;

  // Now: 250, 300, 350, 400, 450, etc.
}
```

### **Level-Aligned Power-Ups**

```javascript
// Power-ups appear at each level transition
this.POWERUP_SCORE_INTERVAL = 120; // Matches CAVERN_THRESHOLD

// Milestones: 120, 240, 360, 480, 600, 720, 840, etc.
// Aligns with: Cavern, Frozen (280 close), Cloud (500 close), etc.
```

---

## File Reference

| File                          | Purpose                      |
| ----------------------------- | ---------------------------- |
| `powerups.js`                 | Registry of all power-ups    |
| `renderer/powerupRenderer.js` | Selection screen & active UI |
| `game.js`                     | Power-up logic integration   |
| `POWERUPS.md`                 | This guide                   |

---

## Summary

✅ **8 power-ups built-in** (ready to play)
✅ **Fully extensible** (add new ones in minutes)
✅ **3 types supported** (timed, instant, persistent)
✅ **Clean architecture** (registry + apply/remove pattern)
✅ **No game logic modification needed** (just add to registry)
✅ **Score-based trigger** (every 200 points, perfectly paced)
✅ **Landing-based display** (never interrupts mid-jump!)
✅ **Strategic depth** (power-ups arrive when difficulty increases)

**Adding a new power-up:**

1. Add object to `POWERUP_REGISTRY` in `powerups.js`
2. Implement `apply` and `remove` functions
3. Add game logic checks in `game.js` (if needed)
4. Test with short duration
5. Done!

**Power-up milestones:**

- 200, 400, 600, 800, 1000, 1200... (every 200 points)
- Waits for landing to display (smooth gameplay flow)
- Aligns with level progression (Cavern→Frozen→Cloud→Volcano→Space)
- Makes each power-up feel earned and meaningful

🐸 Start adding your own power-ups! 🚀
