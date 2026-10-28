/*
 * Landing : triptyque et nom chromé ; au scroll, la caméra passe par l'ouverture du A du nom
 * et l'on entre dans la liste des univers (fond liquide). Puis showreel, défilements, contact.
 */
import { marquees, splitChars, fitFont } from "./ui.js?v=27";
import { reveals, rollWord } from "./reveal.js?v=27";
import { createName } from "./name.js?v=27";

const gsap = window.gsap;
const ST = window.ScrollTrigger;

export function initHome(ctx) {
  const { container: root, gl, reduced, canHover } = ctx;
  const offs = [];
  const splits = [];
  let liquid = null;
  const mouse = { x: 0.5, y: 0.5 };
  let name = null;

  const g = gsap.context(() => {
    /* ─── HERO ─── les trois films, le nom chromé ; au scroll, la traversée du A (voir plus bas) */
    const hero = root.querySelector(".hero");
    const tri = hero.querySelector(".hero__tri");
    const tagline = hero.querySelector(".hero__tagline");
    const labels = hero.querySelectorAll(".hero__label");

    // le nom chromé (voir name.js) ; le chrome se choisit dans config.js ou avec ?chrome=ardoise|neutre|froid|fort|miroir|doux|tube|aplat
    const key = new URLSearchParams(location.search).get("chrome") || window.SITE.nameChrome || "ardoise";
    name = createName(hero, hero.querySelector(".hero__mark"), key);
    // reduced, ou après un changement de langue (la page est remontée sans rejouer l'entrée) : le nom est déjà ouvert
    if (reduced || ctx.via === "lang") { name.open.h = name.full; name.light.x = 1; }
    name.draw();
    const redraw = () => name.draw();
    window.addEventListener("resize", redraw);
    ST.addEventListener("refresh", redraw);
    offs.push(() => { window.removeEventListener("resize", redraw); ST.removeEventListener("refresh", redraw); name.svg.remove(); });

    if (reduced) {
      const ht = gsap.timeline({ defaults: { ease: "none" } });
      ht.fromTo([name.svg, tagline, ...labels], { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, 0)
        .fromTo(tri, { yPercent: 0 }, { yPercent: 22, duration: 1 }, 0);
      ST.create({ trigger: hero, start: "top top", end: "bottom top", scrub: true, animation: ht });
    } else {
      /* Passage vers la liste : la liste attend, immobile, juste derrière le hero ; la caméra avance vers le A,
       * de plus en plus vite, et passe par son ouverture. Les films s'effacent derrière la porte : on est dans la liste,
       * déjà en place. La traversée est finie avant que la liste ne se mette à défiler : en remontant, le nom
       * ne revient que lorsqu'on revient vraiment à l'accueil. */
      const under = root.querySelector(".worlds");
      const tuck = () => { under.style.marginTop = `${-hero.offsetHeight}px`; }; // la liste glisse sous le hero
      tuck();
      ST.addEventListener("refreshInit", tuck);
      offs.push(() => { ST.removeEventListener("refreshInit", tuck); under.style.marginTop = ""; });
      const GATE = "+=90%";
      ST.create({ trigger: hero, start: "top top", end: GATE, pin: under, pinSpacing: true });
      const pz = gsap.timeline({ defaults: { ease: "none" } });
      pz.to([tagline, ...labels], { opacity: 0, duration: 0.12 }, 0)
        .to(name.cam, { c: 1, duration: 1, ease: "power2.inOut", onUpdate: name.draw }, 0)
        .to(name.cam, { z: 1, duration: 1, ease: "power3.in", onUpdate: name.draw }, 0)
        .to([tri, hero.querySelector(".hero__shade")], { opacity: 0, duration: 0.35, ease: "power1.inOut" }, 0.55);
      // une fois la porte passée, le hero (transparent) ne doit plus couvrir la liste ni capter le curseur
      const through = (p) => {
        hero.style.pointerEvents = p > 0.5 ? "none" : "";
        hero.style.visibility = p > 0.985 ? "hidden" : "";
      };
      ST.create({
        trigger: hero, start: "top top", end: GATE, pin: true, pinSpacing: false, scrub: true, animation: pz,
        onUpdate: (self) => through(self.progress),
        onLeave: () => through(1),
        onEnterBack: (self) => through(self.progress),
      });
      offs.push(() => through(0));
    }

    // légère inclinaison au curseur, comme avant
    if (canHover && !reduced) {
      const rx = gsap.quickTo(tri, "rotationX", { duration: 1.6, ease: "power3.out" });
      const ry = gsap.quickTo(tri, "rotationY", { duration: 1.6, ease: "power3.out" });
      const onMove = (e) => {
        ry((e.clientX / innerWidth - 0.5) * 4);
        rx((e.clientY / innerHeight - 0.5) * -2.6);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      offs.push(() => window.removeEventListener("pointermove", onMove));
    }

    /* ─── UNIVERS ─── */
    const worlds = root.querySelector(".worlds");
    const list = worlds.querySelector(".worlds__list");
    const items = [...worlds.querySelectorAll(".world")];
    const words = items.map((a) => a.querySelector(".world__word"));
    const bgMedia = [...worlds.querySelectorAll(".worlds__bg .media")];
    const labelsTxt = words.map(rollWord);
    // une seule taille pour les trois mots, calée sur le plus long
    const fit = () => list.style.setProperty("--world-fs", `${fitFont(labelsTxt, words[0].clientWidth, innerWidth * 0.155)}px`);
    fit();
    window.addEventListener("resize", fit);
    offs.push(() => window.removeEventListener("resize", fit));

    // les mots montent quand la porte s'ouvre (la liste est déjà en place derrière le hero), ou à l'arrivée de la liste
    // (position de scroll absolue : un déclencheur posé sur le hero épinglé serait décalé de toute la durée de l'épinglage)
    const at = (fb) => (reduced ? { trigger: list, start: fb } : { start: () => innerHeight * 0.62 });
    gsap.from(words.map((w) => w.querySelectorAll(".ch")), {
      yPercent: 110, duration: 1.5, ease: "expo.out", stagger: 0.03,
      scrollTrigger: at("top 78%"),
    });
    gsap.from(items.map((a) => [a.querySelector(".world__num"), a.querySelector(".world__desc")]).flat(), {
      opacity: 0, y: 16, duration: 1.2, ease: "expo.out", stagger: 0.06,
      scrollTrigger: at("top 75%"),
    });

    if (gl) liquid = gl.createLiquid(worlds, bgMedia.map((m) => m._slot));

    const activate = (i) => {
      items.forEach((a, j) => a.classList.toggle("is-active", j === i));
      list.classList.toggle("has-active", i >= 0);
      if (gl) gl.liquidTo(i);
      else bgMedia.forEach((m, j) => gsap.to(m, { opacity: j === i ? 1 : 0, scale: j === i ? 1 : 1.04, duration: 1.2, ease: "expo.out", overwrite: true }));
    };
    ctx.activateWorld = activate;

    if (canHover) {
      items.forEach((a, i) => a.addEventListener("pointerenter", () => activate(i)));
      list.addEventListener("pointerleave", () => activate(-1));
      if (liquid) {
        const mx = gsap.quickTo(mouse, "x", { duration: 1.1, ease: "power3.out" });
        const my = gsap.quickTo(mouse, "y", { duration: 1.1, ease: "power3.out" });
        const onMove = (e) => { mx(e.clientX / innerWidth); my(1 - e.clientY / innerHeight); };
        worlds.addEventListener("pointermove", onMove);
        const sync = () => liquid.u && !liquid.locked && liquid.u.uMouse.value.set(mouse.x, mouse.y);
        gsap.ticker.add(sync);
        offs.push(() => gsap.ticker.remove(sync));
      }
    } else {
      // écrans tactiles (pas de survol) : tant que la liste est à l'écran, les trois univers passent tour à tour derrière elle
      let timer = 0, k = -1;
      const step = () => { k = (k + 1) % items.length; activate(k); };
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !timer) { step(); timer = setInterval(step, 2600); }
        if (!e.isIntersecting && timer) { clearInterval(timer); timer = 0; k = -1; activate(-1); }
      }, { threshold: 0.35 });
      io.observe(list);
      offs.push(() => { io.disconnect(); clearInterval(timer); });
    }

    /* ─── SHOWREEL ─── */
    const reel = root.querySelector(".reel");
    const frame = reel.querySelector(".reel__frame");
    const rmedia = frame.querySelector(".media");
    const [w1, w2] = reel.querySelectorAll(".reel__title span");
    const rt = gsap.timeline({ defaults: { ease: "none" } });
    rt.fromTo(frame, { clipPath: "inset(31% 29% 31% 29%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0)
      .fromTo(rmedia, { scale: 1.45 }, { scale: 1, duration: 1 }, 0)
      // les deux mots s'écartent sans sortir de l'écran (moins sur téléphone)
      .fromTo(w1, { xPercent: 0 }, { xPercent: innerWidth < 600 ? -28 : -70, duration: 1 }, 0)
      .fromTo(w2, { xPercent: 0 }, { xPercent: innerWidth < 600 ? 28 : 70, duration: 1 }, 0)
      .fromTo(reel.querySelector(".reel__hint"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.75);
    ST.create({ trigger: reel, start: "top top", end: "+=140%", pin: true, scrub: 1, animation: rt });
    const openReel = () => ctx.lightbox.open([rmedia._slot], 0, rmedia);
    reel.addEventListener("click", openReel);
    offs.push(() => reel.removeEventListener("click", openReel));

    /* ─── CONTACT / PIED ─── */
    const big = root.querySelector(".footer__big");
    if (big) {
      const s = splitChars(big);
      splits.push(s);
      gsap.from(s.chars, { yPercent: 100, duration: 1.6, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: big, start: "top 95%" } });
    }

    reveals(root, splits);
  }, root);

  if (!reduced) offs.push(marquees(root));

  /** Entrée du hero : le nom chromé s'ouvre du centre et la lumière le traverse ; la phrase et les légendes se posent. */
  function intro(first) {
    const hero = root.querySelector(".hero");
    const tri = hero.querySelector(".hero__tri");
    const solo = hero.querySelector(".hero__solo video");
    if (solo) solo.currentTime = 0; // téléphone : le film commence sur le yacht quand l'accueil apparaît
    const tl = gsap.timeline();
    if (!reduced && name) {
      tl.fromTo(name.open, { h: 0 }, { h: name.full, duration: 1.6, ease: "expo.inOut", onUpdate: name.draw }, first ? 0.3 : 0.4)
        .fromTo(name.light, { x: -1 }, { x: 1, duration: 1.8, ease: "power2.inOut", onUpdate: name.draw }, first ? 1.2 : 1.3);
      // en arrivant d'une autre page, les films se posent comme avant ; à l'ouverture, intro.js les amène
      if (!first) {
        tl.fromTo(tri, { scale: 0.84, gap: "24px" }, { scale: 1, gap: "2px", duration: 2.6, ease: "expo.out" }, 0)
          .fromTo(hero.querySelectorAll(".hero__panel .media"), { scale: 1.2 }, { scale: 1, duration: 2.6, ease: "expo.out", immediateRender: false }, 0);
      }
    }
    tl.fromTo(hero.querySelector(".hero__tagline"), { opacity: 0, y: 12 }, { opacity: 0.85, y: 0, duration: 1.2, ease: "expo.out" }, 0.9)
      .fromTo(hero.querySelectorAll(".hero__label"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.12 }, 0.8);
    return tl;
  }

  function destroy({ keepLiquid = false } = {}) {
    offs.forEach((f) => f());
    splits.forEach((s) => s.revert());
    g.revert();
    if (gl && !keepLiquid) gl.destroyLiquid();
  }

  return { intro, destroy };
}
