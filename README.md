# Diaspora Routes ✈️

> Prévoir le prix des billets d'avion sur les lignes France ↔ Algérie, et dire aux familles **quand réserver**.

![statut](https://img.shields.io/badge/statut-MVP%20en%20cours-orange)
![python](https://img.shields.io/badge/python-3.11+-blue)
![next.js](https://img.shields.io/badge/Next.js-site-black)
![supabase](https://img.shields.io/badge/Supabase-Postgres-green)

## Le problème

Chaque année, des centaines de milliers de familles de la diaspora maghrébine voyagent entre la France et le Maghreb, surtout pendant l'été et autour de l'Aïd. Sur ces lignes, les outils de prix habituels (Google Flights, Skyscanner, Hopper) donnent de mauvais conseils :

- **Les fêtes changent de date** : l'Aïd suit le calendrier hégirien et avance d'environ 11 jours par an. Un modèle entraîné sur « mars de l'année dernière » se trompe.
- **Deux calendriers scolaires** : les vacances françaises (zones A, B, C) et algériennes ne tombent pas en même temps.
- **Des réservations familiales** : le prix affiché pour 1 adulte n'a rien à voir avec celui pour 2 adultes, 3 enfants et des bagages, parce que les tarifs les moins chers partent en premier.
- **Peu de concurrence** : quelques compagnies (Air Algérie, Transavia, Volotea, ASL…) et des hausses de prix fortes juste avant les fêtes.

## La solution

Un **site web mobile d'abord** (installable comme une app grâce à la PWA) où une famille indique son trajet et reçoit :

- le **prix total** pour toute la famille, bagages compris ;
- un **conseil clair** : 🟢 réserve maintenant · 🟠 surveille · 🔵 tu peux attendre, avec une phrase qui explique pourquoi ;
- **l'option moins chère** : un autre aéroport de départ (Lyon, Marseille, Genève, Paris) ou un autre jour ;
- un **calendrier des prix** autour de l'Aïd, pour voir les jours les moins chers d'un coup d'œil.

### Périmètre du MVP

| Élément | Périmètre |
|---|---|
| Lignes | Lyon, Marseille, Paris → Alger, Oran, Constantine |
| Profils | 1 adulte · famille (2 adultes + 2 ou 3 enfants) |
| Horizon | départs de 1 à 4 mois |
| Langue | français (structure prête pour l'arabe en RTL) |
| Conseil | v0 : règles tirées des prix observés · v1 : modèle ML |
| Interface | site responsive + PWA |
| Alertes | par e-mail, sans compte |

## Architecture

Le site **n'a pas besoin d'un serveur Python** : tout le calcul est fait une fois par jour, en amont, et le site se contente de lire les résultats.

```
 ┌──────────────┐  tous les jours   ┌──────────────────────┐
 │ API de prix  │ ────────────────► │  Collecteur Python   │  GitHub Actions
 │ Travelpayouts│                   │  + calcul du conseil │
 └──────────────┘                   └──────────┬───────────┘
 ┌──────────────┐                              │
 │  Calendrier  │ ─────────────────────────────┤
 │ Aïd/vacances │                              ▼
 └──────────────┘                   ┌──────────────────────┐
                                    │  Supabase (Postgres) │
                                    │  prices · advice     │
                                    │  alerts              │
                                    └──────────┬───────────┘
                                               │ lecture
                                               ▼
                                    ┌──────────────────────┐
                                    │  Site Next.js (PWA)  │  Vercel
                                    └──────────────────────┘
```

Plus tard, une API FastAPI pourra être ajoutée quand le modèle devra calculer en direct, puis une app mobile (Expo ou Capacitor) réutilisera la même base.

## Les pages du site

| Page | Contenu |
|---|---|
| **Accueil** | accroche + formulaire court : départ, destination, période, adultes, enfants, bagages |
| **Résultat** | prix famille, conseil en couleur, explication, option moins chère, calendrier des prix, bouton « Partager sur WhatsApp », alerte e-mail |
| **Observatoire Aïd 2027** | évolution des prix ligne par ligne, mise à jour chaque jour |
| **Comment ça marche** | la méthode expliquée simplement |
| **Mentions légales / Confidentialité** | obligatoires (RGPD, e-mails des alertes) |

## Stack

| Rôle | Outil |
|---|---|
| Collecte et conseil | Python 3.11, pandas, requests |
| Planification | GitHub Actions (cron quotidien) |
| Base de données | Supabase (Postgres, offre gratuite) |
| Site | Next.js + Tailwind CSS, PWA |
| Hébergement | Vercel |
| E-mails d'alerte | Resend ou Brevo |
| Statistiques | Umami ou Plausible (sans cookies) |
| Modèle v1 | LightGBM (régression quantile) |

## Structure du dépôt

```
diaspora-routes/
├── pipeline/                    # partie Python
│   ├── collector/
│   │   ├── fetch_prices.py      # relève les prix via l'API
│   │   └── routes.yaml          # lignes, profils et dates à suivre
│   ├── advisor/
│   │   ├── features.py          # jours avant départ, avant l'Aïd, percentiles
│   │   └── rules.py             # conseil v0 : réserve / surveille / attends
│   ├── alerts/
│   │   └── send_alerts.py       # e-mails quand le prix baisse
│   ├── data/
│   │   └── calendar.csv         # dates de l'Aïd, vacances FR et DZ
│   ├── notebooks/
│   │   └── 01_exploration.ipynb
│   └── requirements.txt
├── web/                         # site Next.js
│   ├── app/
│   │   ├── page.tsx             # accueil + formulaire
│   │   ├── resultat/page.tsx
│   │   ├── observatoire/page.tsx
│   │   ├── methode/page.tsx
│   │   └── mentions-legales/page.tsx
│   ├── components/
│   ├── lib/supabase.ts
│   └── package.json
├── supabase/
│   └── schema.sql               # tables prices, advice, alerts
├── .github/workflows/
│   └── daily.yml                # collecte + conseil + alertes, une fois par jour
├── .env.example
└── README.md
```

## Installation (Windows)

### 1. Cloner le dépôt

```powershell
git clone https://github.com/AmineBnh21/diaspora-routes.git
cd diaspora-routes
copy .env.example .env
```

Remplis le fichier `.env` :

```
TRAVELPAYOUTS_TOKEN=ton_token
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=cle_service      # uniquement pour le pipeline Python
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cle_publique
RESEND_API_KEY=ta_cle
```

> Ne versionne jamais `.env`. Sur GitHub, mets ces valeurs dans **Settings → Secrets and variables → Actions**.

### 2. Base de données

Crée un projet sur Supabase, puis exécute `supabase/schema.sql` dans l'éditeur SQL.

### 3. Pipeline Python

```powershell
cd pipeline
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python collector/fetch_prices.py     # un relevé à la main
python advisor/rules.py              # calcule les conseils
```

### 4. Site

```powershell
cd web
npm install
npm run dev                          # http://localhost:3000
```

## Données

**Table `prices`** : un relevé par ligne, date, profil et jour de collecte.

| Colonne | Exemple |
|---|---|
| `collected_at` | 2026-11-19 |
| `origin` / `destination` | LYS / ORN |
| `departure_date` / `return_date` | 2027-03-08 / 2027-03-18 |
| `passengers` | `2A3C` |
| `airline` | AH |
| `price_eur` | 1948 |
| `days_to_departure` | 109 |
| `days_to_eid` | 111 |

**Table `advice`** : le conseil du jour pour chaque combinaison (`status` = `book` / `watch` / `wait`, `reason`, `cheaper_option`).

**Table `alerts`** : e-mail, trajet suivi, seuil de prix, date d'inscription.

> Les prix passent par des **API officielles** (Travelpayouts / Aviasales). Aucun scraping de sites de compagnies ni de Google Flights.

## Feuille de route

- [ ] **1. Périmètre** : choisir les lignes, les profils et l'horizon
- [ ] **2. Source de données** : compte Travelpayouts, vérifier ce que l'API couvre vraiment pour l'Algérie
- [ ] **3. Collecteur** : script quotidien + GitHub Actions + Supabase ⚠️ *à lancer en premier, chaque jour non collecté est perdu*
- [ ] **4. Calendrier** : Aïd al-Fitr et Aïd al-Adha 2027, vacances FR (A/B/C) et DZ
- [ ] **5. Conseil v0** : règles par percentiles et nombre de jours avant l'Aïd, écrites dans `advice`
- [ ] **6. Site, pages Accueil et Résultat** : formulaire, prix famille, conseil, option moins chère
- [ ] **7. Page Observatoire** et page **Comment ça marche**
- [ ] **8. Alertes e-mail** et bouton **Partager sur WhatsApp**
- [ ] **9. Mise en ligne** (Vercel, PWA, mentions légales) et tests avec 10 à 20 personnes de la diaspora (mi-décembre 2026)
- [ ] **10. Modèle v1** : LightGBM en régression quantile, comparé aux règles (janvier 2027)
- [ ] **11. Bilan public** des prix de l'Aïd al-Fitr 2027

### Plus tard

- Version arabe (RTL) et darija
- API FastAPI pour un calcul en direct
- App mobile sur les stores (Expo ou Capacitor), seulement s'il y a de la demande
- Autres pays : Maroc, Tunisie · ferries (Marseille, Sète)

## Limites connues

- Au début, il y a peu d'historique, donc le conseil v0 est volontairement prudent.
- Les API de prix donnent parfois des prix en cache, pas le prix exact au moment de réserver.
- Les dates de l'Aïd dépendent de l'observation de la lune et peuvent varier d'un jour.
- Ce projet donne des tendances, pas une garantie de prix.

## Auteur

**Mohamed Amine Benhamaid**, Master 2 Intelligence Artificielle, Université Claude Bernard Lyon 1
[GitHub](https://github.com/AmineBnh21) · [LinkedIn](https://www.linkedin.com/in/mohamed-amine-benhamaid)

## Licence

MIT
