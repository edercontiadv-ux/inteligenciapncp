'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-brand-navy/40 hover:text-brand-navy/70 transition-colors"
        title="Trocar tema"
        aria-label="Trocar tema"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">{theme.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-brand-sand/30 shadow-lg shadow-brand-navy/10 p-2 z-50 animate-scale-in origin-top-right">
          <p className="font-body text-xs font-medium text-brand-navy/50 px-2 py-1.5 uppercase tracking-wider">
            Temas
          </p>
          <div className="space-y-0.5 mt-1">
            {availableThemes.map((t) => {
              const isActive = t.id === theme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-navy/5 text-brand-navy'
                      : 'text-brand-navy/60 hover:bg-brand-navy/[0.03] hover:text-brand-navy/80'
                  }`}
                >
                  <div className="flex gap-0.5 shrink-0">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: `rgb(${t.colors.navy})` }}
                    />
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: `rgb(${t.colors.gold})` }}
                    />
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: `rgb(${t.colors.forest})` }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-sm font-medium block leading-tight">
                      {t.name}
                    </span>
                    <span className="font-body text-xs text-brand-navy/40 truncate block leading-tight">
                      {t.description}
                    </span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-navy shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
