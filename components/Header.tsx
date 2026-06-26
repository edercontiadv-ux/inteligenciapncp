'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PNCPStatusIndicator from '@/components/PNCPStatusIndicator';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LogoutButton from '@/components/LogoutButton';
import NavigationTabs from '@/components/NavigationTabs';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isLanding = pathname === '/';
  const isLogin = pathname.startsWith('/login');
  const showAppNav = user && !isLanding && !isLogin;

  return (
    <header className="relative z-10 border-b border-brand-sand/30 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <button
          onClick={() => router.push(user ? '/busca' : '/')}
          className="flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-navy flex items-center justify-center">
            <span className="text-brand-gold font-heading text-lg italic">P</span>
          </div>
          <div>
            <h1 className="font-heading text-xl text-brand-navy leading-tight">
              Inteligência PNCP
            </h1>
            <span className="font-body text-xs text-brand-navy/50 tracking-widest uppercase">
              Pesquisa de Preços
            </span>
          </div>
        </button>
        <div className="flex items-center gap-4">
          {showAppNav && <PNCPStatusIndicator />}
          <ThemeSwitcher />
          {showAppNav && <LogoutButton />}
        </div>
      </div>

      {showAppNav && <NavigationTabs />}
    </header>
  );
}
