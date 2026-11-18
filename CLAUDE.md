# CLAUDE.md : Diaspora Routes

Ce fichier guide Claude Code sur ce dépôt. Lis-le en entier avant de toucher au code.

## Le projet en bref

Diaspora Routes aide les familles de la diaspora à savoir **quand réserver** leurs billets d'avion entre la France et l'Algérie (Aïd, été, vacances scolaires).
Le site affiche, pour un trajet et une famille donnés : le prix total, un conseil (réserve / surveille / attends), une explication et l'option moins chère.

- Public : familles de la diaspora, souvent sur mobile, arrivant depuis un lien WhatsApp ou Facebook.
- Langue : **français** uniquement pour le MVP. Prévoir la structure pour l'arabe (RTL) plus tard, sans l'implémenter.
- Ton : chaleureux et respectueux. N'emploie pas « le bled », que certains lecteurs trouvent péjoratif : dis « l'Algérie », « au pays » ou le nom de la ville.
- Auteur : Mohamed Amine Benhamaid (GitHub : AmineBnh21). Environnement de dev : **Windows** (PowerShell).

Le détail fonctionnel, la feuille de route et le schéma des données sont dans `README.md`.

## Architecture (à respecter)

```
pipeline/ (Python)  ──►  Supabase (Postgres)  ──►  web/ (Next.js, lecture seule)
   GitHub Actions, 1x/jour     tables prices, advice, alerts      Vercel, PWA
```

- **Tout le calcul est fait dans `pipeline/`**, une fois par jour. Le site **ne calcule rien** : il lit la table `advice` et la table `prices`.
- Pas de serveur FastAPI pour le MVP. N'en ajoute pas sans qu'on te le demande.
- Le site n'utilise que la clé **anon** de Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), avec des règles RLS en lecture seule sur `prices` et `advice`, et insertion seule sur `alerts`. La clé service ne sort jamais de `pipeline/` et des secrets GitHub.
- Les prix viennent **uniquement d'API officielles** (Travelpayouts / Aviasales). Jamais de scraping de sites de compagnies ou de Google Flights.

## Stack

| Partie | Outils |
|---|---|
| Site | Next.js (App Router) + TypeScript + Tailwind CSS |
| Polices | `next/font` (voir Design) |
| Icônes | `lucide-react` |
| Animations | CSS et Tailwind d'abord ; `framer-motion` seulement si nécessaire |
| Données | `@supabase/supabase-js` |
| Pipeline | Python 3.11, pandas, requests |
| E-mails | Resend |
| Stats | Umami (sans cookies, donc pas de bannière cookies) |

## Commandes (Windows)

```powershell
# site
cd web
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build      # à lancer avant de dire qu'une tâche est finie

# pipeline
cd pipeline
.venv\Scripts\Activate.ps1
python collector/fetch_prices.py
python advisor/rules.py
```

---

## Design

### Inspiration et limites

Le design s'inspire du **langage visuel** de junior-entreprises.com : fond crème, grandes cartes blanches très arrondies, barre de navigation flottante en pilule, boutons pilule avec une flèche dans un cercle, titres sur deux tons, petits libellés en majuscules précédés d'un point, chiffres géants en orange.

On reprend le **style**, pas la **marque**. Ne reprends jamais leur logo, leurs textes, leurs photos, leurs illustrations ni les logos de leurs partenaires. Diaspora Routes a son propre nom, son propre logo et ses propres contenus.

### Couleurs (tokens Tailwind)

Valeurs relevées à l'œil sur le site d'inspiration, à ajuster si besoin. Déclare-les dans `tailwind.config.ts` et n'utilise **que** ces tokens dans le code (pas de couleurs en dur).

| Token | Valeur | Usage |
|---|---|---|
| `cream` | `#EFEEE4` | fond de page |
| `surface` | `#FFFFFF` | cartes principales, navbar |
| `surface-muted` | `#F6F5EF` | petites cartes à l'intérieur d'une grande carte |
| `ink` | `#1B1B1B` | texte principal, 1re ligne des titres |
| `ink-soft` | `#4D4B45` | 2e ligne des titres |
| `ink-muted` | `#8A877F` | textes secondaires, sous-titres des chiffres |
| `primary` | `#74203F` | bordeaux : boutons principaux, cartes d'appel à l'action |
| `primary-dark` | `#5A1830` | survol des boutons principaux |
| `accent` | `#FF5A1F` | orange : chiffres géants, icônes, points des libellés |
| `status-book` | `#1F9D55` | conseil « réserve maintenant » |
| `status-watch` | `#FF5A1F` | conseil « surveille » (même que l'accent) |
| `status-wait` | `#2563EB` | conseil « tu peux attendre » |

Contraste : tout texte doit respecter WCAG AA (4,5:1). `ink-muted` sur `cream` est à la limite : réserve-le aux textes de 18 px et plus.

### Typographie

- Une seule famille sans-serif grotesque, moderne et serrée : **Inter Tight** (ou **Geist**) via `next/font/google`.
- Titres : graisse 500, interlignage serré (`leading-[1.05]`), lettrage légèrement resserré (`tracking-tight`).
- **Titres sur deux tons** : la première partie du titre en `ink`, la suite en `ink-soft`, sur deux lignes. Exemple : « Quand réserver » / « ton billet pour l'Algérie ? ».
- Échelle :
  - H1 hero : `text-5xl md:text-7xl`
  - H2 de section : `text-4xl md:text-6xl`
  - Chiffres géants : `text-6xl md:text-8xl`, couleur `accent`, graisse 400
  - Texte courant : `text-base md:text-lg`
- Libellés de section (« eyebrow ») : `text-xs uppercase tracking-wide`, précédés d'un petit point rond `accent` entouré d'un anneau clair.

### Formes, espacements, ombres

- Grandes cartes de section : `rounded-[32px]`, fond `surface`, marge intérieure généreuse (`p-8 md:p-12`).
- Petites cartes : `rounded-3xl`, fond `surface-muted`.
- Le contenu de la page est posé dans un conteneur centré (`max-w-[1200px] mx-auto px-4 md:px-6`), avec un espace de `gap-4` entre les grandes cartes. Le fond `cream` reste visible autour.
- **Pas d'ombres** ou presque : la séparation vient du contraste crème / blanc. Une ombre très légère est tolérée sur la navbar.
- Beaucoup d'air : sections espacées de `py-16 md:py-24`.

### Composants à créer (dans `web/components/`)

1. **`Navbar`** : pilule blanche flottante, collée en haut (`sticky top-3`), `rounded-full`. Logo à gauche, liens au centre, à droite un bouton secondaire (contour) et un bouton principal (bordeaux). Sur mobile : menu burger qui ouvre un panneau plein écran.
2. **`PillButton`** : bouton pilule en majuscules, avec à droite un cercle contenant une flèche (`ArrowRight` de lucide). Variantes `primary` (fond bordeaux, cercle blanc, flèche bordeaux) et `secondary` (fond blanc, contour, cercle bordeaux, flèche blanche).
   Effet au survol : le libellé glisse vers le haut et une copie identique arrive par le bas (deux `span` dans un conteneur `overflow-hidden`), et la flèche se décale légèrement. Respecte `prefers-reduced-motion`.
3. **`Eyebrow`** : petit libellé majuscule avec le point orange.
4. **`SectionTitle`** : titre sur deux tons (props `first` et `second`).
5. **`Hero`** : grande carte `rounded-[32px]` avec photo plein cadre et voile sombre en dégradé. Eyebrow et H1 blancs, un `PillButton`, et en bas trois chiffres clés en blanc (exemple : « 6 lignes suivies », « 2 relevés par jour », « J-112 avant l'Aïd »).
6. **`StatCard`** : carte blanche avec un chiffre géant orange, un sous-titre en `ink-muted` et une phrase d'explication en bas.
7. **`BentoGrid`** : grille de cartes de tailles différentes (une grande carte photo, des petites cartes avec icône orange, une carte bordeaux d'appel à l'action).
8. **`StepList`** : étapes numérotées 01, 02, 03, 04 pour « Comment ça marche ».
9. **`AdviceBadge`** : grande pastille de conseil (vert / orange / bleu) avec une icône et un libellé clair. La couleur ne doit **jamais** être la seule information : toujours un texte.
10. **`PriceCalendar`** : grille des jours de départ autour de l'Aïd, chaque case colorée du moins cher au plus cher, avec le prix écrit dedans.
11. **`LogoMarquee`** : bandeau défilant des compagnies **comparées** (identification, jamais « partenaires »). Logos officiels non modifiés, pris dans les kits presse des compagnies, déposés dans `web/public/images/airlines/<CODE IATA>.svg` ; sinon le nom en texte. Toujours la mention « Marques et logos appartiennent à leurs propriétaires. Aucun partenariat. » Pause au survol, arrêt avec `prefers-reduced-motion`.
12. **`Footer`** : colonnes de liens, mentions légales, confidentialité, lien GitHub.

### Images

- Photos libres de droits uniquement (Unsplash, Pexels) : aéroports, avions, familles en voyage, Alger, Oran. Note la source de chaque photo dans `web/public/images/CREDITS.md`.
- Toujours via `next/image`, avec un texte `alt` en français qui décrit l'image.
- Jamais de photo de personne réelle identifiable sans licence claire.

### Animations

- Discrètes : apparition en fondu et léger glissement vers le haut quand une section entre dans l'écran, effet de survol des `PillButton`, défilement du bandeau de logos.
- Toutes désactivées avec `prefers-reduced-motion: reduce`.

---

## Les pages et leurs sections

### `/` Accueil
1. `Hero` : « Quand réserver ton billet pour l'Algérie ? », bouton « Voir les prix », trois chiffres clés.
2. **Formulaire de recherche** dans une grande carte blanche : départ, destination, période (Aïd al-Fitr, été, vacances de février…), adultes, enfants, bagages. Bouton principal « Voir le conseil ».
3. Eyebrow « Le problème » + `SectionTitle` + `BentoGrid` : pourquoi les comparateurs se trompent sur ces lignes (fêtes qui bougent, deux calendriers scolaires, prix famille, peu de concurrence).
4. Eyebrow « Les chiffres » + quatre `StatCard`, alimentées par de **vraies données** de Supabase (jamais de chiffres inventés ; si les données manquent, n'affiche pas la carte).
5. Eyebrow « Comment ça marche » + `StepList` en 4 étapes.
6. Carte bordeaux d'appel à l'action : « Reçois une alerte quand le prix baisse » + champ e-mail.
7. `Footer`.

### `/resultat`
Paramètres dans l'URL (`?from=LYS&to=ORN&period=eid-fitr-2027&adults=2&children=3&bags=1`) pour que le lien soit partageable.
1. Résumé du trajet.
2. Prix total famille en très grand + `AdviceBadge` + phrase d'explication.
3. Option moins chère (autre aéroport ou autre jour).
4. `PriceCalendar`.
5. Boutons « Partager sur WhatsApp » (texte prérempli avec le lien) et « M'alerter ».
6. Mention claire : « Tendance basée sur les prix observés, pas une garantie. »

### `/observatoire`
Évolution des prix par ligne autour de l'Aïd 2027, mise à jour chaque jour. Graphiques simples (Recharts), une couleur par ligne, données lues dans `prices`.

### `/methode`
« Comment ça marche » en détail, en langage simple, sans jargon.

### `/mentions-legales` et `/confidentialite`
Obligatoires. Préciser l'usage des e-mails d'alerte (RGPD) et le lien de désinscription.

---

## Règles de code

- TypeScript strict, composants serveur par défaut ; `"use client"` seulement quand il y a de l'interaction.
- Un composant par fichier, nommé en PascalCase.
- Pas de couleurs ni de tailles en dur : uniquement les tokens Tailwind ci-dessus.
- **Mobile d'abord** : écris les classes pour mobile, puis `md:` et `lg:`. Teste à 375 px de large.
- Accessibilité : HTML sémantique, `label` sur chaque champ, focus visible, navigation au clavier, `lang="fr"`.
- Textes de l'interface regroupés dans `web/lib/copy.ts` pour préparer la traduction en arabe.
- Pas de clés ni de secrets dans le code. Tout passe par `.env` (non versionné) et `.env.example`.
- PWA : `manifest.webmanifest` + icônes ; service worker seulement quand le reste est stable.
- Performance : objectif Lighthouse ≥ 90 sur mobile.

## Ce qu'il ne faut pas faire

- Copier le logo, les textes, les photos ou les logos partenaires de junior-entreprises.com.
- Présenter une compagnie aérienne comme « partenaire » sans accord signé.
- Inventer des prix ou des statistiques affichés comme réels. En développement, utilise des données de test clairement nommées (`mock`) et retire-les avant la mise en ligne.
- Scraper des sites de compagnies aériennes ou Google Flights.
- Ajouter une bannière cookies ou un outil de suivi qui en nécessite une.
- Ajouter des liens d'affiliation autres que le lien partenaire Aviasales (Travelpayouts, `web/lib/affiliate.ts`) sans qu'on te le demande. Tout lien partenaire porte la mention « lien partenaire » et `rel="sponsored"`, et ne modifie jamais le conseil.
- Ajouter un backend, une authentification ou une nouvelle dépendance lourde sans demander.

## Avant de dire qu'une tâche est finie

1. `npm run lint` et `npm run build` passent sans erreur.
2. La page est vérifiée à 375 px et à 1280 px.
3. Le contraste et la navigation au clavier sont corrects.
4. Les cases de la feuille de route dans `README.md` sont mises à jour si une étape est terminée.
