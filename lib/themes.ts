export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    navy: string;
    gold: string;
    forest: string;
    cream: string;
    ink: string;
    sand: string;
    mist: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  fontUrls: string[];
}

export const themes: Theme[] = [
  {
    id: 'institutional',
    name: 'Institucional',
    description: 'Sóbrio e refinado com identidade brasileira',
    colors: {
      navy: '10, 31, 63',
      gold: '180, 130, 40',
      forest: '27, 107, 74',
      cream: '247, 245, 240',
      ink: '26, 26, 46',
      sand: '232, 224, 212',
      mist: '226, 232, 240',
    },
    fonts: {
      heading: '"DM Serif Display", Georgia, serif',
      body: 'Outfit, system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300..700&display=swap',
    ],
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Profissional e calmante, azul oceano',
    colors: {
      navy: '26, 35, 50',
      gold: '45, 139, 139',
      forest: '168, 218, 220',
      cream: '241, 250, 238',
      ink: '13, 27, 42',
      sand: '197, 213, 214',
      mist: '224, 240, 240',
    },
    fonts: {
      heading: '"Playfair Display", Georgia, serif',
      body: '"Source Sans Pro", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Source+Sans+Pro:wght@300;400;600;700&display=swap',
    ],
  },
  {
    id: 'sunset-boulevard',
    name: 'Sunset Boulevard',
    description: 'Vibrante e criativo, pôr do sol',
    colors: {
      navy: '38, 70, 83',
      gold: '231, 111, 81',
      forest: '244, 162, 97',
      cream: '233, 196, 106',
      ink: '26, 26, 46',
      sand: '212, 195, 163',
      mist: '240, 230, 211',
    },
    fonts: {
      heading: '"Abril Fatface", Georgia, serif',
      body: '"Work Sans", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Work+Sans:wght@300;400;500;600;700&display=swap',
    ],
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    description: 'Natural e terroso, floresta',
    colors: {
      navy: '45, 74, 43',
      gold: '164, 172, 134',
      forest: '125, 132, 113',
      cream: '250, 249, 246',
      ink: '26, 46, 26',
      sand: '197, 201, 181',
      mist: '227, 230, 218',
    },
    fonts: {
      heading: '"Fraunces", Georgia, serif',
      body: '"Nunito", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Nunito:wght@300;400;600;700&display=swap',
    ],
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Limpo, escala de cinzas',
    colors: {
      navy: '54, 69, 79',
      gold: '112, 128, 144',
      forest: '211, 211, 211',
      cream: '255, 255, 255',
      ink: '26, 26, 26',
      sand: '192, 192, 192',
      mist: '232, 232, 232',
    },
    fonts: {
      heading: '"Josefin Sans", system-ui, sans-serif',
      body: '"DM Sans", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,100..1000&display=swap',
    ],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Quente e acolhedor, outonal',
    colors: {
      navy: '74, 64, 58',
      gold: '244, 169, 0',
      forest: '193, 102, 107',
      cream: '212, 184, 150',
      ink: '44, 36, 31',
      sand: '186, 167, 141',
      mist: '224, 211, 196',
    },
    fonts: {
      heading: '"Prata", Georgia, serif',
      body: '"Lato", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Prata&family=Lato:wght@300;400;700&display=swap',
    ],
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Frio e nítido, precisão',
    colors: {
      navy: '74, 111, 165',
      gold: '192, 192, 192',
      forest: '212, 228, 247',
      cream: '250, 250, 250',
      ink: '26, 42, 58',
      sand: '168, 186, 202',
      mist: '226, 236, 245',
    },
    fonts: {
      heading: '"Raleway", system-ui, sans-serif',
      body: '"Open Sans", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&family=Open+Sans:wght@300;400;600;700&display=swap',
    ],
  },
  {
    id: 'desert-rose',
    name: 'Desert Rose',
    description: 'Suave e sofisticado, terroso',
    colors: {
      navy: '93, 46, 70',
      gold: '184, 125, 109',
      forest: '212, 165, 165',
      cream: '232, 213, 196',
      ink: '46, 26, 36',
      sand: '203, 181, 168',
      mist: '232, 219, 210',
    },
    fonts: {
      heading: '"Cormorant Garamond", Georgia, serif',
      body: '"Proza Libre", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Proza+Libre:wght@400;500;600;700&display=swap',
    ],
  },
  {
    id: 'tech-innovation',
    name: 'Tech Innovation',
    description: 'Moderno, alto contraste',
    colors: {
      navy: '30, 30, 30',
      gold: '0, 102, 255',
      forest: '0, 255, 255',
      cream: '255, 255, 255',
      ink: '10, 10, 10',
      sand: '107, 114, 128',
      mist: '229, 231, 235',
    },
    fonts: {
      heading: '"Space Grotesk", system-ui, sans-serif',
      body: '"Chivo", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Chivo:wght@300;400;700&display=swap',
    ],
  },
  {
    id: 'botanical-garden',
    name: 'Botanical Garden',
    description: 'Fresco e orgânico, jardim',
    colors: {
      navy: '74, 124, 89',
      gold: '249, 166, 32',
      forest: '183, 71, 42',
      cream: '245, 243, 237',
      ink: '26, 46, 26',
      sand: '184, 196, 168',
      mist: '227, 232, 218',
    },
    fonts: {
      heading: '"Libre Baskerville", Georgia, serif',
      body: '"Montserrat", system-ui, sans-serif',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@300;400;500;600;700&display=swap',
    ],
  },
  {
    id: 'midnight-galaxy',
    name: 'Midnight Galaxy',
    description: 'Dramático e cósmico',
    colors: {
      navy: '43, 30, 62',
      gold: '74, 78, 143',
      forest: '164, 144, 194',
      cream: '230, 230, 250',
      ink: '13, 8, 26',
      sand: '122, 110, 143',
      mist: '206, 199, 219',
    },
    fonts: {
      heading: '"Syncopate", system-ui, sans-serif',
      body: '"Space Mono", monospace',
    },
    fontUrls: [
      'https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Space+Mono:wght@400;700&display=swap',
    ],
  },
];

export const institutionalDark: Theme = {
  id: 'institutional-dark',
  name: 'Institucional Escuro',
  description: 'Modo escuro da identidade institucional',
  colors: {
    navy: '200, 150, 62',
    gold: '200, 150, 62',
    forest: '27, 107, 74',
    cream: '15, 23, 42',
    ink: '226, 232, 240',
    sand: '30, 41, 61',
    mist: '20, 30, 50',
  },
  fonts: {
    heading: '"DM Serif Display", Georgia, serif',
    body: 'Outfit, system-ui, sans-serif',
  },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300..700&display=swap',
  ],
};

export const activeThemes: Theme[] = [themes[0], institutionalDark];

export const defaultTheme = themes[0];
