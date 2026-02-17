// ─────────────────────────────────────────────────────────────
//  ParticleSystem
//  Two particle types:
//  JumpDust  — small puffs that shoot downward on jump
//  LandSplash — burst that radiates outward on landing
//
//  All particles live in world coordinates and are offset
//  by cameraY when drawing.
// ─────────────────────────────────────────────────────────────

const PX = 3;

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x     = x;
    this.y     = y;
    this.vx    = vx;
    this.vy    = vy;
    this.color = color;
    this.life  = life;
    this.maxLife = life;
    this.size  = size;
    this.gravity = 180; // px/s²
  }

  update(dt) {
    this.vy   += this.gravity * dt;
    this.x    += this.vx * dt;
    this.y    += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx, cameraY) {
    const alpha   = Math.max(0, this.life / this.maxLife);
    const screenY = this.y - cameraY;
    if (screenY < -20 || screenY > 700) return;

    ctx.globalAlpha = alpha;
    ctx.fillStyle   = this.color;
    // Chunky pixel — snap to grid
    const s = Math.ceil(this.size * alpha); // shrink as it fades
    ctx.fillRect(
      Math.round(this.x / PX) * PX,
      Math.round(screenY / PX) * PX,
      s, s
    );
  }
}

export class ParticleSystem {

  constructor() {
    this.particles = [];
  }

  // ── Spawn jump dust — small puffs shoot downward ──
  spawnJump(x, worldY) {
    const colors = ['#a8c878', '#c8e890', '#7aaa50', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.2; // mostly downward
      const speed = 60 + Math.random() * 80;
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        worldY,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        0.25 + Math.random() * 0.2,  // 0.25–0.45s life
        PX * 2,
      ));
    }
  }

  // ── Spawn land splash — burst radiates outward ──
  spawnLand(x, worldY) {
    const colors = ['#5ecf3e', '#7eff5a', '#a8c878', '#ffffff', '#c8e890'];
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI; // upward arc
      const speed = 80 + Math.random() * 120;
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 24,
        worldY,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        0.3 + Math.random() * 0.25,  // 0.3–0.55s life
        PX * 2,
      ));
    }

    // A few bigger chunks
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 0.8;
      const speed = 60 + Math.random() * 80;
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 12,
        worldY,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#5ecf3e',
        0.4 + Math.random() * 0.2,
        PX * 3,
      ));
    }
  }

  // ── Update all particles, remove dead ones ──
  update(dt) {
    this.particles = this.particles.filter(p => p.update(dt));
  }

  // ── Draw all particles ──
  draw(ctx, cameraY) {
    this.particles.forEach(p => p.draw(ctx, cameraY));
    ctx.globalAlpha = 1;
  }
}