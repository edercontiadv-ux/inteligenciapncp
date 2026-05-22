import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import AssistenteVirtual from "@/components/AssistenteVirtual";

export const metadata: Metadata = {
  title: "Inteligência PNCP",
  description: "Ferramenta de Composição de Preço Médio via API do PNCP",
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
                  <div className="hidden sm:flex items-center gap-2 text-xs text-brand-navy/40">
                    <span className="w-2 h-2 rounded-full bg-brand-forest animate-pulse" />
                    API PNCP Online
                  </div>
                  <ThemeSwitcher />
                </div>
              </div>
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
          <AssistenteVirtual />
        </ThemeProvider>
      </body>
    </html>
  );
}
