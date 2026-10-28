/* Interactions communes : curseur, aimantation, texte brouillé, défilements infinis, progression. */
import { t } from "../i18n.js?v=27";

const gsap = window.gsap;
export const motion = { vel: 0, dir: 1 };

/* ─── Curseur ─── */
export function initCursor() {
  if (!matchMedia("(pointer: fine)").matches) return null;
  const root = document.querySelector(".cursor");
  if (!root) return null;
  document.documentElement.classList.add("has-cursor");
  const dot = root.querySelector(".cursor__dot");
  const ring = root.querySelector(".cursor__ring");
  const label = root.querySelector(".cursor__label");
  const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });
  let state = "";
  root.classList.add("is-idle");

  const setState = (el) => {
    const hit = el && el.closest && el.closest("[data-cursor], a, button, [data-cursor-hide]");
    let next = "";
    if (hit) {
      if (hit.hasAttribute("data-cursor-hide")) next = "hide";
      else if (hit.dataset.cursor) next = hit.dataset.cursor;
      else next = "link";
    }
    if (next === state) return;
    state = next;
    root.classList.toggle("is-label", !!next && next !== "link" && next !== "hide");
    root.classList.toggle("is-link", next === "link");
    root.classList.toggle("is-hidden", next === "hide");
    if (next && next !== "link" && next !== "hide") label.textContent = t(`cursor.${next}`) || next;
  };

  window.addEventListener("pointermove", (e) => {
    if (root.classList.contains("is-idle")) {
      gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      root.classList.remove("is-idle");
    }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    setState(e.target);
  }, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.add("is-hidden"));
  document.addEventListener("pointerenter", () => root.classList.remove("is-hidden"));
  return {
    refresh: () => {
      state = "";
      root.classList.remove("is-label", "is-link", "is-hidden");
    },
  };
}

/* ─── Aimantation ─── */
export function magnetic(root) {
  if (!matchMedia("(pointer: fine)").matches) return () => {};
  const offs = [];
  root.querySelectorAll("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "expo.out" });
    const k = parseFloat(el.dataset.magnetic) || 0.2;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * k);
      yTo((e.clientY - (r.top + r.height / 2)) * k);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    offs.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); gsap.set(el, { x: 0, y: 0 }); });
  });
  return () => offs.forEach((f) => f());
}

/* ─── Liens en rouleau : le texte glisse vers le haut et revient par le bas ─── */
export function rollLinks(root) {
  root.querySelectorAll("[data-roll]:not(.link-roll)").forEach((el) => {
    const txt = el.textContent.trim();
    el.classList.add("link-roll");
    el.setAttribute("aria-label", txt);
    el.innerHTML = `<span aria-hidden="true">${txt}</span><span aria-hidden="true">${txt}</span>`;
  });
  return () => {};
}

/* ─── Défilements infinis, sensibles à la vitesse du scroll ─── */
export function marquees(root) {
  const offs = [];
  root.querySelectorAll("[data-marquee]").forEach((m) => {
    const track = m.querySelector(".marquee__track");
    if (!track) return;
    const base = parseFloat(m.dataset.marquee) || 50; // px / s
    // duplique jusqu'à couvrir 2 largeurs d'écran
    const unit = track.innerHTML;
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 2.2 && guard++ < 12) track.insertAdjacentHTML("beforeend", unit);
    const clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    m.appendChild(clone);
    let x = 0, w = track.scrollWidth, boost = 0;
    const tick = (time, delta) => {
      const dt = Math.min(delta, 64) / 1000;
      // accélère doucement avec le scroll, sans jamais changer de sens
      boost += (Math.min(Math.abs(motion.vel) * 6, 160) - boost) * 0.05;
      x -= (base + boost) * dt;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = clone.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);
    const onR = () => { w = track.scrollWidth; };
    window.addEventListener("resize", onR);
    offs.push(() => { gsap.ticker.remove(tick); window.removeEventListener("resize", onR); clone.remove(); });
  });
  return () => offs.forEach((f) => f());
}

/* ─── Indicateur de section 01 / 05 ─── */
export function progress(root, lenis) {
  const box = document.querySelector(".progress");
  if (!box) return () => {};
  const num = box.querySelector(".progress__num");
  const bar = box.querySelector(".progress__bar i");
  const total = box.querySelector(".progress__total");
  const sections = [...root.querySelectorAll("[data-section]")];
  box.style.display = sections.length ? "" : "none";
  total.textContent = String(sections.length).padStart(2, "0");
  let cur = -1;
  const hasIntro = !!root.querySelector(".hero, .c-hero");
  const show = (i) => {
    box.classList.toggle("is-hidden", hasIntro && i === 0);
    if (i === cur) return;
    const up = i > cur;
    cur = i;
    const old = num.firstElementChild;
    const s = document.createElement("span");
    s.textContent = String(i + 1).padStart(2, "0");
    num.appendChild(s);
    gsap.fromTo(s, { yPercent: up ? 100 : -100 }, { yPercent: 0, duration: 0.6, ease: "expo.out" });
    if (old) gsap.to(old, { yPercent: up ? -100 : 100, duration: 0.6, ease: "expo.out", onComplete: () => old.remove() });
  };
  num.innerHTML = "";
  show(0);
  const triggers = sections.map((sec, i) => window.ScrollTrigger.create({
    trigger: sec, start: "top 55%", end: "bottom 55%",
    onToggle: (self) => self.isActive && show(i),
  }));
  // l'indicateur s'efface sur le pied de page, pour ne pas recouvrir ses liens
  const footer = root.querySelector(".footer") || document.querySelector(".footer");
  if (footer) triggers.push(window.ScrollTrigger.create({
    trigger: footer, start: "top bottom", onToggle: (self) => box.classList.toggle("is-off", self.isActive),
  }));
  const onScroll = () => { bar && gsap.set(bar, { scaleX: lenis ? lenis.progress || 0 : 0 }); };
  lenis && lenis.on("scroll", onScroll);
  return () => { triggers.forEach((s) => s.kill()); box.classList.remove("is-off"); lenis && lenis.off("scroll", onScroll); };
}

/* ─── Découpes ─── */
export function splitLines(el) {
  return window.SplitText.create(el, { type: "lines", mask: "lines", linesClass: "line" });
}
export function splitChars(el) {
  // mots puis lettres : un mot ne se coupe jamais en fin de ligne
  return window.SplitText.create(el, { type: "words,chars", charsClass: "char", wordsClass: "word" });
}
export function splitWords(el) {
  return window.SplitText.create(el, { type: "words", wordsClass: "word" });
}

/* ─── Taille d'un grand titre calée sur une largeur ─── */
let probe;
/** Largeur d'un texte en Syne 700 (interlettrage des grands titres), par pixel de taille. */
export function textWidth(text) {
  if (!probe) {
    probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-family:Syne;font-weight:700;font-size:100px;letter-spacing:-0.04em;text-transform:uppercase";
  }
  probe.textContent = text;
  document.body.appendChild(probe);
  const w = probe.getBoundingClientRect().width / 100;
  probe.remove();
  return w || 1;
}
/** Plus grande taille pour que le plus long des textes tienne dans `avail`, plafonnée à `max`. */
export function fitFont(texts, avail, max) {
  const w = Math.max(...texts.map(textWidth));
  // petite marge : l'approche négative de Syne déborde légèrement sur la dernière lettre
  return Math.floor(Math.min(max, (avail * 0.97) / w));
}
export function gutter() {
  return Math.min(64, Math.max(16, innerWidth * 0.044));
}
