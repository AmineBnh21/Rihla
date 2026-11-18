# Comment ça marche

Diaspora Routes t'aide à savoir **quand réserver** ton billet entre la France et l'Algérie pour l'Aïd. On regarde les prix tous les jours et on te donne un conseil simple. Voici comment on fait, en quatre étapes.

<!-- Composant StepList : 4 étapes, numéros 01 à 04. Chaque étape = un titre court + un texte. -->

## Les 4 étapes

### 01. On relève les prix chaque jour

Chaque jour, on récupère les prix des vols entre la France (Lyon, Marseille, Paris) et l'Algérie (Alger, Oran, Constantine).

- Les prix viennent de l'**API officielle de Travelpayouts / Aviasales**, un site de comparaison de vols. On ne copie rien en cachette sur les sites des compagnies.
- Ce sont des prix **gardés en mémoire** par Aviasales : des prix trouvés ces derniers jours par d'autres voyageurs qui cherchaient un vol. Ils peuvent donc avoir changé depuis, à la hausse comme à la baisse.
- Les prix sont donnés pour **1 adulte**, en **aller simple** France vers Algérie, **sans bagage en soute**.

### 02. On estime le prix pour ta famille

L'API ne donne que le prix pour 1 adulte. On calcule donc le prix de ta famille nous-mêmes, en restant **prudents** : on préfère t'annoncer un prix un peu trop haut plutôt qu'un prix que tu ne trouveras pas.

- **Les enfants comptent comme des adultes.** Sur ces lignes, les compagnies font rarement une vraie réduction pour les enfants de 2 à 11 ans.
- **Petite majoration pour les grandes familles.** Les billets les moins chers partent vite, et il n'y en a souvent que quelques-uns. Quand vous êtes nombreux, une partie de la famille finit souvent sur des billets plus chers. On ajoute donc 5 % par personne à partir de la 3e, avec un maximum de 20 %.

Exemple : si le billet coûte 200 € pour 1 adulte, une famille de 2 adultes et 3 enfants (5 personnes) est estimée à 5 × 200 € + 15 % = **1 150 €**.

### 03. On compare avec les prix d'avant

Pour savoir si un prix est bon, il faut le comparer. On garde tous les prix relevés depuis le début du suivi de ta ligne, et on regarde où se place le prix du jour :

- **prix bas** : parmi les moins chers qu'on a vus (le quart le moins cher) ;
- **prix habituel** : au milieu ;
- **prix haut** : dans la moitié la plus chère.

On regarde aussi **combien de jours il reste avant l'Aïd**, car c'est souvent ce qui fait le plus bouger les prix.

### 04. On te donne un conseil

À partir de tout ça, on te donne un des trois conseils suivants :

- **Réserve maintenant**
  - si l'Aïd est dans **45 jours ou moins** : à ce moment-là, les prix montent souvent fort ;
  - ou si le prix du jour est **bas** par rapport à ce qu'on a vu avant.
- **Surveille**
  - quand ce n'est ni le moment de foncer, ni le moment d'attendre : garde un œil sur le prix, ou inscris-toi aux alertes pour être prévenu s'il baisse.
- **Tu peux attendre**
  - si l'Aïd est encore **loin** (plus de 90 jours) et que le prix est **plutôt haut** en ce moment : il y a de bonnes chances de trouver mieux plus tard.

On te montre aussi, quand c'est possible, une **option moins chère** : partir d'un autre aéroport ou un autre jour.

<!-- Note pour l'intégration : afficher chaque conseil avec AdviceBadge (couleur + icône + texte), la couleur ne doit jamais être la seule information. -->

## Bon à savoir

### C'est une tendance, pas une garantie

Notre conseil se base sur les prix qu'on a observés. Personne ne peut savoir à l'avance ce que feront les compagnies. Le prix peut monter même quand on te dit d'attendre, ou baisser après que tu as réservé. Avant de payer, vérifie toujours le prix final sur le site où tu réserves.

### Pourquoi l'Aïd change de date chaque année

L'Aïd suit le **calendrier musulman**, qui se base sur la lune. Une année lunaire est plus courte d'environ 11 jours qu'une année normale. Résultat : l'Aïd arrive environ **11 jours plus tôt chaque année**. Il peut tomber pendant les vacances scolaires une année, et en pleine période de cours quelques années plus tard. C'est pour ça que les prix d'une année ne ressemblent pas à ceux de l'année d'avant.

### La date de l'Aïd peut bouger d'un jour

La date exacte dépend de l'observation de la lune, annoncée seulement quelques jours avant. On utilise une date prévue par le calcul. Elle peut être décalée de **1 jour** avant ou après.

<!-- Composant FAQ : questions courtes, réponses courtes. -->

## Questions fréquentes

**Est-ce que vous vendez des billets ?**
Non. On ne vend rien. On t'aide seulement à choisir le bon moment. Tu réserves où tu veux.

**Pourquoi le prix que je trouve n'est pas le même ?**
Nos prix sont gardés en mémoire et relevés une fois par jour, sans bagage en soute. Le prix réel peut avoir changé, et les bagages, le choix du siège ou les frais de paiement peuvent s'ajouter.

**Le prix affiché, c'est un aller-retour ?**
Non, c'est un **aller simple** France vers Algérie, pour toute ta famille.

**Pourquoi mes enfants paient comme des adultes ?**
C'est une estimation prudente. Si ta compagnie fait une réduction pour les enfants, tant mieux : tu paieras moins que notre estimation.

**Mon trajet n'est pas proposé, pourquoi ?**
Pour commencer, on suit seulement quelques lignes : Lyon, Marseille et Paris vers Alger, Oran et Constantine. D'autres pourront être ajoutées plus tard.

**Le conseil dit « Surveille » alors que l'Aïd est loin. Pourquoi ?**
Quand on suit une ligne depuis peu de temps, on n'a pas encore assez de prix pour comparer. Dans ce cas, on préfère te dire de surveiller plutôt que de te faire attendre pour rien.

**Comment être prévenu si le prix baisse ?**
Inscris-toi aux alertes avec ton e-mail. Tu peux te désinscrire à tout moment avec le lien présent dans chaque e-mail.

<!--
Sources (ne s'affichent pas sur le site) :
- Règles du conseil : pipeline/advisor/rules.py (BOOK_DAYS = 45, WAIT_DAYS = 90, MIN_OBS = 10, book si prix <= p25, wait si prix >= p50).
- Prix famille : pipeline/advisor/family.py (CHILD_FACTOR = 1.0, +5 % par passager au-delà du 2e, plafond +20 % ; 2A3C = 5 x prix x 1,15).
- Format des prix (aller simple, hors bagages en soute, percentiles en prix 1 adulte) et fenêtre J-14 à J+3 : CONTRACT.md.
- Source des prix : API Data Travelpayouts, endpoint aviasales/v3/prices_for_dates (pipeline/collector/fetch_prices.py). Prix issus du cache des recherches des utilisateurs Aviasales : https://support.travelpayouts.com/hc/en-us/articles/203956163 (prix trouvés par les utilisateurs Aviasales ces 2 à 7 derniers jours selon le type de requête ; 48 h pour prices_for_dates selon la doc)
- Dates de l'Aïd 2027 et marge de ±1 jour : pipeline/data/calendar.csv.
- Décalage d'environ 11 jours par an : l'année lunaire hégirienne compte environ 354 jours.
-->
