# Source des données : l'API Data de Travelpayouts (Aviasales)

Dernière vérification de la documentation : 18 novembre 2026. La doc officielle a été mise à jour le 12 novembre 2026.

## En bref

- Les prix viennent de l'**API Data d'Aviasales**, accessible avec un compte Travelpayouts (gratuit).
- Ce ne sont **pas des prix en direct**. L'API renvoie des prix **gardés en cache**, trouvés lors des recherches faites par les visiteurs d'Aviasales.
- Chaque prix vaut pour **1 adulte, aller simple, en classe éco**. Le prix d'une famille est estimé ensuite dans `pipeline/advisor/`.
- Si personne n'a cherché un trajet ou une date sur Aviasales, **l'API n'a pas de prix** pour ce trajet ou cette date.

## L'endpoint utilisé

`GET https://api.travelpayouts.com/aviasales/v3/prices_for_dates`

D'après la doc, cet endpoint « renvoie les billets les moins chers pour des dates précises, trouvés par les utilisateurs d'Aviasales dans les 48 dernières heures ». Il remplace les anciens `/v1/prices/cheap`, `/v1/prices/direct` et `/v2/prices/latest`.

| Paramètre | Valeur dans notre collecteur | Ce qu'il fait |
|---|---|---|
| `origin`, `destination` | `LYS`, `MRS`, `PAR`, `ALG`, `ORN`, `CZL` | Code IATA d'une ville ou d'un aéroport. `PAR` couvre CDG et ORY. |
| `departure_at` | `2027-03` | Accepte `YYYY-MM` (tout le mois) ou `YYYY-MM-DD`. |
| `one_way` | `true` | Aller simple (c'est aussi la valeur par défaut). Avec `true`, l'API ne garde qu'un billet par date. |
| `direct` | `false` | `false` donne les vols directs **et** les vols avec escale. |
| `sorting` | `price` | Tri par prix (par défaut). |
| `unique` | `false` | Ne sert que si on ne donne pas de destination. |
| `currency` | `eur` | Par défaut, la devise est le **rouble (RUB)**. Il faut donc toujours la préciser. |
| `market` | `fr` | Le marché dont on lit le cache (voir plus bas). |
| `limit` / `page` | `1000` / `1, 2…` | 30 résultats par page par défaut, 1000 au maximum. |

**Authentification** : le jeton passe dans l'en-tête `X-Access-Token` (ou dans le paramètre `token`). La doc conseille aussi d'envoyer `Accept-Encoding: gzip, deflate`.

**Réponse** : `{"success": true, "data": [...], "currency": "eur"}`. En cas d'erreur, on reçoit `success: false`, un `data` vide et un message dans `error`. Chaque offre contient : `origin`, `destination`, `origin_airport`, `destination_airport`, `price`, `airline` (code IATA), `flight_number`, `departure_at`, `return_at`, `transfers`, `return_transfers`, `duration`, `duration_to`, `duration_back` et `link`.

**Limite de débit** : 600 requêtes par minute pour `prices_for_dates`. Au-delà, l'API répond `429`. Les en-têtes `X-Rate-Limit`, `X-Rate-Limit-Remaining` et `X-Rate-Limit-Reset` (secondes avant déblocage) aident à suivre la consommation. Notre relevé fait environ 18 lignes × 4 à 5 mois, soit à peu près 90 requêtes par jour. On reste donc très loin de la limite.

## Le piège du « marché »

Chaque recherche Aviasales est rattachée à un **marché**, en gros la version du site utilisée (aviasales.fr, aviasales.com, aviasales.ru…). Le cache est séparé par marché.

- Sans le paramètre `market`, l'API déduit le marché de la ville de départ. Si elle n'y arrive pas, elle renvoie le cache **russe** (`ru`).
- **Il n'existe pas de marché Algérie.** La liste officielle compte 26 marchés, dont `fr`, `es`, `it`, `us`, `ru`… mais pas `dz`. Pour les trajets Algérie → France, on risquait donc de lire le cache russe, presque vide pour ces lignes.
- Pour cette raison, `routes.yaml` impose `market: fr` dans les deux sens.

## Ce que l'API couvre vraiment pour la France et l'Algérie

À vérifier dès qu'on aura un jeton : lancer `python collector/fetch_prices.py --dry-run` et regarder le bilan affiché (lignes sans aucune offre).

Les compagnies qui volent entre la France et l'Algérie (situation 2026, d'après la presse spécialisée) :

| Compagnie | Code IATA | Lignes qui nous intéressent |
|---|---|---|
| Air Algérie | AH | Paris, Lyon et Marseille vers Alger, Oran et Constantine |
| Transavia France | TO | Paris-Orly, Lyon et Marseille vers l'Algérie (Marseille-Oran depuis avril 2026) |
| Volotea | V7 | Marseille vers Alger, Oran, Constantine, Béjaïa et Tlemcen ; Lyon-Sétif |
| ASL Airlines France | 5O | Plus de 50 vols par semaine vers l'Algérie l'été, dont Lyon-Alger |
| Air France | AF | Paris-CDG vers Alger (et Oran ou Constantine selon la saison) |

Ce que l'on ne sait pas encore :

- Aviasales ne vend pas les billets lui-même : il compare les offres d'agences et de compagnies. Une compagnie peut manquer si aucune agence partenaire ne la propose sur le marché `fr`. C'est le cas surtout des compagnies charter ou à vente directe (par exemple ASL ou Air Algérie).
- Les lignes peu recherchées (par exemple Constantine → Lyon) peuvent n'avoir que quelques jours couverts par mois, ou aucun.
- On ne peut **pas** filtrer par compagnie dans la requête. On reçoit le billet le moins cher par date, quelle que soit la compagnie.

## Limites à garder en tête

1. **Prix pour 1 adulte seulement.** L'API Data ne connaît ni les enfants ni les bébés, et ne précise pas les bagages inclus. Le prix famille est une estimation.
2. **Prix en cache, pas en direct.** Prix trouvés dans les 48 dernières heures pour cet endpoint. Selon la doc générale, le cache garde les données de 2 à 7 jours selon le type de requête. Un prix peut ne plus être disponible au moment de réserver.
3. **Trous dans les données.** Un jour sans recherche, c'est un jour sans prix. Le conseil doit en tenir compte (nombre d'observations dans `reference.n_obs`).
4. **Une offre par date** en aller simple : on voit le moins cher du jour, pas toutes les options.
5. **Heures** : `departure_at` est donné avec le fuseau local du vol (ex. `2027-03-08T07:00:00+01:00`). On garde la date locale.

## Autres endpoints possibles

- `/aviasales/v3/grouped_prices` avec `group_by=departure_at` donne le prix le plus bas **par jour** d'un mois. C'est presque la même chose que `prices_for_dates` en aller simple, avec une réponse sous forme de dictionnaire `{date: offre}`. Il remplace `/v1/prices/calendar` et `/v1/prices/monthly`. On le garde en solution de repli si `prices_for_dates` renvoie trop peu de jours.
- `/v1/prices/calendar` est ancien (300 requêtes par minute) et la doc conseille de passer à `grouped_prices`. Il ne faut pas l'utiliser.
- L'API de **recherche en temps réel** (Flights Search API) donne de vrais prix en direct. Elle demande en revanche une validation par Travelpayouts et un site qui génère du trafic. C'est à envisager plus tard, pas pour le MVP.

## Créer le compte et récupérer le jeton

1. Aller sur https://www.travelpayouts.com et créer un compte partenaire (gratuit).
2. Dans l'espace partenaire, ajouter un projet (le site Diaspora Routes), puis **rejoindre le programme Aviasales**. L'accès à l'API Data en dépend.
3. Ouvrir le **Profil**, rubrique **API token** : copier le jeton.
4. Le coller dans le fichier `.env` à la racine du dépôt : `TRAVELPAYOUTS_TOKEN=le_jeton` (ne jamais le committer).
5. Pour GitHub Actions : *Settings → Secrets and variables → Actions → New repository secret*, nom `TRAVELPAYOUTS_TOKEN`.
6. Tester : `cd pipeline` puis `python collector/fetch_prices.py --dry-run`. Le CSV est écrit dans `pipeline/data/out/`.

## Sources

- Doc officielle de l'API Data Aviasales (paramètres, réponse, marchés, `grouped_prices`) : https://support.travelpayouts.com/hc/en-us/articles/203956163
- Limites de débit (depuis le 14 juin 2024) : https://support.travelpayouts.com/hc/en-us/articles/4402565416594
- Conditions d'accès et durée du cache (2 à 7 jours) : https://support.travelpayouts.com/hc/en-us/articles/203956083
- Liste des marchés (tableur lié depuis la doc) : https://docs.google.com/spreadsheets/d/1EElk_VVBnRGaVCrQsk5s3hTR9dJsTCxJ/
- Ancienne doc développeur (v1/v2) : https://travelpayouts.github.io/slate/
- Compagnies France–Algérie en 2026 :
  - https://www.algerie360.com/vols-france-algerie-hiver-2026-2027-compagnies/
  - https://ulysse.com/news/volotea-marseille-algerie-5-destinations-2026
  - https://ulysse.com/news/comparatif-vols-marseille-algerie-transavia-volotea-air-algerie-ete-2026
  - https://zoomalgerie.com/vols-directs-france-algerie-villes-compagnies-bagages-et-frequence/
  - https://www.air-journal.fr/2026-01-23-asl-airlines-france-plus-de-50-vols-par-semaine-vers-lalgerie-a-lete-2026-lancement-du-paiement-en-10-fois-5272491.html
