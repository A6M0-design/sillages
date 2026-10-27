/* Langue (EN par défaut, FR), nom de marque et champs remplis depuis config.js */

const SITE = window.SITE;
const STORE = "aline-lang";
let current = "en";

export function initialLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "fr") { saveLang(q); return q; }
  try {
    const s = localStorage.getItem(STORE);
    if (s === "en" || s === "fr") return s;
  } catch (e) {}
  return "en";
}

export function saveLang(lang) {
  try { localStorage.setItem(STORE, lang); } catch (e) {}
}

export function lang() { return current; }

export function t(key, l = current) {
  const d = SITE.i18n[l] || SITE.i18n.en;
  return d[key] ?? SITE.i18n.en[key] ?? "";
}

export function waLink(message) {
  return `https://wa.me/${SITE.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

function pick(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? null : o[k]), obj);
}

/** Remplit `root` dans la langue `l`. Appelé avant toute découpe de texte. */
export function applyI18n(root = document, l = current) {
  current = l;
  document.documentElement.lang = l;
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.dataset.i18n, l);
    if (el.classList.contains("link-roll")) {
      el.setAttribute("aria-label", v);
      el.querySelectorAll(":scope > span").forEach((s) => { s.textContent = v; });
    } else el.textContent = v;
  });
  root.querySelectorAll("[data-brand]").forEach((el) => { el.textContent = SITE.brand; });
  root.querySelectorAll("[data-year]").forEach((el) => { el.textContent = SITE.year; });
  root.querySelectorAll("[data-wa]").forEach((el) => { el.href = waLink(t(el.dataset.wa, l)); });
  root.querySelectorAll("[data-wa-display]").forEach((el) => { el.textContent = SITE.whatsapp.display; });
  root.querySelectorAll("[data-social]").forEach((el) => { el.href = SITE.social[el.dataset.social] || "#"; });
  root.querySelectorAll("[data-project]").forEach((el) => {
    const v = pick(SITE.projects, el.dataset.project);
    if (v != null) el.textContent = v;
  });
  root.querySelectorAll("[data-legal]").forEach((el) => {
    const v = SITE.legal[el.dataset.legal] ?? "";
    el.textContent = v;
    el.classList.toggle("todo", v.startsWith("["));
  });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
}

export function pageTitle(container) {
  const ns = container.dataset.barbaNamespace;
  const brand = SITE.brand;
  if (ns === "home") return `${brand} · ${t("footer.sign")}`;
  const h1 = container.querySelector("h1");
  const name = h1 ? h1.textContent.trim() : "";
  return `${name.toUpperCase()} · ${brand}`;
}
