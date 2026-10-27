/*
 * Emplacements médias.
 * Chaque `.media[data-media]` reçoit soit le vrai fichier déclaré dans config.js,
 * soit un bloc étiqueté dessiné dans un <canvas> (motif monochrome propre à l'univers).
 * Les blocs "vidéo" sont animés (timecode, mouvement lent) pour servir de textures vivantes.
 */

const SITE = window.SITE;
const animated = new Set();
const all = new Set();
const visibleSections = new WeakSet();
let io;
let lastDraw = 0;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolvePath(key) {
  if (!key) return null;
  return key.split(".").reduce((o, k) => (o == null ? null : o[k]), SITE.media);
}

function ratioOf(str) {
  const [w, h] = (str || "16:9").split(":").map(Number);
  return w / h;
}

/* ─── Motifs ─── */

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = ((pa >> 16) & 255) + ((((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = ((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = (pa & 255) + (((pb & 255) - (pa & 255)) * t);
  return `rgb(${r | 0},${g | 0},${bl | 0})`;
}

function drawYacht(ctx, w, h, t, c) {
  const hz = h * 0.56;
  let g = ctx.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, c.a); g.addColorStop(1, lerpColor(c.a, c.fg, 0.22));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz);
  // soleil bas, voilé
  const sx = w * 0.68, sy = hz - h * 0.04;
  g = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.5);
  g.addColorStop(0, lerpColor(c.a, c.fg, 0.5)); g.addColorStop(0.15, lerpColor(c.a, c.fg, 0.18)); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz);
  // mer
  g = ctx.createLinearGradient(0, hz, 0, h);
  g.addColorStop(0, lerpColor(c.a, c.fg, 0.12)); g.addColorStop(1, c.a);
  ctx.fillStyle = g; ctx.fillRect(0, hz, w, h - hz);
  // reflets
  ctx.strokeStyle = lerpColor(c.a, c.fg, 0.32);
  for (let i = 0; i < 26; i++) {
    const p = i / 26, y = hz + Math.pow(p, 1.7) * (h - hz);
    const len = (w * 0.05 + p * w * 0.22) * (0.6 + 0.4 * Math.sin(t * 0.9 + i * 1.7));
    const x = sx + Math.sin(t * 0.6 + i * 2.3) * w * 0.06 * p - len / 2;
    ctx.globalAlpha = 0.5 * (1 - p * 0.6);
    ctx.lineWidth = 1 + p * 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // coque
  const bob = Math.sin(t * 1.1) * h * 0.006;
  const bx = w * 0.3 + Math.sin(t * 0.15) * w * 0.02, by = hz + h * 0.02 + bob, bw = w * 0.26;
  ctx.fillStyle = lerpColor(c.a, "#000000", 0.55);
  ctx.beginPath();
  ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by - h * 0.004); ctx.lineTo(bx + bw * 0.93, by + h * 0.035); ctx.lineTo(bx + bw * 0.08, by + h * 0.035); ctx.closePath(); ctx.fill();
  ctx.fillRect(bx + bw * 0.22, by - h * 0.03, bw * 0.48, h * 0.03);
  ctx.fillRect(bx + bw * 0.34, by - h * 0.052, bw * 0.24, h * 0.022);
  ctx.fillStyle = lerpColor(c.a, c.fg, 0.4);
  ctx.fillRect(bx + bw * 0.25, by - h * 0.018, bw * 0.42, 1.5);
}

function drawAuto(ctx, w, h, t, c) {
  const vx = w * 0.5, vy = h * 0.42;
  let g = ctx.createLinearGradient(0, 0, 0, vy);
  g.addColorStop(0, c.a); g.addColorStop(1, lerpColor(c.a, c.fg, 0.14));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, vy);
  ctx.fillStyle = lerpColor(c.a, "#000000", 0.35); ctx.fillRect(0, vy, w, h - vy);
  // route
  ctx.fillStyle = lerpColor(c.a, c.fg, 0.06);
  ctx.beginPath(); ctx.moveTo(vx - 4, vy); ctx.lineTo(vx + 4, vy); ctx.lineTo(w * 1.05, h); ctx.lineTo(-w * 0.05, h); ctx.closePath(); ctx.fill();
  // tirets qui avancent
  ctx.fillStyle = lerpColor(c.a, c.fg, 0.55);
  for (let i = 0; i < 9; i++) {
    const p = ((i / 9) + t * 0.22) % 1, q = Math.pow(p, 2.2);
    const y0 = vy + q * (h - vy), y1 = vy + Math.pow(Math.min(p + 0.045, 1), 2.2) * (h - vy);
    const hw = 0.6 + q * w * 0.006;
    ctx.globalAlpha = Math.min(1, p * 3);
    ctx.fillRect(vx - hw, y0, hw * 2, y1 - y0);
  }
  ctx.globalAlpha = 1;
  // traînées lumineuses
  for (let i = 0; i < 5; i++) {
    const p = ((i / 5) + t * 0.35) % 1, q = Math.pow(p, 2);
    const side = i % 2 ? 1 : -1;
    const x = vx + side * q * w * 0.62, y = vy + q * (h - vy) * 0.9;
    ctx.strokeStyle = lerpColor(c.a, c.fg, 0.7); ctx.globalAlpha = 0.6 * p; ctx.lineWidth = 1 + q * 3;
    ctx.beginPath(); ctx.moveTo(vx + side * q * w * 0.5, vy + q * (h - vy) * 0.72); ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  g = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.35);
  g.addColorStop(0, lerpColor(c.a, c.fg, 0.28)); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function drawAviation(ctx, w, h, t, c) {
  // ciel au-dessus des nuages, horizon sur le sillage (36 % du bas)
  const hz = h * 0.64;
  let g = ctx.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, lerpColor(c.a, "#000000", 0.2)); g.addColorStop(1, lerpColor(c.a, c.fg, 0.2));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz);
  g = ctx.createLinearGradient(0, hz, 0, h);
  g.addColorStop(0, lerpColor(c.a, c.fg, 0.12)); g.addColorStop(1, lerpColor(c.a, "#000000", 0.3));
  ctx.fillStyle = g; ctx.fillRect(0, hz, w, h - hz);
  // mer de nuages qui défile lentement
  ctx.fillStyle = lerpColor(c.a, c.fg, 0.16);
  for (let i = 0; i < 7; i++) {
    const x = (((i / 7) - t * 0.012) % 1 + 1) % 1;
    ctx.beginPath(); ctx.ellipse(w * (x * 1.3 - 0.15), hz + h * 0.04, w * 0.16, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
  }
  // le jet traverse de gauche à droite, sa traînée derrière lui
  const p = (t * 0.045) % 1, x = w * (-0.1 + p * 1.2), y = h * (0.36 - p * 0.06), s = Math.min(w, h) * 0.05;
  g = ctx.createLinearGradient(x - w * 0.5, y, x, y);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, lerpColor(c.a, c.fg, 0.75));
  ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, s * 0.06);
  ctx.beginPath(); ctx.moveTo(x - w * 0.5, y + w * 0.5 * 0.05); ctx.lineTo(x - s * 0.9, y); ctx.stroke();
  ctx.fillStyle = lerpColor(c.a, c.fg, 0.85);
  ctx.beginPath();
  ctx.moveTo(x + s, y); ctx.lineTo(x - s * 0.9, y - s * 0.08); ctx.lineTo(x - s * 0.9, y + s * 0.08); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.1, y); ctx.lineTo(x - s * 0.35, y + s * 0.55); ctx.lineTo(x - s * 0.5, y + s * 0.55); ctx.lineTo(x - s * 0.25, y); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y); ctx.lineTo(x - s * 0.95, y - s * 0.32); ctx.lineTo(x - s * 1.02, y - s * 0.32); ctx.lineTo(x - s * 0.88, y); ctx.closePath(); ctx.fill();
}

function drawNeutral(ctx, w, h, t, c) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  g.addColorStop(0, lerpColor(c.a, c.fg, 0.16)); g.addColorStop(1, c.a);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // silhouette de portrait ou forme abstraite
  ctx.fillStyle = lerpColor(c.a, "#000000", 0.35);
  if (h > w) {
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.4, w * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.95, w * 0.38, h * 0.3, 0, Math.PI, 0); ctx.fill();
  } else {
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(w * (0.5 + Math.sin(t * 0.3) * 0.05), h * 0.5, h * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

const MOTIFS = { yacht: drawYacht, auto: drawAuto, aviation: drawAviation, neutral: drawNeutral };

function timecode(t) {
  const f = Math.floor(t * 24);
  const ff = f % 24, s = Math.floor(f / 24) % 60, m = Math.floor(f / 1440) % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `00:${p(m)}:${p(s)}:${p(ff)}`;
}

function drawPlaceholder(slot, t) {
  const { canvas, ctx, kind, label, ratio, type, seed } = slot;
  const w = canvas.width, h = canvas.height;
  const fg = cssVar("--fg") || "#ede9e3";
  const c = { a: lerpColor(cssVar("--ph-a") || "#1c1a17", cssVar("--ph-b") || "#3a3631", 0.45), fg };
  const tt = t + seed;
  ctx.save();
  (MOTIFS[kind] || drawNeutral)(ctx, w, h, type === "video" ? tt : seed, c);
  ctx.restore();

  const s = Math.max(0.6, w / (slot.dispW || w));
  const pad = 18 * s;

  // étiquettes, gardées hors des zones du menu et des légendes
  const yTop = Math.max(pad + 22 * s, h * 0.14);
  const yBot = Math.min(h - pad - 10 * s, h * 0.84);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${13 * s}px "Hanken Grotesk", sans-serif`;
  ctx.letterSpacing = `${2.6 * s}px`;
  ctx.fillText(label.toUpperCase(), pad + 10 * s, yBot - 16 * s);
  ctx.font = `400 ${10 * s}px "Hanken Grotesk", sans-serif`;
  ctx.letterSpacing = `${2 * s}px`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(`${ratio} · ${type === "video" ? "VIDEO" : "PHOTO"} · CONFIG.JS`, pad + 10 * s, yBot);
  if (type === "video") {
    const tc = timecode(tt);
    ctx.font = `500 ${10 * s}px "Hanken Grotesk", sans-serif`;
    const tw = ctx.measureText(tc).width;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(tc, w - pad - 10 * s - tw, yTop);
    ctx.fillStyle = Math.floor(tt * 1.2) % 2 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(pad + 16 * s, yTop - 4 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("REC", pad + 26 * s, yTop);
  }
  ctx.letterSpacing = "0px";
  slot.version++;
}

/* ─── Grilles composées depuis config.js ─── */

const CAT_LABEL = { yacht: "Yacht", auto: "Auto", aviation: "Aviation" };
const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const isPortrait = (ratio) => ratioOf(ratio) < 1;
const arCss = (ratio) => (ratio || "16:9").replace(":", " / ");

/**
 * Les films sont posés deux par deux sur 12 colonnes, en alternant les côtés.
 * Le second de chaque paire descend d'un cran : rythme éditorial, mais toujours aligné sur la grille.
 */
function filmPlacement(items) {
  const P = {
    LP: [["1 / span 8", "10 / span 3"], ["5 / span 8", "1 / span 3"]],
    PL: [["1 / span 3", "5 / span 8"], ["10 / span 3", "1 / span 8"]],
    LL: [["1 / span 7", "8 / span 5"], ["1 / span 5", "6 / span 7"]],
    PP: [["2 / span 4", "8 / span 4"], ["3 / span 4", "9 / span 4"]],
  };
  const out = [];
  for (let i = 0, row = 1; i < items.length; i += 2, row++) {
    const a = items[i], b = items[i + 1];
    const ka = isPortrait(a.ratio) ? "P" : "L";
    if (!b) { out.push({ col: ka === "P" ? "5 / span 4" : "2 / span 10", row, drop: false }); continue; }
    const kb = isPortrait(b.ratio) ? "P" : "L";
    const [ca, cb] = P[ka + kb][(row - 1) % 2];
    out.push({ col: ca, row, drop: false }, { col: cb, row, drop: true });
  }
  return out;
}

/** Ajoute le numéro de version (config.js) à l'adresse d'un média local : un fichier remplacé est rechargé. */
const versioned = (src) => (SITE.version && !/^(https?:|data:|blob:)/.test(src) ? `${src}${src.includes("?") ? "&" : "?"}v=${SITE.version}` : src);

export function buildGalleries(root) {
  root.querySelectorAll("[data-films]:not([data-built])").forEach((grid) => {
    const cat = grid.dataset.films;
    const real = (SITE.media[cat] && SITE.media[cat].films) || [];
    const n = Math.max(real.length, SITE.minFilms || 0);
    const items = Array.from({ length: n }, (_, i) => ({ ...(normalize(real[i]) || { ratio: "16:9" }), entry: real[i] }));
    const place = filmPlacement(items);
    grid.innerHTML = items.map((it, i) => {
      const p = place[i];
      const e = it.entry || {};
      return `<a class="card${isPortrait(it.ratio) ? " is-portrait" : ""}${p.drop ? " is-drop" : ""}" href="#" data-cursor="play" data-lightbox style="grid-column:${p.col};grid-row:${p.row}">
          <div class="card__inner"><div class="media" data-media="${cat}.films.${i}" data-role="film" data-type="video" data-kind="${cat}" data-ratio="${it.ratio}" data-label="Video ${CAT_LABEL[cat]} ${pad2(i + 1)}" style="aspect-ratio:${arCss(it.ratio)}"></div></div>
          <div class="card__meta"><b>${esc(e.title || "Project title")}</b><span>${esc(e.meta || "Client · 2026")}</span></div>
        </a>`;
    }).join("");
    grid.dataset.built = "";
    const count = root.querySelector(`[data-films-count="${cat}"]`);
    if (count) count.dataset.count = String(real.length || n);
  });

  root.querySelectorAll("[data-stills]:not([data-built])").forEach((track) => {
    const cat = track.dataset.stills;
    const real = (SITE.media[cat] && SITE.media[cat].stills) || [];
    const n = Math.max(real.length, SITE.minStills || 0);
    // pas de photos pour cet univers : le bloc entier disparaît
    if (!n) { track.closest(".stills")?.remove(); return; }
    track.innerHTML = Array.from({ length: n }, (_, i) => {
      const it = normalize(real[i]) || { ratio: "4:5" };
      return `<a class="card still" href="#" data-cursor="view" data-lightbox>
            <div class="card__inner"><div class="media" data-media="${cat}.stills.${i}" data-type="photo" data-kind="${cat}" data-ratio="${it.ratio}" data-label="Photo ${CAT_LABEL[cat]} ${pad2(i + 1)}" style="aspect-ratio:${arCss(it.ratio)}"></div></div>
            <div class="card__meta"><b>${pad2(i + 1)}</b><span data-i18n="work.photo">Photo</span></div>
          </a>`;
    }).join("");
    track.dataset.built = "";
    const count = root.querySelector(`[data-stills-count="${cat}"]`);
    if (count) count.textContent = `( ${pad2(real.length || n)} )`;
  });
}

/* ─── Création des emplacements ─── */

function normalize(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { src: entry };
  return entry.src ? entry : null;
}

let vio;
function videoObserver() {
  if (vio) return vio;
  vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target._slot && e.target._slot.node;
      if (!v || v.tagName !== "VIDEO") return;
      const s = e.target._slot;
      s.inView = e.isIntersecting;
      // les boucles de fond ne jouent que lorsqu'elles sont visibles ; les films attendent le survol
      if (s.role === "film" && !s.autoInView) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
  }, { rootMargin: "15% 0px" });
  return vio;
}

/** Portraits pas encore fournis (`portraitA` / `portraitB` à null) : leur place disparaît, et le texte prend la largeur. */
function dropMissingPortraits(root) {
  root.querySelectorAll(".portrait").forEach((fig) => {
    const m = fig.querySelector(".media[data-media]");
    if (m && !resolvePath(m.dataset.media)) fig.remove();
  });
  root.querySelectorAll(".c-about__duo").forEach((duo) => {
    if (duo.querySelector(".portrait")) return;
    duo.closest(".c-about__grid")?.classList.add("is-solo");
    duo.remove();
  });
}

export function buildMedia(root = document) {
  buildGalleries(root);
  dropMissingPortraits(root);
  const slots = [];
  const touch = !matchMedia("(hover: hover)").matches;
  root.querySelectorAll(".media[data-media]").forEach((el) => {
    if (el._slot) { slots.push(el._slot); return; }
    const key = el.dataset.media;
    const entry = normalize(resolvePath(key));
    const type = el.dataset.type || "photo";
    const ratio = (entry && entry.ratio) || el.dataset.ratio || (type === "video" ? "16:9" : "4:5");
    const role = el.dataset.role || "loop";
    let slot;
    if (entry) {
      const isVideo = /\.(mp4|webm|mov)$/i.test(entry.src);
      const node = document.createElement(isVideo ? "video" : "img");
      if (isVideo) {
        node.muted = true; node.loop = true; node.playsInline = true;
        node.setAttribute("muted", ""); node.setAttribute("playsinline", ""); node.setAttribute("loop", "");
        node.preload = role === "film" ? "none" : "auto";
        if (entry.poster) node.poster = versioned(entry.poster);
        node.src = versioned(entry.src);
      } else {
        node.alt = el.dataset.alt || el.dataset.label || "";
        node.decoding = "async";
        node.loading = "lazy";
        node.src = versioned(entry.src);
      }
      el.appendChild(node);
      el.classList.add("is-real");
      slot = {
        el, node, source: node, kind: el.dataset.kind, type: isVideo ? "video" : "photo", real: true, version: 0,
        ratio, role, full: entry.full || entry.src, poster: entry.poster || null, autoInView: role === "film" && touch,
      };
      if (isVideo) { el._slot = slot; videoObserver().observe(el); }
    } else {
      const canvas = document.createElement("canvas");
      // le bloc est dessiné au format réel de son emplacement, pour que les repères ne soient pas rognés
      const rect = el.getBoundingClientRect();
      const r = el.dataset.fit === "viewport" ? innerWidth / innerHeight
        : rect.width > 0 && rect.height > 0 ? rect.width / rect.height : ratioOf(ratio);
      const big = el.dataset.res === "hi";
      const base = big ? 1280 : 800;
      canvas.width = r >= 1 ? base : Math.round(base * r);
      canvas.height = r >= 1 ? Math.round(base / r) : base;
      canvas.setAttribute("aria-hidden", "true");
      el.appendChild(canvas);
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", el.dataset.label || "Placeholder");
      slot = {
        el, canvas, source: canvas, ctx: canvas.getContext("2d"),
        kind: el.dataset.kind || "neutral", label: el.dataset.label || key, ratio, type, role,
        seed: (key.length * 7.31 + [...key].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % 40,
        real: false, version: 0, dispW: rect.width || null,
      };
      drawPlaceholder(slot, 0);
      if (type === "video") {
        animated.add(slot);
        const sec = el.closest("section") || el;
        slot.section = sec;
        io && io.observe(sec);
      }
    }
    all.add(slot);
    el._slot = slot;
    slots.push(slot);
  });
  return slots;
}

export function releaseMedia(root) {
  root.querySelectorAll(".media[data-media]").forEach((el) => {
    const s = el._slot;
    if (!s) return;
    animated.delete(s); all.delete(s);
    if (s.node && s.node.tagName === "VIDEO") {
      vio && vio.unobserve(el);
      s.node.pause(); s.node.removeAttribute("src"); s.node.load();
    }
    el._slot = null;
  });
}

/** Lecture d'un film au survol (galerie). */
export function playSlot(slot, on) {
  const v = slot && slot.node;
  if (!v || v.tagName !== "VIDEO") return;
  if (on) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
}

/** Redessine les blocs vidéo visibles à ~24 i/s. */
export function tickMedia(time) {
  if (time - lastDraw < 1 / 24) return;
  lastDraw = time;
  animated.forEach((s) => {
    if (s.section && !visibleSections.has(s.section) && !s.force) return;
    drawPlaceholder(s, time);
  });
}

/** Thème changé : tous les blocs se redessinent avec les nouvelles teintes. */
export function redrawAll(time = 0) {
  all.forEach((s) => { if (!s.real) drawPlaceholder(s, time); });
}

export function initMediaObserver() {
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visibleSections.add(e.target) : visibleSections.delete(e.target)));
  }, { rootMargin: "20% 0px" });
}

/**
 * Copie DOM d'un emplacement : lightbox (`sound` : version complète avec le son)
 * ou fond de transition (même boucle, calée sur le même instant).
 * Renvoie une fonction de nettoyage ; la copie est accessible via `target._clone`.
 */
export function cloneSlot(slot, target, { sound = false } = {}) {
  target.innerHTML = "";
  target.dataset.media = slot.el.dataset.media;
  if (slot.real) {
    let n;
    if (slot.type === "video") {
      n = document.createElement("video");
      n.playsInline = true; n.setAttribute("playsinline", "");
      n.loop = !sound; n.muted = !sound; n.controls = sound;
      if (!sound) n.setAttribute("muted", "");
      if (slot.poster) n.poster = slot.poster;
      n.src = sound ? slot.full : slot.node.currentSrc || slot.node.src;
      if (!sound && slot.node.currentTime) n.currentTime = slot.node.currentTime;
      n.play().catch(() => {});
    } else {
      n = document.createElement("img");
      n.src = slot.node.currentSrc || slot.node.src;
      n.alt = slot.node.alt;
    }
    target.appendChild(n);
    target._clone = n;
    return () => { if (n.tagName === "VIDEO") { n.pause(); n.removeAttribute("src"); n.load(); } };
  }
  const canvas = document.createElement("canvas");
  canvas.width = slot.canvas.width; canvas.height = slot.canvas.height;
  target.appendChild(canvas);
  target._clone = canvas;
  const copy = { ...slot, el: target, canvas, ctx: canvas.getContext("2d"), source: canvas, version: 0, force: true, section: null };
  drawPlaceholder(copy, performance.now() / 1000);
  if (slot.type === "video") animated.add(copy);
  all.add(copy);
  return () => { animated.delete(copy); all.delete(copy); };
}
