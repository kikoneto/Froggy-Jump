import { Platform } from "../entities/platform.js";
import { Size, Physics, Platforms } from "../variables.js";

// ─────────────────────────────────────────────────────────────
//  PlatformManager
//  Owns the list of active platforms.
//  Called by Game every frame to update and collide.
//  All generation constants now in variables.js → Platforms
// ─────────────────────────────────────────────────────────────

export class PlatformManager {
  constructor() {
    // All active platforms in world space
    this.platforms = [];

    // Y coordinate of the highest (smallest Y) platform generated so far.
    // We generate upward, so this shrinks over time.
    this.highestY = 0;
  }

  // ─────────────────────────────────────────────────────────
  //  INIT — called at the start of each game
  //  Places a guaranteed wide platform right under the frog,
  //  then generates a column of platforms going upward.
  // ─────────────────────────────────────────────────────────

  init() {
    this.platforms = [];
    this.highestY = Physics.FLOOR_Y;

    // Starter platform — wide and centred so the frog always lands safely
    this._addPlatform(
      Size.LOGICAL_WIDTH / 2 - 70, // x — centred
      Physics.FLOOR_Y, // y — at floor level
      140, // width — wide so frog always starts on it
    );

    // Pre-generate platforms filling two screens above the start
    for (let i = 0; i < Platforms.INITIAL_COUNT; i++) {
      this._generateNext(0);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  UPDATE — called every frame
  //  1. Generates new platforms ahead of the camera
  //  2. Removes platforms that have scrolled far below screen
  // ─────────────────────────────────────────────────────────

  update(cameraY, difficulty, dt) {
    // Move all platforms
    for (const p of this.platforms) {
      p.update(dt);
    }

    // Generate platforms until we have coverage one full screen above camera
    while (this.highestY > cameraY - Size.LOGICAL_HEIGHT) {
      this._generateNext(difficulty);
    }

    // Remove platforms that have scrolled more than one screen below the camera
    const cutoff = cameraY + Size.LOGICAL_HEIGHT * 2;
    this.platforms = this.platforms.filter((p) => p.y < cutoff);
  }

  // ─────────────────────────────────────────────────────────
  //  COLLISION
  //  Called every frame while the frog is falling (vy > 0).
  //  Returns the platform the frog just landed on, or null.
  //
  //  Rules:
  //  - Frog must be moving downward
  //  - Frog bottom must cross platform top this frame
  //  - Frog must overlap the platform horizontally
  // ─────────────────────────────────────────────────────────

  collide(frog) {
    // Only check when falling
    if (frog.vy <= 0) return null;

    const frogLeft = frog.x - Physics.FROG_W / 2;
    const frogRight = frog.x + Physics.FROG_W / 2;
    const frogBottom = frog.y + Physics.FROG_H / 2;

    for (const p of this.platforms) {
      const horizontalOverlap = frogRight > p.x + 4 && frogLeft < p.right - 4;
      // +/- 4px inset prevents landing on the very edge pixel
      const crossedTop =
        frogBottom >= p.top && frogBottom <= p.top + p.height + frog.vy * 0.017;
      // The vy term accounts for fast falls tunnelling through thin platforms

      if (horizontalOverlap && crossedTop) {
        return p; // landed on this platform
      }
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────
  //  INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────

  // Places a platform with velocity into the list
  _addPlatform(x, y, width, vx = 0, vy = 0) {
    this.platforms.push(new Platform(x, y, width, vx, vy));
    if (y < this.highestY) this.highestY = y;
  }

  // Generates the next platform above the current highest one
  _generateNext(difficulty) {
    // Width shrinks with difficulty, using WIDTH_SCALE for tunable rate
    const width = Math.max(
      Platforms.WIDTH_MIN,
      Platforms.WIDTH_MAX - difficulty * Platforms.WIDTH_SCALE,
    );

    // Vertical gap grows with difficulty
    const gapY = Math.min(
      Platforms.GAP_Y_BASE + difficulty * Platforms.GAP_Y_SCALE * 100,
      Platforms.GAP_Y_MAX,
    );

    const y = this.highestY - gapY;

    const maxX = Size.LOGICAL_WIDTH - width - Platforms.MARGIN;
    const x = Platforms.MARGIN + Math.random() * (maxX - Platforms.MARGIN);

    // ── Speed scales with difficulty, capped at max ──
    const speed = Math.min(
      Platforms.SPEED_X_BASE + difficulty * Platforms.SPEED_SCALE,
      Platforms.SPEED_MAX,
    );
    const speedY = Math.min(
      Platforms.SPEED_Y_BASE + difficulty * Platforms.SPEED_SCALE * 0.6,
      Platforms.SPEED_MAX * 0.6,
    );

    // Random starting direction for each axis independently
    const vx = speed * (Math.random() < 0.5 ? 1 : -1);
    const vy = speedY * (Math.random() < 0.5 ? 1 : -1);

    this._addPlatform(x, y, width, vx, vy);
  }
}
