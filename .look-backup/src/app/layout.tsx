import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Noto_Serif_Devanagari } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnounceBar from "@/components/layout/AnnounceBar";
import Overlays from "@/components/overlay/Overlays";
import Toast from "@/components/ui/Toast";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400","500","600","700","800"], variable: "--font-sans", display: "swap" });
const dev = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["500","600"], variable: "--font-dev", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Shehnai® — Ethnic Jewellery & Accessories", template: "%s · Shehnai®" },
  description: "Kundan and brass, worked the way they always have been — for men, for women, for weddings, and for the mandir at home.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { type: "website", locale: "en_IN" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, verticals] = await Promise.all([
    getSettings(),
    prisma.vertical.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const nav = verticals.map((v) => ({
    id: v.id, slug: v.slug, name: v.name, devName: v.devName,
    categories: v.categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
  }));

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${dev.variable}`}>
      <body>
        <a href="#main"
           className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-toast focus:rounded focus:bg-ink focus:px-4 focus:py-3 focus:text-cream">
          Skip to content
        </a>

        <AnnounceBar text={settings.announcement} />
        <Header verticals={nav} />

        <main id="main" className="min-h-[60vh]">{children}</main>

        <Footer settings={settings} verticals={nav} />
        <Overlays verticals={nav} freeShippingAt={settings.freeShippingThresholdPaise} />
        <Toast />
      </body>
    </html>
  );
}
