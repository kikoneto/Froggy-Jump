// ─────────────────────────────────────────────────────────────
//  FrogRenderer
//  Draws the frog as a pixel-art sprite.
//  Animation states:
//    idle     — grounded, no charge
//    charging — grounded, charge > 0 (squishes vertically)
//    rising   — airborne, vy < 0 (stretches tall)
//    falling  — airborne, vy > 0 (spreads wide, legs out)
//    landing  — single-frame squash on touchdown
// ─────────────────────────────────────────────────────────────

const PX = 3; // one "pixel" in canvas pixels

// Colour palette
const C = {
  body: "#3ecf4a", // main green
  bodyDark: "#2a9e33", // shadow / underside
  bodyLight: "#6eff7a", // highlight
  eye: "#ffffff",
  pupil: "#1a1a2e",
  shine: "#ffffff",
  belly: "#a8e8a0",
  leg: "#2a9e33",
  legDark: "#1a7024",
  mouth: "#1a5e22",
};

export class FrogRenderer {
  constructor() {
    this._landingTimer = 0; // frames remaining of landing squash
  }

  // ── Called by game when frog lands ──
  triggerLanding() {
    this._landingTimer = 8; // 8 frames of squash
  }

  // ── Main draw — called every frame ──
  draw(ctx, frog, cameraY) {
    const screenY = frog.y - cameraY;
    const state = this._getState(frog);

    // Squish / stretch scale based on state
    const { sx, sy } = this._getScale(frog, state);

    ctx.save();
    ctx.translate(Math.round(frog.x), Math.round(screenY));
    ctx.scale(sx, sy);

    this._drawShadow(ctx, frog, state);
    this._drawLegs(ctx, state);
    this._drawBody(ctx);
    this._drawBelly(ctx);
    this._drawEyes(ctx, state);
    this._drawMouth(ctx, state);

    ctx.restore();

    if (this._landingTimer > 0) this._landingTimer--;
  }

  // ─────────────────────────────────────────────────────────
  //  STATE
  // ─────────────────────────────────────────────────────────

  _getState(frog) {
    if (this._landingTimer > 0) return "landing";
    if (!frog.grounded) return frog.vy < 0 ? "rising" : "falling";
    if (frog.charge > 0) return "charging";
    return "idle";
  }

  _getScale(frog, state) {
    switch (state) {
      case "landing":
        return { sx: 1.4, sy: 0.65 }; // wide squash
      case "charging": {
        const t = frog.charge / 1100;
        return { sx: 1 + t * 0.25, sy: 1 - t * 0.3 }; // squish as charge builds
      }
      case "rising":
        return { sx: 0.75, sy: 1.35 }; // tall stretch
      case "falling":
        return { sx: 1.2, sy: 0.85 }; // wide spread
      default:
        return { sx: 1, sy: 1 };
    }
  }

  // ─────────────────────────────────────────────────────────
  //  SHADOW — oval under frog when grounded
  // ─────────────────────────────────────────────────────────

  _drawShadow(ctx, frog, state) {
    if (!frog.grounded && state !== "landing") return;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(0, 20, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ─────────────────────────────────────────────────────────
  //  BODY — chunky pixel-art rectangle with highlights
  // ─────────────────────────────────────────────────────────

  _drawBody(ctx) {
    const w = 30,
      h = 24;
    const x = -w / 2,
      y = -h / 2;

    // Main body
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y, w, h);

    // Top highlight row
    ctx.fillStyle = C.bodyLight;
    ctx.fillRect(x + PX, y, w - PX * 2, PX);
    ctx.fillRect(x, y + PX, PX, PX);

    // Left highlight column
    ctx.fillStyle = C.bodyLight;
    ctx.fillRect(x, y + PX, PX, h - PX * 3);

    // Bottom shadow row
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x + PX, y + h - PX, w - PX * 2, PX);
    ctx.fillRect(x + w - PX, y + PX, PX, h - PX * 2);

    // Corner pixels (darkest)
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x, y, PX, PX); // top-left
    ctx.fillRect(x + w - PX, y, PX, PX); // top-right
    ctx.fillRect(x, y + h - PX, PX, PX); // bottom-left
    ctx.fillRect(x + w - PX, y + h - PX, PX, PX); // bottom-right
  }

  // ─────────────────────────────────────────────────────────
  //  BELLY — lighter patch on lower body
  // ─────────────────────────────────────────────────────────

  _drawBelly(ctx) {
    ctx.fillStyle = C.belly;
    ctx.fillRect(-8, 4, 16, 8);
    // Belly outline (darker)
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(-8, 4, 16, PX); // top edge
    ctx.fillRect(-8, 12 - PX, 16, PX); // bottom edge
  }

  // ─────────────────────────────────────────────────────────
  //  EYES — round pixel eyes, positioned on top of head
  //  In 'falling' state eyes go wide
  // ─────────────────────────────────────────────────────────

  _drawEyes(ctx, state) {
    const eyeW = state === "falling" ? PX * 3 : PX * 2;
    const eyeH = state === "falling" ? PX * 3 : PX * 2;
    const eyeY = -14;

    [
      [-9, eyeY],
      [6, eyeY],
    ].forEach(([ex, ey]) => {
      // White
      ctx.fillStyle = C.eye;
      ctx.fillRect(ex, ey, eyeW, eyeH);

      // Pupil (offset right-down for direction feel)
      ctx.fillStyle = C.pupil;
      ctx.fillRect(ex + PX, ey + PX, PX, PX);

      // Shine dot
      ctx.fillStyle = C.shine;
      ctx.fillRect(ex, ey, PX, PX);
    });
  }

  // ─────────────────────────────────────────────────────────
  //  MOUTH — smile when idle, open O when rising/falling
  // ─────────────────────────────────────────────────────────

  _drawMouth(ctx, state) {
    ctx.fillStyle = C.mouth;
    if (state === "rising" || state === "falling") {
      // Open O mouth
      ctx.fillRect(-PX, 6, PX * 2, PX * 2);
    } else {
      // Smile — two pixels
      ctx.fillRect(-6, 6, PX, PX);
      ctx.fillRect(3, 6, PX, PX);
      ctx.fillRect(-3, 8, PX * 2, PX);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  LEGS — chunky pixel legs, position changes per state
  // ─────────────────────────────────────────────────────────

  _drawLegs(ctx, state) {
    ctx.fillStyle = C.leg;

    if (state === "idle" || state === "charging" || state === "landing") {
      // Legs tucked under body
      // Left leg
      this._pixelRect(ctx, -18, 12, 8, PX * 2);
      this._pixelRect(ctx, -22, 14, PX * 2, PX);
      // Right leg
      this._pixelRect(ctx, 10, 12, 8, PX * 2);
      this._pixelRect(ctx, 14, 14, PX * 2, PX);
    } else if (state === "rising") {
      // Legs pulled up tight
      this._pixelRect(ctx, -16, 6, PX * 2, 8);
      this._pixelRect(ctx, 10, 6, PX * 2, 8);
    } else {
      // Falling — legs splayed outward
      this._pixelRect(ctx, -22, 10, 10, PX * 2);
      this._pixelRect(ctx, -24, 12, PX * 2, PX * 2);
      this._pixelRect(ctx, 12, 10, 10, PX * 2);
      this._pixelRect(ctx, 22, 12, PX * 2, PX * 2);
    }

    // Feet toes (darker)
    ctx.fillStyle = C.legDark;
    if (state === "idle" || state === "charging" || state === "landing") {
      this._pixelRect(ctx, -24, 14, PX * 2, PX);
      this._pixelRect(ctx, 16, 14, PX * 2, PX);
    }
  }

  _pixelRect(ctx, x, y, w, h) {
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
}
