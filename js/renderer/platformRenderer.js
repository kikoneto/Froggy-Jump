// ─────────────────────────────────────────────────────────────
//  PlatformRenderer
//  Draws platforms with textures that match the current level theme.
//  Six types: grass, stone, ice, cloud, lava, crystal
// ─────────────────────────────────────────────────────────────

import { getCurrentLevel } from "../levels.js";

const PX = 3;

export class PlatformRenderer {
  draw(ctx, p, screenY, score) {
    const level = getCurrentLevel(score);
    const type = level.platform.type;
    const colors = level.platform.colors;

    switch (type) {
      case "grass":
        this._drawGrass(ctx, p, screenY, colors);
        break;
      case "stone":
        this._drawStone(ctx, p, screenY, colors);
        break;
      case "ice":
        this._drawIce(ctx, p, screenY, colors);
        break;
      case "cloud":
        this._drawCloud(ctx, p, screenY, colors);
        break;
      case "lava":
        this._drawLava(ctx, p, screenY, colors);
        break;
      case "crystal":
        this._drawCrystal(ctx, p, screenY, colors);
        break;
    }
  }

  // ─────────────────────────────────────────────────────────
  //  GRASS PLATFORM (Level 0: Meadow)
  // ─────────────────────────────────────────────────────────

  _drawGrass(ctx, p, screenY, C) {
    const { x, width: w, height: h } = p;
    const y = screenY;

    // Dirt body
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y + PX * 2, w, h - PX * 2);

    // Dirt texture
    ctx.fillStyle = C.bodyDark;
    for (let tx = x + PX; tx < x + w - PX; tx += PX * 4) {
      ctx.fillRect(tx, y + PX * 3, PX, PX);
      ctx.fillRect(tx + PX * 2, y + PX * 4, PX, PX);
    }

    ctx.fillStyle = C.bodyLight;
    ctx.fillRect(x + PX, y + PX * 2, w - PX * 2, PX);

    // Grass top
    ctx.fillStyle = C.top;
    ctx.fillRect(x, y, w, PX * 2);

    ctx.fillStyle = C.topLight;
    for (let tx = x + PX; tx < x + w - PX; tx += PX * 3) {
      ctx.fillRect(tx, y, PX, PX);
    }

    ctx.fillStyle = C.topDark;
    ctx.fillRect(x, y + PX, w, PX);

    // Edges
    ctx.fillStyle = C.edge;
    ctx.fillRect(x, y, PX, h);
    ctx.fillRect(x + w - PX, y, PX, h);
    ctx.fillRect(x, y + h - PX, w, PX);
  }

  // ─────────────────────────────────────────────────────────
  //  STONE PLATFORM (Level 1: Cavern)
  // ─────────────────────────────────────────────────────────

  _drawStone(ctx, p, screenY, C) {
    const { x, width: w, height: h } = p;
    const y = screenY;

    // Body
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y, w, h);

    // Highlight
    ctx.fillStyle = C.topLight;
    ctx.fillRect(x + PX, y, w - PX * 2, PX);
    ctx.fillRect(x, y, PX, h - PX);

    // Shadow
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x + PX, y + h - PX, w - PX * 2, PX);
    ctx.fillRect(x + w - PX, y + PX, PX, h - PX);

    // Cracks
    ctx.fillStyle = C.crack;
    const c1x = x + Math.floor((w * 0.25) / PX) * PX;
    ctx.fillRect(c1x, y + PX, PX, PX * 2);
    ctx.fillRect(c1x - PX, y + PX * 3, PX, PX);

    if (w > 60) {
      const c2x = x + Math.floor((w * 0.7) / PX) * PX;
      ctx.fillRect(c2x, y + PX * 2, PX, PX * 2);
      ctx.fillRect(c2x + PX, y + PX * 4, PX, PX);
    }

    // Corners
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x, y, PX, PX);
    ctx.fillRect(x + w - PX, y, PX, PX);
    ctx.fillRect(x, y + h - PX, PX, PX);
    ctx.fillRect(x + w - PX, y + h - PX, PX, PX);
  }

  // ─────────────────────────────────────────────────────────
  //  ICE PLATFORM (Level 2: Frozen Peaks)
  // ─────────────────────────────────────────────────────────

  _drawIce(ctx, p, screenY, C) {
    const { x, width: w, height: h } = p;
    const y = screenY;

    // Body
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y, w, h);

    // Top shine
    ctx.fillStyle = C.topLight;
    ctx.fillRect(x, y, w, PX);

    // Shine streaks
    ctx.fillStyle = C.shine;
    ctx.globalAlpha = 0.6;
    for (let tx = x + PX; tx < x + w; tx += PX * 6) {
      ctx.fillRect(tx, y + PX, PX, PX);
      ctx.fillRect(tx + PX * 2, y + PX * 2, PX, PX);
    }
    ctx.globalAlpha = 1;

    // Edges
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x, y, PX, h);
    ctx.fillRect(x + w - PX, y, PX, h);
    ctx.fillRect(x, y + h - PX, w, PX);
  }

  // ─────────────────────────────────────────────────────────
  //  CLOUD PLATFORM (Level 3: Cloud City)
  // ─────────────────────────────────────────────────────────

  _drawCloud(ctx, p, screenY, C) {
    const { x, width: w, height: h } = p;
    const y = screenY;

    // Main body
    ctx.fillStyle = C.body;
    ctx.fillRect(x + PX, y + PX, w - PX * 2, h - PX * 2);

    // Puffs
    ctx.fillStyle = C.topLight;
    for (let tx = x; tx < x + w; tx += PX * 4) {
      ctx.fillRect(tx, y, PX * 3, PX * 2);
    }

    // Shadow bottom
    ctx.fillStyle = C.bodyDark;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x + PX * 2, y + h - PX * 2, w - PX * 4, PX);
    ctx.globalAlpha = 1;

    // Soft edges
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y + PX, PX, h - PX * 2);
    ctx.fillRect(x + w - PX, y + PX, PX, h - PX * 2);
  }

  // ─────────────────────────────────────────────────────────
  //  LAVA PLATFORM (Level 4: Volcano)
  // ─────────────────────────────────────────────────────────

  _drawLava(ctx, p, screenY, C) {
    const { x, width: w, height: h } = p;
    const y = screenY;
    const t = Date.now() * 0.003;

    // Stone body
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y + PX * 2, w, h - PX * 2);

    // Lava glow cracks
    ctx.fillStyle = C.crack;
    for (let tx = x + PX * 2; tx < x + w - PX * 2; tx += PX * 5) {
      const flicker = 0.7 + 0.3 * Math.sin(t * 3 + tx * 0.1);
      ctx.globalAlpha = flicker;
      ctx.fillRect(tx, y + PX * 3, PX, PX * 2);
    }
    ctx.globalAlpha = 1;

    // Hot top
    ctx.fillStyle = C.top;
    ctx.fillRect(x, y, w, PX * 2);

    // Glow
    ctx.fillStyle = C.glow;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2);
    ctx.fillRect(x, y, w, PX);
    ctx.globalAlpha = 1;

    // Dark edges
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x, y, PX, h);
    ctx.fillRect(x + w - PX, y, PX, h);
    ctx.fillRect(x, y + h - PX, w, PX);
  }

  // ─────────────────────────────────────────────────────────
  //  CRYSTAL PLATFORM (Level 5: Space)
  // ─────────────────────────────────────────────────────────

  _drawCrystal(ctx, p, screenY, C) {
    const { x, width: w, height: h } = p;
    const y = screenY;
    const t = Date.now() * 0.002;

    // Body
    ctx.fillStyle = C.body;
    ctx.fillRect(x, y, w, h);

    // Facets
    ctx.fillStyle = C.bodyLight;
    for (let tx = x; tx < x + w; tx += PX * 4) {
      ctx.fillRect(tx, y, PX * 2, h);
    }

    // Shine
    ctx.fillStyle = C.shine;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 3);
    for (let tx = x + PX; tx < x + w; tx += PX * 6) {
      ctx.fillRect(tx, y + PX, PX, PX);
      ctx.fillRect(tx + PX, y + PX * 3, PX, PX);
    }
    ctx.globalAlpha = 1;

    // Glow edges
    ctx.fillStyle = C.glow;
    ctx.globalAlpha = 0.4 + 0.2 * Math.sin(t * 2);
    ctx.fillRect(x, y, w, PX);
    ctx.fillRect(x, y, PX, h);
    ctx.fillRect(x + w - PX, y, PX, h);
    ctx.globalAlpha = 1;

    // Dark corners
    ctx.fillStyle = C.bodyDark;
    ctx.fillRect(x, y, PX, PX);
    ctx.fillRect(x + w - PX, y, PX, PX);
    ctx.fillRect(x, y + h - PX, PX, PX);
    ctx.fillRect(x + w - PX, y + h - PX, PX, PX);
  }
}
