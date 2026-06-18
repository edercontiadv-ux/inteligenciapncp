'use client';

import { useEffect, useState } from 'react';

export default function PNCPStatusIndicator() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (!cancelled) setStatus(data.status === 'online' ? 'online' : 'offline');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 text-xs text-brand-navy/40">
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'online'
            ? 'bg-brand-forest animate-pulse'
            : status === 'offline'
            ? 'bg-red-400'
            : 'bg-brand-sand animate-pulse'
        }`}
      />
      {status === 'online' ? 'API PNCP Online' : status === 'offline' ? 'API PNCP Offline' : 'Verificando...'}
    </div>
  );
}
