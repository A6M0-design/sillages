/* Lightbox : le média s'agrandit depuis sa vignette, navigation clavier et glisser. */
import { cloneSlot } from "../media.js?v=26";
import { t } from "../i18n.js?v=26";

const gsap = window.gsap;
const pad = (n) => String(n).padStart(2, "0");

export function createLightbox({ lenis }) {
  const box = document.querySelector(".lightbox");
  if (!box) return { open() {}, close() {} };
  const veil = box.querySelector(".lightbox__veil");
  const stage = box.querySelector(".lightbox__stage");
  const mediaEl = stage.querySelector(".media");
  const ui = box.querySelector(".lightbox__ui");
  const count = box.querySelector(".lightbox__count");
  const btnPrev = box.querySelector('[data-lb="prev"]');
  const btnNext = box.querySelector('[data-lb="next"]');
  const btnClose = box.querySelector('[data-lb="close"]');
  let list = [], idx = 0, from = null, release = null, isOpen = false, busy = false, lastFocus = null;

  function labels() {
    btnPrev.textContent = t("lightbox.prev") || "Prev";
    btnNext.textContent = t("lightbox.next") || "Next";
    btnClose.textContent = t("lightbox.close") || "Close";
  }

  function render(i) {
    idx = (i + list.length) % list.length;
    if (release) release();
    const slot = list[idx];
    // le cadre épouse le format du média et tient dans l'écran
    const [rw, rh] = (slot.ratio || "16:9").split(":").map(Number);
    const r = rw / rh;
    const w = Math.min(innerWidth * 0.86, innerHeight * 0.78 * r);
    stage.style.width = `${Math.round(w)}px`;
    mediaEl.style.aspectRatio = `${rw} / ${rh}`;
    release = cloneSlot(slot, mediaEl, { sound: true });
    count.textContent = `${pad(idx + 1)} / ${pad(list.length)}`;
    const multi = list.length > 1;
    btnPrev.style.visibility = btnNext.style.visibility = multi ? "" : "hidden";
  }

  function fit(el) {
    gsap.set(stage, { clearProps: "transform" });
    const r1 = stage.getBoundingClientRect();
    const r0 = el.getBoundingClientRect();
    return { x: r0.left - r1.left, y: r0.top - r1.top, scaleX: r0.width / r1.width, scaleY: r0.height / r1.height };
  }

  function open(slots, i, fromEl) {
    if (isOpen || !slots.length) return;
    isOpen = true;
    list = slots;
    from = fromEl;
    lastFocus = document.activeElement;
    labels();
    box.classList.add("is-open");
    render(i);
    lenis && lenis.stop();
    const f = fit(fromEl);
    gsap.timeline()
      .fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0)
      .fromTo(stage, { ...f, transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.15, ease: "expo.inOut" }, 0)
      .fromTo(ui, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }, 0.7);
    btnClose.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen || busy) return;
    busy = true;
    const r = from.getBoundingClientRect();
    const onScreen = r.bottom > 0 && r.top < innerHeight;
    const tl = gsap.timeline({
      onComplete: () => {
        box.classList.remove("is-open");
        if (release) release();
        release = null;
        mediaEl.innerHTML = "";
        gsap.set(stage, { clearProps: "all" });
        isOpen = busy = false;
        lenis && lenis.start();
        lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
      },
    });
    tl.to(ui, { opacity: 0, duration: 0.3 }, 0);
    if (onScreen && idx === list.findIndex((s) => s.el === from)) {
      const f = fit(from);
      gsap.set(stage, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
      tl.to(stage, { ...f, transformOrigin: "0 0", duration: 1, ease: "expo.inOut" }, 0);
    } else {
      tl.to(stage, { opacity: 0, scale: 0.94, duration: 0.6, ease: "power3.inOut" }, 0);
    }
    tl.to(veil, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 0.3);
  }

  function go(d) {
    if (busy) return;
    busy = true;
    gsap.timeline({ onComplete: () => (busy = false) })
      .to(mediaEl, { opacity: 0, xPercent: -6 * d, duration: 0.35, ease: "power3.in" })
      .add(() => render(idx + d))
      .fromTo(mediaEl, { opacity: 0, xPercent: 6 * d }, { opacity: 1, xPercent: 0, duration: 0.7, ease: "expo.out" });
  }

  btnPrev.addEventListener("click", () => go(-1));
  btnNext.addEventListener("click", () => go(1));
  btnClose.addEventListener("click", close);
  veil.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
  let sx = null;
  stage.addEventListener("pointerdown", (e) => (sx = e.clientX));
  stage.addEventListener("pointerup", (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50 && list.length > 1) go(dx < 0 ? 1 : -1);
  });

  return { open, close, isOpen: () => isOpen };
}
