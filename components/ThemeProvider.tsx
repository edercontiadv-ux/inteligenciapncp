'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Theme, themes, defaultTheme } from '@/lib/themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {},
  availableThemes: themes,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('inteligencia-pncp-theme');
    if (saved) {
      const found = themes.find((t) => t.id === saved);
      if (found) setThemeState(found);
    }
  }, []);

  const setTheme = useCallback((id: string) => {
    const found = themes.find((t) => t.id === id);
    if (found) {
      setThemeState(found);
      localStorage.setItem('inteligencia-pncp-theme', id);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);

    const r = root.style;
    const c = theme.colors;
    r.setProperty('--brand-navy', c.navy);
    r.setProperty('--brand-gold', c.gold);
    r.setProperty('--brand-forest', c.forest);
    r.setProperty('--brand-cream', c.cream);
    r.setProperty('--brand-ink', c.ink);
    r.setProperty('--brand-sand', c.sand);
    r.setProperty('--brand-mist', c.mist);
    r.setProperty('--font-heading', theme.fonts.heading);
    r.setProperty('--font-body', theme.fonts.body);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}
