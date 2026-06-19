import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import PNCPStatusIndicator from "@/components/PNCPStatusIndicator";
import NavigationTabs from "@/components/NavigationTabs";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Inteligência PNCP",
  description: "Ferramenta de Composição de Preço Médio via API do PNCP",
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
  openGraph: {
    title: 'Inteligência PNCP',
    description: 'Ferramenta de Composição de Preço Médio via API do PNCP',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <div className="relative">
              {/* Decorative top bar */}
              <div className="h-1.5 bg-gradient-to-r from-brand-navy via-brand-gold to-brand-forest" />

              <header className="relative z-10 border-b border-brand-sand/30 bg-white/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                  <div className="flex items-center gap-3">
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
                  </div>
                  <div className="flex items-center gap-4">
                    <PNCPStatusIndicator />
                    <ThemeSwitcher />
                  </div>
                </div>

                <NavigationTabs />
              </header>

              <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                {children}
              </main>

              <footer className="border-t border-brand-sand/30 bg-white/50 mt-16 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-brand-navy/50 text-xs">
                      <span className="font-heading text-base text-brand-navy/30 italic">P</span>
                      <span>Inteligência PNCP</span>
                    </div>
                    <p className="text-brand-navy/40 text-xs text-center">
                      Ferramenta auxiliar baseada no art. 23 da Lei nº 14.133/2021.
                      Dados provenientes do Portal Nacional de Contratações Públicas.
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
