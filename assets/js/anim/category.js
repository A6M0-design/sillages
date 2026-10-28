/*
 * Pages univers : titre-masque qui libère la vidéo, About Us mot à mot, portraits en profondeur,
 * galerie WebGL, photos en défilement horizontal, univers suivant qui s'approche.
 */
import { splitWords, splitChars, fitFont, gutter } from "./ui.js?v=27";
import { reveals } from "./reveal.js?v=27";
import { playSlot } from "../media.js?v=27";

const gsap = window.gsap;
const ST = window.ScrollTrigger;

function bindHover(card, media, canHover) {
  if (!canHover) return () => {};
  const enter = () => {
    playSlot(media._slot, true);
    gsap.to(media, { scale: 1.035, duration: 1.4, ease: "expo.out", overwrite: true });
  };
  const leave = () => {
    playSlot(media._slot, false);
    gsap.to(media, { scale: 1, duration: 1.4, ease: "expo.out", overwrite: true });
  };
  card.addEventListener("pointerenter", enter);
  card.addEventListener("pointerleave", leave);
  return () => {
    card.removeEventListener("pointerenter", enter);
    card.removeEventListener("pointerleave", leave);
  };
}

export function initCategory(ctx) {
  const { container: root, canHover, via } = ctx;
  const offs = [];
  const splits = [];
  const desktop = matchMedia("(min-width: 901px)").matches;

  const hero = root.querySelector(".c-hero");
  const mask = hero.querySelector(".c-hero__mask");
  const word = hero.querySelector(".c-hero__word");
  const hmedia = hero.querySelector(".media");
  const meta = hero.querySelector(".c-hero__meta");
  // titres A LINE calés sur la largeur de l'écran
  const nextWord = root.querySelector(".c-next__word");
  const fit = () => {
    const avail = innerWidth - 2 * gutter();
    hero.style.setProperty("--hero-fs", `${fitFont([word.textContent], avail, innerWidth * 0.21)}px`);
    if (nextWord) nextWord.style.setProperty("--next-fs", `${fitFont([nextWord.textContent], avail, innerWidth * 0.16)}px`);
  };
  fit();
  window.addEventListener("resize", fit);
  offs.push(() => window.removeEventListener("resize", fit));

  const g = gsap.context(() => {
    /* ─── HERO : le titre blanc sur le film ; au scroll il monte et s'efface, le film reste ─── */
    const ht = gsap.timeline({ defaults: { ease: "none" } });
    ht.fromTo(mask, { yPercent: 0, opacity: 1 }, { yPercent: -18, opacity: 0, duration: 0.6, ease: "power1.in", immediateRender: false }, 0)
      .fromTo(hmedia, { scale: 1 }, { scale: 1.08, duration: 1 }, 0)
      .to(meta, { opacity: 0, y: 20, duration: 0.2 }, 0);
    ST.create({ trigger: hero, start: "top top", end: "+=130%", pin: true, scrub: 1, animation: ht });

    /* ─── ABOUT ─── */
    const text = root.querySelector(".c-about__text");
    const sw = splitWords(text);
    splits.push(sw);
    gsap.to(sw.words, {
      opacity: 1, stagger: 0.06, ease: "none",
      scrollTrigger: { trigger: text, start: "top 82%", end: "bottom 50%", scrub: true },
    });
    const duo = root.querySelector(".c-about__duo");
    root.querySelectorAll(".portrait").forEach((p, i) => {
      const m = p.querySelector(".media");
      const st = { trigger: p, start: "top 86%" };
      gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut", scrollTrigger: st });
      gsap.fromTo(m.firstElementChild, { scale: 1.4 }, { scale: 1, duration: 2.4, ease: "expo.out", scrollTrigger: st });
      if (desktop) {
        // deux plans de profondeur : Romeo, plus proche, défile plus vite
        gsap.fromTo(p, { yPercent: i ? 34 : 12 }, {
          yPercent: i ? -34 : -12, ease: "none",
          scrollTrigger: { trigger: duo, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    });
    gsap.fromTo(root.querySelector(".c-about__bg"), { yPercent: -10 }, {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: root.querySelector(".c-about"), start: "top bottom", end: "bottom top", scrub: true },
    });

    /* ─── PHOTOS : mur de galerie ─── */
    const stills = root.querySelector(".stills");
    const wall = stills && wallLayout(stills);
    if (wall) offs.push(wall.destroy);

    /* ─── GALERIE ─── */
    const galleries = {};
    root.querySelectorAll("[data-gallery]").forEach((gEl) => {
      const cards = [...gEl.querySelectorAll("[data-lightbox]")];
      galleries[gEl.dataset.gallery] = cards;
      cards.forEach((card, i) => {
        const m = card.querySelector(".media");
        const inner = card.querySelector(".card__inner");
        // dans le mur de photos, les images d'une même rangée se dévoilent l'une après l'autre
        const row = card.closest(".stills__row");
        const st = { trigger: card, start: "top 90%" };
        const delay = row ? [...row.children].indexOf(card) * 0.08 : 0;
        // volet net de bas en haut, l'image se pose en même temps : une seule direction, pas de rebond
        gsap.fromTo(inner, { clipPath: "inset(100% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", delay, scrollTrigger: st,
        });
        gsap.fromTo(m, { scale: 1.2 }, { scale: 1, duration: 2.2, ease: "expo.out", delay: delay + 0.15, scrollTrigger: st, immediateRender: false });
        offs.push(bindHover(card, m, canHover));
        const open = (e) => {
          e.preventDefault();
          ctx.lightbox.open(cards.map((c) => c.querySelector(".media")._slot), i, m);
        };
        card.addEventListener("click", open);
        offs.push(() => card.removeEventListener("click", open));
      });
    });

    // compteur de projets
    const count = root.querySelector(".c-work__count");
    if (count) {
      const n = { v: 0 };
      gsap.to(n, {
        v: Number(count.dataset.count) || 0, duration: 1.6, ease: "power3.out",
        onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(2, "0")),
        scrollTrigger: { trigger: count, start: "top 90%" },
      });
    }

    /* ─── UNIVERS SUIVANT ─── */
    const next = root.querySelector(".c-next");
    const link = next.querySelector("[data-next]");
    const nword = next.querySelector(".c-next__word");
    const nmedia = next.querySelector(".c-next__media");
    const bar = next.querySelector(".c-next__bar b");
    let fired = false;
    const nt = gsap.timeline({ defaults: { ease: "none" } });
    nt.fromTo(nword, { scale: 0.3 }, { scale: 1.12, duration: 1 }, 0)
      .fromTo(nmedia, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 1 }, 0)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
    ST.create({
      trigger: next, start: "top top", end: "bottom bottom", scrub: 0.6, animation: nt,
      onUpdate: (self) => {
        if (!fired && self.progress > 0.985 && self.direction > 0) {
          fired = true;
          ctx.go(link.getAttribute("href"), link);
        }
      },
    });

    reveals(root, splits);
  }, root);

  function intro() {
    const tl = gsap.timeline();
    if (via !== "world") {
      const s = splitChars(word);
      splits.push(s);
      tl.from(s.chars, { yPercent: 110, duration: 1.6, ease: "expo.out", stagger: 0.05 }, 0.05)
        .from(hmedia, { scale: 1.25, duration: 2.4, ease: "expo.out" }, 0)
        .from(meta, { opacity: 0, y: 20, duration: 1.2, ease: "expo.out" }, 0.6);
    }
    return tl;
  }

  function destroy() {
    offs.forEach((f) => f());
    splits.forEach((s) => s.revert());
    g.revert();
  }

  return { intro, destroy };
}

/**
 * Mur de photos « justifié » : on remplit chaque rangée jusqu'à la largeur du conteneur,
 * puis on ajuste sa hauteur pour qu'elle tombe juste. Les photos gardent leur format.
 * Seules les premières rangées sont visibles ; le bouton déplie le reste sur place.
 */
function wallLayout(stills) {
  const track = stills.querySelector(".stills__track");
  const more = stills.querySelector(".stills__more");
  const cards = [...track.querySelectorAll(".card")];
  if (!cards.length) return null;
  const ratio = (c) => {
    const [w, h] = (c.querySelector(".media").dataset.ratio || "4:5").split(":").map(Number);
    return w / h || 0.8;
  };
  const ar = cards.map(ratio);
  const VISIBLE = 3;
  let open = false, lastW = 0;

  function layout() {
    const W = track.clientWidth;
    if (!W || W === lastW) return;
    lastW = W;
    const gap = parseFloat(getComputedStyle(stills).getPropertyValue("--sg")) || 12;
    const target = innerWidth > 900 ? Math.min(Math.max(innerHeight * 0.36, 240), 420) : 150;
    const rows = [];
    let cur = [], sum = 0;
    cards.forEach((c, i) => {
      cur.push(i); sum += ar[i];
      if (sum * target + gap * (cur.length - 1) >= W) { rows.push({ idx: cur, h: (W - gap * (cur.length - 1)) / sum }); cur = []; sum = 0; }
    });
    // dernière rangée incomplète : hauteur normale, pas étirée
    if (cur.length) rows.push({ idx: cur, h: target });
    track.replaceChildren(...rows.map((r, k) => {
      const row = document.createElement("div");
      row.className = "stills__row" + (!open && k >= VISIBLE ? " is-folded" : "");
      r.idx.forEach((i) => {
        cards[i].style.width = `${(ar[i] * r.h).toFixed(1)}px`;
        cards[i].style.height = `${r.h.toFixed(1)}px`;
        row.appendChild(cards[i]);
      });
      return row;
    }));
    const hidden = rows.slice(VISIBLE).reduce((n, r) => n + r.idx.length, 0);
    more.hidden = open || hidden === 0;
    more.querySelector(".stills__n").textContent = `( ${String(cards.length).padStart(2, "0")} )`;
  }

  const unfold = () => {
    open = true;
    const rows = [...track.querySelectorAll(".stills__row.is-folded")];
    rows.forEach((r) => r.classList.remove("is-folded"));
    more.hidden = true;
    // les volets de chaque photo (voir GALERIE) se jouent d'eux-mêmes en entrant dans l'écran
    ST.refresh();
  };
  more.addEventListener("click", unfold);
  let t = 0;
  const onResize = () => { clearTimeout(t); t = setTimeout(() => { layout(); ST.refresh(); }, 150); };
  window.addEventListener("resize", onResize);
  layout();
  return { destroy: () => { more.removeEventListener("click", unfold); window.removeEventListener("resize", onResize); } };
}
