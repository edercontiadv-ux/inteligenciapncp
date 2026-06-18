'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, ClipboardList, Users } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Busca', icon: Search },
  { href: '/tarefas', label: 'Tarefas', icon: ClipboardList },
  { href: '/clientes', label: 'Clientes', icon: Users },
];

export default function NavigationTabs() {
  const pathname = usePathname();

  return (
    <div className="border-t border-brand-sand/20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-3 font-body text-sm border-b-2 transition-all ${
                  isActive
                    ? 'border-brand-navy text-brand-navy font-medium'
                    : 'border-transparent text-brand-navy/40 hover:text-brand-navy/60 hover:border-brand-navy/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
