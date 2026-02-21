// ─────────────────────────────────────────────────────────────
//  Power-Up System
//  Extensible power-up definitions and selection system
//  Add new power-ups by adding to POWERUP_REGISTRY
// ─────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────
//  POWER-UP REGISTRY
//  Each power-up has:
//  - id: unique identifier
//  - name: display name
//  - description: what it does (short)
//  - icon: emoji or symbol
//  - color: hex color for UI
//  - duration: how long it lasts (seconds, null = instant/permanent)
//  - apply: function that activates the power-up
//  - remove: function that deactivates (if duration-based)
// ──────────────────────────────────────────────────────────

export const POWERUP_REGISTRY = [
  {
    id: "double_jump",
    name: "Double Jump",
    description: "Jump twice in air",
    icon: "↟",
    color: "#44aaff",
    duration: 15, // seconds
    apply: (game) => {
      game.powerupState.doubleJumpEnabled = true;
      game.powerupState.doubleJumpAvailable = true;
    },
    remove: (game) => {
      game.powerupState.doubleJumpEnabled = false;
      game.powerupState.doubleJumpAvailable = false;
    },
  },

  {
    id: "shield",
    name: "Shield",
    description: "Survive one fall",
    icon: "◉",
    color: "#ffaa44",
    duration: null, // Uses counter instead of timer
    apply: (game) => {
      // Increment shield counter (allows stacking)
      if (!game.powerupState.shieldCount) {
        game.powerupState.shieldCount = 0;
      }
      game.powerupState.shieldCount += 1;
      game.powerupState.shieldActive = true;

      // Add to timers with infinite duration for display purposes
      game.powerupState.timers["shield"] = Infinity;

      console.log(
        `Shield obtained! Total shields: ${game.powerupState.shieldCount}`,
      );
    },
    remove: (game) => {
      // Called when shield counter reaches 0
      game.powerupState.shieldActive = false;
      game.powerupState.shieldCount = 0;
      delete game.powerupState.timers["shield"];
    },
  },

  {
    id: "slow_motion",
    name: "Slow Motion",
    description: "Time moves slower",
    icon: "◷",
    color: "#aa44ff",
    duration: 10,
    apply: (game) => {
      game.powerupState.slowMotionActive = true;
      game.powerupState.timeScale = 0.6; // 60% speed
    },
    remove: (game) => {
      game.powerupState.slowMotionActive = false;
      game.powerupState.timeScale = 1.0;
    },
  },

  {
    id: "mega_jump",
    name: "Mega Jump",
    description: "+30% jump power",
    icon: "⇈",
    color: "#ff4444",
    duration: 12,
    apply: (game) => {
      game.powerupState.megaJumpActive = true;
      game.powerupState.jumpMultiplier = 1.3;
    },
    remove: (game) => {
      game.powerupState.megaJumpActive = false;
      game.powerupState.jumpMultiplier = 1.0;
    },
  },

  {
    id: "magnet",
    name: "Magnet",
    description: "Wider platforms",
    icon: "⬌",
    color: "#44ff88",
    duration: 15,
    apply: (game) => {
      game.powerupState.magnetActive = true;
      game.powerupState.platformWidthBonus = 45;

      // Actually increase all platform widths and center them
      for (const p of game.platformManager.platforms) {
        p.width += game.powerupState.platformWidthBonus;
        p.x -= game.powerupState.platformWidthBonus / 2; // Center the expansion
      }
    },
    remove: (game) => {
      const bonus = game.powerupState.platformWidthBonus; // Store before clearing

      game.powerupState.magnetActive = false;
      game.powerupState.platformWidthBonus = 0;

      // Actually decrease all platform widths and recenter them
      for (const p of game.platformManager.platforms) {
        p.width -= bonus;
        p.x += bonus / 2; // Recenter
      }
    },
  },

  {
    id: "spring",
    name: "Spring Shoes",
    description: "Auto max charge",
    icon: "⌃",
    color: "#88ff44",
    duration: 10,
    apply: (game) => {
      game.powerupState.springActive = true;
    },
    remove: (game) => {
      game.powerupState.springActive = false;
    },
  },

  // ADD NEW POWER-UPS HERE:
  // {
  //   id: 'your_powerup_id',
  //   name: 'Your Power-Up',
  //   description: 'What it does',
  //   icon: '◆',
  //   color: '#ff00ff',
  //   duration: 10,
  //   apply: (game) => { /* activate */ },
  //   remove: (game) => { /* deactivate */ },
  // },
];

// ──────────────────────────────────────────────────────────
//  POWER-UP SELECTION LOGIC
// ──────────────────────────────────────────────────────────

/**
 * Get 3 random power-ups for player to choose from
 * @param {Array} excludeIds - Power-up IDs to exclude (already active)
 * @returns {Array} 3 random power-up objects
 */
export function getRandomPowerups(excludeIds = []) {
  // Filter out excluded power-ups
  const available = POWERUP_REGISTRY.filter((p) => !excludeIds.includes(p.id));

  if (available.length <= 3) {
    return available; // Return all if 3 or fewer
  }

  // Fisher-Yates shuffle and take first 3
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

/**
 * Find power-up by ID
 * @param {string} id - Power-up ID
 * @returns {Object|null} Power-up object or null
 */
export function getPowerupById(id) {
  return POWERUP_REGISTRY.find((p) => p.id === id) || null;
}

/**
 * Get all active power-up IDs (those with timers > 0)
 * @param {Object} powerupState - Game's powerup state
 * @returns {Array} Array of active power-up IDs
 */
export function getActivePowerupIds(powerupState) {
  const active = [];

  // Check each power-up's timer
  for (const [key, value] of Object.entries(powerupState.timers || {})) {
    if (value > 0) {
      active.push(key);
    }
  }

  return active;
}
