// ─────────────────────────────────────────────────────────────
//  Platform
//  A single rectangle the frog can land on.
//  x, y      — top-left corner in world coordinates
//  width     — how wide it is (height is always fixed)
//  vx, vy    — velocity in px/s (both directions)
//  spawnY    — the Y it was created at, used to bound vertical movement
// ─────────────────────────────────────────────────────────────

export class Platform {
  constructor(x, y, width, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 14;
    this.vx = vx;
    this.vy = vy;
    this.spawnY = y; // remember where it was born for vertical bounds
  }

  // Move platform and bounce off walls / vertical bounds
  update(dt) {
    // ── Horizontal movement — bounce off screen edges ──
    this.x += this.vx * dt;
    if (this.x <= 0) {
      this.x = 0;
      this.vx = Math.abs(this.vx); // flip to positive (rightward)
    }
    if (this.x + this.width >= 400) {
      // 400 = LOGICAL_WIDTH (avoid circular import)
      this.x = 400 - this.width;
      this.vx = -Math.abs(this.vx); // flip to negative (leftward)
    }

    // ── Vertical movement — bounce within ±30px of spawn point ──
    const VERTICAL_RANGE = 30; // px each way
    this.y += this.vy * dt;
    if (this.y <= this.spawnY - VERTICAL_RANGE) {
      this.y = this.spawnY - VERTICAL_RANGE;
      this.vy = Math.abs(this.vy); // flip downward
    }
    if (this.y >= this.spawnY + VERTICAL_RANGE) {
      this.y = this.spawnY + VERTICAL_RANGE;
      this.vy = -Math.abs(this.vy); // flip upward
    }
  }

  // Top surface Y — what the frog lands on
  get top() {
    return this.y;
  }

  // Right edge — used in collision
  get right() {
    return this.x + this.width;
  }
}
