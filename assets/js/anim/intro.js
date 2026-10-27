/*
 * Ouverture de l'accueil.
 *  1. Sur le fond uni, le film du monogramme (05_ANIMATION, « carrosserie ») : macro sur la tranche du S,
 *     recul jusqu'au monogramme posé, joué 2,2 × plus vite que le fichier. Le film a un fond noir : il passe par un
 *     canvas WebGL qui rend le noir transparent (filmgl.js). Son reflet s'efface, puis le monogramme du film part
 *     vers le menu ; en route, le monogramme fixe (01_LOGO), posé exactement dessus, prend le relais.
 *     Si le film ne peut pas jouer, le monogramme fixe apparaît seul au centre, traversé par une lumière.
 *  2. Il rejoint sa place en haut à gauche, dans le menu. En même temps, le fond s'efface :
 *     le triptyque arrive vers nous et se pose, et le nom chromé s'ouvre du centre (home.js, intro).
 * La traversée du A, elle, sert de passage vers la liste des univers, au scroll (home.js).
 */
import { createFilmGL } from "./filmgl.js?v=26";

const gsap = window.gsap;

/** Attend que les films aient une image à montrer (ou abandonne au bout de `max` secondes). */
function ready(max) {
  const vids = [...document.querySelectorAll(".hero video")];
  return Promise.race([
    Promise.all(vids.map((v) => (v.readyState >= 3 ? 0 : new Promise((r) => v.addEventListener("canplay", r, { once: true }))))),
    new Promise((r) => setTimeout(r, max * 1000)),
  ]);
}

/**
 * Les deux versions du film (réglage `introFilm` dans config.js) :
 *  · sans-fond : vraie transparence (WebM pour Chrome / Firefox, HEVC .mov pour Safari et l'iPhone), sans sol ni reflet ;
 *  · fond      : fond noir et reflet au sol, rendu transparent par un canvas WebGL (filmgl.js).
 */
const FILMS = {
  "sans-fond": { alpha: true, src: "media/brand/intro-monogramme-sans-fond.webm", apple: "media/brand/intro-monogramme-sans-fond.mov" },
  fond: { alpha: false, src: "media/brand/intro-monogramme.mp4", small: "media/brand/intro-monogramme-1280.mp4" },
};
/** Le film choisi, sa vitesse, et la place du monogramme au moment du relais (en px du cadre 1920 × 1080). */
const FILM = {
  ...(FILMS[window.SITE && SITE.introFilm] || FILMS["sans-fond"]),
  w: 1920, h: 1080,
  rate: 2.2,                            // joué plus vite que le fichier : 5,8 s de film en 2,6 s
  swap: 5.8,                            // le monogramme est posé : il part vers le menu (temps du film)
  mono: { cx: 961, cy: 528, h: 548 },
};

/** Safari et tous les navigateurs de l'iPhone / iPad lisent la transparence en HEVC, pas en WebM. */
const APPLE = (() => {
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ||
    (/Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua));
})();

/** Charge le film ; résout `true` s'il peut jouer jusqu'au bout, `false` sinon (erreur ou `max` secondes). */
function loadFilm(film, max) {
  const src = FILM.alpha ? (APPLE ? FILM.apple : FILM.src) : (matchMedia("(max-width: 900px)").matches ? FILM.small : FILM.src);
  film.classList.toggle("is-alpha", FILM.alpha);
  film.src = src + (SITE.version ? `?v=${SITE.version}` : "");
  film.preload = "auto";
  film.load();
  return Promise.race([
    new Promise((r) => film.addEventListener("canplaythrough", () => r(true), { once: true })),
    new Promise((r) => film.addEventListener("error", () => r(false), { once: true })),
    new Promise((r) => setTimeout(() => r(film.readyState >= 3), max * 1000)),
  ]);
}

/** Attend que le film atteigne `t` secondes (ou sa fin, ou `max` secondes de sécurité). */
function until(film, t, max) {
  const t0 = performance.now();
  return new Promise((r) => {
    const tick = () => (film.currentTime >= t || film.ended || performance.now() - t0 > max * 1000 ? r() : requestAnimationFrame(tick));
    tick();
  });
}

/**
 * Pose le monogramme fixe sur celui du film (cadré en `object-fit: cover`) et centre les transformations du film
 * sur son monogramme : les deux peuvent alors voyager ensemble. Renvoie le bas du monogramme (px), pour le reflet.
 */
function placeOnFilm(mono, film) {
  const W = film.clientWidth, H = film.clientHeight, k = Math.max(W / FILM.w, H / FILM.h);
  const cx = W / 2 + (FILM.mono.cx - FILM.w / 2) * k, cy = H / 2 + (FILM.mono.cy - FILM.h / 2) * k;
  gsap.set(mono, { left: cx, top: cy, height: FILM.mono.h * k });
  gsap.set(film, { transformOrigin: `${cx}px ${cy}px` });
  return cy + (FILM.mono.h * k) / 2;
}

/** Déplacement (translation + échelle) qui pose `from` exactement sur `to`. */
function flight(from, to) {
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  return {
    x: b.left + b.width / 2 - (a.left + a.width / 2),
    y: b.top + b.height / 2 - (a.top + a.height / 2),
    scale: b.height / a.height,
  };
}

/**
 * Joue l'ouverture dans le préloader `L`. `onReveal` est appelé quand le fond commence à s'effacer.
 * Renvoie une promesse résolue quand tout est posé (le relais avec le menu est invisible).
 */
export function playIntro(L, onReveal) {
  return new Promise(async (resolve) => {
    const halves = L.querySelectorAll(".loader__half");
    const film = L.querySelector(".loader__film");
    const mono = L.querySelector(".loader__mono");
    const header = document.querySelector(".header");
    const headMono = header.querySelector(".mono");
    const progress = document.querySelector(".progress");
    const tri = document.querySelector(".hero__tri");
    gsap.set(L.querySelectorAll(".loader__mark, .loader__by"), { display: "none" });
    gsap.set([header, progress], { opacity: 0 });
    gsap.set(mono, { xPercent: -50, yPercent: -50 });
    gsap.set(tri, { scale: 1.22, transformOrigin: "50% 55%" });
    gsap.set(document.querySelectorAll(".hero__tagline, .hero__label"), { opacity: 0 });

    // le film d'abord : les films du hero se chargent pendant qu'il joue
    let played = false;
    if (film && (await loadFilm(film, 6))) {
      film.defaultPlaybackRate = film.playbackRate = FILM.rate;
      try { await film.play(); played = true; } catch { played = false; } // lecture auto refusée (mode économie…)
    }
    // film à fond noir : il passe par un canvas WebGL (noir → transparent) ; sans WebGL, la vidéo seule, fusionnée sur l'ardoise
    const gl = played && !FILM.alpha ? createFilmGL(film, L, FILM.w, FILM.h) : null;
    const vis = gl ? gl.el : film;
    const travel = played && (FILM.alpha || !!gl);   // le film peut voyager avec le monogramme (pas de cadre noir)
    if (played) {
      gsap.to(vis, { opacity: 1, duration: 0.5, ease: "power1.out" });
      await Promise.all([until(film, FILM.swap, 10), ready(1)]);
    } else {
      await ready(2.5);
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(mono, { opacity: 0 });
        if (gl) gl.destroy();
        if (film) { film.pause(); film.removeAttribute("src"); film.load(); }
        resolve();
      },
    });
    if (/[?&]debug/.test(location.search) && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__intro = tl; // tests uniquement

    let T;
    const movers = travel ? [mono, vis] : [mono];
    if (travel) {
      // 1 · le film continue (son reflet au sol s'efface, s'il en a un) et le monogramme part vers le menu avec le film.
      //     En route, quand il file et rapetisse, le monogramme fixe prend le relais : on ne voit pas le passage.
      const bottom = placeOnFilm(mono, vis);
      gsap.set(mono, { opacity: 0 });
      if (gl) {
        const refl = { r: 1 };
        tl.to(refl, { r: 0, duration: 0.45, ease: "power1.out", onUpdate: () => gl.setCut(bottom, refl.r) }, 0);
      }
      T = gl ? 0.1 : 0;
      tl.to(mono, { opacity: 1, duration: 0.4, ease: "power1.inOut" }, T + 0.45)
        .to(vis, { opacity: 0, duration: 0.4, ease: "power1.inOut" }, T + 0.55);
    } else if (played) {
      // 1 · (sans WebGL) le monogramme fixe se pose sur celui du film, le film s'efface sur place
      placeOnFilm(mono, film);
      tl.to(mono, { opacity: 1, duration: 0.45, ease: "power1.inOut" }, 0)
        .to(film, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, 0);
      T = 0.4;
    } else {
      // 1 · le monogramme sort du fond, une lumière le traverse
      tl.fromTo(mono, { opacity: 0, scale: 0.94, filter: "blur(8px) brightness(0.55)" },
        { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: 1.2, ease: "expo.out" }, 0.15)
        .to(mono, { keyframes: [{ filter: "blur(0px) brightness(1.5)", duration: 0.35, ease: "power2.out" }, { filter: "blur(0px) brightness(1)", duration: 0.6, ease: "power2.inOut" }] }, 0.8);
      T = 1.75;
    }

    // 2 · il rejoint le menu ; le fond s'efface, le triptyque arrive, le nom s'ouvre (home.js)
    const fly = { p: 0 };
    let f = null;
    tl.to(fly, {
      p: 1, duration: travel ? 1.05 : 1.4, ease: "expo.inOut",
      onStart: () => { f = flight(mono, headMono); },  // calculé au dernier moment : la mise en page est stable
      onUpdate: () => f && gsap.set(movers, { x: f.x * fly.p, y: f.y * fly.p, scale: 1 + (f.scale - 1) * fly.p }),
    }, T)
      .to(halves, { opacity: 0, duration: 1.3, ease: "power2.inOut" }, T + 0.1)
      .to(tri, { scale: 1, duration: 2.4, ease: "expo.out" }, T + 0.1)
      .add(() => onReveal && onReveal(), T + 0.1)
      // le menu apparaît autour du monogramme posé
      .to(header, { opacity: 1, duration: 0.9, ease: "power2.out" }, T + 1.2)
      .to(progress, { opacity: 1, duration: 0.9, ease: "power2.out", clearProps: "opacity" }, T + 1.4); // puis la feuille de style reprend la main (masqué sur le pied de page)
  });
}
