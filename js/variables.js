export const Size = Object.freeze({
  LOGICAL_WIDTH: 400,
  LOGICAL_HEIGHT: 650,
});

export const State = Object.freeze({
  IDLE: "idle", // title screen, waiting to start
  PLAYING: "playing", // active gameplay
  DEAD: "dead", // player lost, showing result
});

export const Physics = Object.freeze({
  // Core physics
  GRAVITY: 1800, // px/s² — downward acceleration
  JUMP_POWER_MIN: 500, // px/s — minimum jump (tiny tap)
  JUMP_POWER_MAX: 1100, // px/s — maximum jump (full charge)
  CHARGE_RATE: 900, // px/s added per second of holding

  // Frog dimensions
  FROG_W: 82, // px — frog collision width (matches sprite)
  FROG_H: 40, // px — frog collision height (matches sprite aspect ratio)
  FLOOR_Y: Size.LOGICAL_HEIGHT - 40, // px — starting floor position

  // Movement modifiers
  FROG_VELOCITY_BOOST: 3.0, // multiplier — horizontal velocity boost when jumping from platform
  WALL_BOUNCE_DAMPING: 1.0, // multiplier — velocity retained after bouncing off edge (1.0 = 100%)
  AIR_DRAG: 3.0, // coefficient — horizontal friction while airborne (higher = more drag)

  // Grounded ride tolerances
  RIDE_TOLERANCE: 4, // px — how far frog can overhang platform edge before falling off
});

export const Camera = Object.freeze({
  FROG_SCREEN_POSITION: 0.65, // ratio — frog sits at 65% down screen (0.0 = top, 1.0 = bottom)
  SMOOTHING: 0.1, // coefficient — camera lerp speed (0.1 = smooth, 1.0 = instant)
  INIT_POSITION: 0.8, // ratio — frog starts at 80% down screen on game start
});

export const Scoring = Object.freeze({
  HEIGHT_TO_SCORE: 10, // px — how many pixels of height = 1 score point
  DIFFICULTY_INTERVAL: 5, // score — difficulty increases every N points
});

export const FPS = Object.freeze({
  TARGET: 120,
  MAX_DT: (1000 / 120) * 4, // ~33ms — cap so a stalled tab doesn't explode physics
});
