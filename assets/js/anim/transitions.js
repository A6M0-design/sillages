/*
 * Transitions entre pages (Barba). Une seule idée : la continuité de l'image.
 *  · world    — liste → univers : le mot cliqué devient le titre, la vidéo de fond reste à l'écran
 *  · continue — univers → univers suivant : la vidéo qui a envahi l'écran devient le hero de la page
 *  · bands    — trois volets, rappel du préloader (pages juridiques, accueil, repli)
 */
import { cloneSlot } from "../media.js?v=26";
import { fitFont, gutter } from "./ui.js?v=26";

const gsap = window.gsap;

/** Transition par défaut : la ligne se trace, l'écran se referme sur elle, puis s'ouvre de part et d'autre. */
export const bands = {
  parts: () => ({
    top: document.querySelector(".bands__half--top"),
    bot: document.querySelector(".bands__half--bot"),
  }),
  cover(fast) {
    const { top, bot } = this.parts();
    const d = fast ? 0.25 : 1;
    return gsap.timeline()
      .fromTo([top, bot], { scaleY: 0 }, { scaleY: 1, duration: 0.7 * d, ease: "expo.inOut" });
  },
  reveal(fast) {
    const { top, bot } = this.parts();
    const d = fast ? 0.25 : 1;
    return gsap.timeline()
      .to([top, bot], { scaleY: 0, duration: 1 * d, ease: "expo.inOut" }, 0.1 * d);
  },
};

/** Taille du titre de la page univers, calquée sur le CSS de .c-hero__word */
function heroWordSize(text) {
  return fitFont([text], innerWidth - 2 * gutter(), innerWidth * 0.21);
}

/** Fond plein écran posé au-dessus de la page qui part, sous le menu. */
function holdMedia(slot) {
  const box = document.createElement("div");
  box.className = "tr-media";
  const m = document.createElement("div");
  m.className = "media";
  box.appendChild(m);
  document.body.appendChild(box);
  const release = cloneSlot(slot, m);
  return { box, media: m, release };
}

/** Cale la vidéo du hero d'arrivée sur l'instant de la vidéo affichée pendant la transition. */
function syncHero(next, video) {
  const hv = next.container.querySelector(".c-hero .media > video");
  if (hv && video && video.tagName === "VIDEO" && video.currentTime) {
    try { hv.currentTime = video.currentTime % (hv.duration || Infinity); } catch (e) {}
    hv.play().catch(() => {});
  }
}

/** Entrée commune sur une page univers : le titre blanc se pose sur la vidéo déjà présente, à la place exacte du mot qui a grandi. */
function heroArrival(app, next, { fadeOut = [] } = {}) {
  const mask = next.container.querySelector(".c-hero__mask");
  const meta = next.container.querySelector(".c-hero__meta");
  const tl = gsap.timeline();
  tl.fromTo(mask, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, 0.05)
    .to(fadeOut, { opacity: 0, duration: 1, ease: "power2.inOut" }, 0.2)
    .fromTo(meta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out" }, 0.55);
  app.view.intro && app.view.intro(false);
  return tl;
}

export function transitions(app) {
  const { gl, reduced } = app;
  const toTop = () => {
    if (app.lenis) app.lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  };

  return [
    {
      name: "world",
      custom: ({ trigger }) => !reduced && trigger && trigger.dataset && trigger.dataset.transition === "world",
      async leave({ current, trigger }) {
        app.lenis && app.lenis.stop();
        const i = Number(trigger.dataset.index);
        const word = trigger.querySelector(".world__word");
        if (app.view && app.view.activateWorld) app.view.activateWorld(i);
        const bg = current.container.querySelectorAll(".worlds__bg .media")[i];

        // le fond : la scène WebGL si elle est là, sinon une copie DOM de la vidéo
        let hold = null;
        const L = gl && gl.liquid;
        if (L) { gl.liquidTo(i); L.full = true; L.locked = true; }
        else if (bg && bg._slot) { hold = holdMedia(bg._slot); gsap.set(hold.box, { opacity: 0 }); }

        const label = word.getAttribute("aria-label") || word.textContent;
        const r = word.getBoundingClientRect();
        const cs = getComputedStyle(word);
        const clone = document.createElement("div");
        clone.className = "tr-word";
        clone.textContent = label;
        Object.assign(clone.style, {
          left: `${r.left}px`, top: `${r.top}px`, height: `${r.height}px`,
          fontSize: cs.fontSize, letterSpacing: cs.letterSpacing, lineHeight: `${r.height}px`,
        });
        document.body.appendChild(clone);
        const cr = clone.getBoundingClientRect();
        const S = heroWordSize(label) / parseFloat(cs.fontSize);

        const tl = gsap.timeline();
        tl.to(current.container, { opacity: 0, duration: 0.6, ease: "power2.out" }, 0)
          .to(clone, {
            x: innerWidth / 2 - (cr.left + cr.width / 2),
            y: innerHeight / 2 - (cr.top + cr.height / 2),
            scale: S, duration: 1.3, ease: "expo.inOut",
          }, 0);
        if (L) {
          tl.to(L.u.uShow, { value: 1, duration: 1.2, ease: "expo.out" }, 0)
            .to(L.u.uMix, { value: 1, duration: 1.2, ease: "expo.out" }, 0)
            .to(L.u.uDim, { value: 0, duration: 1.3, ease: "power2.inOut" }, 0)
            .to(L.u.uZoom, { value: 1, duration: 1.3, ease: "power2.inOut" }, 0)
            .to(L.u.uFull, { value: 1, duration: 1.3, ease: "power2.inOut" }, 0);
        } else if (hold) {
          tl.to(hold.box, { opacity: 1, duration: 0.9, ease: "power2.inOut" }, 0.1);
        }
        await tl;
        app.unmount(current.container, { keepLiquid: true });
        app.pending = { clone, hold, video: L ? L.slots[i] && L.slots[i].source : hold && hold.media._clone };
      },
      async enter({ next }) {
        toTop();
        app.mount(next.container, "world");
        const p = app.pending || {};
        syncHero(next, p.video);
        await heroArrival(app, next, { fadeOut: [p.clone, p.hold && p.hold.box].filter(Boolean) });
        p.clone && p.clone.remove();
        if (p.hold) { p.hold.release(); p.hold.box.remove(); }
        app.pending = null;
        gl && gl.destroyLiquid();
      },
    },
    {
      name: "continue",
      custom: ({ trigger }) => !reduced && trigger && trigger.dataset && trigger.dataset.transition === "dissolve",
      async leave({ current, trigger }) {
        app.lenis && app.lenis.stop();
        const m = trigger.querySelector(".c-next__media .media");
        const hold = m && m._slot ? holdMedia(m._slot) : null;
        const tl = gsap.timeline();
        tl.to(current.container, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 0);
        if (hold) tl.fromTo(hold.box, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
        await tl;
        app.unmount(current.container);
        app.pending = { hold, video: hold && hold.media._clone };
      },
      async enter({ next }) {
        toTop();
        app.mount(next.container, "world");
        const p = app.pending || {};
        syncHero(next, p.video);
        await heroArrival(app, next, { fadeOut: [p.hold && p.hold.box].filter(Boolean) });
        if (p.hold) { p.hold.release(); p.hold.box.remove(); }
        app.pending = null;
      },
    },
    {
      name: "bands",
      async once({ next }) {
        await app.first(next.container);
      },
      async leave({ current }) {
        app.lenis && app.lenis.stop();
        await bands.cover(reduced);
        app.unmount(current.container);
      },
      async enter({ next }) {
        toTop();
        app.mount(next.container, "bands");
        const r = bands.reveal(reduced);
        gsap.delayedCall(reduced ? 0 : 0.35, () => app.view.intro && app.view.intro(false));
        await r;
      },
    },
  ];
}
