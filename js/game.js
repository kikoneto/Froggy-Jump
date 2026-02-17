import { Frog } from "./frog/frog.js";
import { PlatformManager } from "./platform/platformManager.js";
import { State, Size, Physics, FPS } from "./variables.js";

export class Game {
  // ─────────────────────────────────────────────────────────
  //  CONSTRUCTOR
  // ─────────────────────────────────────────────────────────

  constructor() {
    // ── Canvas ──
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = Size.LOGICAL_WIDTH;
    this.height = Size.LOGICAL_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // ── Game objects ──
    this.frog = new Frog();
    this.platformManager = new PlatformManager();

    // ── Camera ──
    // cameraY is the world Y that maps to the top of the screen.
    // screenY = worldY - cameraY
    this.cameraY = 0;

    // ── Score & difficulty ──
    this.score = 0;
    this.bestScore = 0;
    this.difficulty = 0;

    // ── State ──
    this.currentState = State.IDLE;

    // ── Loop timing ──
    this.lastTimestamp = null;
    this.fps = 0;
    this.fpsTimer = 0;
    this.fpsCount = 0;

    // ── Input ──
    this.input = { held: false, released: false };

    // ── Bootstrap ──
    this._bindInput();
    this._resize();
    window.addEventListener("resize", () => this._resize());
    requestAnimationFrame(this.loop.bind(this));
  }

  // ─────────────────────────────────────────────────────────
  //  RESIZE
  // ─────────────────────────────────────────────────────────

  _resize() {
    const scale = Math.min(
      window.innerWidth / this.width,
      window.innerHeight / this.height,
    );
    this.canvas.style.width = this.width * scale + "px";
    this.canvas.style.height = this.height * scale + "px";
  }

  // ─────────────────────────────────────────────────────────
  //  STATE
  // ─────────────────────────────────────────────────────────

  setState(newState) {
    console.log("State: " + this.currentState + " -> " + newState);
    this.currentState = newState;
  }

  // ─────────────────────────────────────────────────────────
  //  INIT — reset everything for a fresh game
  // ─────────────────────────────────────────────────────────

  init() {
    this.frog.reset();
    this.platformManager.init();

    // Snap camera so frog starts near the bottom 20% of the screen
    this.cameraY = this.frog.y - this.height * 0.8;
    this.score = 0;
    this.difficulty = 0;

    this.input.held = false;
    this.input.released = false;
  }

  // ─────────────────────────────────────────────────────────
  //  LOOP
  // ─────────────────────────────────────────────────────────

  loop(timestamp) {
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;

    const dtMs = Math.min(timestamp - this.lastTimestamp, FPS.MAX_DT);
    const dt = dtMs / 1000;

    this.lastTimestamp = timestamp;

    this.fpsCount++;
    this.fpsTimer += dtMs;
    if (this.fpsTimer >= 1000) {
      this.fps = this.fpsCount;
      this.fpsCount = 0;
      this.fpsTimer = 0;
    }

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  // ─────────────────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────────────────

  update(dt) {
    switch (this.currentState) {
      case State.IDLE:
        break;

      case State.PLAYING:
        this.updateCharge(dt);
        this.updateJump();
        this.updatePhysics(dt);
        this.updateGroundedRide(); // snap frog to platform every grounded frame
        this.updateWallWrap();
        this.updatePlatformCollision();
        this.updateCamera();
        this.updateScore();
        this.platformManager.update(this.cameraY, this.difficulty, dt);
        this.updateDeathCheck();
        break;

      case State.DEAD:
        break;
    }
  }

  // Builds charge while input held and frog is grounded
  updateCharge(dt) {
    if (this.input.held && this.frog.grounded) {
      this.frog.charge = Math.min(
        this.frog.charge + Physics.CHARGE_RATE * dt,
        Physics.JUMP_POWER_MAX,
      );
    }
  }

  // Fires jump on input release
  updateJump() {
    if (!this.input.released) return;
    this.input.released = false;

    if (!this.frog.grounded) return;

    const t = this.frog.charge / Physics.JUMP_POWER_MAX;
    const power =
      Physics.JUMP_POWER_MIN +
      t * (Physics.JUMP_POWER_MAX - Physics.JUMP_POWER_MIN);

    this.frog.vy = -power;
    this.frog.grounded = false;
    this.frog.charge = 0;
    this.frog.currentPlatform = null; // detach from platform

    console.log("Jump! power=" + Math.round(power) + " t=" + t.toFixed(2));
  }

  // Gravity + velocity -> position
  updatePhysics(dt) {
    if (!this.frog.grounded) {
      this.frog.vy += Physics.GRAVITY * dt;
      // Light air drag on vx — bleeds off the platform's inherited velocity
      // 3.0 = friction coefficient, feels natural without killing momentum instantly
      this.frog.vx *= Math.max(0, 1 - 3.0 * dt);
    }
    this.frog.x += this.frog.vx * dt;
    this.frog.y += this.frog.vy * dt;
  }

  // Wall wrap — only when airborne
  // When grounded the platform's own wall bounce handles position
  updateWallWrap() {
    if (this.frog.grounded) return;
    const hw = Physics.FROG_W / 2;
    if (this.frog.x < -hw) this.frog.x = this.width + hw;
    if (this.frog.x > this.width + hw) this.frog.x = -hw;
  }

  // Check if frog landed on a platform this frame
  updatePlatformCollision() {
    const platform = this.platformManager.collide(this.frog);
    if (!platform) return;

    // Store which platform the frog is riding
    this.frog.currentPlatform = platform;
    this.frog.grounded = true;
    this.frog.vy = 0;
    this.frog.charge = 0;

    // Snap frog to platform surface and inherit both velocities
    this.frog.y = platform.top - Physics.FROG_H / 2;
    this.frog.vx = platform.vx;
  }

  // Every frame the frog is grounded, keep it locked to its platform
  // This fixes the jitter caused by platform.vy moving the surface
  // out from under the frog between frames
  updateGroundedRide() {
    if (!this.frog.grounded) return;
    const p = this.frog.currentPlatform;
    if (!p) return;

    // Check frog is still horizontally over the platform
    const frogLeft = this.frog.x - Physics.FROG_W / 2;
    const frogRight = this.frog.x + Physics.FROG_W / 2;
    const stillOn = frogRight > p.x + 4 && frogLeft < p.right - 4;

    if (stillOn) {
      // Ride the platform — snap y and match both velocities every frame
      this.frog.y = p.top - Physics.FROG_H / 2;
      this.frog.vx = p.vx;
      this.frog.vy = 0;
    } else {
      // Frog walked off the edge — become airborne
      this.frog.grounded = false;
      this.frog.currentPlatform = null;
    }
  }

  // Camera follows frog upward, never scrolls back down
  updateCamera() {
    // Keep frog in the lower third of the screen while climbing
    // target: frog sits at 65% down the screen
    const targetCameraY = this.frog.y - this.height * 0.65;

    // Only move camera up (targetCameraY is more negative = higher up)
    if (targetCameraY < this.cameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * 0.1;
    }
  }

  // Score = how many units high the frog has climbed
  updateScore() {
    const height = Math.floor((Physics.FLOOR_Y - this.frog.y) / 10);

    if (height > this.score) {
      this.score = height;

      // Difficulty increments every 5 score points (was 3)
      this.difficulty = Math.floor(this.score / 5);

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
      }
    }
  }

  // Death: frog fell below the bottom of the camera view
  updateDeathCheck() {
    if (this.frog.y - Physics.FROG_H / 2 > this.cameraY + this.height) {
      this.setState(State.DEAD);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  DRAW
  // ─────────────────────────────────────────────────────────

  draw() {
    const { ctx, width, height } = this;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    switch (this.currentState) {
      case State.IDLE:
        this.drawIdleScreen();
        break;
      case State.PLAYING:
        this.drawGame();
        break;
      case State.DEAD:
        this.drawDeadScreen();
        break;
    }
  }

  drawIdleScreen() {
    const { ctx, width, height } = this;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("FROGGY JUMP", width / 2, height / 2 - 20);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "16px monospace";
    ctx.fillText("hold SPACE or tap to start", width / 2, height / 2 + 20);
  }

  drawGame() {
    const { ctx, width, frog, cameraY } = this;
    const { FROG_W, FROG_H, JUMP_POWER_MAX } = Physics;

    // ── Platforms ──
    this.platformManager.draw(ctx, cameraY);

    // ── Frog ──
    const screenY = frog.y - cameraY;

    ctx.fillStyle = frog.grounded ? "#4cff6a" : "#2aaa44";
    ctx.fillRect(frog.x - FROG_W / 2, screenY - FROG_H / 2, FROG_W, FROG_H);

    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(frog.x - 8, screenY - 8, 5, 0, Math.PI * 2);
    ctx.arc(frog.x + 8, screenY - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // ── Charge bar ──
    if (frog.grounded && frog.charge > 0) {
      const barW = 60;
      const barH = 6;
      const barX = frog.x - barW / 2;
      const barY = screenY - FROG_H / 2 - 14;
      const fillW = (frog.charge / JUMP_POWER_MAX) * barW;
      const t = frog.charge / JUMP_POWER_MAX;

      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = t < 0.5 ? "#4cff6a" : "#ffdd44";
      ctx.fillRect(barX, barY, fillW, barH);
    }

    // ── Score HUD ──
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "right";
    ctx.fillText(this.score, width - 16, 32);

    ctx.fillStyle = "#888888";
    ctx.font = "12px monospace";
    ctx.fillText("best: " + this.bestScore, width - 16, 50);
  }

  drawDeadScreen() {
    const { ctx, width, height } = this;

    ctx.fillStyle = "#ff5555";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", width / 2, height / 2 - 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px monospace";
    ctx.fillText("score: " + this.score, width / 2, height / 2);

    ctx.fillStyle = "#ffdd44";
    ctx.font = "14px monospace";
    ctx.fillText("best:  " + this.bestScore, width / 2, height / 2 + 26);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "13px monospace";
    ctx.fillText("tap or SPACE to retry", width / 2, height / 2 + 60);
  }

  // ─────────────────────────────────────────────────────────
  //  DEBUG STATS — read by the HTML stats panel in index.html
  //  Returns a plain object so the panel never touches internals
  // ─────────────────────────────────────────────────────────

  getDebugStats() {
    const p = this.frog.currentPlatform;
    return {
      // Game
      state: this.currentState,
      fps: this.fps,
      targetFps: FPS.TARGET,
      score: this.score,
      bestScore: this.bestScore,
      difficulty: this.difficulty,
      cameraY: this.cameraY,
      platformCount: this.platformManager.platforms.length,

      // Frog
      frog: {
        x: this.frog.x,
        y: this.frog.y,
        vx: this.frog.vx,
        vy: this.frog.vy,
        grounded: this.frog.grounded,
        charge: this.frog.charge,
      },

      // Current platform (null when airborne)
      platform: p
        ? {
            x: p.x,
            y: p.y,
            width: p.width,
            vx: p.vx,
            vy: p.vy,
            spawnY: p.spawnY,
          }
        : null,
    };
  }

  // ─────────────────────────────────────────────────────────
  //  INPUT
  // ─────────────────────────────────────────────────────────

  _bindInput() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.onInputStart();
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.onInputEnd();
      }
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.onInputStart();
    });
    this.canvas.addEventListener("pointerup", (e) => {
      e.preventDefault();
      this.onInputEnd();
    });
  }

  onInputStart() {
    if (this.currentState === State.IDLE) {
      this.setState(State.PLAYING);
      this.init();
      return;
    }
    if (this.currentState === State.DEAD) {
      this.setState(State.IDLE);
      return;
    }
    this.input.held = true;
  }

  onInputEnd() {
    if (this.currentState !== State.PLAYING) return;
    this.input.held = false;
    this.input.released = true;
  }
}
