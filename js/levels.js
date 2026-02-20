// ─────────────────────────────────────────────────────────────
//  Level System
//  Defines visual themes that change as the player climbs higher.
//  Each level has unique colors for platforms, background, and effects.
//  Level thresholds are defined in variables.js → Levels
// ─────────────────────────────────────────────────────────────

import { Levels } from "./variables.js";

export const LEVELS = [
  {
    id: 0,
    name: "Meadow",
    scoreThreshold: Levels.MEADOW_THRESHOLD,

    // Difficulty modifiers for this level
    difficultyMultiplier: 1.0, // Normal difficulty
    gapMultiplier: 1.0, // Normal gaps
    speedMultiplier: 1.0, // Normal speed

    sky: {
      bands: [
        "#0a0a1e",
        "#0c0c22",
        "#0e0e28",
        "#10102e",
        "#121234",
        "#141438",
        "#16163c",
        "#181840",
      ],
    },

    stars: {
      color: "#ffffff",
      count: 60,
    },

    clouds: {
      color: "#2a2a44",
      count: 8,
    },

    platform: {
      type: "grass",
      colors: {
        top: "#5ecf3e",
        topLight: "#7eff5a",
        topDark: "#3a9e24",
        body: "#8b5e3c",
        bodyDark: "#6b4028",
        bodyLight: "#a07048",
        edge: "#5a3820",
      },
    },
  },

  {
    id: 1,
    name: "Cavern",
    scoreThreshold: Levels.CAVERN_THRESHOLD,

    // Difficulty modifiers - EASIER: reduced from 1.15/1.1/1.1
    difficultyMultiplier: 1.08, // 8% harder (was 15%)
    gapMultiplier: 1.05, // 5% bigger gaps (was 10%)
    speedMultiplier: 1.05, // 5% faster (was 10%)

    sky: {
      bands: [
        "#1a1a2e",
        "#1c1c32",
        "#1e1e36",
        "#20203a",
        "#22223e",
        "#242442",
        "#262646",
        "#28284a",
      ],
    },

    stars: {
      color: "#88aaff",
      count: 40,
    },

    clouds: {
      color: "#3a3a5a",
      count: 5,
    },

    platform: {
      type: "stone",
      colors: {
        top: "#8899aa",
        topLight: "#aabbcc",
        topDark: "#667788",
        body: "#667788",
        bodyDark: "#445566",
        bodyLight: "#889aaa",
        crack: "#334455",
      },
    },
  },

  {
    id: 2,
    name: "Frozen Peaks",
    scoreThreshold: Levels.FROZEN_THRESHOLD,

    // EASIER: reduced from 1.3/1.15/1.2
    difficultyMultiplier: 1.15, // 15% harder (was 30%)
    gapMultiplier: 1.08, // 8% bigger gaps (was 15%)
    speedMultiplier: 1.1, // 10% faster (was 20%)

    sky: {
      bands: [
        "#0d1520",
        "#0f1824",
        "#111b28",
        "#131e2c",
        "#152130",
        "#172434",
        "#192738",
        "#1b2a3c",
      ],
    },

    stars: {
      color: "#aaddff",
      count: 80,
    },

    clouds: {
      color: "#4a5a6a",
      count: 12,
    },

    platform: {
      type: "ice",
      colors: {
        top: "#aaddff",
        topLight: "#ccf0ff",
        topDark: "#88bbdd",
        body: "#6699bb",
        bodyDark: "#4477aa",
        bodyLight: "#88bbdd",
        shine: "#ffffff",
      },
    },
  },

  {
    id: 3,
    name: "Cloud City",
    scoreThreshold: Levels.CLOUD_THRESHOLD,

    // EASIER: reduced from 1.5/1.25/1.3
    difficultyMultiplier: 1.25, // 25% harder (was 50%)
    gapMultiplier: 1.12, // 12% bigger gaps (was 25%)
    speedMultiplier: 1.15, // 15% faster (was 30%)

    sky: {
      bands: [
        "#2a1540",
        "#2c1744",
        "#2e1948",
        "#301b4c",
        "#321d50",
        "#341f54",
        "#362158",
        "#38235c",
      ],
    },

    stars: {
      color: "#ffddaa",
      count: 100,
    },

    clouds: {
      color: "#6a5a8a",
      count: 20,
    },

    platform: {
      type: "cloud",
      colors: {
        top: "#e8e8ff",
        topLight: "#ffffff",
        topDark: "#c8c8ee",
        body: "#d0d0f0",
        bodyDark: "#a8a8cc",
        bodyLight: "#e8e8ff",
        puff: "#ffffff",
      },
    },
  },

  {
    id: 4,
    name: "Volcano",
    scoreThreshold: Levels.VOLCANO_THRESHOLD,

    // EASIER: reduced from 1.8/1.35/1.5
    difficultyMultiplier: 1.35, // 35% harder (was 80%)
    gapMultiplier: 1.18, // 18% bigger gaps (was 35%)
    speedMultiplier: 1.25, // 25% faster (was 50%)

    sky: {
      bands: [
        "#2a1010",
        "#321414",
        "#3a1818",
        "#421c1c",
        "#4a2020",
        "#522424",
        "#5a2828",
        "#622c2c",
      ],
    },

    stars: {
      color: "#ffaa44",
      count: 30,
    },

    clouds: {
      color: "#6a4040",
      count: 6,
    },

    platform: {
      type: "lava",
      colors: {
        top: "#ff6644",
        topLight: "#ffaa66",
        topDark: "#cc4422",
        body: "#8b4513",
        bodyDark: "#5a2a0a",
        bodyLight: "#a05520",
        glow: "#ff8844",
        crack: "#ff4422",
      },
    },
  },

  {
    id: 5,
    name: "Space",
    scoreThreshold: Levels.SPACE_THRESHOLD,

    // EASIER: reduced from 2.2/1.5/1.8
    difficultyMultiplier: 1.5, // 50% harder (was 120%)
    gapMultiplier: 1.25, // 25% bigger gaps (was 50%)
    speedMultiplier: 1.35, // 35% faster (was 80%)

    sky: {
      bands: [
        "#050510",
        "#070714",
        "#090918",
        "#0b0b1c",
        "#0d0d20",
        "#0f0f24",
        "#111128",
        "#13132c",
      ],
    },

    stars: {
      color: "#ffffff",
      count: 150,
    },

    clouds: {
      color: "#1a1a3a",
      count: 3,
    },

    platform: {
      type: "crystal",
      colors: {
        top: "#ff44ff",
        topLight: "#ffaaff",
        topDark: "#cc22cc",
        body: "#8844aa",
        bodyDark: "#5522aa",
        bodyLight: "#aa66cc",
        shine: "#ffffff",
        glow: "#ff88ff",
      },
    },
  },
];

// Helper function to get current level based on score
export function getCurrentLevel(score) {
  // Find the highest level threshold that the score has passed
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].scoreThreshold) {
      return LEVELS[i];
    }
  }
  return LEVELS[0]; // fallback to first level
}

// Get level transition progress (0.0 to 1.0) for smooth transitions
export function getLevelTransitionProgress(score) {
  const currentLevel = getCurrentLevel(score);
  const nextLevelIndex = currentLevel.id + 1;

  if (nextLevelIndex >= LEVELS.length) {
    return 1.0; // Max level reached
  }

  const nextLevel = LEVELS[nextLevelIndex];
  const range = nextLevel.scoreThreshold - currentLevel.scoreThreshold;
  const progress = (score - currentLevel.scoreThreshold) / range;

  return Math.min(1.0, Math.max(0.0, progress));
}