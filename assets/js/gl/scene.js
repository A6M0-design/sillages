/*
 * Scène WebGL unique, fixe derrière le DOM.
 * Caméra calée pour qu'1 unité = 1 px à z = 0 : les plans suivent exactement les éléments HTML.
 */
import * as THREE from "three";
import { mediaVert, mediaFrag, liquidVert, liquidFrag } from "./shaders.js?v=27";

const CAM_Z = 1000;

export function glSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

export class GL {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(this.dpr);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 6000);
    this.camera.position.z = CAM_Z;
    this.geo = new THREE.PlaneGeometry(1, 1, 32, 32);
    this.flat = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.planes = new Set();
    this.textures = new Map();
    this.vel = 0;
    this.hero = null;
    this.liquid = null;
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.resize();
  }

  resize() {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.renderer.setSize(this.vw, this.vh, false);
    this.camera.aspect = this.vw / this.vh;
    this.camera.fov = (2 * Math.atan(this.vh / 2 / CAM_Z) * 180) / Math.PI;
    this.camera.updateProjectionMatrix();
    if (this.liquid) {
      this.liquid.mesh.scale.set(this.vw, this.vh, 1);
      this.liquid.u.uPlane.value.set(this.vw, this.vh);
      this.liquid.u.uView.value.set(this.vw, this.vh);
    }
  }

  /* ─── Textures ─── */
  texture(slot) {
    if (!slot) return null;
    let t = this.textures.get(slot.source);
    if (t) return t;
    const src = slot.source;
    if (src.tagName === "VIDEO") t = new THREE.VideoTexture(src);
    else if (src.tagName === "CANVAS") t = new THREE.CanvasTexture(src);
    else {
      t = new THREE.Texture(src);
      if (src.complete) t.needsUpdate = true;
      else src.addEventListener("load", () => (t.needsUpdate = true), { once: true });
    }
    // valeurs brutes : les shaders écrivent directement en sRGB, comme le DOM
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.userData.slot = slot;
    t.userData.v = -1;
    t.userData.refs = 0;
    this.textures.set(src, t);
    return t;
  }

  imgSize(slot) {
    const s = slot && slot.source;
    if (!s) return new THREE.Vector2(16, 9);
    if (s.tagName === "VIDEO") return new THREE.Vector2(s.videoWidth || 16, s.videoHeight || 9);
    if (s.tagName === "IMG") return new THREE.Vector2(s.naturalWidth || 4, s.naturalHeight || 5);
    return new THREE.Vector2(s.width, s.height);
  }

  _retain(t) { if (t) t.userData.refs++; }
  _release(t) {
    if (!t) return;
    t.userData.refs--;
    if (t.userData.refs <= 0) {
      this.textures.delete(t.userData.slot.source);
      t.dispose();
    }
  }

  _mediaMaterial(slot, extra = {}) {
    const tex = this.texture(slot);
    this._retain(tex);
    return new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex },
        uPlane: { value: new THREE.Vector2(1, 1) },
        uImg: { value: this.imgSize(slot) },
        uZoom: { value: 1 },
        uAlpha: { value: 1 },
        uShade: { value: extra.shade ?? 0 },
      },
      vertexShader: mediaVert,
      fragmentShader: mediaFrag,
      transparent: true,
      depthWrite: false,
    });
  }

  /* ─── Plans synchronisés au DOM ─── */
  addPlane(el, slot, opts = {}) {
    const material = this._mediaMaterial(slot, opts);
    const mesh = new THREE.Mesh(this.geo, material);
    mesh.renderOrder = 1;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    const plane = { el, slot, mesh, u: material.uniforms, tex: material.uniforms.uTex.value };
    this.planes.add(plane);
    el._plane = plane;
    return plane;
  }

  removePlanes(root) {
    this.planes.forEach((p) => {
      if (root && !root.contains(p.el)) return;
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
      this._release(p.tex);
      p.el._plane = null;
      this.planes.delete(p);
    });
  }

  _sync(p) {
    const r = p.el.getBoundingClientRect();
    const visible = r.bottom > -200 && r.top < this.vh + 200 && r.width > 0 && r.right > -200 && r.left < this.vw + 200;
    p.mesh.visible = visible;
    if (!visible) return false;
    p.mesh.position.set(r.left + r.width / 2 - this.vw / 2, this.vh / 2 - r.top - r.height / 2, 0);
    p.mesh.scale.set(r.width, r.height, 1);
    p.u.uPlane.value.set(r.width, r.height);
    return true;
  }

  /* ─── Triptyque du hero ─── */
  createHero(el, slots) {
    this.destroyHero();
    const group = new THREE.Group();
    const pivots = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
    const meshes = slots.map((slot, i) => {
      const m = new THREE.Mesh(this.geo, this._mediaMaterial(slot));
      m.renderOrder = 0;
      m.frustumCulled = false;
      pivots[i].add(m);
      group.add(pivots[i]);
      return m;
    });
    this.scene.add(group);
    this.hero = {
      el, group, pivots, meshes,
      state: { fold: 0, dolly: 0, tiltX: 0, tiltY: 0, alpha: 1, spread: 0, zoom: 1 },
    };
    return this.hero;
  }

  destroyHero() {
    if (!this.hero) return;
    this.scene.remove(this.hero.group);
    this.hero.meshes.forEach((m) => { this._release(m.material.uniforms.uTex.value); m.material.dispose(); });
    this.hero = null;
  }

  _syncHero(time) {
    const h = this.hero;
    const r = h.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > this.vh) { h.group.visible = false; return; }
    h.group.visible = true;
    const W = r.width, H = r.height, gap = 1 + h.state.spread;
    const pw = W / 3 - gap;
    const s = h.state;
    const A = Math.PI * 0.56 * s.fold;
    // pivots aux arêtes intérieures
    h.pivots[0].position.set(-W / 6 - gap / 2, 0, 0);
    h.pivots[1].position.set(0, 0, 0);
    h.pivots[2].position.set(W / 6 + gap / 2, 0, 0);
    h.pivots[0].rotation.y = -A;
    h.pivots[2].rotation.y = A;
    h.meshes[0].position.set(-W / 6 + gap / 2, 0, 0);
    h.meshes[1].position.set(0, 0, 0);
    h.meshes[2].position.set(W / 6 - gap / 2, 0, 0);
    h.meshes.forEach((m) => {
      m.scale.set(pw, H, 1);
      m.material.uniforms.uPlane.value.set(pw, H);
      m.material.uniforms.uAlpha.value = s.alpha;
      m.material.uniforms.uZoom.value = s.zoom;
      const src = m.material.uniforms.uTex.value.userData.slot.source;
      if (src.tagName === "VIDEO" && src.videoWidth) m.material.uniforms.uImg.value.set(src.videoWidth, src.videoHeight);
    });
    h.meshes[0].material.uniforms.uShade.value = s.fold * 0.55;
    h.meshes[2].material.uniforms.uShade.value = s.fold * 0.55;
    h.group.position.set(r.left + W / 2 - this.vw / 2, this.vh / 2 - r.top - H / 2, s.dolly);
    h.group.rotation.set(s.tiltX, s.tiltY, 0);
  }

  /* ─── Fond liquide de la liste ─── */
  createLiquid(el, slots) {
    this.destroyLiquid();
    const texs = slots.map((s) => { const t = this.texture(s); this._retain(t); return t; });
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uA: { value: texs[0] }, uB: { value: texs[0] },
        uImgA: { value: this.imgSize(slots[0]) }, uImgB: { value: this.imgSize(slots[0]) },
        uPlane: { value: new THREE.Vector2(this.vw, this.vh) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMix: { value: 1 }, uShow: { value: 0 }, uTime: { value: 0 }, uDim: { value: 0.35 }, uZoom: { value: 0.94 }, uFull: { value: 0 },
        uClip: { value: new THREE.Vector2(0, 0) },
        uDpr: { value: this.dpr },
        uView: { value: new THREE.Vector2(this.vw, this.vh) },
      },
      vertexShader: liquidVert,
      fragmentShader: liquidFrag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(this.flat, material);
    mesh.scale.set(this.vw, this.vh, 1);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.liquid = { el, mesh, u: material.uniforms, texs, slots, current: -1, full: false };
    return this.liquid;
  }

  /** Bascule le fond vers l'univers `i` (ou le masque si i < 0). Renvoie les tweens à animer. */
  liquidTo(i) {
    const L = this.liquid;
    if (!L || i === L.current) return;
    const g = window.gsap;
    if (i < 0) {
      g.to(L.u.uShow, { value: 0, duration: 1.1, ease: "power3.out", overwrite: true });
    } else if (L.u.uShow.value < 0.05 || L.current < 0) {
      L.u.uB.value = L.texs[i]; L.u.uImgB.value = this.imgSize(L.slots[i]);
      L.u.uMix.value = 1;
      g.to(L.u.uShow, { value: 1, duration: 1.4, ease: "expo.out", overwrite: true });
    } else {
      L.u.uA.value = L.u.uB.value; L.u.uImgA.value = L.u.uImgB.value;
      L.u.uB.value = L.texs[i]; L.u.uImgB.value = this.imgSize(L.slots[i]);
      L.u.uMix.value = 0;
      g.to(L.u.uMix, { value: 1, duration: 1.3, ease: "expo.out", overwrite: true });
      g.to(L.u.uShow, { value: 1, duration: 1, ease: "expo.out", overwrite: true });
    }
    L.current = i;
  }

  destroyLiquid() {
    if (!this.liquid) return;
    this.scene.remove(this.liquid.mesh);
    this.liquid.mesh.material.dispose();
    this.liquid.texs.forEach((t) => this._release(t));
    this.liquid = null;
  }

  _syncLiquid(time) {
    const L = this.liquid;
    L.u.uTime.value = time;
    if (L.full) { L.u.uClip.value.set(0, this.vh); L.mesh.visible = true; return; }
    const r = L.el.getBoundingClientRect();
    L.mesh.visible = r.bottom > 0 && r.top < this.vh && L.u.uShow.value > 0.001;
    L.u.uClip.value.set(Math.max(0, r.top), Math.min(this.vh, r.bottom));
  }

  /* ─── Boucle ─── */
  render(time, velocity) {
    this.vel += ((Math.max(-30, Math.min(30, velocity)) || 0) - this.vel) * 0.12;
    // textures canvas à rafraîchir
    this.textures.forEach((t) => {
      const s = t.userData.slot;
      if (s.canvas && t.userData.v !== s.version) { t.needsUpdate = true; t.userData.v = s.version; }
    });
    this.planes.forEach((p) => {
      if (!this._sync(p)) return;
      if (p.slot.source.tagName === "VIDEO" && p.slot.source.videoWidth) p.u.uImg.value.set(p.slot.source.videoWidth, p.slot.source.videoHeight);
    });
    if (this.hero) this._syncHero(time);
    if (this.liquid) this._syncLiquid(time);
    this.renderer.render(this.scene, this.camera);
  }
}
