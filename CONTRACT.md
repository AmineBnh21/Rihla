# Contrat entre `pipeline/` et `web/`

Le site lit seulement les tables décrites dans `supabase/schema.sql`. Ce fichier fixe le format des valeurs.

## Codes

| Champ | Valeurs |
|---|---|
| `origin` (France) | `LYS`, `MRS`, `PAR` |
| `destination` (Algérie) | `ALG`, `ORN`, `CZL` |
| `passengers` | `1A`, `2A2C`, `2A3C` (A = adulte, C = enfant 2-11 ans) |
| `period` | Aïd : `eid-fitr-2027`, `eid-adha-2027` · vacances scolaires françaises : `noel-2026`, `hiver-2027`, `printemps-2027`, `ete-2027` · mois : `mois-AAAA-MM` (le mois en cours et les 10 suivants) |
| `status` | `book`, `watch`, `wait` |

## Périodes

Fenêtres de départs France → Algérie (dates dans `pipeline/data/calendar.csv`) :

- **Aïd** : de J-14 à J+3 autour de l'Aïd.
- **Vacances** : du dernier jour de cours à J+9 (été : J+42), **selon la zone de l'aéroport de départ** (Lyon A, Marseille B, Paris C). La même période `hiver-2027` a donc une fenêtre différente pour chaque origine.
- **Mois** : du 1er au dernier jour du mois.

## Une ligne `advice`

Une ligne par `(computed_at, origin, destination, period, passengers)`. Le site prend la ligne au `computed_at` le plus récent.

- `price_eur` : prix total estimé pour le profil, **aller simple France → Algérie, hors bagages en soute**, au jour le moins cher de la fenêtre.
- `reason` : une phrase en français, tutoiement, sans jargon.
- `cheaper_option` (ou `null`) :
  ```json
  { "kind": "airport" | "day" | "stops", "origin": "MRS", "destination": "ORN",
    "departure_date": "2027-03-05", "price_eur": 845, "saving_eur": 120 }
  ```
  `stops` : même trajet, mais avec escale (proposé seulement si aucune option directe ne fait économiser au moins 20 €).
- `price_eur`, `calendar` et `reference` portent sur les **vols directs**. S'il n'y a aucun direct relevé sur la ligne, ils portent sur les vols avec escale, et `reason` le dit.
- `calendar` : liste triée par date, prix famille du jour (jours sans relevé absents).
  ```json
  [{ "date": "2027-02-24", "price_eur": 912 }]
  ```
- `reference` :
  ```json
  { "p25": 180, "p50": 210, "p75": 260, "n_obs": 42, "days_to_eid": 112 }
  ```
  `days_to_eid` pour les périodes Aïd ; pour les vacances et les mois, la clé est `days_to_start` (jours entre `computed_at` et le début de la période).
  Les percentiles sont en prix **1 adulte**. `days_to_eid` = jours entre `computed_at` et l'Aïd.
