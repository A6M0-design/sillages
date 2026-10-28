/*
 * Préloader.
 *  · Accueil : le monogramme seul au centre rejoint le menu ; le triptyque et le nom chromé arrivent (intro.js).
 *  · Autres pages : le nom monte de sa ligne de base, puis l'écran s'ouvre.
 */
import { playIntro } from "./intro.js?v=27";

const gsap = window.gsap;

export function runLoader({ isHome, reduced, onReveal }) {
  return new Promise((resolve) => {
    const L = document.querySelector(".loader");
    if (!L) { onReveal && onReveal(); resolve(); return; }
    if (isHome && !reduced) {
      playIntro(L, onReveal).then(() => {
        document.documentElement.classList.add("is-loaded");
        resolve();
      });
      return;
    }
    const top = L.querySelector(".loader__half--top");
    const bot = L.querySelector(".loader__half--bot");
    const mark = L.querySelector(".loader__mark");
    const by = L.querySelector(".loader__by");
    const heroMark = isHome ? document.querySelector(".hero__mark") : null;
    const k = reduced ? 0.15 : 1;
    // le nom est caché sous sa ligne de base
    const CLOSED = "inset(100% 0% 0% 0%)";

    gsap.set(mark, { clipPath: CLOSED });
    gsap.set(by, { opacity: 0 });
    if (heroMark) gsap.set(heroMark, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.classList.add("is-loaded");
        resolve();
      },
    });

    // 1. le nom monte de sa ligne de base, 2. le texte en fondu
    tl.to(mark, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1 * k, ease: "expo.out" }, 0.7 * k)
      .to(by, { opacity: 1, duration: 0.3 * k, ease: "power1.out" }, 1.1 * k)
      .to(by, { opacity: 0, duration: 0.3 * k, ease: "power1.in" }, "+=0.5")
      .addLabel("open");

    if (!isHome) {
      // ailleurs que sur l'accueil, le nom redescend avant l'ouverture
      tl.to(mark, { clipPath: CLOSED, duration: 0.6 * k, ease: "power3.in" }, "open-=0.1")
        .addLabel("open", ">-0.1");
    }

    tl.add(() => onReveal && onReveal(), "open")
      .to(top, { scaleY: 0, duration: 1.3 * k, ease: "expo.inOut" }, "open")
      .to(bot, { scaleY: 0, duration: 1.3 * k, ease: "expo.inOut" }, "open");

    if (heroMark) {
      // le nom du hero est au même endroit : le relais est invisible
      tl.add(() => { gsap.set(heroMark, { opacity: 1 }); gsap.set(mark, { opacity: 0 }); }, ">");
    }
  });
}
