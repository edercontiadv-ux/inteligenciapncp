'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user || pathname === '/login') return null;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-xs text-brand-navy/40 hover:text-red-500 transition-colors font-body"
      title="Sair"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
