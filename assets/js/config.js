/*
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURATION DU SITE — le seul fichier à modifier
 * ─────────────────────────────────────────────────────────────
 *  · Nom de marque : `brand` (le logo, lui, est un dessin : assets/brand/)
 *  · WhatsApp     : numéro au format international, sans + ni espaces
 *  · Médias       : voir le bloc `media` plus bas (chemins relatifs au dossier v3).
 *                   Tant qu'un emplacement est null, un bloc étiqueté s'affiche.
 *  · Juridique    : remplacer chaque "[À COMPLÉTER]"
 */
window.SITE = {
  brand: "SILLAGES",
  // numéro de version des fichiers : à augmenter quand on remplace une vidéo ou une photo (le navigateur reprend la nouvelle)
  version: 26,
  // nom sur l'accueil : blanc (aplat, sans chrome), ou un chrome : nuit, sombre, ardoise, neutre, froid, fort, miroir, doux, tube, ou aplat (papier)
  nameChrome: "blanc",
  // film du monogramme à l'ouverture : "sans-fond" (vraie transparence, sans sol ni reflet) ou "fond" (fond noir, reflet au sol)
  introFilm: "sans-fond",
  team: ["Romeo", "Valentin"],
  year: 2026,

  whatsapp: {
    number: "32486629207",
    display: "+32 486 62 92 07",
  },

  social: {
    instagram: "https://www.instagram.com/sillages.films/",
  },

  legal: {
    status: "[À COMPLÉTER — ex. Entrepreneurs individuels / SAS]",
    siret: "[À COMPLÉTER]",
    address: "[À COMPLÉTER — adresse postale]",
    email: "[À COMPLÉTER — contact@domaine.com]",
    director: "Romeo [NOM] · Valentin [NOM]",
    host: "[À COMPLÉTER — ex. Netlify, Inc.]",
    hostAddress: "[À COMPLÉTER — adresse de l'hébergeur]",
    hostPhone: "[À COMPLÉTER]",
    updated: "23/10/2026",
  },

  /*
   * Médias — chemins relatifs au dossier v3.
   * Une entrée peut être :
   *   · null                          → bloc étiqueté (emplacement vide)
   *   · "media/yacht/hero.mp4"        → fichier simple
   *   · { src, poster, full, ratio }  → src : fichier affiché,
   *                                      full : version ouverte avec le son dans la lightbox,
   *                                      poster : image affichée avant lecture,
   *                                      ratio : "16:9", "9:16", "47:20" (cinéma 2,35)…
   *                                      les bandes noires éventuelles sont rognées par ce cadrage
   * Les listes `films` et `stills` acceptent autant d'éléments que vous voulez :
   * la grille se compose toute seule, avec exactement ce qu'il y a (aucune case vide).
   * Pour réserver des places en attendant des fichiers, mettre `minFilms` / `minStills` au nombre voulu.
   */
  minFilms: 0,
  minStills: 0,
  media: {
    yacht: {
      landing: { src: "media/yacht/landing.mp4", ratio: "9:16" },
      hero: "media/yacht/hero.mp4",
      about: "media/yacht/about.mp4",
      portraitA: null,
      portraitB: null,
      films: [
        { src: "media/yacht/show.mp4", poster: "media/yacht/show.jpg", ratio: "47:20", title: "Show Yacht", meta: "R&V Production · 2026" },
        { src: "media/yacht/kensho.mp4", poster: "media/yacht/kensho.jpg", ratio: "9:16", title: "Kensho", meta: "Superyacht · 2025" },
        { src: "media/yacht/maluca.mp4", poster: "media/yacht/maluca.jpg", ratio: "47:20", title: "Maluca — Take my mind", meta: "R&V Production · 2025" },
        { src: "media/yacht/amo.mp4", poster: "media/yacht/amo.jpg", ratio: "9:16", title: "Amo Yachts — Summer 25", meta: "amoyachts.com · 2025" },
      ],
      stills: [
        { src: "media/photos/yacht/dji_20260710122125_0002_d.jpg", ratio: "3:2" },
        { src: "media/photos/yacht/5.jpg", ratio: "9:16" },
        { src: "media/photos/yacht/2.jpg", ratio: "4:3" },
        { src: "media/photos/yacht/7.jpg", ratio: "16:9" },
        { src: "media/photos/yacht/10.jpg", ratio: "2:3" },
        { src: "media/photos/yacht/8.jpg", ratio: "4:3" },
        { src: "media/photos/yacht/1.jpg", ratio: "16:9" },
        { src: "media/photos/yacht/6.jpg", ratio: "9:16" },
        { src: "media/photos/yacht/3.jpg", ratio: "4:3" },
        { src: "media/photos/yacht/4.jpg", ratio: "16:9" },
        { src: "media/photos/yacht/9.jpg", ratio: "4:3" },
        { src: "media/photos/yacht/11.jpg", ratio: "16:9" },
      ],
    },
    auto: {
      landing: { src: "media/auto/landing.mp4", ratio: "9:16" },
      hero: "media/auto/hero.mp4",
      about: "media/auto/about.mp4",
      portraitA: null,
      portraitB: null,
      films: [
        { src: "media/auto/zgp.mp4", poster: "media/auto/zgp.jpg", ratio: "16:9", title: "Porsche — ZGP", meta: "Event · 2025" },
        { src: "media/auto/drivecity.mp4", poster: "media/auto/drivecity.jpg", ratio: "9:16", title: "Drive City — Event", meta: "McLaren · 2025" },
      ],
      stills: [
        { src: "media/photos/auto/dsc00149.jpg", ratio: "16:9" },
        { src: "media/photos/auto/dsc01409.jpg", ratio: "2:3" },
        { src: "media/photos/auto/dsc03444.jpg", ratio: "16:9" },
        { src: "media/photos/auto/dsc_1088.jpg", ratio: "2:3" },
        { src: "media/photos/auto/dsc09130.jpg", ratio: "1:1" },
        { src: "media/photos/auto/dsc03315.jpg", ratio: "2:3" },
        { src: "media/photos/auto/design.jpg", ratio: "16:9" },
        { src: "media/photos/auto/dsc03599.jpg", ratio: "9:16" },
        { src: "media/photos/auto/dsc_0009.jpg", ratio: "4:3" },
        { src: "media/photos/auto/dsc05816.jpg", ratio: "2:3" },
        { src: "media/photos/auto/dsc_1108.jpg", ratio: "2:3" },
        { src: "media/photos/auto/img_1964.jpg", ratio: "9:16" },
        { src: "media/photos/auto/dsc03321.jpg", ratio: "2:3" },
        { src: "media/photos/auto/dsc_0068.jpg", ratio: "1:1" },
        { src: "media/photos/auto/dsc05817.jpg", ratio: "2:3" },
        { src: "media/photos/auto/dsc_1150.jpg", ratio: "2:3" },
      ],
    },
    aviation: {
      landing: { src: "media/aviation/landing.mp4", ratio: "9:16" },
      hero: "media/aviation/hero.mp4",
      about: "media/aviation/hero.mp4",
      portraitA: null,
      portraitB: null,
      films: [
        { src: "media/aviation/nuages.mp4", poster: "media/aviation/nuages.jpg", ratio: "16:9", title: "Above the clouds", meta: "Private aviation · 2026" },
        { src: "media/aviation/g700.mp4", poster: "media/aviation/g700.jpg", ratio: "9:16", title: "G700 — Boarding", meta: "Private aviation · 2026" },
        { src: "media/aviation/cote.mp4", poster: "media/aviation/cote.jpg", ratio: "9:16", title: "Coastline — Flight", meta: "Private aviation · 2026" },
        { src: "media/aviation/virage.mp4", poster: "media/aviation/virage.jpg", ratio: "9:16", title: "Coastline — Bank", meta: "Private aviation · 2026" },
      ],
      stills: [],
    },
    // boucle muette au scroll ; `full` s'ouvre avec le son au clic
    showreel: { src: "media/yacht/hero.mp4", full: "media/yacht/show.mp4", poster: "media/yacht/show.jpg", ratio: "47:20" },
  },

  /* Ordre de navigation infinie entre les univers */
  categories: [
    { id: "yacht", url: "yacht.html" },
    { id: "auto", url: "auto.html" },
    { id: "aviation", url: "aviation.html" },
  ],

  /* ─── Textes ─── */
  i18n: {
    en: {
      "nav.work": "Films",
      "nav.contact": "Contact",
      "nav.home": "Home",
      "loader.by": "Romeo · Valentin · Filmmakers",
      "hero.tagline": "Moving images for the sea, the road and the sky",
      "hero.scroll": "Scroll",
      "cat.yacht": "Yacht",
      "cat.auto": "Automotive",
      "cat.aviation": "Aviation",
      "list.overline": "Three worlds, one eye",
      "list.yacht": "Superyachts, regattas and life on deck.",
      "list.auto": "Launch films, track days and collector cars.",
      "list.aviation": "Private jets, take-offs and life on board.",
      "showreel.overline": "Showreel",
      "showreel.title": "Reel 2026",
      "showreel.play": "Play",
      "clients.overline": "They trusted us",
      "contact.marquee": "Let's make a film",
      "contact.title": "Tell us about your project",
      "contact.cta": "Write to us on WhatsApp",
      "contact.wa": "Hello Romeo and Valentin, we would like to talk about a project.",
      "footer.legal": "Legal notice",
      "footer.privacy": "Privacy",
      "footer.sign": "Romeo · Valentin",
      "footer.rights": "All rights reserved",
      "cursor.view": "View",
      "cursor.play": "Play",
      "cursor.drag": "Drag",
      "cursor.next": "Next",

      "about.overline": "About us",
      "about.roleA": "Filmmaker",
      "about.roleB": "Filmmaker",
      "work.overline": "Latest productions",
      "work.title": "Recent work",
      "work.photos": "Stills",
      "work.more": "See all stills",
      "work.film": "Film",
      "work.photo": "Photo",
      "catcontact.overline": "Contact us",
      "next.overline": "Next world",
      "next.hint": "Keep scrolling",

      "yacht.hero.sub": "Superyachts · Charters · Regattas",
      "yacht.about.title": "We film the sea the way owners feel it.",
      "yacht.about.text": "We are Romeo and Valentin, two filmmakers who grew up close to the water. For shipyards, charter brands and owners, we shoot yachts at sea and at anchor: drone runs at golden hour, quiet interiors, the crew at work. We travel light and stay out of the way, so the boat and the people on it stay the story.",
      "yacht.contact.title": "A yacht to film",
      "yacht.contact.wa": "Hello Romeo and Valentin, we have a yacht project to discuss.",

      "auto.hero.sub": "Launch films · Track · Collectors",
      "auto.about.title": "We chase light, speed and the sound of the engine.",
      "auto.about.text": "We are Romeo and Valentin. We make films for brands, dealers and collectors: car-to-car tracking shots, night sessions, details that only show up in macro. Every film is planned with you and shot as a pair, one of us on the camera car, one of us on the ground.",
      "auto.contact.title": "A car to film",
      "auto.contact.wa": "Hello Romeo and Valentin, we have an automotive project to discuss.",

      "aviation.hero.sub": "Private jets · Charter · Air to air",
      "aviation.about.title": "We film the moment an aircraft leaves the ground.",
      "aviation.about.text": "We are Romeo and Valentin. For private jet operators, brokers and owners, we film aircraft on the ground and in flight: the walk to the steps at first light, the cabin before take-off, the climb above the clouds. Every shoot is planned with the crew and the airport, so the aircraft stays the story.",
      "aviation.contact.title": "An aircraft to film",
      "aviation.contact.wa": "Hello Romeo and Valentin, we have an aviation project to discuss.",

      "legal.title": "Legal notice",
      "privacy.title": "Privacy policy",
      "legal.updated": "Last updated",
      "legal.back": "Back to home",
      "lightbox.prev": "Prev",
      "lightbox.next": "Next",
      "lightbox.close": "Close",
    },

    fr: {
      "nav.work": "Films",
      "nav.contact": "Contact",
      "nav.home": "Accueil",
      "loader.by": "Romeo · Valentin · Vidéastes",
      "hero.tagline": "Des images pour la mer, la route et le ciel",
      "hero.scroll": "Défiler",
      "cat.yacht": "Yacht",
      "cat.auto": "Automobile",
      "cat.aviation": "Aviation",
      "list.overline": "Trois mondes, un regard",
      "list.yacht": "Superyachts, régates et vie à bord.",
      "list.auto": "Films de lancement, circuits et voitures de collection.",
      "list.aviation": "Jets privés, décollages et vie à bord.",
      "showreel.overline": "Showreel",
      "showreel.title": "Reel 2026",
      "showreel.play": "Lecture",
      "clients.overline": "Ils nous ont fait confiance",
      "contact.marquee": "Faisons un film",
      "contact.title": "Parlez-nous de votre projet",
      "contact.cta": "Nous écrire sur WhatsApp",
      "contact.wa": "Bonjour Romeo et Valentin, nous aimerions parler d'un projet.",
      "footer.legal": "Mentions légales",
      "footer.privacy": "Confidentialité",
      "footer.sign": "Romeo · Valentin",
      "footer.rights": "Tous droits réservés",
      "cursor.view": "Voir",
      "cursor.play": "Lire",
      "cursor.drag": "Glisser",
      "cursor.next": "Suite",

      "about.overline": "À propos",
      "about.roleA": "Vidéaste",
      "about.roleB": "Vidéaste",
      "work.overline": "Nos dernières productions",
      "work.title": "Projets récents",
      "work.photos": "Photographies",
      "work.more": "Voir toutes les photos",
      "work.film": "Film",
      "work.photo": "Photo",
      "catcontact.overline": "Nous contacter",
      "next.overline": "Univers suivant",
      "next.hint": "Continuez à défiler",

      "yacht.hero.sub": "Superyachts · Charter · Régates",
      "yacht.about.title": "Nous filmons la mer comme les propriétaires la vivent.",
      "yacht.about.text": "Nous sommes Romeo et Valentin, deux vidéastes qui ont grandi près de l'eau. Pour les chantiers, les marques de charter et les propriétaires, nous filmons les yachts en mer et au mouillage : passages en drone à l'heure dorée, intérieurs calmes, équipage au travail. Nous voyageons léger et restons discrets, pour que le bateau et ceux qui le font vivre restent l'histoire.",
      "yacht.contact.title": "Un yacht à filmer",
      "yacht.contact.wa": "Bonjour Romeo et Valentin, nous avons un projet yacht à vous présenter.",

      "auto.hero.sub": "Films de lancement · Circuit · Collection",
      "auto.about.title": "Nous suivons la lumière, la vitesse et le son du moteur.",
      "auto.about.text": "Nous sommes Romeo et Valentin. Nous réalisons des films pour les marques, les concessions et les collectionneurs : travellings voiture à voiture, sessions de nuit, détails qu'on ne voit qu'en macro. Chaque film est préparé avec vous et tourné à deux, l'un dans la voiture caméra, l'autre au sol.",
      "auto.contact.title": "Une voiture à filmer",
      "auto.contact.wa": "Bonjour Romeo et Valentin, nous avons un projet automobile à vous présenter.",

      "aviation.hero.sub": "Jets privés · Charter · Air-air",
      "aviation.about.title": "Nous filmons l'instant où l'avion quitte le sol.",
      "aviation.about.text": "Nous sommes Romeo et Valentin. Pour les opérateurs de jets privés, les courtiers et les propriétaires, nous filmons les avions au sol et en vol : l'arrivée au pied de la passerelle à l'aube, la cabine avant le décollage, la montée au-dessus des nuages. Chaque tournage est préparé avec l'équipage et l'aéroport, pour que l'avion reste le sujet.",
      "aviation.contact.title": "Un avion à filmer",
      "aviation.contact.wa": "Bonjour Romeo et Valentin, nous avons un projet aviation à vous présenter.",

      "legal.title": "Mentions légales",
      "privacy.title": "Politique de confidentialité",
      "legal.updated": "Dernière mise à jour",
      "legal.back": "Retour à l'accueil",
      "lightbox.prev": "Préc.",
      "lightbox.next": "Suiv.",
      "lightbox.close": "Fermer",
    },
  },
};
