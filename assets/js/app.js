/*
 * Point d'entrée : scroll fluide, scène WebGL, langue, thème, navigation Barba et vues.
 */
import { buildMedia, releaseMedia, tickMedia, initMediaObserver } from "./media.js?v=26";
import { initialLang, saveLang, applyI18n, lang, pageTitle } from "./i18n.js?v=26";
import { magnetic, rollLinks, motion, progress } from "./anim/ui.js?v=26";
import { runLoader } from "./anim/preloader.js?v=26";
import { initHome } from "./anim/home.js?v=26";
import { initCategory } from "./anim/category.js?v=26";
import { initLegal } from "./anim/legal.js?v=26";
import { createLightbox } from "./anim/lightbox.js?v=26";
import { transitions, bands } from "./anim/transitions.js?v=26";

const { gsap, ScrollTrigger, SplitText, Flip, CustomEase, Lenis, barba } = window;
gsap.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase);

const html = document.documentElement;
const params = new URLSearchParams(location.search);
// les outils de test (?debug) ne répondent qu'en local, jamais sur le site en ligne
const debug = params.has("debug") && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
function glSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) {
    return false;
  }
}
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const useGL = params.get("gl") !== "0" && !reduced && canHover && innerWidth >= 900 && glSupported();

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (reduced) gsap.globalTimeline.timeScale(6);

/* ─── Scroll fluide ─── */
const lenis = reduced ? null : new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
if (lenis) {
  lenis.on("scroll", () => { ScrollTrigger.update(); motion.vel = lenis.velocity; });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
} else {
  let last = scrollY;
  window.addEventListener("scroll", () => { motion.vel = scrollY - last; last = scrollY; }, { passive: true });
}
gsap.ticker.lagSmoothing(0);

/* ─── WebGL ─── (Three.js, 676 Ko, n'est téléchargé que sur les écrans qui s'en servent : jamais sur téléphone) */
let gl = null;
if (useGL) {
  try {
    const { GL } = await import("./gl/scene.js?v=26");
    gl = new GL(document.querySelector("canvas.gl"));
    html.classList.add("gl-on");
  } catch (e) {
    console.warn("WebGL indisponible, repli CSS.", e);
    gl = null;
  }
}
initMediaObserver();
gsap.ticker.add((time) => {
  tickMedia(time);
  if (!lenis) motion.vel *= 0.85;
  if (gl) gl.render(time, motion.vel);
});
window.addEventListener("resize", () => gl && gl.resize());

/* ─── Interface fixe ─── */
const lightbox = createLightbox({ lenis });
const header = document.querySelector(".header");
magnetic(header);
rollLinks(header);
// l'en-tête prend un fond dès que le contenu passe dessous (après l'ouverture plein écran) : rien ne glisse sous le logo
function solidHeader() {
  const page = [...document.querySelectorAll('[data-barba="container"]')].filter((c) => c.style.display !== "none").pop();
  const top = page && page.querySelector(".hero, .c-hero");
  header.classList.toggle("is-solid", scrollY > (top ? top.offsetHeight - header.offsetHeight : 8));
}
addEventListener("scroll", solidHeader, { passive: true });
addEventListener("resize", solidHeader);

/* ─── Vues ─── */
const app = {
  gl, lenis, reduced, view: null, pending: null,

  mount(container, via) {
    const ns = container.dataset.barbaNamespace;
    const ctx = {
      container, gl, lenis, reduced, via, canHover, lightbox,
      go: (url, el) => barba.go(url, el),
    };
    const v = ns === "home" ? initHome(ctx) : ns === "category" ? initCategory(ctx) : initLegal(ctx);
    const offs = [magnetic(container), rollLinks(container), progress(container, lenis)];
    app.view = {
      intro: v.intro,
      activateWorld: (i) => ctx.activateWorld && ctx.activateWorld(i),
      destroy(opts) { offs.forEach((f) => f()); v.destroy(opts); },
    };
    ScrollTrigger.refresh();
    solidHeader();
    return app.view;
  },

  unmount(container, opts) {
    if (app.view) app.view.destroy(opts);
    app.view = null;
    releaseMedia(container);
    if (gl) gl.removePlanes(container);
    ScrollTrigger.getAll().forEach((st) => { if (st.trigger && container.contains(st.trigger)) st.kill(); });
    // Barba garde l'ancienne page dans le DOM jusqu'à la fin de l'entrée : on la sort du flux
    container.style.display = "none";
  },

  async first(container) {
    await document.fonts.ready;
    applyI18n(document, initialLang());
    buildMedia(container);
    document.title = pageTitle(container);
    app.mount(container, "once");
    const isHome = container.dataset.barbaNamespace === "home";
    await runLoader({
      isHome, reduced,
      onReveal: () => {
        app.view.intro && app.view.intro(true);
      },
    });
    scrollToHash(location.hash, true);
  },
};

// accès de test uniquement : ?debug
if (debug) window.__site = { app, lenis, gl, ScrollTrigger };

/* ─── Navigation dans la page ─── */
function scrollToHash(hash, immediate) {
  if (!hash) return false;
  let el = null;
  try { el = document.querySelector('[data-barba="container"]').querySelector(hash); } catch (e) { return false; }
  if (!el) return false;
  let y = el.getBoundingClientRect().top + scrollY;
  // une section épinglée (la liste des univers, glissée sous l'accueil) n'est en place qu'à la fin de son épinglage
  const pin = ScrollTrigger.getAll().find((st) => st.pin === el);
  if (pin) y = Math.max(y, pin.end);
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  return true;
}

const samePage = (url) => url.pathname.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "");
window.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (!url.hash) {
    // déjà sur cette page (« Home » ou le logo, sur l'accueil) : on remonte en haut
    if (samePage(url)) {
      e.preventDefault();
      e.stopPropagation();
      if (lenis) lenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }
  if (samePage(url)) {
    e.preventDefault();
    e.stopPropagation();
    if (!scrollToHash(url.hash) && url.hash === "#contact") barba.go("index.html#contact");
  }
}, true);

/* ─── Langue ─── */
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", async () => {
  const l = b.dataset.lang;
  if (l === lang()) return;
  saveLang(l);
  const container = document.querySelector('[data-barba="container"]');
  const y = scrollY;
  lenis && lenis.stop();
  await bands.cover(reduced);
  if (app.view) app.view.destroy();
  applyI18n(document, l);
  document.title = pageTitle(container);
  app.mount(container, "lang");
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  ScrollTrigger.refresh();
  await bands.reveal(reduced);
  lenis && lenis.start();
}));

/* ─── Barba ─── */
barba.hooks.beforeEnter(({ next }) => {
  // Barba ne change que le contenu : l'adresse canonique suit la page affichée
  const canon = next.html && next.html.match(/<link rel="canonical" href="([^"]+)"/);
  if (canon) document.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach((el) => el.setAttribute(el.tagName === "LINK" ? "href" : "content", canon[1]));
  applyI18n(next.container, lang());
  buildMedia(next.container);
  document.title = pageTitle(next.container);
});
barba.hooks.after(({ next }) => {
  ScrollTrigger.refresh();
  lenis && lenis.start();
  scrollToHash(location.hash);
  void next;
});

barba.init({
  preventRunning: true,
  timeout: 8000,
  prevent: ({ el }) => el.hasAttribute("data-no-barba") || el.target === "_blank" || (el.getAttribute("href") || "").startsWith("#"),
  transitions: transitions(app),
});
