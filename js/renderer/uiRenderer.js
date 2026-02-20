// ─────────────────────────────────────────────────────────────
//  UIRenderer
//  Draws all HUD elements and screen overlays.
//  Everything is pixel-art styled — chunky fonts via fillRect.
// ─────────────────────────────────────────────────────────────

import { Size } from "../variables.js";
import {
  getCurrentLevel,
  getLevelTransitionProgress,
  LEVELS,
} from "../levels.js";

const W = Size.LOGICAL_WIDTH;
const H = Size.LOGICAL_HEIGHT;
const PX = 3;

// ── Full 5×5 pixel font — digits 0–9, A–Z, space, colon, dash ──
// Each char is 5 rows of a 5-bit bitmask (MSB = leftmost pixel)
const FONT = {
  // Digits
  0: [0b11111, 0b10001, 0b10001, 0b10001, 0b11111],
  1: [0b00100, 0b01100, 0b00100, 0b00100, 0b01110],
  2: [0b11111, 0b00001, 0b11111, 0b10000, 0b11111],
  3: [0b11111, 0b00001, 0b01111, 0b00001, 0b11111],
  4: [0b10001, 0b10001, 0b11111, 0b00001, 0b00001],
  5: [0b11111, 0b10000, 0b11111, 0b00001, 0b11111],
  6: [0b11111, 0b10000, 0b11111, 0b10001, 0b11111],
  7: [0b11111, 0b00001, 0b00010, 0b00100, 0b00100],
  8: [0b11111, 0b10001, 0b11111, 0b10001, 0b11111],
  9: [0b11111, 0b10001, 0b11111, 0b00001, 0b11111],
  // Punctuation
  " ": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  ":": [0b00000, 0b00100, 0b00000, 0b00100, 0b00000],
  "-": [0b00000, 0b00000, 0b11111, 0b00000, 0b00000],
  "!": [0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  // Letters A–Z
  A: [0b01110, 0b10001, 0b11111, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b11110, 0b10001, 0b11110],
  C: [0b01111, 0b10000, 0b10000, 0b10000, 0b01111],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b11110, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b11110, 0b10000, 0b10000],
  G: [0b01111, 0b10000, 0b10111, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b11111, 0b10001, 0b10001],
  I: [0b11111, 0b00100, 0b00100, 0b00100, 0b11111],
  J: [0b11111, 0b00001, 0b00001, 0b10001, 0b01110],
  K: [0b10001, 0b10010, 0b11100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b11110, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b11110, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b01110, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b11111],
  V: [0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
  Y: [0b10001, 0b01010, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
};

export class UIRenderer {
  // ── Draw score HUD (top right) — only during PLAYING ──
  drawScore(ctx, score, bestScore, levelName) {
    // Moved down to avoid overlap with progress bar
    const panelY = 52;
    this._panel(ctx, W - 90, panelY, 82, 50);

    // Score
    ctx.fillStyle = "#ffdd44";
    this._pixelText(ctx, String(score), W - 86, panelY + 6, 2);

    // Best score
    ctx.fillStyle = "#aaaacc";
    this._pixelText(ctx, "B:" + String(bestScore), W - 86, panelY + 18, 1);

    // Level name
    ctx.fillStyle = "#88ff88";
    this._pixelText(ctx, levelName.toUpperCase(), W - 86, panelY + 30, 1);
  }

  // ── Draw level progress bar (top center) ──
  drawLevelProgress(ctx, score) {
    const currentLevel = getCurrentLevel(score);
    const progress = getLevelTransitionProgress(score);
    const nextLevelIndex = currentLevel.id + 1;
    const isMaxLevel = nextLevelIndex >= LEVELS.length;

    // Bar dimensions - moved down to be fully visible
    const barWidth = 280;
    const barHeight = 8;
    const barX = (W - barWidth) / 2;
    const barY = 18; // Moved down from 8 to give space for level text

    // Background panel
    this._panel(ctx, barX - 4, barY - 4, barWidth + 8, barHeight + 18);

    // Level indicator dots (show all 6 levels)
    const dotSpacing = barWidth / 6;
    for (let i = 0; i < 6; i++) {
      const dotX = barX + dotSpacing * i + dotSpacing / 2 - 2;
      const dotY = barY + barHeight + 6;

      if (i < currentLevel.id) {
        // Completed levels - filled dot
        ctx.fillStyle = "#88ff88";
        ctx.fillRect(dotX, dotY, 4, 4);
      } else if (i === currentLevel.id) {
        // Current level - pulsing dot
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ffdd44";
        ctx.fillRect(dotX - 1, dotY - 1, 6, 6);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffdd44";
        ctx.fillRect(dotX, dotY, 4, 4);
      } else {
        // Future levels - empty dot
        ctx.fillStyle = "#333344";
        ctx.fillRect(dotX, dotY, 4, 4);
      }
    }

    // Progress bar background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar fill
    const fillWidth = Math.floor(barWidth * progress);

    // Color based on level
    const levelColors = [
      "#5ecf3e", // Meadow - green
      "#8899aa", // Cavern - grey
      "#aaddff", // Frozen - blue
      "#e8e8ff", // Cloud - white
      "#ff6644", // Volcano - orange
      "#ff44ff", // Space - pink
    ];

    ctx.fillStyle = levelColors[currentLevel.id];
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Shine on progress bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(barX, barY, fillWidth, PX);

    // Level text above bar
    ctx.fillStyle = "#aaaacc";
    const levelText = isMaxLevel
      ? `LV ${currentLevel.id + 1}: ${currentLevel.name.toUpperCase()}`
      : `LV ${currentLevel.id + 1}: ${currentLevel.name.toUpperCase()}`;
    const textWidth = levelText.length * 6;
    this._pixelText(
      ctx,
      levelText,
      barX + (barWidth - textWidth) / 2,
      barY - 10,
      1,
    );

    // Next level preview (if not at max)
    if (!isMaxLevel) {
      const nextLevel = LEVELS[nextLevelIndex];
      const scoreNeeded = nextLevel.scoreThreshold - score;

      if (scoreNeeded <= 50) {
        // Show "NEXT: NAME" when close
        ctx.fillStyle = "#666688";
        const nextText = `NEXT: ${nextLevel.name.toUpperCase()}`;
        const nextTextWidth = nextText.length * 4;
        this._pixelText(ctx, nextText, W - nextTextWidth - 10, barY, 0.7);
      }
    } else {
      // Max level indicator
      ctx.fillStyle = "#ff88ff";
      this._pixelText(ctx, "MAX LV", W - 40, barY, 0.7);
    }
  }

  // ── Draw charge bar (above frog) ──
  drawChargeBar(ctx, frog, cameraY, maxCharge) {
    if (!frog.grounded || frog.charge <= 0) return;

    const barW = 50;
    const barH = 6;
    const x = Math.round(frog.x - barW / 2);
    const y = Math.round(frog.y - cameraY) - 30;
    const fillW = Math.round((frog.charge / maxCharge) * barW);
    const t = frog.charge / maxCharge;

    ctx.fillStyle = "#0a0a1e";
    ctx.fillRect(x - 2, y - 2, barW + 4, barH + 4);

    ctx.fillStyle = "#222244";
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = t < 0.5 ? "#44ff66" : t < 0.85 ? "#ffdd44" : "#ff4444";
    ctx.fillRect(x, y, fillW, barH);

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x, y, fillW, PX);

    ctx.fillStyle = "#0a0a1e";
    for (let i = 1; i < 4; i++) {
      ctx.fillRect(x + Math.round((barW * i) / 4), y, 1, barH);
    }
  }

  // ── Idle screen ──
  drawIdle(ctx) {
    ctx.fillStyle = "rgba(5,5,20,0.82)";
    ctx.fillRect(0, 0, W, H);

    // Title panel
    const panelW = 200;
    const panelX = W / 2 - panelW / 2;
    const panelY = H / 2 - 90;
    this._panel(ctx, panelX, panelY, panelW, 76);

    ctx.fillStyle = "#44ff66";
    this._pixelText(ctx, "FROGGY", W / 2 - 54, panelY + 10, 3);
    ctx.fillStyle = "#ffdd44";
    this._pixelText(ctx, "JUMP", W / 2 - 36, panelY + 44, 3);

    // Frog silhouette
    ctx.fillStyle = "#3ecf4a";
    ctx.fillRect(W / 2 - 12, H / 2 + 8, 24, 18);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(W / 2 - 8, H / 2 + 11, 5, 5);
    ctx.fillRect(W / 2 + 3, H / 2 + 11, 5, 5);
    ctx.fillStyle = "#1a5e22";
    ctx.fillRect(W / 2 - 5, H / 2 + 19, 10, 3);

    // Instructions panel
    const instrY = H / 2 + 34;
    this._panel(ctx, W / 2 - 94, instrY, 188, 38);
    ctx.fillStyle = "#aaaacc";
    this._pixelText(ctx, "HOLD TO CHARGE", W / 2 - 84, instrY + 8, 1);
    ctx.fillStyle = "#ffffff";
    this._pixelText(ctx, "RELEASE TO JUMP", W / 2 - 84, instrY + 22, 1);

    // Flashing start prompt
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = "#44ff66";
      this._pixelText(ctx, "PRESS SPACE OR TAP", W / 2 - 54, H / 2 + 82, 1);
    }
  }

  // ── Dead screen ──
  drawDead(ctx, score, bestScore) {
    ctx.fillStyle = "rgba(5,5,20,0.88)";
    ctx.fillRect(0, 0, W, H);

    // Panel
    this._panel(ctx, W / 2 - 100, H / 2 - 80, 200, 140);

    // GAME OVER title
    ctx.fillStyle = "#ff4444";
    this._pixelText(ctx, "GAME", W / 2 - 40, H / 2 - 68, 3);
    this._pixelText(ctx, "OVER", W / 2 - 40, H / 2 - 46, 3);

    // Divider
    ctx.fillStyle = "#334455";
    ctx.fillRect(W / 2 - 80, H / 2 - 26, 160, 2);

    // Score row
    ctx.fillStyle = "#aaaacc";
    this._pixelText(ctx, "SCORE", W / 2 - 80, H / 2 - 16, 1);
    ctx.fillStyle = "#ffffff";
    this._pixelText(ctx, String(score), W / 2 + 20, H / 2 - 16, 2);

    // Best row
    ctx.fillStyle = "#aaaacc";
    this._pixelText(ctx, "BEST", W / 2 - 80, H / 2 + 4, 1);
    ctx.fillStyle = "#ffdd44";
    this._pixelText(ctx, String(bestScore), W / 2 + 20, H / 2 + 4, 2);

    // Retry prompt
    if (Math.floor(Date.now() / 600) % 2 === 0) {
      ctx.fillStyle = "#44ff66";
      this._pixelText(ctx, "PRESS SPACE OR TAP", W / 2 - 54, H / 2 + 42, 1);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────

  // Bordered dark panel
  _panel(ctx, x, y, w, h) {
    ctx.fillStyle = "#334466";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#080818";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#445577";
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
  }

  // Draw pixel-art text using the FONT bitmask table
  // scale = canvas pixels per font pixel
  _pixelText(ctx, text, x, y, scale = 1) {
    const charW = 5;
    const charH = 5;
    const gap = 1;
    let cx = x;

    for (const ch of text.toUpperCase()) {
      const glyph = FONT[ch];
      if (!glyph) {
        cx += (charW + gap) * scale;
        continue;
      }

      for (let row = 0; row < charH; row++) {
        for (let col = 0; col < charW; col++) {
          if (glyph[row] & (1 << (charW - 1 - col))) {
            ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
          }
        }
      }
      cx += (charW + gap) * scale;
    }
  }
}
