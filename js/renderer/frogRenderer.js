// ─────────────────────────────────────────────────────────────
//  FrogRenderer - Sprite Sheet Animation
//  Uses all 4 frames from the original GIF
//  Frame timing: 170ms per frame (from GIF metadata)
// ─────────────────────────────────────────────────────────────

import { Physics } from "../variables.js";

export class FrogRenderer {
  constructor() {
    this._landingTimer = 0;

    // Load the sprite sheet (4 frames horizontal)
    this.spriteSheet = new Image();
    this.spriteSheet.src = "./assets/frog-spritesheet-2x.png"; // 832×100 (4 frames at 208×100 each)
    this.spriteLoaded = false;

    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
      console.log(
        "Frog sprite sheet loaded:",
        this.spriteSheet.width,
        "x",
        this.spriteSheet.height,
      );
    };

    this.spriteSheet.onerror = () => {
      console.error("Failed to load frog sprite sheet");
    };

    // Animation config
    this.frameCount = 4;
    this.frameWidth = 208; // each frame is 208px wide (2x scale)
    this.frameHeight = 100; // each frame is 100px tall (2x scale)
    this.frameDuration = 170; // ms per frame (from GIF)
    this.animationStartTime = Date.now();
  }

  triggerLanding() {
    this._landingTimer = 8;
  }

  draw(ctx, frog, cameraY) {
    if (!this.spriteLoaded) {
      // Fallback while loading
      ctx.fillStyle = "#5b7d73";
      ctx.fillRect(frog.x - 41, frog.y - cameraY - 20, 82, 40);
      return;
    }

    const screenY = frog.y - cameraY;
    const state = this._getState(frog);
    const { sx, sy, offsetY } = this._getTransform(frog, state);

    ctx.save();
    ctx.translate(Math.round(frog.x), Math.round(screenY + offsetY));
    ctx.scale(sx, sy);

    this._drawShadow(ctx, frog, state);

    // Calculate which frame to show
    const frameIndex = this._getCurrentFrame(state);
    const frameX = frameIndex * this.frameWidth;

    // Scale sprite to match target size (82px wide)
    const targetWidth = Physics.FROG_W;
    const scale = targetWidth / this.frameWidth;
    const w = this.frameWidth * scale;
    const h = this.frameHeight * scale;

    // Draw the current frame from the sprite sheet
    ctx.drawImage(
      this.spriteSheet,
      frameX,
      0,
      this.frameWidth,
      this.frameHeight, // source rectangle
      -w / 2,
      -h / 2,
      w,
      h, // destination
    );

    ctx.restore();

    if (this._landingTimer > 0) this._landingTimer--;
  }

  _getCurrentFrame(state) {
    // Use different animation speeds for different states
    let speed = 1.0;

    if (state === "charging") {
      speed = 0.5; // slower breathing when charging
    } else if (state === "rising" || state === "falling") {
      speed = 2.0; // faster animation when airborne
    }

    const elapsed = Date.now() - this.animationStartTime;
    const adjustedTime = elapsed * speed;
    const frameIndex =
      Math.floor(adjustedTime / this.frameDuration) % this.frameCount;

    return frameIndex;
  }

  _getState(frog) {
    if (this._landingTimer > 0) return "landing";
    if (!frog.grounded) return frog.vy < 0 ? "rising" : "falling";
    if (frog.charge > 0) return "charging";
    return "idle";
  }

  _getTransform(frog, state) {
    switch (state) {
      case "idle":
        // No extra offset — let frame animation handle breathing
        return { sx: 1, sy: 1, offsetY: 0 };

      case "charging":
        const chargeT = frog.charge / 1100;
        return {
          sx: 1 + chargeT * 0.2,
          sy: 1 - chargeT * 0.3,
          offsetY: 0,
        };

      case "rising":
        return { sx: 0.8, sy: 1.3, offsetY: 0 };

      case "falling":
        return { sx: 1.15, sy: 0.9, offsetY: 0 };

      case "landing":
        return { sx: 1.4, sy: 0.65, offsetY: 0 };

      default:
        return { sx: 1, sy: 1, offsetY: 0 };
    }
  }

  _drawShadow(ctx, frog, state) {
    if (!frog.grounded && state !== "landing") return;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(0, 20, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
