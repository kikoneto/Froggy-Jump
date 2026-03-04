import * as spine from "@esotericsoftware/spine-webgl";
import { Physics, Size } from "../variables.js";

// ── Why ATTACHMENT_Y_OFFSET = -22 ──
// frogRenderer draws the sprite centered on (frog.x, frog.y - cameraY).
// All Spine attachments have y:32 in Character.json — the sprite center
// is 32 units ABOVE the skeleton bone origin in Spine's Y-up space.
// ATTACHMENT_Y_OFFSET = -22 shifts the skeleton down so its origin
// aligns with frog.y, matching frogRenderer exactly.
const ATTACHMENT_Y_OFFSET = -22;

const SPINE_CONFIG = {
  scale: 1.2,
  offsetX: 0,
  offsetY: ATTACHMENT_Y_OFFSET,
  mix: 0.2,
  animations: {
    idle: "idle",
    prep: "prep",
    charge: "charge",
    jump: "jumpLoop",
    land: "land",
  },
};

const ASSET_BASE = "../../assets/character/";

export class SpineRenderer {
  constructor() {
    this.ready = false;
    this.canvas = null; // offscreen WebGL canvas — blitted onto gameCanvas each frame
    this.skeleton = null;
    this.animState = null;
    this.renderer = null;
    this.gl = null;
    this.currentAnim = "";
    this._landingTimer = 0;
    this._barSlotIndex = -1;
  }

  // Takes logical width/height instead of a DOM canvas element.
  // Creates its own offscreen canvas — never touches the DOM.
  async load(width, height) {
    try {
      console.log("Spine load started");

      // Offscreen canvas — completely independent of CSS/media queries
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      this.canvas = offscreen;

      const gl = offscreen.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
      });
      if (!gl) throw new Error("WebGL not supported");
      this.gl = gl;

      this.renderer = new spine.SceneRenderer(offscreen, gl, true);
      this.renderer.skeletonRenderer.premultipliedAlpha = true;

      const [atlasText, jsonData] = await Promise.all([
        fetch(ASSET_BASE + "Character.atlas").then((r) => r.text()),
        fetch(ASSET_BASE + "Character.json").then((r) => r.json()),
      ]);

      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Failed to load Character.png"));
        i.src = ASSET_BASE + "Character.png";
      });

      const textureAtlas = new spine.TextureAtlas(atlasText);
      for (const page of textureAtlas.pages) {
        page.setTexture(new spine.GLTexture(gl, img, false));
      }

      const atlasLoader = new spine.AtlasAttachmentLoader(textureAtlas);
      const skeletonJson = new spine.SkeletonJson(atlasLoader);
      skeletonJson.scale = 1;
      const skeletonData = skeletonJson.readSkeletonData(jsonData);

      this.skeleton = new spine.Skeleton(skeletonData);
      this.skeleton.setSkinByName("default");
      this.skeleton.setToSetupPose();

      // Cache bar slot index and pre-attach so it's ready from frame 1
      this._barSlotIndex = skeletonData.slots.findIndex(
        (s) => s.name === "bar",
      );
      if (this._barSlotIndex >= 0) {
        const barAtt = skeletonData.defaultSkin.getAttachment(
          this._barSlotIndex,
          "bar_",
        );
        if (barAtt)
          this.skeleton.slots[this._barSlotIndex].setAttachment(barAtt);
        this.skeleton.slots[this._barSlotIndex].color.a = 0;
      }

      const stateData = new spine.AnimationStateData(skeletonData);
      stateData.defaultMix = SPINE_CONFIG.mix;
      stateData.setMix("jumpLoop", "land", 0.05);
      stateData.setMix("land", "idle", 0.1);
      stateData.setMix("prep", "charge", 0.1);
      stateData.setMix("charge", "jumpLoop", 0.05);

      this.animState = new spine.AnimationState(stateData);
      this.animState.setAnimation(0, SPINE_CONFIG.animations.idle, true);
      this.currentAnim = SPINE_CONFIG.animations.idle;

      this.animState.update(0);
      this.animState.apply(this.skeleton);
      this.skeleton.updateWorldTransform(spine.Physics.update);

      this._updateCamera();
      this.ready = true;
      console.log(
        "Spine ready. Animations:",
        skeletonData.animations.map((a) => a.name),
      );
    } catch (err) {
      console.warn("Spine failed:", err);
    }
  }

  _updateCamera() {
    const cam = this.renderer.camera;
    cam.position.x = Size.LOGICAL_WIDTH / 2;
    cam.position.y = Size.LOGICAL_HEIGHT / 2;
    cam.viewportWidth = Size.LOGICAL_WIDTH;
    cam.viewportHeight = Size.LOGICAL_HEIGHT;
    cam.update();
  }

  triggerLanding() {
    this._landingTimer = 8;
  }

  setAnimation(name, loop = true) {
    if (!this.ready || this.currentAnim === name) return;
    if (this.skeleton.data.findAnimation(name)) {
      this.animState.setAnimation(0, name, loop);
      this.currentAnim = name;
    }
  }

  _resolveAnimation(frog) {
    if (this._landingTimer > 0) return SPINE_CONFIG.animations.land;
    if (!frog.grounded) return SPINE_CONFIG.animations.jump;
    if (frog.charge > 0) {
      const t = frog.charge / Physics.JUMP_POWER_MAX;
      return t < 0.3
        ? SPINE_CONFIG.animations.prep
        : SPINE_CONFIG.animations.charge;
    }
    return SPINE_CONFIG.animations.idle;
  }

  update(dt) {
    if (!this.ready) return;
    if (this._landingTimer > 0) this._landingTimer--;
    this.animState.update(dt);
    this.animState.apply(this.skeleton);
    this.skeleton.update(dt);
  }

  // Renders to the offscreen canvas. Caller blits this.canvas onto gameCanvas.
  // Returns false if not ready (caller falls back to frogRenderer).
  draw(ctx, frog, cameraY) {
    if (!this.ready) return false;

    this.setAnimation(this._resolveAnimation(frog));

    const gl = this.gl;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ── Position — derived directly from frogRenderer ──
    // frogRenderer: ctx.translate(frog.x, frog.y - cameraY), sprite at -w/2,-h/2
    // → sprite center = (frog.x, frog.y - cameraY) in 2D canvas space (Y-down)
    // Spine WebGL is Y-up so we flip: spineY = LOGICAL_HEIGHT - (frog.y - cameraY)
    // offsetY = ATTACHMENT_Y_OFFSET (-32) aligns attachment center with bone origin
    const screenX = frog.x + SPINE_CONFIG.offsetX;
    const screenY =
      Size.LOGICAL_HEIGHT - (frog.y - cameraY) + SPINE_CONFIG.offsetY;

    this.skeleton.x = screenX;
    this.skeleton.y = screenY;
    this.skeleton.scaleX = (frog.vx < 0 ? -1 : 1) * SPINE_CONFIG.scale;
    this.skeleton.scaleY = SPINE_CONFIG.scale;

    this.skeleton.updateWorldTransform(spine.Physics.update);
    this._updateCamera();

    this.renderer.begin();
    this.renderer.drawSkeleton(this.skeleton, true);
    this.renderer.end();

    return true;
  }
}
