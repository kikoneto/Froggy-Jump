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
    id: 'double_jump',
    name: 'Double Jump',
    description: 'Jump twice in air',
    icon: '↟',
    color: '#44aaff',
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
    id: 'shield',
    name: 'Shield',
    description: 'Survive one fall',
    icon: '◉',
    color: '#ffaa44',
    duration: null, // One-time use
    apply: (game) => {
      game.powerupState.shieldActive = true;
    },
    remove: (game) => {
      // Shield consumed on death, not time-based
    },
  },

  {
    id: 'slow_motion',
    name: 'Slow Motion',
    description: 'Time moves slower',
    icon: '◷',
    color: '#aa44ff',
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
    id: 'mega_jump',
    name: 'Mega Jump',
    description: '+50% jump power',
    icon: '⇈',
    color: '#ff4444',
    duration: 12,
    apply: (game) => {
      game.powerupState.megaJumpActive = true;
      game.powerupState.jumpMultiplier = 1.5;
    },
    remove: (game) => {
      game.powerupState.megaJumpActive = false;
      game.powerupState.jumpMultiplier = 1.0;
    },
  },

  {
    id: 'magnet',
    name: 'Magnet',
    description: 'Wider platforms',
    icon: '⬌',
    color: '#44ff88',
    duration: 15,
    apply: (game) => {
      game.powerupState.magnetActive = true;
      game.powerupState.platformWidthBonus = 30; // +30px
    },
    remove: (game) => {
      game.powerupState.magnetActive = false;
      game.powerupState.platformWidthBonus = 0;
    },
  },

  // Ghost Mode removed - too confusing/dangerous for players

  {
    id: 'score_boost',
    name: 'Score Boost',
    description: 'Instant +50 points',
    icon: '★',
    color: '#ffdd44',
    duration: null, // Instant
    apply: (game) => {
      game.score += 50;
      if (game.score > game.bestScore) {
        game.bestScore = game.score;
        localStorage.setItem('froggyJumpBest', game.bestScore);
      }
    },
    remove: (game) => {
      // Instant effect, nothing to remove
    },
  },

  {
    id: 'spring',
    name: 'Spring Shoes',
    description: 'Auto max charge',
    icon: '⌃',
    color: '#88ff44',
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
  const available = POWERUP_REGISTRY.filter(p => !excludeIds.includes(p.id));
  
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
  return POWERUP_REGISTRY.find(p => p.id === id) || null;
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