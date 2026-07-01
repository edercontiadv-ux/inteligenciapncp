'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Theme, activeThemes, defaultTheme } from '@/lib/themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {},
  availableThemes: activeThemes,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function loadFonts(urls: string[]) {
  urls.forEach((url) => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  });
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('inteligencia-pncp-theme');
    if (saved) {
      const found = activeThemes.find((t) => t.id === saved);
      if (found) setThemeState(found);
    }
  }, []);

  const setTheme = useCallback((id: string) => {
    const found = activeThemes.find((t) => t.id === id);
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

    loadFonts(theme.fontUrls);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: activeThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}
