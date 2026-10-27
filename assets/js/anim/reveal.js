/* Révélations génériques au scroll : lignes derrière un masque, fondus montants. */
import { splitLines } from "./ui.js?v=26";

const gsap = window.gsap;

export function reveals(root, splits) {
  root.querySelectorAll("[data-split]").forEach((el) => {
    const s = splitLines(el);
    splits.push(s);
    gsap.from(s.lines, {
      yPercent: 115, rotate: 2, duration: 1.5, ease: "expo.out", stagger: 0.09,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  root.querySelectorAll(".overline, .card__meta, .contact__body > .btn-wa, .c-contact > p, .c-contact > .btn-wa, .c-work__count, .portrait figcaption").forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 22, duration: 1.3, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 94%" },
    });
  });
}

/** Mot découpé en lettres doublées, pour l'effet de rouleau au survol. */
export function rollWord(el) {
  const txt = el.textContent.trim();
  el.setAttribute("aria-label", txt);
  el.innerHTML = [...txt]
    .map((c, i) => `<span class="ch" style="--i:${i}" aria-hidden="true"><span>${c}</span><span>${c}</span></span>`)
    .join("");
  return txt;
}
