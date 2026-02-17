// ─────────────────────────────────────────────────────────────
//  BackgroundRenderer
//  Three parallax layers:
//  1. Sky gradient (static)
//  2. Stars (slow scroll, twinkle)
//  3. Clouds (medium scroll, chunky pixel shapes)
// ─────────────────────────────────────────────────────────────

import { Size } from "../variables.js";

const W = Size.LOGICAL_WIDTH;
const H = Size.LOGICAL_HEIGHT;

// Pixel size for chunky art feel
const PX = 3;

export class BackgroundRenderer {
  constructor() {
    this.stars = this._genStars(60);
    this.clouds = this._genClouds(8);
  }

  // ── Public draw — called every frame ──
  draw(ctx, cameraY) {
    this._drawSky(ctx);
    this._drawStars(ctx, cameraY);
    this._drawClouds(ctx, cameraY);
  }

  // ─────────────────────────────────────────────────────────
  //  SKY — two-tone pixel gradient (banded, not smooth)
  // ─────────────────────────────────────────────────────────

  _drawSky(ctx) {
    // Band the sky into 8 horizontal strips for pixel feel
    const bands = [
      "#0a0a1e",
      "#0c0c22",
      "#0e0e28",
      "#10102e",
      "#121234",
      "#141438",
      "#16163c",
      "#181840",
    ];
    const bandH = Math.ceil(H / bands.length);
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i * bandH, W, bandH + 1);
    });
  }

  // ─────────────────────────────────────────────────────────
  //  STARS — chunky 2×2 or 3×3 pixel dots, slow parallax
  // ─────────────────────────────────────────────────────────

  _genStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * W,
      worldY: Math.random() * H * 20, // spread over 20 screens
      size: Math.random() < 0.3 ? 3 : 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.1, // parallax factor
    }));
  }

  _drawStars(ctx, cameraY) {
    const t = Date.now() * 0.001;
    this.stars.forEach((s) => {
      // Parallax: stars scroll slower than the world (factor s.speed)
      const screenY =
        (((s.worldY - cameraY * s.speed) % (H * 20)) + H * 20) % (H * 20);
      if (screenY < -4 || screenY > H + 4) return;

      const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.phase);
      const alpha = 0.4 + 0.5 * twinkle;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = twinkle > 0.7 ? "#ffffff" : "#aaaacc";
      ctx.fillRect(
        Math.floor(s.x / PX) * PX,
        Math.floor(screenY / PX) * PX,
        s.size,
        s.size,
      );
    });
    ctx.globalAlpha = 1;
  }

  // ─────────────────────────────────────────────────────────
  //  CLOUDS — chunky pixel blobs, medium parallax
  // ─────────────────────────────────────────────────────────

  // Each cloud is a list of [dx, dy, w, h] pixel-art blocks
  _cloudShape() {
    const shapes = [
      // Wide flat cloud
      [
        [0, 2, 6, 2],
        [1, 1, 4, 1],
        [2, 0, 2, 1],
      ],
      // Tall puffy cloud
      [
        [0, 2, 4, 2],
        [1, 1, 3, 2],
        [1, 0, 2, 1],
      ],
      // Small wispy cloud
      [
        [0, 1, 5, 1],
        [1, 0, 3, 1],
      ],
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  _genClouds(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * W,
      worldY: Math.random() * H * 15,
      scale: (Math.random() * 2 + 2) * PX, // 2–4 × PX per block
      shape: this._cloudShape(),
      alpha: 0.06 + Math.random() * 0.08,
      speed: 0.2 + Math.random() * 0.15, // parallax factor
    }));
  }

  _drawClouds(ctx, cameraY) {
    this.clouds.forEach((c) => {
      const screenY =
        (((c.worldY - cameraY * c.speed) % (H * 15)) + H * 15) % (H * 15);
      if (screenY < -100 || screenY > H + 100) return;

      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = "#c8d8ff";

      c.shape.forEach(([dx, dy, bw, bh]) => {
        ctx.fillRect(
          Math.floor(c.x) + dx * c.scale,
          Math.floor(screenY) + dy * c.scale,
          bw * c.scale,
          bh * c.scale,
        );
      });
    });
    ctx.globalAlpha = 1;
  }
}
