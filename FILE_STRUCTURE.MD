# Froggy Jump - Correct File Structure

## Directory Layout

```
froggy-jump/
├── index.html
├── game.js                    ← Main game class
├── variables.js               ← All constants
├── levels.js                  ← Level definitions (AT ROOT)
├── entities/
│   └── frog.js               ← Frog class
├── services/
│   ├── platform.js           ← Platform class
│   └── platformManager.js    ← Platform generation/collision
├── renderer/
│   ├── backgroundRenderer.js
│   ├── frogRenderer.js
│   ├── platformRenderer.js
│   ├── particleSystem.js
│   └── uiRenderer.js
└── assets/
    ├── frog-spritesheet.png
    └── frog-spritesheet-2x.png
```

## Import Path Reference

### From ROOT files (game.js, variables.js, levels.js):

```javascript
// game.js imports:
import { Frog } from "./entities/frog.js";
import { PlatformManager } from "./services/platformManager.js";
import { getCurrentLevel } from "./levels.js"; // ← levels.js is at root
import { BackgroundRenderer } from "./renderer/backgroundRenderer.js";

// levels.js imports:
import { Levels } from "./variables.js"; // ← same directory
```

### From ENTITIES folder (entities/frog.js):

```javascript
import { Size, Physics } from "../variables.js"; // ← go up one level
```

### From SERVICES folder (services/platformManager.js, services/platform.js):

```javascript
// platformManager.js imports:
import { Platform } from "./platform.js"; // ← same directory
import { Size, Physics, Platforms } from "../variables.js"; // ← up one
import { getCurrentLevel } from "../levels.js"; // ← levels at root

// platform.js has no imports
```

### From RENDERER folder (all renderer/\*.js files):

```javascript
// backgroundRenderer.js imports:
import { Size } from "../variables.js"; // ← up one level
import { getCurrentLevel, LEVELS } from "../levels.js"; // ← levels at root

// platformRenderer.js imports:
import { getCurrentLevel } from "../levels.js"; // ← levels at root

// uiRenderer.js imports:
import { Size } from "../variables.js"; // ← up one level
import { getCurrentLevel, LEVELS } from "../levels.js"; // ← levels at root

// frogRenderer.js imports:
import { Physics } from "../variables.js";

// particleSystem.js has no imports (just constants)
```

## Common Mistakes to Avoid

❌ **WRONG:** `import { getCurrentLevel } from "./services/levels.js"`
✅ **CORRECT:** `import { getCurrentLevel } from "./levels.js"` (when in root)

❌ **WRONG:** `import { Platform } from "../entities/platform.js"` (from services/)
✅ **CORRECT:** `import { Platform } from "./platform.js"` (platform.js is in services/)

❌ **WRONG:** `import { Levels } from "../variables.js"` (from levels.js)
✅ **CORRECT:** `import { Levels } from "./variables.js"` (both in root)

## Quick Reference

**Relative Path Rules:**

- `./` = same directory
- `../` = parent directory (go up one level)
- `../../` = grandparent directory (go up two levels)

**Current Structure Depth:**

- Root: `game.js`, `variables.js`, `levels.js` (depth 0)
- Entities: `entities/frog.js` (depth 1)
- Services: `services/*.js` (depth 1)
- Renderer: `renderer/*.js` (depth 1)

**To import from root when you're in a subfolder:**
Use `../filename.js`

**To import from same folder:**
Use `./filename.js`
