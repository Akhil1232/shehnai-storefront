import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Noto_Serif_Devanagari } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnounceBar from "@/components/layout/AnnounceBar";
import CartDrawer from "@/components/cart/CartDrawer";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const dev = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "600"],
  variable: "--font-dev",
});

export const metadata: Metadata = {
  title: {
    default: "Shehnai® — Ethnic Jewellery & Accessories",
    template: "%s · Shehnai®",
  },
  description:
    "Kundan and brass, worked the way they always have been — for the men, the women, and the quiet devotion of a home shrine.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { type: "website", locale: "en_IN" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, verticals] = await Promise.all([
    getSettings(),
    prisma.vertical.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${dev.variable}`}>
      <body className="font-sans">
        <AnnounceBar text={settings.announcement} />
        <Header verticals={verticals} />
        <main>{children}</main>
        <Footer settings={settings} verticals={verticals} />
        <CartDrawer />
      </body>
    </html>
  );
}
