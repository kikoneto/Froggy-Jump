import { Size, Physics } from "../variables.js";

// Default values used when creating a fresh frog at game start.
// Object.freeze means nobody can accidentally mutate this template.
const InitFrogPayload = Object.freeze({
  x: Size.LOGICAL_WIDTH / 2,
  y: Physics.FLOOR_Y - Physics.FROG_H / 2, // sit on top of starter platform
  vx: 0,
  vy: 0,
  grounded: true,
  charge: 0,
});

export class Frog {
  constructor({ x, y, vx, vy, grounded, charge } = InitFrogPayload) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.grounded = grounded;
    this.charge = charge;
    this.currentPlatform = null; // the platform the frog is standing on
  }

  reset() {
    this.x = InitFrogPayload.x;
    this.y = InitFrogPayload.y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.charge = 0;
    this.currentPlatform = null;
  }
}
