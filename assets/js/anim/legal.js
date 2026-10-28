/* Pages juridiques : titre en lettres, sommaire, sections révélées. */
import { splitChars } from "./ui.js?v=27";
import { reveals } from "./reveal.js?v=27";

const gsap = window.gsap;

export function initLegal(ctx) {
  const { container: root } = ctx;
  const splits = [];
  const g = gsap.context(() => {
    root.querySelectorAll(".legal section, .legal__toc li").forEach((el) => {
      gsap.from(el, { opacity: 0, y: 30, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });
    reveals(root, splits);
  }, root);

  function intro() {
    const title = root.querySelector(".legal__title");
    const s = splitChars(title);
    splits.push(s);
    return gsap.timeline()
      .from(s.chars, { yPercent: 100, opacity: 0, filter: "blur(8px)", stagger: 0.025, duration: 1.2, ease: "expo.out" }, 0.05)
      .from(root.querySelector(".legal__date"), { opacity: 0, y: 12, duration: 1, ease: "expo.out" }, 0.4);
  }

  function destroy() {
    splits.forEach((s) => s.revert());
    g.revert();
  }

  return { intro, destroy };
}
