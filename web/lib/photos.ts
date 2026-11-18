/**
 * Photos du site : toutes sous licence libre (usage commercial autorisé), avec crédit.
 * Source unique pour les composants et la page /credits. Voir aussi public/images/CREDITS.md.
 */

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  page: string;
};

export const photos = {
  oran: {
    src: "/images/oran-baie.jpg",
    alt: "La baie d'Oran vue depuis Santa Cruz : la jetée du port, les bateaux et la ville au bord de la mer",
    width: 1920,
    height: 1440,
    title: "Oran - Santa cruz - panoramio",
    author: "habib kaki",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=54400053",
  },
  airport: {
    src: "/images/alger-aeroport.jpg",
    alt: "Le grand hall lumineux de l'aéroport d'Alger Houari-Boumédiène, avec des voyageurs et leurs valises",
    width: 1920,
    height: 1440,
    title: "Aeroport Houari Boumediene IMG 1374",
    author: "Poudou99",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=11916529",
  },
  alger: {
    src: "/images/alger-bab-el-oued.jpg",
    alt: "Alger vue des hauteurs : le quartier de Bab El Oued et ses immeubles blancs face à la mer",
    width: 1920,
    height: 1440,
    title: "Bab El Oued Algiers 2008",
    author: "Sandervalya",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=3946664",
  },
  constantine: {
    src: "/images/constantine-el-kantara.jpg",
    alt: "Constantine perchée au-dessus des gorges du Rhummel, avec le pont El Kantara",
    width: 1920,
    height: 1440,
    title: "Constantine, Pont El Kantara, Algeria",
    author: "Alaa Benz",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=23077675",
  },
  window: {
    src: "/images/hublot-nuages.jpg",
    alt: "Vue par le hublot d'un avion : l'aile au-dessus d'une mer de nuages blancs",
    width: 1536,
    height: 2048,
    title: "View from an airplane window showing a wing and a vast sea of fluffy white clouds",
    author: "akidgrt",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    page: "https://wordpress.org/photos/photo/9625964cea/",
  },
} satisfies Record<string, Photo>;

/** Photo de chaque destination (page Résultat). */
export const destinationPhotos = {
  ALG: photos.alger,
  ORN: photos.oran,
  CZL: photos.constantine,
} as const;
