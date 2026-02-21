import { Frog } from "./entities/frog.js";
import { PlatformManager } from "./services/platformManager.js";
import { State, Size, Physics, FPS } from "./variables.js";
import { getCurrentLevel } from "./levels.js";
import { BackgroundRenderer } from "./renderer/backgroundRenderer.js";
import { FrogRenderer } from "./renderer/frogRenderer.js";
import { PlatformRenderer } from "./renderer/platformRenderer.js";
import { ParticleSystem } from "./renderer/particleSystem.js";
import { UIRenderer } from "./renderer/uiRenderer.js";
import { PowerupRenderer } from "./renderer/powerupRenderer.js";
import { getRandomPowerups, getPowerupById, getActivePowerupIds } from "./powerups.js";

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

    // Disable smoothing — keeps pixel art crisp when canvas is scaled
    this.ctx.imageSmoothingEnabled = false;

    // ── Game objects ──
    this.frog = new Frog();
    this.platformManager = new PlatformManager();

    // ── Renderers ──
    this.bgRenderer = new BackgroundRenderer();
    this.frogRenderer = new FrogRenderer();
    this.platformRenderer = new PlatformRenderer();
    this.particles = new ParticleSystem();
    this.ui = new UIRenderer();
    this.powerupRenderer = new PowerupRenderer();

    // ── Camera ──
    // cameraY is the world Y that maps to the top of the screen.
    // screenY = worldY - cameraY
    this.cameraY = 0;

    // ── Score & difficulty ──
    this.score = 0;
    this.bestScore = 0;
    this.difficulty = 0;

    // ── Power-up system ──
    this.powerupState = {
      timers: {},                    // Active power-up timers
      doubleJumpEnabled: false,
      doubleJumpAvailable: false,
      shieldActive: false,
      slowMotionActive: false,
      timeScale: 1.0,
      jumpMultiplier: 1.0,
      platformWidthBonus: 0,
      ghostActive: false,
      megaJumpActive: false,
      magnetActive: false,
      springActive: false,
    };
    
    this.powerupSelectionActive = false;
    this.powerupChoices = [];
    this.powerupHoveredIndex = -1;
    this.scoreUntilPowerup = 50;    // Offer power-up every 200 points
    this.POWERUP_SCORE_INTERVAL = 50;
    this.lastPowerupScore = 0;       // Track when last power-up was offered
    this.powerupReady = false;       // Flag: power-up ready, waiting for landing

    // ── State ──
    this.currentState = State.IDLE;

    // ── Loop timing ──
    this.lastTimestamp = null;
    this.fps = 0;
    this.fpsTimer = 0;
    this.fpsCount = 0;

    // ── Input ──
    this.input = { held: false, released: false };
    this.ignoreNextRelease = false; // Flag to ignore release after starting game

    // ── Bootstrap ──
    this._bindInput();
    this._resize();
    window.addEventListener("resize", () => this._resize());

    // Pre-init the world so it renders behind the idle overlay
    this.init();

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
    
    // Reset power-ups
    this.powerupState.timers = {};
    this.powerupState.doubleJumpEnabled = false;
    this.powerupState.doubleJumpAvailable = false;
    this.powerupState.shieldActive = false;
    this.powerupState.slowMotionActive = false;
    this.powerupState.timeScale = 1.0;
    this.powerupState.jumpMultiplier = 1.0;
    this.powerupState.platformWidthBonus = 0;
    this.powerupState.ghostActive = false;
    this.powerupState.megaJumpActive = false;
    this.powerupState.magnetActive = false;
    this.powerupState.springActive = false;
    
    this.powerupSelectionActive = false;
    this.powerupChoices = [];
    this.scoreUntilPowerup = this.POWERUP_SCORE_INTERVAL;
    this.lastPowerupScore = 0;
    this.powerupReady = false;
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
    // Apply slow motion time scale
    const effectiveDt = dt * this.powerupState.timeScale;
    
    switch (this.currentState) {
      case State.IDLE:
        break;

      case State.PLAYING:
        // Power-up selection takes priority
        if (this.powerupSelectionActive) {
          // Game is paused during selection, don't update physics
          return;
        }
        
        this.updatePowerupTimers(effectiveDt);
        this.updateCharge(effectiveDt);
        this.updateJump();
        this.updatePhysics(effectiveDt);
        this.updateGroundedRide();
        this.updateWallBounce();
        this.updatePlatformCollision();
        this.updateCamera();
        this.updateScore();
        this.platformManager.update(
          this.cameraY,
          this.difficulty,
          effectiveDt,
          this.score,
        );
        this.particles.update(effectiveDt);
        this.updateDeathCheck();
        break;

      case State.DEAD:
        break;
    }
  }

  // Builds charge while input held and frog is grounded
  updateCharge(dt) {
    // Spring Shoes: Auto max charge
    if (this.powerupState.springActive && this.frog.grounded) {
      this.frog.charge = Physics.JUMP_POWER_MAX;
      return;
    }
    
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

    // Double Jump: Allow jump in air if enabled and available
    if (!this.frog.grounded) {
      if (this.powerupState.doubleJumpEnabled && this.powerupState.doubleJumpAvailable) {
        const t = this.frog.charge / Physics.JUMP_POWER_MAX;
        let power =
          Physics.JUMP_POWER_MIN +
          t * (Physics.JUMP_POWER_MAX - Physics.JUMP_POWER_MIN);
        
        // Apply Mega Jump multiplier
        if (this.powerupState.megaJumpActive) {
          power *= this.powerupState.jumpMultiplier;
        }
        
        this.frog.vy = -power;
        this.frog.charge = 0;
        this.powerupState.doubleJumpAvailable = false; // Consumed
        
        this.particles.spawnJump(this.frog.x, this.frog.y + Physics.FROG_H / 2);
        console.log("Double Jump! power=" + Math.round(power));
        return;
      }
      return; // Can't jump in air
    }

    // Normal ground jump
    const t = this.frog.charge / Physics.JUMP_POWER_MAX;
    let power =
      Physics.JUMP_POWER_MIN +
      t * (Physics.JUMP_POWER_MAX - Physics.JUMP_POWER_MIN);
    
    // Apply Mega Jump multiplier
    if (this.powerupState.megaJumpActive) {
      power *= this.powerupState.jumpMultiplier;
    }

    this.frog.vy = -power;
    this.frog.grounded = false;
    this.frog.charge = 0;

    // Apply velocity boost when jumping from moving platform
    const platform = this.frog.currentPlatform;
    if (platform) {
      this.frog.vx = platform.vx * Physics.FROG_VELOCITY_BOOST;
    }

    this.frog.currentPlatform = null;

    // Dust puff downward on jump
    this.particles.spawnJump(this.frog.x, this.frog.y + Physics.FROG_H / 2);

    console.log(
      "Jump! power=" + Math.round(power) + " vx=" + Math.round(this.frog.vx),
    );
  }

  // Gravity + velocity -> position
  updatePhysics(dt) {
    if (!this.frog.grounded) {
      this.frog.vy += Physics.GRAVITY * dt;
      // Air drag bleeds off horizontal velocity while airborne
      this.frog.vx *= Math.max(0, 1 - Physics.AIR_DRAG * dt);
    }
    this.frog.x += this.frog.vx * dt;
    this.frog.y += this.frog.vy * dt;
  }

  // Wall bounce — frog bounces off screen edges instead of wrapping
  updateWallBounce() {
    const hw = Physics.FROG_W / 2;
    const leftEdge = 0;
    const rightEdge = this.width;

    if (this.frog.grounded) {
      // Grounded: Hard clamp to screen bounds (can't walk off edge)
      if (this.frog.x - hw < leftEdge) {
        this.frog.x = leftEdge + hw;
        this.frog.vx = 0;
      }
      if (this.frog.x + hw > rightEdge) {
        this.frog.x = rightEdge - hw;
        this.frog.vx = 0;
      }
    } else {
      // Airborne: Bounce with velocity reversal and damping
      if (this.frog.x - hw < leftEdge) {
        this.frog.x = leftEdge + hw;
        this.frog.vx = Math.abs(this.frog.vx) * Physics.WALL_BOUNCE_DAMPING;
      }
      if (this.frog.x + hw > rightEdge) {
        this.frog.x = rightEdge - hw;
        this.frog.vx = -Math.abs(this.frog.vx) * Physics.WALL_BOUNCE_DAMPING;
      }
    }
  }

  // Check if frog landed on a platform this frame
  updatePlatformCollision() {
    // Ghost Mode: Pass through platforms
    if (this.powerupState.ghostActive) {
      return;
    }
    
    const platform = this.platformManager.collide(
      this.frog,
      this.powerupState.platformWidthBonus
    );
    if (!platform) return;

    const wasAirborne = !this.frog.grounded;

    this.frog.currentPlatform = platform;
    this.frog.grounded = true;
    this.frog.vy = 0;
    this.frog.charge = 0;
    this.frog.y = platform.top - Physics.FROG_H / 2;
    this.frog.vx = platform.vx; // Match platform speed (boost happens on jump)

    // Only trigger landing events if we were actually airborne
    // (prevents triggering on grounded platform ride)
    if (wasAirborne) {
      // Splash burst + frog squash animation
      this.particles.spawnLand(this.frog.x, platform.top);
      this.frogRenderer.triggerLanding();
      
      // Reset double jump on landing
      if (this.powerupState.doubleJumpEnabled) {
        this.powerupState.doubleJumpAvailable = true;
      }
      
      // Show power-up selection if ready AND not already showing
      if (this.powerupReady && !this.powerupSelectionActive) {
        this.powerupReady = false;
        this.showPowerupSelection();
      }
    }
  }

  // Every frame the frog is grounded, keep it locked to its platform
  updateGroundedRide() {
    if (!this.frog.grounded) return;
    const p = this.frog.currentPlatform;
    if (!p) return;

    // Check frog is still horizontally over the platform
    const frogLeft = this.frog.x - Physics.FROG_W / 2;
    const frogRight = this.frog.x + Physics.FROG_W / 2;
    const stillOn = frogRight > p.x + 4 && frogLeft < p.right - 4;

    if (stillOn) {
      // Ride the platform — snap y and match velocity every frame
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
      this.difficulty = Math.floor(this.score / 5);

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
      }
      
      // Power-up trigger: Set flag when reaching threshold, show on next landing
      // Only set flag if not already ready and not currently showing selection
      if (this.score >= this.scoreUntilPowerup && 
          !this.powerupReady && 
          !this.powerupSelectionActive) {
        this.powerupReady = true;
        console.log(`Power-up ready! Will show on next landing (score: ${this.score})`);
      }
    }
  }

  // Death: frog fell below the bottom of the camera view
  updateDeathCheck() {
    if (this.frog.y - Physics.FROG_H / 2 > this.cameraY + this.height) {
      // Shield: Survive one fall
      if (this.powerupState.shieldActive) {
        console.log("Shield absorbed death!");
        this.powerupState.shieldActive = false;
        
        // Find a safe platform to spawn on (visible on screen)
        const visiblePlatforms = this.platformManager.platforms.filter(p => {
          const screenY = p.y - this.cameraY;
          return screenY > 100 && screenY < this.height - 100; // Platforms in middle of screen
        });
        
        if (visiblePlatforms.length > 0) {
          // Spawn on a random visible platform
          const platform = visiblePlatforms[Math.floor(Math.random() * visiblePlatforms.length)];
          this.frog.y = platform.top - Physics.FROG_H / 2;
          this.frog.x = platform.x + platform.width / 2; // Center of platform
          this.frog.vy = 0;
          this.frog.vx = platform.vx; // Match platform speed
          this.frog.grounded = true;
          this.frog.currentPlatform = platform;
          
          // Visual feedback
          this.particles.spawnLand(this.frog.x, platform.top);
        } else {
          // No visible platforms, spawn in middle of screen and hope for the best
          this.frog.y = this.cameraY + this.height * 0.5;
          this.frog.x = this.width / 2;
          this.frog.vy = 0;
          this.frog.vx = 0;
          this.frog.grounded = false;
        }
        
        // Remove shield timer
        delete this.powerupState.timers['shield'];
        
        // Visual feedback
        this.particles.spawnLand(this.frog.x, this.frog.y);
        return;
      }
      
      this.setState(State.DEAD);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  POWER-UP SYSTEM
  // ─────────────────────────────────────────────────────────
  
  updatePowerupTimers(dt) {
    // Update all active power-up timers
    for (const [id, timeLeft] of Object.entries(this.powerupState.timers)) {
      if (timeLeft <= 0) continue;
      
      this.powerupState.timers[id] -= dt;
      
      // Timer expired, remove power-up
      if (this.powerupState.timers[id] <= 0) {
        const powerup = getPowerupById(id);
        if (powerup && powerup.remove) {
          powerup.remove(this);
          console.log(`Power-up expired: ${powerup.name}`);
        }
        delete this.powerupState.timers[id];
      }
    }
  }
  
  showPowerupSelection() {
    // Get currently active power-up IDs to exclude
    const activeIds = Object.keys(this.powerupState.timers);
    
    // Get 3 random power-ups
    this.powerupChoices = getRandomPowerups(activeIds);
    
    if (this.powerupChoices.length === 0) {
      // No power-ups available (all active)
      this.scoreUntilPowerup = this.score + this.POWERUP_SCORE_INTERVAL;
      this.powerupReady = false;  // Clear the flag
      return;
    }
    
    this.powerupSelectionActive = true;
    this.powerupHoveredIndex = -1;
    
    // Clear all input state to prevent jump on resume
    this.input.held = false;
    this.input.released = false;
    this.frog.charge = 0;
    
    console.log("Power-up selection shown at score:", this.score, "- Choices:", this.powerupChoices.map(p => p.name));
  }
  
  selectPowerup(index) {
    if (index < 0 || index >= this.powerupChoices.length) return;
    
    const powerup = this.powerupChoices[index];
    
    // Apply power-up
    if (powerup.apply) {
      powerup.apply(this);
      console.log(`Power-up selected: ${powerup.name}`);
    }
    
    // Start timer if duration-based
    if (powerup.duration !== null) {
      this.powerupState.timers[powerup.id] = powerup.duration;
    }
    
    // Close selection and set next threshold
    this.powerupSelectionActive = false;
    this.powerupChoices = [];
    this.lastPowerupScore = this.score;
    this.scoreUntilPowerup = this.score + this.POWERUP_SCORE_INTERVAL;
    
    // CRITICAL: Clear input state and ignore next release
    this.input.held = false;
    this.input.released = false;
    this.frog.charge = 0;
    this.ignoreNextRelease = true;  // Ignore the pointerup from clicking power-up
    
    console.log(`Next power-up at score: ${this.scoreUntilPowerup}`);
  }

  // ─────────────────────────────────────────────────────────
  //  DRAW
  // ─────────────────────────────────────────────────────────

  draw() {
    const { ctx, width, height, cameraY } = this;

    ctx.clearRect(0, 0, width, height);

    // Background (always drawn, even on overlays) - pass score for level system
    this.bgRenderer.draw(ctx, cameraY, this.score);

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
    // Draw the game world first so it shows behind the overlay
    this.drawGame();
    this.ui.drawIdle(this.ctx);
  }

  drawGame() {
    const { ctx, frog, cameraY } = this;

    // Platforms - pass score for level-based textures
    for (const p of this.platformManager.platforms) {
      const screenY = p.y - cameraY;
      if (screenY > this.height + 20 || screenY < -20) continue;
      this.platformRenderer.draw(ctx, p, screenY, this.score);
    }

    // Particles (behind frog)
    this.particles.draw(ctx, cameraY);

    // Frog
    this.frogRenderer.draw(ctx, frog, cameraY);

    // HUD — only show score during active play, not on idle/dead overlays
    if (this.currentState === State.PLAYING) {
      const level = getCurrentLevel(this.score);
      this.ui.drawLevelProgress(ctx, this.score);
      this.ui.drawScore(ctx, this.score, this.bestScore, level.name);
      this.ui.drawChargeBar(ctx, frog, cameraY, Physics.JUMP_POWER_MAX);
      
      // Active power-ups indicator (top-left)
      const activePowerups = [];
      for (const [id, timeLeft] of Object.entries(this.powerupState.timers)) {
        const powerup = getPowerupById(id);
        if (powerup) {
          activePowerups.push({ powerup, timeLeft });
        }
      }
      this.powerupRenderer.drawActivePowerups(ctx, activePowerups);
      
      // Power-up selection overlay (pauses game)
      if (this.powerupSelectionActive) {
        this.powerupRenderer.drawSelection(
          ctx,
          this.powerupChoices,
          this.powerupHoveredIndex
        );
      }
    }
  }

  drawDeadScreen() {
    // Keep the game world visible underneath
    this.drawGame();
    this.ui.drawDead(this.ctx, this.score, this.bestScore);
  }

  // ─────────────────────────────────────────────────────────
  //  DEBUG STATS
  // ─────────────────────────────────────────────────────────

  getDebugStats() {
    const p = this.frog.currentPlatform;
    return {
      state: this.currentState,
      fps: this.fps,
      targetFps: FPS.TARGET,
      score: this.score,
      bestScore: this.bestScore,
      difficulty: this.difficulty,
      cameraY: this.cameraY,
      platformCount: this.platformManager.platforms.length,

      frog: {
        x: this.frog.x,
        y: this.frog.y,
        vx: this.frog.vx,
        vy: this.frog.vy,
        grounded: this.frog.grounded,
        charge: this.frog.charge,
      },

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
      
      // Handle power-up selection clicks
      if (this.powerupSelectionActive) {
        this.handlePowerupClick(e);
        return;
      }
      
      this.onInputStart();
    });
    
    this.canvas.addEventListener("pointermove", (e) => {
      // Handle power-up hover
      if (this.powerupSelectionActive) {
        this.handlePowerupHover(e);
      }
    });
    this.canvas.addEventListener("pointerup", (e) => {
      e.preventDefault();
      
      // Block input during power-up selection
      if (this.powerupSelectionActive) {
        return;
      }
      
      this.onInputEnd();
    });

    // Disable right-click context menu on canvas
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Also disable on entire document to prevent any right-click menus
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  onInputStart() {
    // Block input during power-up selection
    if (this.powerupSelectionActive) {
      return;
    }
    
    if (this.currentState === State.IDLE) {
      this.setState(State.PLAYING);
      this.init();
      // Explicitly clear all input state to prevent charge from building
      this.frog.charge = 0;
      this.input.held = false;
      this.input.released = false;
      this.ignoreNextRelease = true;
      return;
    }
    if (this.currentState === State.DEAD) {
      this.setState(State.IDLE);
      return;
    }
    this.input.held = true;
  }

  onInputEnd() {
    // Block input during power-up selection
    if (this.powerupSelectionActive) {
      return;
    }
    
    if (this.currentState !== State.PLAYING) return;

    // Ignore the release if it's from the press that started the game
    if (this.ignoreNextRelease) {
      this.ignoreNextRelease = false;
      // Defensively clear all input state
      this.input.held = false;
      this.input.released = false;
      this.frog.charge = 0;
      return;
    }

    this.input.held = false;
    this.input.released = true;
  }
  
  // ─────────────────────────────────────────────────────────
  //  POWER-UP INTERACTION
  // ─────────────────────────────────────────────────────────
  
  handlePowerupClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Calculate card positions (MUST match powerupRenderer)
    const cardWidth = 110;
    const cardHeight = 130;
    const spacing = 15;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = (this.width - totalWidth) / 2;
    const startY = 110;
    
    for (let i = 0; i < this.powerupChoices.length; i++) {
      const cardX = startX + i * (cardWidth + spacing);
      const cardY = startY;
      
      if (x >= cardX && x <= cardX + cardWidth &&
          y >= cardY && y <= cardY + cardHeight) {
        this.selectPowerup(i);
        return;
      }
    }
  }
  
  handlePowerupHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Calculate card positions (MUST match powerupRenderer)
    const cardWidth = 110;
    const cardHeight = 130;
    const spacing = 15;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = (this.width - totalWidth) / 2;
    const startY = 110;
    
    let hoveredIndex = -1;
    for (let i = 0; i < this.powerupChoices.length; i++) {
      const cardX = startX + i * (cardWidth + spacing);
      const cardY = startY;
      
      if (x >= cardX && x <= cardX + cardWidth &&
          y >= cardY && y <= cardY + cardHeight) {
        hoveredIndex = i;
        break;
      }
    }
    
    this.powerupHoveredIndex = hoveredIndex;
  }
}