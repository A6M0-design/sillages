/*
 * Le nom SILLAGES du hero, dessiné lettre par lettre dans un SVG qui couvre tout le hero,
 * avec une « caméra » : au repos, il se pose exactement sur le logo (.hero__mark) ;
 * au scroll, la caméra avance vers le A et passe par son ouverture, comme par une porte.
 * Le nom est chromé ; les chromes viennent du nuancier de la charte (06_SOURCES/board_s_chrome.py).
 */
import { LETTERS } from "./letters.js?v=26";

const NS = "http://www.w3.org/2000/svg";
const VB = { x: 4.14, y: -8.87, w: 614.32, h: 114.22 };
const MID = VB.x + VB.w / 2;
// au milieu de l'ouverture du A, entre ses deux branches
const GATE = { x: 314.7, y: 72, w: 43.2 };

/* Chromes du nuancier (le « chaud » champagne est écarté : jamais de doré). `aplat` : le logo papier de la charte, `blanc` : le logo blanc. */
export const CHROMES = {
  // plus sombre, entre l'ardoise et le chrome sombre de la charte : reflets argent, creux ardoise profonds
  nuit: [[0, "#c8cfd5"], [0.28, "#4e5964"], [0.46, "#e9ecef"], [0.62, "#232a31"], [0.82, "#98a2ab"], [1, "#36404a"]],
  // niveaux du chrome sombre (01_LOGO/LOGO/CHROMES_SOMBRES) : la référence assombrie de 15 à 72 %
  "sombre-15": [[0, "#778087"], [0.28, "#384149"], [0.46, "#adb2b7"], [0.62, "#1c2328"], [0.82, "#858d94"], [1, "#2d353c"]],
  "sombre-30": [[0, "#656c72"], [0.28, "#30383f"], [0.46, "#91969a"], [0.62, "#1a2025"], [0.82, "#70777e"], [1, "#272e35"]],
  "sombre-45": [[0, "#52595e"], [0.28, "#293036"], [0.46, "#757a7e"], [0.62, "#171d21"], [0.82, "#5b6167"], [1, "#22282e"]],
  "sombre-60": [[0, "#40454a"], [0.28, "#22272d"], [0.46, "#595d61"], [0.62, "#15191e"], [0.82, "#464b50"], [1, "#1c2227"]],
  "sombre-72": [[0, "#31353a"], [0.28, "#1c2125"], [0.46, "#42464a"], [0.62, "#13171b"], [0.82, "#353a3e"], [1, "#181d21"]],
  // le chrome sombre de la charte (prévu pour le fond papier)
  sombre: [[0, "#8a939b"], [0.28, "#3f4952"], [0.46, "#c9cfd4"], [0.62, "#1f262c"], [0.82, "#9aa3ab"], [1, "#323b43"]],
  ardoise: [[0, "#eef0f2"], [0.28, "#7f8b97"], [0.46, "#ffffff"], [0.62, "#3e4953"], [0.82, "#c8cfd5"], [1, "#5b6772"]],
  neutre: [[0, "#f6f6f4"], [0.28, "#9aa3ab"], [0.46, "#ffffff"], [0.62, "#5f6a74"], [0.82, "#d4d8db"], [1, "#7d8790"]],
  froid: [[0, "#f1f5f9"], [0.28, "#8a9cae"], [0.46, "#ffffff"], [0.62, "#4a5d71"], [0.82, "#cdd8e2"], [1, "#6c8095"]],
  fort: [[0, "#ffffff"], [0.22, "#6d767e"], [0.4, "#ffffff"], [0.5, "#ffffff"], [0.62, "#262c31"], [0.8, "#e9ebec"], [1, "#4b545c"]],
  miroir: [[0, "#d9dcde"], [0.44, "#ffffff"], [0.5, "#1f2428"], [0.56, "#8b949b"], [1, "#e6e8e9"]],
  // le plus clair : argent brossé, très lisible sur les films (par défaut)
  doux: [[0, "#e4e5e4"], [0.3, "#b9bfc4"], [0.5, "#f3f3f1"], [0.7, "#a2aab0"], [1, "#d3d6d8"]],
  tube: [[0, "#3d454c"], [0.35, "#c9ced2"], [0.5, "#ffffff"], [0.65, "#c9ced2"], [1, "#3d454c"]],
  aplat: null,
  // le logo blanc de la charte (LOGO_DEFINITIF/SANS_FOND/SILLAGES_logo_blanc), en aplat, sans chrome
  blanc: null,
};
// angle du reflet par chrome (degrés ; 62 = du haut gauche au bas droit, 90 = la lumière tombe du haut)
const ANGLE = { miroir: 90 };

const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

/** Crée le nom dans `hero`, calé sur `mark`. `key` : un des CHROMES. */
export function createName(hero, mark, key = "ardoise") {
  if (!Object.hasOwn(CHROMES, key)) key = "ardoise";
  const pal = CHROMES[key];
  const svg = el("svg", { class: "hero__name", preserveAspectRatio: "none", "aria-hidden": "true" });
  const defs = el("defs", {}, svg);
  let fill = key === "blanc" ? "#fff" : "currentColor";
  if (pal) {
    // un reflet par lettre (repère de chaque lettre), comme sur le monogramme
    const a = ((ANGLE[key] ?? 62) * Math.PI) / 180;
    const dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
    const g = el("linearGradient", { id: "nm-chrome", x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy, spreadMethod: key === "tube" ? "reflect" : "pad" }, defs);
    pal.forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, g));
    fill = "url(#nm-chrome)";
  }
  // la lumière qui passe sur le nom, de gauche à droite
  const sheen = el("linearGradient", { id: "nm-sheen", gradientUnits: "userSpaceOnUse", x1: -260, y1: 0, x2: -60, y2: 0 }, defs);
  [[0, 0], [0.45, 0], [0.5, 0.85], [0.55, 0], [1, 0]].forEach(([o, op]) => el("stop", { offset: o, "stop-color": "#fff", "stop-opacity": op }, sheen));
  // fenêtre d'ouverture du nom, du centre vers les bords
  const clip = el("clipPath", { id: "nm-win" }, defs);
  const win = el("rect", { x: MID, y: VB.y - 10, width: 0, height: VB.h + 20 }, clip);
  const g = el("g", { "clip-path": "url(#nm-win)" }, svg);
  const d = LETTERS.join(" ");
  el("path", { d, fill }, g);
  const shine = el("path", { d, fill: "url(#nm-sheen)", style: "mix-blend-mode:screen" }, g);
  hero.appendChild(svg);

  const cam = { z: 0, c: 0 };   // z : avancée vers la porte (0 → 1, échelle logarithmique) ; c : recentrage
  const open = { h: 0 };        // demi-ouverture du nom, en unités du logo
  const light = { x: -1 };      // position de la lumière (-1 : avant le nom, 1 : après)

  function draw() {
    const H = hero.getBoundingClientRect(), r = mark.getBoundingClientRect();
    const W = H.width, Ht = H.height;
    if (!W || !r.width) return;
    const s0 = r.width / VB.w, s1 = (3 * W) / GATE.w;   // au bout, les branches du A sont sorties de l'écran
    const s = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * cam.z);
    // position à l'écran (repère du hero) du milieu de la porte, au repos puis recentrée
    const px = r.left - H.left + (GATE.x - VB.x) * s0, py = r.top - H.top + (GATE.y - VB.y) * s0;
    const fx = px + (W / 2 - px) * cam.c, fy = py + (Ht / 2 - py) * cam.c;
    svg.setAttribute("viewBox", `${GATE.x - fx / s} ${GATE.y - fy / s} ${W / s} ${Ht / s}`);
    win.setAttribute("x", MID - open.h);
    win.setAttribute("width", open.h * 2);
    const lx = VB.x + (light.x + 1) / 2 * (VB.w + 400) - 100;
    sheen.setAttribute("x1", lx - 100); sheen.setAttribute("x2", lx + 100);
  }
  draw();
  return { svg, cam, open, light, draw, full: VB.w / 2 + 10, shine };
}
