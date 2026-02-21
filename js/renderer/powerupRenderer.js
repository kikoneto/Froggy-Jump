// ─────────────────────────────────────────────────────────────
//  PowerupRenderer
//  Draws power-up selection screen and active power-up indicators
// ─────────────────────────────────────────────────────────────

import { Size } from "../variables.js";

const W = Size.LOGICAL_WIDTH;
const H = Size.LOGICAL_HEIGHT;
const PX = 3;

// Simple 5×5 pixel font for power-up UI
const FONT = {
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
  " ": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  ":": [0b00000, 0b00100, 0b00000, 0b00100, 0b00000],
  "!": [0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "+": [0b00000, 0b00100, 0b01110, 0b00100, 0b00000],
  "-": [0b00000, 0b00000, 0b11111, 0b00000, 0b00000],
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

export class PowerupRenderer {
  // ── Draw power-up selection screen (3 choices) ──
  drawSelection(ctx, powerups, hoveredIndex) {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(5, 5, 20, 0.92)";
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "#ffdd44";
    const title = "CHOOSE POWER-UP";
    const titleWidth = title.length * 6 * 2; // 6px per char at scale 2
    this._pixelText(ctx, title, (W - titleWidth) / 2, 60, 2);

    // Draw 3 power-up cards (centered and symmetric)
    const cardWidth = 110;
    const cardHeight = 130;
    const spacing = 15;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = (W - totalWidth) / 2;
    const startY = 110;

    powerups.forEach((powerup, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = startY;
      const hovered = index === hoveredIndex;

      this._drawPowerupCard(ctx, powerup, x, y, cardWidth, cardHeight, hovered);
    });

    // Instructions (centered)
    ctx.fillStyle = "#aaaacc";
    const instruction = "CLICK OR TAP TO SELECT";
    const instrWidth = instruction.length * 6; // 6px per char at scale 1
    this._pixelText(ctx, instruction, (W - instrWidth) / 2, H - 40, 1);
  }

  // ── Draw single power-up card ──
  _drawPowerupCard(ctx, powerup, x, y, w, h, hovered) {
    // Card background
    if (hovered) {
      // Glowing border when hovered
      ctx.fillStyle = powerup.color;
      ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(x, y, w, h);
    } else {
      // Normal border
      ctx.fillStyle = "#334466";
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = "#0a0a1e";
      ctx.fillRect(x, y, w, h);
    }

    // Icon (large, centered)
    ctx.fillStyle = powerup.color;
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(powerup.icon, x + w / 2, y + 32);

    // Name (centered, with proper spacing)
    ctx.fillStyle = powerup.color;
    const name = this._truncateText(powerup.name.toUpperCase(), 16); // Max 16 chars
    const nameWidth = name.length * 6; // 6px per char at scale 1
    this._pixelText(ctx, name, x + (w - nameWidth) / 2, y + 68, 1);

    // Description (centered, truncated to fit, smaller)
    ctx.fillStyle = "#aaaacc";
    const desc = this._truncateText(powerup.description.toUpperCase(), 20); // Max 20 chars
    const descWidth = desc.length * 4.5; // 4.5px per char at scale 0.7
    this._pixelText(ctx, desc, x + (w - descWidth) / 2, y + 84, 0.7);

    // Duration indicator (centered)
    if (powerup.duration) {
      ctx.fillStyle = "#666688";
      const durationText = `${powerup.duration}S`;
      const durationWidth = durationText.length * 4.5;
      this._pixelText(
        ctx,
        durationText,
        x + (w - durationWidth) / 2,
        y + 102,
        0.7,
      );
    } else {
      ctx.fillStyle = "#888888";
      const instantText = "INSTANT";
      const instantWidth = instantText.length * 4.5;
      this._pixelText(
        ctx,
        instantText,
        x + (w - instantWidth) / 2,
        y + 102,
        0.7,
      );
    }

    // Highlight pulse if hovered
    if (hovered) {
      const pulse = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = powerup.color;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
  }

  // ── Draw active power-ups indicator (LEFT side, below level progress) ──
  drawActivePowerups(ctx, activePowerups) {
    if (activePowerups.length === 0) return;

    let offsetY = 50; // Below level progress bar (18 + 8 + 14)

    activePowerups.forEach(({ powerup, timeLeft, count }) => {
      const panelW = 80;
      const panelH = 25;
      const x = 8; // Left side
      const y = offsetY;

      // Background
      this._panel(ctx, x, y, panelW, panelH);

      // Icon - centered vertically
      ctx.fillStyle = powerup.color;
      ctx.font = "16px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle"; // Changed from 'top' to 'middle'
      ctx.fillText(powerup.icon, x + 6, y + panelH / 2 + 3); // Center vertically

      // Display based on power-up type
      if (count !== undefined && count > 0) {
        // Shield with counter
        ctx.fillStyle = "#ffffff";
        this._pixelText(ctx, `x${count}`, x + 24, y + 11, 1); // Adjusted y position
      } else if (
        powerup.duration &&
        timeLeft !== null &&
        timeLeft !== Infinity
      ) {
        // Timed power-up
        ctx.fillStyle = "#ffffff";
        this._pixelText(ctx, `${Math.ceil(timeLeft)}S`, x + 24, y + 11, 1); // Adjusted y position
      } else {
        // Permanent/instant power-up
        ctx.fillStyle = "#88ff88";
        this._pixelText(ctx, "ACTIVE", x + 24, y + 11, 1); // Adjusted y position
      }

      // Progress bar for timed power-ups only
      if (powerup.duration && timeLeft !== null && timeLeft !== Infinity) {
        const progress = timeLeft / powerup.duration;
        const barW = panelW - 8;
        const fillW = Math.floor(barW * progress);

        ctx.fillStyle = "#222244";
        ctx.fillRect(x + 4, y + panelH - 6, barW, 4);

        ctx.fillStyle = powerup.color;
        ctx.fillRect(x + 4, y + panelH - 6, fillW, 4);
      }

      offsetY += panelH + 6;
    });
  }

  // ── Helper: Draw bordered panel ──
  _panel(ctx, x, y, w, h) {
    ctx.fillStyle = "#334466";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#080818";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#445577";
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
  }

  // ── Helper: Truncate text to max length ──
  _truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 2) + "..";
  }

  // ── Helper: Pixel text renderer ──
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
