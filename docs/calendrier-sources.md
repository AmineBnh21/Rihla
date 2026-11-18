# Calendrier : sources des dates

Fichier concerné : `pipeline/data/calendar.csv`. Vérifié le 18 novembre 2026.

Convention des colonnes pour les vacances : `start_date` = jour de fin des cours (premier jour où les élèves sont libres, ou le soir du départ en Algérie), `end_date` = jour de reprise des cours.

Niveaux de confiance :
- **Élevée** : source officielle publiée (arrêté, API du ministère).
- **Moyenne** : calendrier officiel relayé par la presse, sans accès direct au communiqué.
- **Estimation** : calcul astronomique. La date officielle n'est fixée qu'après l'observation du croissant (la veille).

## Fêtes musulmanes (country `ALL`)

| Événement | Date retenue | Confiance | Sources |
|---|---|---|---|
| `ramadan_debut` | 2027-02-08 → 2027-03-09 | Estimation (±1 jour) | CTMF, calendrier publié le 10/11/2026 : [observalgerie.com](https://observalgerie.com/2026/11/11/societe/ramadan-et-aid-el-fitr-2027-en-france-les-dates-deja-connues) ; Centre international d'astronomie : [algerie360.com](https://www.algerie360.com/ramadan-2027-date-8-fevrier-calculs-astronomiques/) ; Umm al-Qura : [makkahlive.net](https://makkahlive.net/en/tools/islamic-calendar) |
| `eid_al_fitr` | 2027-03-10 | Estimation (±1 jour, 9 mars possible) | [sortiraparis.com](https://www.sortiraparis.com/actualites/a-paris/articles/274470-ramadan-2023-quand-aura-lieu-l-aid-el-fitr-en-france-la-fete-qui-marque-la-fin-du-jeune) (10 mars, sous réserve de la Grande Mosquée de Paris) ; [observalgerie.com](https://observalgerie.com/2026/10/22/societe/ramadan-2027-voici-les-dates-de-debut-et-de-fin-selon-les-calculs-astronomiques/) (9 ou 10 mars) ; [khaleejtimes.com](https://www.khaleejtimes.com/uae/ramadan-eid-al-fitr-eid-al-adha-2027-likely-dates) ; nouvelles lunes : [timeanddate.com](https://www.timeanddate.com/moon/phases/?year=2027) |
| `eid_al_adha` | 2027-05-17 | Estimation (±1 jour, 16 mai possible) | [mediaterranee.com](https://www.mediaterranee.com/guides/aid-el-adha-2027-date-en-france-algerie-maroc-et-tunisie) (16 ou 17 mai) ; [calendriergratuit.fr](https://www.calendriergratuit.fr/aid-el-kebir.html) ; nouvelles lunes : [timeanddate.com](https://www.timeanddate.com/moon/phases/?year=2027) |

Pourquoi le 10 mars et le 17 mai plutôt que les 9 et 16 :
- Les nouvelles lunes tombent le 8 mars 2027 à 09:29 UTC et le 6 mai 2027 à 10:58 UTC. Le soir même, le croissant n'a que 7 à 9 heures. Il n'est pas visible en Algérie ni en France.
- Le ministère algérien des Affaires religieuses (commission d'observation du croissant) et la Grande Mosquée de Paris attendent l'observation du croissant. Avec cette méthode, le Ramadan dure 30 jours (Aïd le mercredi 10 mars) et le 1er Dhou al-Hijja tombe le 8 mai (Aïd le lundi 17 mai).
- L'Arabie saoudite (Umm al-Qura) et le CTMF, qui s'appuient sur le calcul, annoncent un jour plus tôt (9 mars, 16 mai).
- Aucun calendrier officiel 2027 n'est encore publié, ni par le ministère algérien ni par la Grande Mosquée de Paris ou le CFCM. Les annonces officielles tomberont la « nuit du doute » (soir du 29e jour). Pour comparaison, le 1er Moharram 1448 a été fixé par le ministère algérien au 16 juin 2026 : [algerie-eco.com](https://algerie-eco.com/2026/06/15/algerie-le-mardi-16-juin-premier-jour-de-moharem-1448/).

Non retenus : Mawlid (le prochain, vers le 14-15 août 2027, tombe en plein été sans effet propre sur les prix) et Yennayer (12 janvier 2027, un mardi, un seul jour férié en Algérie, en période scolaire des deux côtés). Ils n'apportent rien pour le conseil de réservation.

## Vacances scolaires françaises 2026-2027 (country `FR`)

Source officielle : API du ministère de l'Éducation nationale, jeu « fr-en-calendrier-scolaire », année `2026-2027`, lieux Lyon (zone A), Aix-Marseille (zone B), Paris (zone C).
Requête : <https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?where=annee_scolaire%3D%222026-2027%22> (dates en UTC, converties à l'heure de Paris).
Page grand public : <https://www.education.gouv.fr/calendrier-scolaire-100148>. **Confiance : élevée.**

| Événement | Zone A (Lyon) | Zone B (Marseille) | Zone C (Paris) |
|---|---|---|---|
| `vacances_toussaint` (déjà passées) | 17/10/2026 → 02/11/2026 | idem | idem |
| `vacances_noel` | 19/12/2026 → 04/01/2027 | idem | idem |
| `vacances_hiver` | 13/02/2027 → 01/03/2027 | 20/02/2027 → 08/03/2027 | 06/02/2027 → 22/02/2027 |
| `vacances_printemps` | 10/04/2027 → 26/04/2027 | 17/04/2027 → 03/05/2027 | 03/04/2027 → 19/04/2027 |
| `pont_ascension` (zone vide) | 07/05/2027 | idem | idem |
| `vacances_ete` | 03/07/2027 → 02/09/2027 (rentrée des élèves ; enseignants le 01/09) | idem | idem |

À noter : l'Aïd al-Fitr (10 mars) tombe juste après les vacances d'hiver de la zone B (reprise le 8 mars). L'Aïd al-Adha (17 mai) tombe hors vacances, dix jours après le pont de l'Ascension.

## Vacances scolaires algériennes 2026-2027 (country `DZ`)

Le ministère de l'Éducation nationale a dévoilé ce calendrier le 5 octobre 2026, dans une note aux directeurs de l'éducation datée du 4 octobre 2026. Il a été publié après le report de la rentrée au 21 septembre 2026. Il est relayé par [tsa-algerie.com](https://www.tsa-algerie.com/algerie-le-calendrier-des-examens-et-des-vacances-scolaires-devoile/) ; pour les heures de départ et de reprise, voir aussi [algerie360.com](https://www.algerie360.com/calendrier-examens-trimestriels-2026-2027-education/). Je n'ai pas trouvé le communiqué original sur le site du ministère. **Confiance : moyenne.**

| Événement | Dates |
|---|---|
| `vacances_hiver` | jeudi 17/12/2026 au soir → reprise le dimanche 03/01/2027 au matin |
| `vacances_printemps` | jeudi 18/03/2027 au soir → reprise le dimanche 04/04/2027 au matin |
| Vacances d'automne (27/10 → 02/11/2026) | déjà passées, non ajoutées |
| **Vacances d'été 2027** | **absentes du CSV** : le calendrier ne donne pas de date de fin des cours. Les vacances commencent après les examens du 3e trimestre (23-27 mai 2027), les rattrapages et la correction. Les congés des enseignants commencent le jeudi 8 juillet 2027. BEM et BAC : dates non publiées dans ce communiqué. |

Remarque : un article d'Algérie 360 du 3 octobre 2026 indiquait que les vacances n'étaient pas encore annoncées. Il est antérieur au communiqué du 5 octobre.
