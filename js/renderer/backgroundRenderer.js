// ─────────────────────────────────────────────────────────────
//  BackgroundRenderer
//  Three parallax layers with SMOOTH TRANSITIONS between levels:
//  1. Sky gradient (lerps between level colors)
//  2. Stars (count and color smoothly transition)
//  3. Clouds (count and color smoothly transition)
// ─────────────────────────────────────────────────────────────

import { Size } from '../variables.js';
import { getCurrentLevel, getLevelTransitionProgress, LEVELS } from '../levels.js';

const W = Size.LOGICAL_WIDTH;
const H = Size.LOGICAL_HEIGHT;
const PX = 3;

export class BackgroundRenderer {

  constructor() {
    this.stars = [];
    this.clouds = [];
    this.currentLevelId = -1;
    this.transitionProgress = 0; // 0 = start of level, 1 = end of level
  }

  draw(ctx, cameraY, score) {
    const currentLevel = getCurrentLevel(score);
    const progress = getLevelTransitionProgress(score);
    
    // Detect level change
    if (currentLevel.id !== this.currentLevelId) {
      this._onLevelChange(currentLevel);
      this.currentLevelId = currentLevel.id;
    }
    
    this.transitionProgress = progress;
    
    // Get next level for smooth blending
    const nextLevelIndex = currentLevel.id + 1;
    const nextLevel = nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : currentLevel;
    
    this._drawSky(ctx, currentLevel, nextLevel, progress);
    this._drawStars(ctx, cameraY, currentLevel, nextLevel, progress);
    this._drawClouds(ctx, cameraY, currentLevel, nextLevel, progress);
  }

  _onLevelChange(level) {
    // Regenerate stars/clouds for new level
    const targetCount = level.stars.count;
    
    // Smoothly add/remove stars to reach target count
    if (this.stars.length < targetCount) {
      // Add stars
      while (this.stars.length < targetCount) {
        this.stars.push(this._createStar());
      }
    } else if (this.stars.length > targetCount) {
      // Remove excess stars
      this.stars = this.stars.slice(0, targetCount);
    }
    
    // Same for clouds
    const targetCloudCount = level.clouds.count;
    if (this.clouds.length < targetCloudCount) {
      while (this.clouds.length < targetCloudCount) {
        this.clouds.push(this._createCloud());
      }
    } else if (this.clouds.length > targetCloudCount) {
      this.clouds = this.clouds.slice(0, targetCloudCount);
    }
    
    console.log(`Level ${level.id}: ${level.name} (${this.stars.length} stars, ${this.clouds.length} clouds)`);
  }

  // Helper to create single star
  _createStar() {
    return {
      x:       Math.random() * W,
      worldY:  Math.random() * H * 20,
      size:    Math.random() < 0.3 ? 3 : 2,
      phase:   Math.random() * Math.PI * 2,
      speed:   0.05 + Math.random() * 0.1,
    };
  }

  // Helper to create single cloud
  _createCloud() {
    return {
      x:      Math.random() * W,
      worldY: Math.random() * H * 15,
      width:  40 + Math.random() * 80,
      height: 20 + Math.random() * 30,
      speed:  0.15 + Math.random() * 0.1,
    };
  }

  // ─────────────────────────────────────────────────────────
  //  SKY — SMOOTH COLOR TRANSITIONS
  // ─────────────────────────────────────────────────────────

  _drawSky(ctx, currentLevel, nextLevel, progress) {
    const currentBands = currentLevel.sky.bands;
    const nextBands = nextLevel.sky.bands;
    const bandH = Math.ceil(H / currentBands.length);
    
    currentBands.forEach((currentColor, i) => {
      const nextColor = nextBands[i] || currentColor;
      
      // Lerp between colors
      const blendedColor = this._lerpColor(currentColor, nextColor, progress);
      
      ctx.fillStyle = blendedColor;
      ctx.fillRect(0, i * bandH, W, bandH + 1);
    });
  }

  // Linear interpolation between two hex colors
  _lerpColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ─────────────────────────────────────────────────────────
  //  STARS — smooth color transitions
  // ─────────────────────────────────────────────────────────

  _drawStars(ctx, cameraY, currentLevel, nextLevel, progress) {
    const t = Date.now() * 0.001;
    
    // Lerp star color
    const starColor = this._lerpColor(
      currentLevel.stars.color,
      nextLevel.stars.color,
      progress
    );
    
    for (const star of this.stars) {
      const parallaxY = star.worldY - cameraY * star.speed;
      const y = parallaxY % (H + 100) - 50;
      
      if (y < -10 || y > H + 10) continue;
      
      const brightness = 0.5 + 0.5 * Math.sin(t * star.speed * 2 + star.phase);
      ctx.globalAlpha = brightness;
      ctx.fillStyle = starColor;
      
      ctx.fillRect(
        Math.floor(star.x / PX) * PX,
        Math.floor(y / PX) * PX,
        star.size, star.size
      );
    }
    
    ctx.globalAlpha = 1;
  }

  // ─────────────────────────────────────────────────────────
  //  CLOUDS — smooth color transitions
  // ─────────────────────────────────────────────────────────

  _drawClouds(ctx, cameraY, currentLevel, nextLevel, progress) {
    // Lerp cloud color
    const cloudColor = this._lerpColor(
      currentLevel.clouds.color,
      nextLevel.clouds.color,
      progress
    );
    
    for (const cloud of this.clouds) {
      const parallaxY = cloud.worldY - cameraY * cloud.speed;
      const y = parallaxY % (H + 200) - 100;
      
      if (y < -cloud.height - 10 || y > H + 10) continue;
      
      ctx.fillStyle = cloudColor;
      ctx.globalAlpha = 0.6;
      
      const cx = Math.floor(cloud.x / PX) * PX;
      const cy = Math.floor(y / PX) * PX;
      const w = Math.floor(cloud.width / PX) * PX;
      const h = Math.floor(cloud.height / PX) * PX;
      
      // Chunky cloud shape
      ctx.fillRect(cx + PX * 2, cy, w - PX * 4, h);
      ctx.fillRect(cx, cy + PX * 2, w, h - PX * 4);
      ctx.fillRect(cx + PX, cy + PX, w - PX * 2, h - PX * 2);
      
      // Top bumps
      for (let i = 0; i < 3; i++) {
        const bumpX = cx + (w / 4) * (i + 0.5);
        ctx.fillRect(bumpX, cy - PX, PX * 2, PX * 2);
      }
    }
    
    ctx.globalAlpha = 1;
  }
}