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

const themes: Theme[] = [
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
  }
];

const institutionalDark: Theme = {
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
