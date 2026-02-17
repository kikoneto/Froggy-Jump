// ─────────────────────────────────────────────────────────────
//  PlatformRenderer
//  Draws platforms as pixel-art tiles.
//  Two visual types derived from platform speed:
//    grass  — slower platforms (green top, brown dirt body)
//    stone  — faster platforms (grey with cracks)
//
//  Each platform is drawn as a repeating tile pattern.
// ─────────────────────────────────────────────────────────────

const PX = 3;

// Grass platform palette
const GRASS = {
  top: "#5ecf3e",
  topLight: "#7eff5a",
  topDark: "#3a9e24",
  dirt: "#8b5e3c",
  dirtDark: "#6b4028",
  dirtLight: "#a07048",
  root: "#5a3820",
};

// Stone platform palette
const STONE = {
  top: "#8899aa",
  topLight: "#aabbcc",
  topDark: "#667788",
  body: "#667788",
  bodyDark: "#445566",
  bodyLight: "#889aaa",
  crack: "#445566",
};

export class PlatformRenderer {
  draw(ctx, p, screenY) {
    const isStone = Math.abs(p.vx) + Math.abs(p.vy) > 150;
    if (isStone) {
      this._drawStone(ctx, p, screenY);
    } else {
      this._drawGrass(ctx, p, screenY);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  GRASS PLATFORM
  //  Top: 2 rows of grass pixels
  //  Body: dirt with pixel texture
  // ─────────────────────────────────────────────────────────

  _drawGrass(ctx, p, screenY) {
    const { x, width: w, height: h } = p;
    const y = screenY;

    // ── Dirt body ──
    ctx.fillStyle = GRASS.dirt;
    ctx.fillRect(x, y + PX * 2, w, h - PX * 2);

    // Dirt texture — darker horizontal bands
    ctx.fillStyle = GRASS.dirtDark;
    for (let tx = x + PX; tx < x + w - PX; tx += PX * 4) {
      ctx.fillRect(tx, y + PX * 3, PX, PX);
      ctx.fillRect(tx + PX * 2, y + PX * 4, PX, PX);
    }

    // Dirt light highlight
    ctx.fillStyle = GRASS.dirtLight;
    ctx.fillRect(x + PX, y + PX * 2, w - PX * 2, PX);

    // ── Grass top — two pixel rows ──
    ctx.fillStyle = GRASS.top;
    ctx.fillRect(x, y, w, PX * 2);

    // Grass blades — lighter tufts
    ctx.fillStyle = GRASS.topLight;
    for (let tx = x + PX; tx < x + w - PX; tx += PX * 3) {
      ctx.fillRect(tx, y, PX, PX); // single bright pixel at top
    }

    // Grass shadow edge
    ctx.fillStyle = GRASS.topDark;
    ctx.fillRect(x, y + PX, w, PX);

    // ── Left / right edge caps ──
    ctx.fillStyle = GRASS.root;
    ctx.fillRect(x, y, PX, h);
    ctx.fillRect(x + w - PX, y, PX, h);

    // ── Bottom edge ──
    ctx.fillStyle = GRASS.dirtDark;
    ctx.fillRect(x, y + h - PX, w, PX);
  }

  // ─────────────────────────────────────────────────────────
  //  STONE PLATFORM
  //  Solid grey brick with cracks for fast/hard platforms
  // ─────────────────────────────────────────────────────────

  _drawStone(ctx, p, screenY) {
    const { x, width: w, height: h } = p;
    const y = screenY;

    // ── Stone body ──
    ctx.fillStyle = STONE.body;
    ctx.fillRect(x, y, w, h);

    // ── Top highlight ──
    ctx.fillStyle = STONE.topLight;
    ctx.fillRect(x + PX, y, w - PX * 2, PX);
    ctx.fillRect(x, y, PX, h - PX);

    // ── Bottom / right shadow ──
    ctx.fillStyle = STONE.bodyDark;
    ctx.fillRect(x + PX, y + h - PX, w - PX * 2, PX);
    ctx.fillRect(x + w - PX, y + PX, PX, h - PX);

    // ── Cracks — pixel lines for worn stone look ──
    ctx.fillStyle = STONE.crack;
    // Crack 1 — near left
    const c1x = x + Math.floor((w * 0.25) / PX) * PX;
    ctx.fillRect(c1x, y + PX, PX, PX * 2);
    ctx.fillRect(c1x - PX, y + PX * 3, PX, PX);

    // Crack 2 — near right (only if wide enough)
    if (w > 60) {
      const c2x = x + Math.floor((w * 0.7) / PX) * PX;
      ctx.fillRect(c2x, y + PX * 2, PX, PX * 2);
      ctx.fillRect(c2x + PX, y + PX * 4, PX, PX);
    }

    // ── Corners ──
    ctx.fillStyle = STONE.bodyDark;
    ctx.fillRect(x, y, PX, PX);
    ctx.fillRect(x + w - PX, y, PX, PX);
    ctx.fillRect(x, y + h - PX, PX, PX);
    ctx.fillRect(x + w - PX, y + h - PX, PX, PX);
  }
}
