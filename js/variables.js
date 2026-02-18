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
  GRAVITY: 1800, // px/s²
  JUMP_POWER_MIN: 500, // px/s — minimum jump (tiny tap)
  JUMP_POWER_MAX: 1100, // px/s — maximum jump (full charge)
  CHARGE_RATE: 900, // px/s added per second of holding
  FROG_W: 82, // px — frog collision width (matches sprite)
  FROG_H: 40, // px — frog collision height (matches sprite aspect ratio)
  FLOOR_Y: Size.LOGICAL_HEIGHT - 40, // ← fixed: was LOGICAL_H (undefined)
});

export const FPS = Object.freeze({
  TARGET: 120,
  MAX_DT: (1000 / 120) * 4, // ~33ms — cap so a stalled tab doesn't explode physics
});
