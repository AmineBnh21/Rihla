import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import DemoBanner from "@/components/DemoBanner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { copy } from "@/lib/copy";
import { isSupabaseConfigured } from "@/lib/supabase";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: copy.site.title,
  description: copy.site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Structure prête pour l'arabe plus tard : lang="ar" dir="rtl".
    <html lang="fr" dir="ltr" className={`${interTight.variable} antialiased`}>
      <body className="min-h-dvh bg-cream font-sans text-ink">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:text-ink"
        >
          {copy.site.skipLink}
        </a>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 pb-4 pt-3 md:px-6">
          <Navbar />
          {!isSupabaseConfigured && <DemoBanner />}
          <main id="contenu" className="flex flex-col gap-4">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
