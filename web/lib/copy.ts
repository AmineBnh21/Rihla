/**
 * Tous les textes de l'interface, en français.
 * Regroupés ici pour préparer la traduction en arabe (RTL) plus tard.
 */

import type { Destination, EidPeriod, Origin, Passengers, Status } from "@/lib/types";

export const copy = {
  site: {
    name: "Diaspora Routes",
    title: "Diaspora Routes : quand réserver ton billet pour l'Algérie",
    description:
      "Prix des billets d'avion France ↔ Algérie pour toute la famille, et un conseil clair : réserve, surveille ou attends.",
    skipLink: "Aller au contenu",
  },

  nav: {
    label: "Navigation principale",
    home: "Accueil",
    observatory: "Observatoire",
    method: "Comment ça marche",
    seePrices: "Voir les prix",
    alertMe: "M'alerter",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    logoLabel: "Diaspora Routes, retour à l'accueil",
  },

  demo: {
    title: "Données de démonstration",
    text: "La base de données n'est pas encore connectée : les prix et les chiffres affichés sont fictifs et servent seulement à montrer le site.",
  },

  places: {
    LYS: "Lyon",
    MRS: "Marseille",
    PAR: "Paris",
    ALG: "Alger",
    ORN: "Oran",
    CZL: "Constantine",
  } satisfies Record<Origin | Destination, string> as Record<string, string>,

  periods: {
    "eid-fitr-2027": "Aïd al-Fitr 2027",
    "eid-adha-2027": "Aïd al-Adha 2027",
  } satisfies Record<EidPeriod, string>,

  periodLabels: {
    "eid-fitr-2027": "Aïd al-Fitr 2027",
    "eid-adha-2027": "Aïd al-Adha 2027",
    "noel-2026": "Vacances de Noël 2026",
    "hiver-2027": "Vacances d'hiver 2027",
    "printemps-2027": "Vacances de printemps 2027",
    "ete-2027": "Vacances d'été 2027",
  },

  passengers: {
    "1A": "1 adulte",
    "2A2C": "2 adultes et 2 enfants",
    "2A3C": "2 adultes et 3 enfants",
  } satisfies Record<Passengers, string>,

  status: {
    book: {
      label: "Réserve maintenant",
      hint: "Les prix ont peu de chances de baisser.",
    },
    watch: {
      label: "Surveille",
      hint: "Les prix peuvent encore bouger, garde un œil dessus.",
    },
    wait: {
      label: "Tu peux attendre",
      hint: "Les prix sont hauts pour l'instant, rien ne presse.",
    },
  } satisfies Record<Status, { label: string; hint: string }>,

  hero: {
    eyebrow: "France ↔ Algérie",
    titleFirst: "Quand réserver",
    titleSecond: "ton billet pour l'Algérie ?",
    text: "On suit chaque jour les prix entre la France et l'Algérie, pour l'Aïd, les vacances ou n'importe quel mois, et on te dit quand réserver pour toute la famille.",
    cta: "Voir les prix",
    statsLabel: "Chiffres clés",
    statRoutes: "lignes suivies",
    statProfiles: "profils de voyageurs",
    statDaysToEid: (days: number) => `J-${days}`,
    statDaysToEidLabel: "avant l'Aïd al-Fitr",
  },

  search: {
    eyebrow: "Ton trajet",
    titleFirst: "Qui part ?",
    titleSecond: "Quand réserver ?",
    lead: "Dis-nous ton trajet et ta famille : on te donne le prix total et le bon moment pour réserver.",
    from: "Départ",
    to: "Destination",
    period: "Quand pars-tu ?",
    periodGroups: {
      eid: "Fêtes",
      holiday: "Vacances scolaires (dates de ta zone)",
      month: "Un mois au choix",
    },
    travellers: "Voyageurs",
    adults: "Adultes",
    children: "Enfants (2 à 11 ans)",
    bags: "Bagages en soute",
    profilesHint:
      "Profils suivis pour l'instant : 1 adulte, ou 2 adultes avec 2 ou 3 enfants.",
    submit: "Voir le conseil",
  },

  problem: {
    eyebrow: "Le problème",
    titleFirst: "Les comparateurs",
    titleSecond: "se trompent ici.",
    introTitle: "Rentrer au pays, pas un week-end à Rome.",
    introText:
      "Les outils de prix habituels raisonnent pour un voyageur seul, à des dates fixes. Pour une famille qui part pour l'Aïd, leurs conseils tombent souvent à côté.",
    items: {
      moving: {
        title: "Les fêtes bougent",
        text: "L'Aïd avance d'environ 11 jours chaque année. Comparer avec « mars de l'an dernier » ne marche pas.",
      },
      school: {
        title: "Deux calendriers scolaires",
        text: "Les vacances françaises (zones A, B, C) et algériennes ne tombent pas en même temps.",
      },
      family: {
        title: "Le prix famille",
        text: "Le prix pour 1 adulte n'a rien à voir avec celui pour 5 personnes : les tarifs les moins chers partent en premier.",
      },
      competition: {
        title: "Peu de concurrence",
        text: "Quelques compagnies seulement, et des hausses fortes juste avant les fêtes.",
      },
    },
    ctaTitle: "Regarde ton trajet",
    ctaText: "Prix famille, conseil du jour et jours les moins chers.",
    ctaButton: "Voir les prix",
  },

  stats: {
    eyebrow: "Les chiffres",
    titleFirst: "Ce qu'on observe",
    titleSecond: "en ce moment.",
    empty: "Les chiffres s'afficheront dès les premiers relevés de prix.",
    updatedOn: (date: string) => `Mis à jour le ${date}.`,
    routes: {
      subtitle: "lignes suivies",
      text: "Lyon, Marseille et Paris vers Alger, Oran et Constantine, chaque jour.",
    },
    daysToEid: {
      value: (days: number) => `J-${days}`,
      subtitle: "avant l'Aïd al-Fitr 2027",
      text: "Plus l'Aïd approche, plus les tarifs les moins chers disparaissent.",
    },
    cheapest: {
      subtitle: (route: string) => `le moins cher pour 1 adulte, ${route}`,
      text: "Aller simple vers l'Aïd al-Fitr 2027, hors bagages en soute, au jour le moins cher.",
    },
    observations: {
      subtitle: "prix relevés sur une même ligne",
      text: "Le conseil s'appuie sur les prix réellement observés, pas sur une promesse.",
    },
  },

  airlines: {
    eyebrow: "Les compagnies",
    titleFirst: "Qui vole",
    titleSecond: "sur ces lignes ?",
    text: "Cet hiver, cinq compagnies relient la France et l'Algérie sur les lignes qu'on suit. On compare leurs prix chaque jour.",
    independent:
      "Diaspora Routes n'est lié à aucune compagnie : le conseil est le même, quelle que soit la compagnie la moins chère.",
    codeLabel: "Code IATA :",
    marqueeTitle: "Compagnies comparées chaque jour",
    trademarks:
      "Marques et logos appartiennent à leurs propriétaires. Aucun partenariat avec ces compagnies.",
  },

  steps: {
    eyebrow: "Comment ça marche",
    titleFirst: "Quatre étapes,",
    titleSecond: "zéro jargon.",
    lead: "Chaque matin, le calcul tourne tout seul. Tu n'as rien à installer : tu lis le conseil, tu décides.",
    items: [
      {
        title: "On relève les prix",
        text: "Chaque jour, on récupère les prix des vols via une source officielle, sans aspirer les sites des compagnies.",
      },
      {
        title: "On les compare à l'Aïd",
        text: "On regarde combien de jours il reste avant la fête et comment les prix évoluent.",
      },
      {
        title: "On calcule le prix famille",
        text: "On estime le total pour ton profil : 1 adulte, ou 2 adultes avec 2 ou 3 enfants.",
      },
      {
        title: "Tu reçois un conseil clair",
        text: "Réserve, surveille ou attends, avec une phrase qui explique pourquoi.",
      },
    ],
  },

  alert: {
    eyebrow: "Alerte prix",
    titleFirst: "Reçois une alerte",
    titleSecond: "quand ça baisse.",
    text: "Un e-mail, sans compte, seulement quand ça vaut le coup. Désinscription en un clic.",
    emailLabel: "Ton adresse e-mail",
    emailPlaceholder: "prenom@exemple.fr",
    submit: "Bientôt disponible",
    soon: "Les alertes e-mail arrivent bientôt.",
  },

  footer: {
    tagline: "Savoir quand réserver ses billets entre la France et l'Algérie.",
    siteTitle: "Le site",
    legalTitle: "Informations",
    projectTitle: "Le projet",
    legal: "Mentions légales",
    privacy: "Confidentialité",
    credits: "Crédits photos",
    github: "Code source sur GitHub",
    disclaimer: "Tendances basées sur les prix observés, pas une garantie.",
    copyright: "© Diaspora Routes",
  },

  result: {
    metaTitle: "Ton conseil | Diaspora Routes",
    loading: "Chargement du conseil…",
    eyebrow: "Ton trajet",
    routeArrow: "→",
    summaryTravellers: "Voyageurs",
    summaryPeriod: "Période",
    summaryBags: (n: number) =>
      n === 0 ? "Aucun bagage en soute" : n === 1 ? "1 bagage en soute" : `${n} bagages en soute`,
    adults: (n: number) => (n > 1 ? `${n} adultes` : `${n} adulte`),
    children: (n: number) => (n === 0 ? "" : n > 1 ? `${n} enfants` : `${n} enfant`),
    priceEyebrow: "Prix total estimé",
    priceFor: (profile: string) => `pour ${profile}`,
    priceNote:
      "Aller simple France → Algérie, hors bagages en soute, au jour le moins cher de la période.",
    priceMissing: "Prix pas encore disponible pour ce trajet.",
    adviceLabel: "Notre conseil",
    updatedOn: (date: string) => `Conseil mis à jour le ${date}.`,
    cheaperEyebrow: "Option moins chère",
    cheaperAirport: (place: string, date: string) => `Pars de ${place} le ${date}`,
    cheaperAirportTo: (place: string) => `en arrivant à ${place}`,
    cheaperDay: (date: string) => `Pars le ${date}`,
    cheaperStops: (date: string) => `Avec une escale, le ${date}`,
    cheaperStopsNote: "Plus long, mais moins cher. Le prix et le conseil ci-dessus portent sur les vols directs.",
    cheaperSaving: (saving: string) => `${saving} d'économie`,
    cheaperNone: "Pas d'option moins chère repérée pour l'instant.",
    calendarEyebrow: "Calendrier des prix",
    calendarTitleFirst: "Les jours de départ",
    calendarTitleSecond: "et leur prix.",
    calendarEmpty: "Pas encore assez de relevés pour afficher le calendrier.",
    shareEyebrow: "Partager",
    shareWhatsapp: "Partager sur WhatsApp",
    whatsappText: (summary: string, url: string) =>
      `Regarde quand réserver ${summary} sur Diaspora Routes : ${url}`,
    alertMe: "M'alerter",
    alertSoon: "Les alertes e-mail arrivent bientôt.",
    disclaimer: "Tendance basée sur les prix observés, pas une garantie.",
    noAdviceTitle: "Pas encore de conseil pour ce trajet.",
    noAdviceText:
      "On n'a pas encore assez de prix relevés pour cette combinaison. Reviens dans quelques jours.",
    profileNotTrackedTitle: "Ce profil n'est pas encore suivi.",
    profileNotTrackedText:
      "Pour l'instant, on suit seulement 1 adulte, ou 2 adultes avec 2 ou 3 enfants. Essaie avec l'un de ces profils.",
    invalidTitle: "Ce trajet n'est pas encore suivi.",
    invalidText:
      "Choisis un départ (Lyon, Marseille, Paris), une destination (Alger, Oran, Constantine) et une période (une fête, des vacances ou un mois).",
    backToSearch: "Modifier la recherche",
  },

  affiliate: {
    eyebrow: "Prix exact",
    title: "Vérifie le prix du jour",
    text: "Notre prix est une estimation tirée des prix observés. Pour le prix exact, avec tes dates et ta famille, lance la recherche :",
    cheapestDay: (date: string) => `Voir les vols du ${date}`,
    cheaperOption: (date: string) => `Voir l'option moins chère (${date})`,
    disclosure:
      "Lien partenaire : si tu réserves après ce lien, Diaspora Routes touche une petite commission d'Aviasales, sans aucun surcoût pour toi. Ça ne change rien à notre conseil.",
    newTab: "S'ouvre sur Aviasales, dans un nouvel onglet.",
  },

  calendar: {
    legendLabel: "Légende",
    cheap: "Moins cher",
    mid: "Moyen",
    expensive: "Plus cher",
    cheapest: "Le moins cher",
    gridLabel: "Prix famille par jour de départ",
    weekdays: ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."],
    noPrice: "pas de prix relevé",
    noPriceLegend: "– : pas encore de prix ce jour-là",
  },

  pages: {
    method: {
      metaTitle: "Comment ça marche | Diaspora Routes",
      eyebrow: "La méthode",
      subtitle: "sans jargon.",
    },
    legal: {
      metaTitle: "Mentions légales | Diaspora Routes",
      eyebrow: "Informations",
      subtitle: "qui édite ce site.",
    },
    credits: {
      metaTitle: "Crédits photos | Diaspora Routes",
      eyebrow: "Crédits",
      titleFirst: "Les photos",
      titleSecond: "et leurs auteurs.",
      intro:
        "Toutes les photos du site sont sous licence libre. Merci à leurs auteurs. Elles montrent l'Algérie et le voyage, pas des clients ni des vols précis.",
      listLabel: "Liste des photos",
      by: "Par",
      source: "Voir la source",
    },
    privacy: {
      metaTitle: "Confidentialité | Diaspora Routes",
      eyebrow: "Tes données",
      subtitle: "ce qu'on garde, et pourquoi.",
    },
  },

  observatory: {
    metaTitle: "Observatoire | Diaspora Routes",
    eyebrow: "Observatoire",
    titleFirst: "Prix de l'Aïd,",
    titleSecond: "ligne par ligne.",
    intro:
      "Pour chaque ligne suivie : le conseil du jour et le prix pour 1 adulte selon le jour de départ autour de l'Aïd. Mis à jour une fois par jour.",
    updatedOn: (date: string) => `Dernier calcul le ${date}.`,
    periodEyebrow: "Période",
    pricePrefix: "dès",
    priceNote: "1 adulte, aller simple, hors bagages en soute",
    noPrice: "Pas encore de prix",
    chartLabel: (route: string) => `Prix 1 adulte par jour de départ, ${route}`,
    cheapestDay: (date: string) => `Jour le moins cher : ${date}`,
    seeDetail: "Voir le détail",
    empty: "Pas encore de données pour cette période : elle entrera dans le suivi environ 4 mois avant l'Aïd.",
    historyNote:
      "Bientôt : l'évolution des prix jour après jour, dès qu'on aura quelques semaines de relevés.",
    disclaimer: "Tendance basée sur les prix observés, pas une garantie.",
  },
} as const;
