import { Platform } from "./platform.js";
import { Size, Physics, Platforms } from "../variables.js";
import { getCurrentLevel } from "../levels.js";

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

  update(cameraY, difficulty, dt, score) {
    // Move all platforms
    for (const p of this.platforms) {
      p.update(dt);
    }

    // Store platform count before generating
    const oldCount = this.platforms.length;

    // Generate platforms until we have coverage one full screen above camera
    while (this.highestY > cameraY - Size.LOGICAL_HEIGHT) {
      this._generateNext(difficulty, score);
    }

    // Return newly created platforms (if any)
    return this.platforms.slice(oldCount);

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
      // Platforms are their actual size (including Magnet bonus if active)
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
  _generateNext(difficulty, score) {
    // Get current level and apply its difficulty modifiers
    const level = getCurrentLevel(score);
    const effectiveDifficulty = difficulty * level.difficultyMultiplier;

    // Width shrinks with difficulty, using WIDTH_SCALE for tunable rate
    const width = Math.max(
      Platforms.WIDTH_MIN,
      Platforms.WIDTH_MAX - effectiveDifficulty * Platforms.WIDTH_SCALE,
    );

    // Vertical gap grows with difficulty and level modifier
    const baseGap =
      Platforms.GAP_Y_BASE + effectiveDifficulty * Platforms.GAP_Y_SCALE * 100;
    const gapY = Math.min(
      baseGap * level.gapMultiplier,
      Platforms.GAP_Y_MAX * level.gapMultiplier,
    );

    const y = this.highestY - gapY;

    const maxX = Size.LOGICAL_WIDTH - width - Platforms.MARGIN;
    const x = Platforms.MARGIN + Math.random() * (maxX - Platforms.MARGIN);

    // ── Speed scales with difficulty and level modifier ──
    const baseSpeed =
      Platforms.SPEED_X_BASE + effectiveDifficulty * Platforms.SPEED_SCALE;
    const speed = Math.min(
      baseSpeed * level.speedMultiplier,
      Platforms.SPEED_MAX * level.speedMultiplier,
    );
    const speedY = Math.min(
      (Platforms.SPEED_Y_BASE +
        effectiveDifficulty * Platforms.SPEED_SCALE * 0.6) *
        level.speedMultiplier,
      Platforms.SPEED_MAX * 0.6 * level.speedMultiplier,
    );

    // Random starting direction for each axis independently
    const vx = speed * (Math.random() < 0.5 ? 1 : -1);
    const vy = speedY * (Math.random() < 0.5 ? 1 : -1);

    this._addPlatform(x, y, width, vx, vy);
  }
}
