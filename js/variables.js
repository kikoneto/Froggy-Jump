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
  GRAVITY: 1500, // px/s²
  JUMP_POWER_MIN: 350, // px/s — minimum jump (tiny tap)
  JUMP_POWER_MAX: 600, // px/s — maximum jump (full charge)
  CHARGE_RATE: 1500, // px/s added per second of holding
  FROG_W: 36, // px — frog collision width
  FROG_H: 36, // px — frog collision height
  FLOOR_Y: Size.LOGICAL_HEIGHT - 40, // ← fixed: was LOGICAL_H (undefined)
});

export const FPS = Object.freeze({
  TARGET: 120,
  MAX_DT: (1000 / 120) * 4, // ~33ms — cap so a stalled tab doesn't explode physics
});
