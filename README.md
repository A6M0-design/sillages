# SILLAGES — Romeo · Valentin (version 3)

Site vitrine statique (HTML/CSS/JS, sans étape de build). Tout est hébergé dans le dossier : aucun CDN, aucun cookie.
Trois univers : **Yacht**, **Automobile**, **Aviation** (jets privés). La catégorie Art de la v2 n'existe plus.
La v2 (A LINE) reste intacte dans `../v2/`.

## Voir le site en local

```bash
python3 "projets/site SILLAGES/serve.py"
```

Puis ouvrir http://localhost:8765/v3/. Le site ne fonctionne pas en double-cliquant sur le fichier : il faut un serveur, même local.
`serve.py` demande au navigateur de toujours revérifier les fichiers : un simple rechargement montre la dernière version.

## Identité (charte SILLAGES)

La charte complète est dans `Desktop/SILLAGES/SILLAGES/03_CHARTE/README.md`. Sur le site :

- **Logo** : le nom SILLAGES définitif (`01_LOGO/LOGO_DEFINITIF/SANS_FOND`), A sans barre, en aplat papier (`assets/brand/`).
  Aucune ligne ni aucun filet. Les lettres sont dans `letters.js` ; l'ouverture du A (traversée au scroll) est `GATE` dans `name.js`.
- **Polices** : SILLAGES (titres, capitales seules ; Y redessiné en oct. 2026), Hanken Grotesk (texte), tout en capitales.
- **Couleurs** : thème Ardoise (surface `#1e2429`, ardoise-nuit `#1a1f24`, encre papier `#e8e7e3`, pierre `#b4bcc3`).
- **Menu** : en haut à gauche, le monogramme (le S en chrome, `assets/brand/monogramme.svg`), pas le nom complet.
  Transparent sur l'ouverture plein écran ; dès que le contenu passe dessous, il prend un fond ardoise (sans filet).
- **Ouverture de l'accueil** (`assets/js/anim/intro.js`), à partir des fichiers fixes :
  1. sur le fond uni (ardoise), le film du monogramme, joué 2,2 × plus vite que le fichier. Deux versions, au choix
     avec `introFilm` dans `config.js` :
     - `sans-fond` (par défaut) : `05_ANIMATION/CARROSSERIE_MONOGRAMME_SANS_FOND`, vraie transparence, sans sol ni reflet
       (`media/brand/intro-monogramme-sans-fond.webm` pour Chrome / Firefox, `.mov` HEVC pour Safari et l'iPhone) ;
     - `fond` : `05_ANIMATION/CARROSSERIE_MONOGRAMME`, fond noir et reflet au sol (`intro-monogramme.mp4`, `-1280.mp4`
       pour les mobiles) ; un petit canvas WebGL rend le noir transparent (`filmgl.js`) et le reflet s'efface avant le départ.
     Le monogramme du film part vers le menu ; en route, le monogramme fixe, posé exactement dessus, prend le relais
     (réglages `FILM` dans `intro.js` : vitesse, moment du départ, place du monogramme).
     Si le film ne peut pas jouer, le monogramme fixe apparaît seul ;
  2. il rejoint sa place en haut à gauche, dans le menu ; en même temps le fond s'efface, le triptyque arrive
     vers nous et le nom chromé s'ouvre du centre, traversé par une lumière.
- **Passage vers la liste des univers** (`assets/js/anim/home.js`, `name.js`) : la liste attend, immobile, juste
  derrière l'accueil. Au scroll, la caméra avance vers le A du nom, de plus en plus vite, et passe par son ouverture ;
  les films s'effacent. La traversée se termine sur 90 % d'un écran de scroll, avec la liste déjà en place : ensuite
  seulement la page défile. En remontant, le nom ne revient que lorsqu'on revient vraiment sur l'accueil.
  La liste a son fond liquide WebGL, comme en v2.
- **Nom de l'accueil** : `nameChrome` dans `config.js` (`blanc` par défaut : le logo blanc de LOGO_DEFINITIF, en aplat,
  sans chrome). Chromes possibles : `ardoise` (le chrome teinté à la couleur de la marque, avec un voile doux derrière le nom). Niveaux sombres (`01_LOGO/LOGO/CHROMES_SOMBRES`) : `sombre-15` à `sombre-72`. Autres variantes : `nuit`, `sombre`, `ardoise`,
  `neutre`, `froid`, `fort`, `miroir`, `doux`, `tube`, ou `aplat` (logo papier). Pour comparer sans
  toucher au fichier : `?chrome=froid`, etc. (le « chaud » champagne est écarté : jamais de doré).
- **Pages univers** : au clic dans la liste, le mot grandit jusqu'à remplir l'écran, sur le film de l'univers, et reste
  tel quel à l'arrivée (blanc sur le film, sans incrustation). Au scroll, il monte et s'efface ; le film reste.

  Les S ne sont pas animés : ils accueilleront plus tard nos vidéos (sillage d'un bateau vu du ciel, voiture sur une route en S).
  Les lettres du logo sont dans `assets/js/anim/letters.js`.

## Modifier le contenu : `assets/js/config.js`

C'est le seul fichier à toucher.

- **Version** : `version`. À augmenter de 1 quand on remplace une vidéo ou une photo par un fichier du même nom :
  les navigateurs qui gardaient l'ancienne en mémoire reprennent la nouvelle. (Après une modification du code,
  augmenter aussi le `?v=` des fichiers `.js` / `.css`, dans les pages HTML et les `import`.)

- **WhatsApp** : `whatsapp.number` (format international sans + ni espaces, ex. `33612345678`) et `whatsapp.display`.
- **Vidéos et photos** : bloc `media`, un bloc par univers (`yacht`, `auto`, `aviation`) :
  - `landing` : panneau vertical du triptyque (9:16 ; pour l'automobile, montage de plans du film Drive City :
    portière ouverte, virage devant DriveCity, feux arrière, arrivée, départ), `hero` : plein écran (fond liquide de la liste, tête de page), `about` : fond d'About Us
  - `portraitA` / `portraitB` : portraits de Valentin et Romeo (4:5)
  - `films` : liste libre `{ src, poster, ratio, title, meta }`, la grille se compose seule (horizontal / vertical)
  - `stills` : liste libre `{ src, ratio }` pour les photos ; elles forment un mur de galerie (rangées à hauteur égale,
    trois rangées puis « Voir toutes les photos »)
  - `showreel` : `src` = boucle muette, `full` = version avec le son ouverte au clic

  Les fichiers web sont dans `v3/media/` (versions allégées de vos originaux, qui restent intacts dans `../yacht`, `../voitures`).
  Pour un nouveau fichier : vidéo en `.mp4` H.264, 1920 px max (1080 px de large pour du vertical),
  photo en `.jpg` 2400 px max. Les films au format cinéma prennent `ratio: "47:20"`, ce qui rogne les bandes noires.
  **Aviation** : `landing` = montage des clips verticaux de `../aviation/videos` (jet au sol porte qui s'ouvre, puis deux plans
  au-dessus de la côte) ; `hero` = le plan horizontal (jet face caméra au-dessus des nuages), en boucle sans coupure.
  `about` reprend ce plan ; `films` = les 4 clips du dossier ; pas de photos (le bloc Photos n'apparaît pas).
- **Cases vides** : aucune. Les grilles n'affichent que les films et photos déclarés ; un portrait à `null` disparaît
  (sans portraits, le texte About prend la largeur).
- **Textes EN / FR** : `i18n.en` et `i18n.fr` (clés `aviation.*` pour la nouvelle page).
- **Mentions légales** : `legal`, remplacer chaque `[À COMPLÉTER]` (statut, SIRET, adresse, e-mail, hébergeur).

## En ligne

Le site est publié avec GitHub Pages : **https://a6m0-design.github.io/sillages/** (dépôt `A6M0-design/sillages`, branche `main`).
Pour publier une modification : augmenter `version` dans `config.js` (et le `?v=` des fichiers si le code a changé), puis
`git add -A && git commit -m "…" && git push`. Le site en ligne se met à jour en une à deux minutes.

## Sécurité et référencement

- **Aucun secret** dans le site ni dans l'historique git (vérifié le 27 oct. 2026) : pas de clé, pas de `.env`, pas de serveur.
  Ne jamais mettre de clé API dans `config.js` : tout ce qui est dans ce dossier est public.
- **Photos** : avant d'ajouter une photo, retirer ses métadonnées (GPS du drone ou du téléphone, appareil, auteur).
  Lightroom : Exporter › Métadonnées › « Copyright uniquement » et décocher « Informations de position ».
- **Politique de sécurité** (CSP) et `referrer` posés dans chaque page (GitHub Pages ne permet pas d'en-têtes serveur).
  Si l'on modifie l'`importmap` d'une page, recalculer son empreinte `sha256` dans la CSP, sinon le site ne démarre plus.
- `?debug` ne répond qu'en local. Three.js (WebGL) n'est téléchargé que sur ordinateur.
- **SEO** : titre, description, canonical, Open Graph (`assets/brand/og-image.jpg`, 1200 × 630) sur chaque page,
  données structurées (Organization) sur l'accueil, `404.html`, `robots.txt`, `sitemap.xml`, `llms.txt`.
  Les adresses absolues visent `https://a6m0-design.github.io/sillages/` : à remplacer partout le jour d'un nom de domaine.

## À compléter

- Ajouter les portraits de Romeo et Valentin et des photos Aviation. (WhatsApp : +32 486 62 92 07 ; Instagram : @sillages.films.)
- Faire relire les mentions légales et la politique de confidentialité (ce sont des modèles, pas un avis juridique).

## Tests utiles

- `?debug` : expose `window.__site` et `window.__intro` (la timeline de l'ouverture, tests uniquement).
- `?gl=0` : force la version sans WebGL (celle des mobiles et des appareils peu puissants).
- `?lang=fr` / `?lang=en`.
