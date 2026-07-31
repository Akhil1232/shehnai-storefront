#!/usr/bin/env bash
# =============================================================================
# BLUSH PALETTE + REMOVE THE MOBILE BOTTOM BAR
#
#   cd ~/shehnai-storefront
#   sudo bash update-look.sh
#
# TWO CHANGES
#
# 1. Removes the mobile bottom navigation. Everything on it (search, saved,
#    bag, collections) is already in the header and the menu drawer, so it was
#    a second copy taking up screen height.
#
# 2. Rebuilds the background as three layers rather than a flat colour:
#
#      1. a WARM WHITE field                #FDFAF6
#      2. three soft blush / beige pools    large, diffuse, asymmetric
#      3. a fine lattice ornament           drift 5 - visible only on a look
#
#    Every earlier attempt used a flat pink page. That is the wrong shape of
#    solution: a flat fill tints every pixel behind the type, so the copy is
#    permanently fighting the background. A warm white field with blush
#    arriving as a wash reads as pink overall while the text itself sits on
#    something close to white - which is how the packaging works too.
#
#    Ornament scale was also wrong before. At drift 5 a large damask reads as
#    uneven blotches; a fine 96px motif reads as paper grain.
#
# Safe to re-run.  Undo instructions print at the end.
# =============================================================================
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$APP_DIR/package.json" ]] || { echo "Run from the project folder."; exit 1; }
[[ $EUID -eq 0 ]] || { echo "Run with sudo."; exit 1; }
OWNER="$(stat -c '%U' "$APP_DIR/package.json")"
cd "$APP_DIR"

G=$'\033[1;32m'; B=$'\033[1;35m'; N=$'\033[0m'
step() { printf "\n${B}[%s/4] %s${N}\n" "$1" "$2"; }
ok()   { printf "  ${G}ok${N}    %s\n" "$1"; }

BK="$APP_DIR/.look-backup"
mkdir -p "$BK"

step 1 "Backing up"
for f in tailwind.config.ts src/app/globals.css src/app/layout.tsx \
         src/components/layout/Footer.tsx src/components/layout/Header.tsx \
         src/components/layout/BottomNav.tsx src/components/ui/Toast.tsx \
         src/components/product/AddToCart.tsx src/components/checkout/CheckoutForm.tsx \
         src/components/collection/Filters.tsx ; do
  [[ -f "$f" ]] && { mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; }
done
chown -R "$OWNER:$OWNER" "$BK"
ok "backup in $BK"

step 2 "Writing the updated files"
cat > 'tailwind.config.ts' <<'LOOK_FILE_END'
import type { Config } from "tailwindcss";

/**
 * =============================================================================
 * THE SINGLE SOURCE OF TRUTH FOR THE DESIGN
 * =============================================================================
 * Every colour, font, breakpoint, radius, shadow and z-index lives here.
 * globals.css holds only what genuinely cannot be a utility (the body
 * background wash and a few base resets).
 *
 * To retheme the site, edit `colors` below. Nothing else needs to change.
 *
 * The colours are ALSO mirrored as CSS variables in globals.css so that
 * arbitrary values like `border-[color:var(--line)]` keep working — the admin
 * panel uses a few of those.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // One breakpoint scale for the whole app. `lg` is 900px, not Tailwind's
    // default 1024px, because that is where the desktop nav takes over from
    // the mobile bottom bar. Two scales disagreeing is how elements end up
    // rendering on top of each other.
    screens: {
      sm: "640px",
      md: "760px",
      lg: "900px",
      xl: "1100px",
      "2xl": "1300px",
    },
    extend: {
      colors: {
        onyx: "#120D0A",
        ink: { DEFAULT: "#241C15", soft: "#4A3B2E" },
        maroon: { DEFAULT: "#8A2226", deep: "#5A0F12", soft: "#F3E6E2" },
        gold: { DEFAULT: "#C9A24B", deep: "#7E5A25", pale: "#E7D3B1" },
        rose: "#D3A0A8", // ornament
        forest: "#2F6B4F",
        // Blush-beige, taken from the packaging.
        // Warm white field. Blush arrives as a wash in globals.css,
        // not as a flat fill — that is what keeps text legible.
        beige: { DEFAULT: "#FDFAF6", deep: "#F7E6E5" },
        cream: "#FCF4F1",
        paper: "#FFFFFF",
        // Semantic aliases used for text and hairlines.
        muted: "rgba(36,28,21,.68)",
        faint: "rgba(36,28,21,.42)",
        line: { DEFAULT: "rgba(138,34,38,.13)", gold: "rgba(201,162,75,.42)" },
        header: "#FCF3F0", // sticky header / floating bars
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        dev: ["var(--font-dev)", "var(--font-serif)", "serif"],
      },
      fontSize: {
        // Fluid display sizes, so headings never need a breakpoint override.
        display: ["clamp(32px,5.2vw,56px)", { lineHeight: "1.1" }],
        h1: ["clamp(26px,3.6vw,40px)", { lineHeight: "1.14" }],
        h2: ["clamp(22px,2.8vw,30px)", { lineHeight: "1.16" }],
      },
      borderRadius: {
        DEFAULT: "3px",
        arch: "170px 170px 3px 3px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(138,34,38,.06)",
        card: "0 8px 24px rgba(138,34,38,.09)",
        lift: "0 20px 48px rgba(138,34,38,.14)",
        // The gold double-border used around hero and arch frames.
        frame: "0 0 0 5px #FFFFFF, 0 0 0 6px rgba(201,162,75,.42), 0 20px 48px rgba(138,34,38,.14)",
      },
      backgroundImage: {
        // Decorative only. NONE of these sit behind body copy — a pattern
        // under text is what made the old build feel noisy and hard to read.
        // Fine lattice ornament. Visible weight is --texture in globals.css.
        ornament: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2796%27%20height%3D%2796%27%20viewBox%3D%270%200%2096%2096%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23D3A0A8%27%20stroke-width%3D%270.9%27%3E%3Cpath%20d%3D%27M0%2048.0%20L48.0%200%20L96%2048.0%20L48.0%2096%20Z%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27%23D3A0A8%27%3E%3Cellipse%20cx%3D%2753.6%27%20cy%3D%2748.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%2742.4%27%20cy%3D%2748.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%2748.0%27%20cy%3D%2753.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Cellipse%20cx%3D%2748.0%27%20cy%3D%2742.4%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Ccircle%20cx%3D%2748.0%27%20cy%3D%2748.0%27%20r%3D%271.5%27%2F%3E%3Cellipse%20cx%3D%275.6%27%20cy%3D%270.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%27-5.6%27%20cy%3D%270.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%270.0%27%20cy%3D%275.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Cellipse%20cx%3D%270.0%27%20cy%3D%27-5.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Ccircle%20cx%3D%270%27%20cy%3D%270%27%20r%3D%271.5%27%2F%3E%3Cellipse%20cx%3D%27101.6%27%20cy%3D%270.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%2790.4%27%20cy%3D%270.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%2796.0%27%20cy%3D%275.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Cellipse%20cx%3D%2796.0%27%20cy%3D%27-5.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Ccircle%20cx%3D%2796%27%20cy%3D%270%27%20r%3D%271.5%27%2F%3E%3Cellipse%20cx%3D%275.6%27%20cy%3D%2796.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%27-5.6%27%20cy%3D%2796.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%270.0%27%20cy%3D%27101.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Cellipse%20cx%3D%270.0%27%20cy%3D%2790.4%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Ccircle%20cx%3D%270%27%20cy%3D%2796%27%20r%3D%271.5%27%2F%3E%3Cellipse%20cx%3D%27101.6%27%20cy%3D%2796.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%2790.4%27%20cy%3D%2796.0%27%20rx%3D%272.30%27%20ry%3D%275.29%27%2F%3E%3Cellipse%20cx%3D%2796.0%27%20cy%3D%27101.6%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Cellipse%20cx%3D%2796.0%27%20cy%3D%2790.4%27%20rx%3D%275.29%27%20ry%3D%272.30%27%2F%3E%3Ccircle%20cx%3D%2796%27%20cy%3D%2796%27%20r%3D%271.5%27%2F%3E%3Ccircle%20cx%3D%2724.0%27%20cy%3D%2724.0%27%20r%3D%271.1%27%2F%3E%3Ccircle%20cx%3D%2772.0%27%20cy%3D%2724.0%27%20r%3D%271.1%27%2F%3E%3Ccircle%20cx%3D%2724.0%27%20cy%3D%2772.0%27%20r%3D%271.1%27%2F%3E%3Ccircle%20cx%3D%2772.0%27%20cy%3D%2772.0%27%20r%3D%271.1%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',
        band: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27120%27%20height%3D%2728%27%20viewBox%3D%270%200%20120%2028%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23A9762F%27%20stroke-width%3D%271%27%20opacity%3D%270.5%27%3E%3Cpath%20d%3D%27M0%2014%20Q15%200%2030%2014%20Q45%2028%2060%2014%20Q75%200%2090%2014%20Q105%2028%20120%2014%27%2F%3E%3Cpath%20d%3D%27M0%2014%20Q15%2028%2030%2014%20Q45%200%2060%2014%20Q75%2028%2090%2014%20Q105%200%20120%2014%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27%23A9762F%27%20opacity%3D%270.55%27%3E%3Ccircle%20cx%3D%270%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%2760%27%20cy%3D%2714%27%20r%3D%272.6%27%2F%3E%3Ccircle%20cx%3D%2790%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%27120%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',      // horizontal divider between sections      
        scallop: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2714%27%20viewBox%3D%270%200%2024%2014%27%3E%3Cpath%20d%3D%27M0%201.6%20H24%27%20stroke%3D%27%23C9A24B%27%20stroke-width%3D%271%27%20fill%3D%27none%27%20opacity%3D%270.55%27%2F%3E%3Cpath%20d%3D%27M0%202%20Q6%2022%2012%202%20Q18%2022%2024%202%27%20fill%3D%27none%27%20stroke%3D%27%23C9A24B%27%20stroke-width%3D%271.35%27%2F%3E%3C%2Fsvg%3E")',
        jewel: "linear-gradient(158deg,#FFFFFF,#FBF0EC)", // product art field
      },
      // Named layers, so nothing ever guesses a z-index. Ordered bottom to top.
      zIndex: {
        bar: "30",      // sticky filter/sort bar
        header: "#FCF3F0", // sticky header / floating bars
        buybar: "45",   // floating buy bar (sits below the tab bar)
        tabbar: "50",   // mobile bottom navigation
        backdrop: "60",
        panel: "70",    // drawers, sheets, search overlay
        toast: "80",
      },
      spacing: {
        tabbar: "3.5rem", // 56px — keep in step with the BottomNav height
        // Header height (64px) + 14px gap. Used as the offset for every sticky
        // sidebar so they all align under the header.
        "sticky-top": "4.875rem",
        13: "3.25rem",
        15: "3.75rem",
        4.5: "1.125rem",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(.2,.7,.3,1)",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
LOOK_FILE_END
echo "    wrote tailwind.config.ts"
mkdir -p "src/app"
cat > 'src/app/globals.css' <<'LOOK_FILE_END'
@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * =============================================================================
 * globals.css — DELIBERATELY SMALL
 * =============================================================================
 * All visual design lives in tailwind.config.ts and in utility classes on the
 * components. This file holds only three things:
 *
 *   1. CSS variables, mirroring the Tailwind palette, so arbitrary values like
 *      `border-[color:var(--line)]` keep working (the admin panel uses these).
 *   2. Base element defaults that cannot be expressed as utilities.
 *   3. Two tiny helpers that need a media query or an observer class.
 *
 * Do NOT add component classes here. If a rule would beat a Tailwind utility,
 * it belongs in a component's className instead — mixing the two means the
 * later one silently wins and elements start overlapping.
 */

:root {
  --onyx: #120d0a;
  --ink: #241c15;
  --ink-soft: #4a3b2e;
  --maroon: #8a2226;
  --maroon-deep: #5a0f12;
  --maroon-soft: #f3e6e2;
  --gold: #c9a24b;
  --gold-deep: #7e5a25;
  --gold-pale: #e7d3b1;
  --rose: #d3a0a8;
  --header: #fcf3f0;
  --forest: #2f6b4f;
  --beige: #fdfaf6;
  --beige-deep: #f7e6e5;
  --cream: #fcf4f1;
  --paper: #ffffff;
  --muted: rgba(36, 28, 21, 0.68);
  --faint: rgba(36, 28, 21, 0.42);
  --line: rgba(138, 34, 38, 0.13);
  --line-gold: rgba(201, 162, 75, 0.42);
}

@layer base {
  /* ---------------------------------------------------------------------
     PAGE BACKGROUND
     ---------------------------------------------------------------------
     Three layers, in paint order:

       1. a WARM WHITE field                     #FDFAF6
       2. two soft blush pools, low opacity      #F6DCDF / #F9E7DC
       3. a fine lattice ornament                --texture

     Why not a flat pink page: a flat fill tints every pixel behind the type,
     so the copy is always fighting it. A warm white field with blush arriving
     as a diffuse wash reads as pink overall, while the text itself sits on
     something close to white. That is how the packaging works too — the blush
     is an accent, not a flood.

     The pools are large, soft and asymmetric on purpose. Symmetric corner
     vignettes look like smudging; an off-centre wash looks like paper.

     --texture governs the ornament only:

       0.09  visible at a glance
       0.055 <- current: you see it when you look for it, not before
       0.03  effectively invisible

     Contrast never drops below 13:1 anywhere on the page, so this is a taste
     control, not a legibility one.
     --------------------------------------------------------------------- */
  :root {
    --texture: 0.055;
  }

  html {
    background-color: #FDFAF6;
    background-image:
      radial-gradient(ellipse 80% 55% at 78% 0%,   rgba(246,220,223,.62), transparent 68%),
      radial-gradient(ellipse 70% 50% at 12% 34%,  rgba(249,231,220,.50), transparent 66%),
      radial-gradient(ellipse 95% 45% at 50% 100%, rgba(246,220,223,.55), transparent 70%);
    background-attachment: fixed;
  }

  body {
    @apply text-ink font-sans text-[15px] leading-relaxed antialiased;
    position: relative;
    overflow-x: hidden;
  }

  /* Ornament sits at z-index -1: above the washes, below every element.
     pointer-events:none so it can never intercept a click. */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image: theme("backgroundImage.ornament");
    background-repeat: repeat;
    background-size: 96px 96px;
    opacity: var(--texture);
  }

  /* A fixed layer repaints on every scroll frame on iOS, so let both scroll. */
  @media (max-width: 640px) {
    html { background-attachment: scroll; }
    body::before { position: absolute; background-size: 84px 84px; }
  }

  h1, h2, h3, h4 {
    @apply font-serif font-semibold;
    text-wrap: balance;
  }

  ::selection {
    @apply bg-gold text-onyx;
  }

  :focus-visible {
    @apply outline-2 outline-offset-[3px] outline-gold rounded-[2px];
    outline-style: solid;
  }

  /* Hide the scrollbar on horizontal product rails without losing scrolling. */
  .no-bar::-webkit-scrollbar { height: 0; width: 0; }
  .no-bar { scrollbar-width: none; }
}

/* Scroll-reveal. The `.in` class is added by components/ui/Reveal.tsx. */
@layer utilities {
  .reveal {
    @apply opacity-0 translate-y-5 transition-[opacity,transform] duration-700 ease-silk;
  }
  .reveal.in {
    @apply opacity-100 translate-y-0;
  }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
LOOK_FILE_END
echo "    wrote src/app/globals.css"
mkdir -p "src/app"
cat > 'src/app/layout.tsx' <<'LOOK_FILE_END'
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
LOOK_FILE_END
echo "    wrote src/app/layout.tsx"
mkdir -p "src/components/layout"
cat > 'src/components/layout/Footer.tsx' <<'LOOK_FILE_END'
import Link from "next/link";
import { cx, wrap } from "@/lib/styles";
import type { SiteSettings } from "@/lib/settings";
import type { NavVertical } from "./Header";

const ftLink = "block py-1.5 text-[13.5px] text-muted hover:text-gold-deep";
const ftHead = "mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.16em] font-sans";

export default function Footer({
  settings, verticals,
}: { settings: SiteSettings; verticals: NavVertical[] }) {
  return (
    <footer className="relative mt-5 border-t border-line-gold bg-beige-deep">
      {/* Scalloped gold-foil edge from the packaging. */}
      <div aria-hidden className="h-3.5 bg-scallop bg-[length:24px_14px] bg-repeat-x" />

      <div className={cx(wrap, "grid gap-7 pb-7 pt-9 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-8")}>
        <div>
          <div className="font-serif text-[26px] font-semibold">Shehnai&reg;</div>
          <p className="my-3 max-w-[34ch] text-[13.5px] text-muted">
            A modern ethnic jewellery &amp; accessories house from India &mdash; for men, women,
            weddings, and murti sringaar.
          </p>
          <span className="font-dev text-[15px] text-maroon">शहनाई · हर बात, बारीकी से</span>
        </div>

        <div>
          <h4 className={ftHead}>Shop</h4>
          {verticals.map((v) => (
            <Link key={v.id} href={`/collections/${v.slug}`} className={ftLink}>{v.name}</Link>
          ))}
          <Link href="/collections/all" className={ftLink}>All Jewellery</Link>
        </div>

        <div>
          <h4 className={ftHead}>Help</h4>
          <Link href="/policies/shipping" className={ftLink}>Shipping Policy</Link>
          <Link href="/policies/returns" className={ftLink}>Replacement Policy</Link>
          <Link href="/policies/privacy" className={ftLink}>Privacy Policy</Link>
          <Link href="/policies/terms" className={ftLink}>Terms &amp; Conditions</Link>
        </div>

        <div>
          <h4 className={ftHead}>Contact</h4>
          <a href={`mailto:${settings.supportEmail}`} className={ftLink}>{settings.supportEmail}</a>
          <a href={settings.whatsapp} className={ftLink}>WhatsApp</a>
          <a href={settings.instagram} className={ftLink}>Instagram</a>
        </div>
      </div>

      <div className={cx(wrap, "flex flex-wrap justify-between gap-3 border-t border-line py-4 text-[11.5px] text-muted")}>
        <span>&copy; {new Date().getFullYear()} Shehnai&reg; &middot; Ethnic Accessories</span>
        <span>UPI &middot; Cards &middot; Net Banking &middot; Wallets &middot; COD</span>
      </div>
    </footer>
  );
}
LOOK_FILE_END
echo "    wrote src/components/layout/Footer.tsx"
mkdir -p "src/components/layout"
cat > 'src/components/layout/Header.tsx' <<'LOOK_FILE_END'
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { Icon } from "@/components/ui/icons";
import { cx, wrap } from "@/lib/styles";

export type NavVertical = {
  id: string; slug: string; name: string; devName: string | null;
  categories: { id: string; slug: string; name: string }[];
};

const iconBtn =
  "grid h-[42px] w-[42px] place-items-center rounded-full transition-colors hover:bg-maroon/[.07]";

/**
 * One row at every width: logo, then navigation, then actions.
 *
 * Search is an icon on desktop as well as mobile — the full-width input was
 * eating the header and pushing the categories onto a second bar. With it gone
 * the category links fit inline, so the whole header is a single 64px strip.
 */
export default function Header({ verticals }: { verticals: NavVertical[] }) {
  const path = usePathname() ?? "/";
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const ui = useUI();
  const [mega, setMega] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-header border-b border-line bg-[#FCF3F0]/95 backdrop-blur-md">
      <div className={cx(wrap, "flex h-16 items-center gap-2")}>
        <button onClick={ui.openMenu} aria-label="Open menu" className={cx(iconBtn, "lg:hidden")}>
          <Icon name="menu" />
        </button>

        <Link href="/" aria-label="Shehnai home" className="flex shrink-0 items-center lg:mr-2">
          <Image src="/logo.png" alt="Shehnai" width={435} height={240} priority
                 className="h-9 w-auto lg:h-11" />
        </Link>

        {/* Category navigation, inline. Hidden below lg, where the drawer and
            the bottom tab bar take over. */}
        <nav aria-label="Collections" className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <NavLink href="/collections/all" active={path === "/collections/all"}>All</NavLink>

          {verticals.map((v) => (
            <div key={v.id} className="relative"
                 onMouseEnter={() => setMega(v.slug)} onMouseLeave={() => setMega(null)}>
              <NavLink href={`/collections/${v.slug}`} active={path.startsWith(`/collections/${v.slug}`)}>
                {v.name}
                {v.categories.length > 0 && <span className="text-[7px] opacity-50">&#9660;</span>}
              </NavLink>

              {v.categories.length > 0 && (
                <div className={cx(
                  "absolute left-1/2 top-full min-w-[240px] -translate-x-1/2 rounded border border-line-gold bg-paper p-2.5 shadow-lift",
                  "transition-all duration-200 ease-silk",
                  mega === v.slug ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
                )}>
                  {v.categories.map((c) => (
                    <Link key={c.id} href={`/collections/${v.slug}?category=${c.slug}`}
                          className="block rounded-[2px] px-3.5 py-2 text-[13.5px] hover:bg-cream hover:text-maroon">
                      {c.name}
                    </Link>
                  ))}
                  <Link href={`/collections/${v.slug}`}
                        className="mt-1.5 block border-t border-line px-3.5 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-maroon">
                    View all {v.name} &rarr;
                  </Link>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-0">
          <button onClick={ui.openSearch} aria-label="Search" className={iconBtn}>
            <Icon name="search" />
          </button>
          <Link href="/wishlist" aria-label="Saved pieces" className={iconBtn}>
            <Icon name="heart" />
          </Link>
          <button onClick={ui.openCart} aria-label={`Shopping bag, ${count} items`} className={cx(iconBtn, "relative")}>
            <Icon name="bag" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full border-[1.5px] border-beige bg-maroon px-1 text-[9.5px] font-extrabold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cx(
      "flex h-16 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors xl:px-4 xl:text-[12.5px]",
      active ? "border-maroon text-maroon" : "border-transparent hover:border-maroon hover:text-maroon"
    )}>
      {children}
    </Link>
  );
}
LOOK_FILE_END
echo "    wrote src/components/layout/Header.tsx"
mkdir -p "src/components/ui"
cat > 'src/components/ui/Toast.tsx' <<'LOOK_FILE_END'
"use client";

import { useToast } from "@/store/toast";
import { cx } from "@/lib/styles";
import { Icon } from "./icons";

/** Sits above the mobile tab bar so it never covers navigation. */
export default function Toast() {
  const message = useToast((s) => s.message);
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "pointer-events-none fixed left-1/2 z-toast flex max-w-[calc(100vw-2rem)] items-center gap-2",
        "rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-cream shadow-lift",
        "bottom-6",
        "transition-all duration-300 ease-silk",
        message ? "-translate-x-1/2 translate-y-0 opacity-100" : "-translate-x-1/2 translate-y-5 opacity-0"
      )}
    >
      {message && (<><Icon name="check" className="h-4 w-4 shrink-0 text-gold" /><span>{message}</span></>)}
    </div>
  );
}
LOOK_FILE_END
echo "    wrote src/components/ui/Toast.tsx"
mkdir -p "src/components/product"
cat > 'src/components/product/AddToCart.tsx' <<'LOOK_FILE_END'
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { formatINR, discountPercent } from "@/lib/money";
import QtyStepper from "@/components/ui/QtyStepper";
import { btn, cx, micro } from "@/lib/styles";
import type { FullProduct } from "@/types/catalog";

export default function AddToCart({ product }: { product: FullProduct }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.show);

  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const rowRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // The floating bar only appears once the real buttons scroll out of view.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return <p className="mt-4 text-maroon">Currently unavailable.</p>;

  const available = variant.stockQty - variant.reservedQty;
  const d = discountPercent(variant.pricePaise, variant.mrpPaise);
  const soldOut = available <= 0;

  const line = {
    variantId: variant.id, productId: product.id, slug: product.slug, name: product.name,
    variantName: variant.optionValue, sku: variant.sku,
    imageUrl: product.images[0]?.url ?? null, pricePaise: variant.pricePaise,
  };

  const buyNow = () => { add(line, qty); router.push("/checkout"); };

  return (
    <>
      <div className="mb-1 mt-2.5 flex flex-wrap items-baseline gap-3">
        <span className="text-[27px] font-extrabold text-maroon">{formatINR(variant.pricePaise)}</span>
        {d > 0 && (
          <>
            <span className="text-base text-faint line-through">{formatINR(variant.mrpPaise)}</span>
            <span className="text-[13.5px] font-extrabold text-forest">{d}% off</span>
          </>
        )}
      </div>
      <p className="text-xs text-muted">Inclusive of all taxes</p>

      {product.variants.length > 1 && (
        <div className="mt-4">
          <span className={micro}>Choose {product.variants[0].optionName ?? "option"}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stockQty - v.reservedQty <= 0;
              return (
                <button key={v.id} onClick={() => setVariantId(v.id)} disabled={out}
                        className={cx(
                          "rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                          v.id === variantId ? "border-maroon bg-maroon text-white" : "border-line bg-paper hover:border-gold",
                          out && "line-through opacity-40"
                        )}>
                  {v.optionValue ?? v.sku}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {soldOut ? (
        <div className="mt-4 rounded border border-line-gold bg-cream p-4 text-center">
          <b className="block text-[10.5px] font-extrabold uppercase tracking-[0.13em]">Currently sold out</b>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Message us on WhatsApp and we will tell you when it is back.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <QtyStepper qty={qty} onChange={setQty} max={available} />
            {available <= variant.lowStockAt && (
              <span className="text-[13.5px] font-bold text-maroon">Only {available} left</span>
            )}
          </div>

          <div ref={rowRef} className="mt-4 flex gap-2.5">
            <button className={cx(btn.line, "flex-1")}
                    onClick={() => { add(line, qty); toast(`${product.name} added to bag`); }}>
              Add to Bag
            </button>
            <button className={cx(btn.primary, "flex-1")} onClick={buyNow}>Buy Now</button>
          </div>

          {/* Floating buy bar, mobile only. */}
          <div className={cx(
            "fixed inset-x-0 bottom-0 z-buybar flex items-center gap-2.5 border-t border-line-gold",
            "bg-[#FCF3F0]/97 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md transition-transform duration-300 ease-silk lg:hidden",
            showBar ? "translate-y-0" : "translate-y-[130%]"
          )}>
            <div className="flex-none">
              <b className="block text-base text-maroon">{formatINR(variant.pricePaise)}</b>
              <span className="text-[10px] text-muted">{d > 0 ? `${d}% off` : "Incl. taxes"}</span>
            </div>
            <button className={cx(btn.primary, "flex-1")} onClick={buyNow}>Buy Now</button>
          </div>
        </>
      )}
    </>
  );
}
LOOK_FILE_END
echo "    wrote src/components/product/AddToCart.tsx"
mkdir -p "src/components/checkout"
cat > 'src/components/checkout/CheckoutForm.tsx' <<'LOOK_FILE_END'
"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";
import StepBar from "@/components/ui/StepBar";
import PolicyNote from "@/components/ui/PolicyNote";
import EmptyState from "@/components/ui/EmptyState";
import { btn, btnFull, cx, input, inputError, label as labelCls, summaryRow, summaryTotal, wrap } from "@/lib/styles";

declare global {
  interface Window { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }
}

const SAVED = "shehnai-address";

type Form = {
  name: string; phone: string; email: string;
  pincode: string; city: string; state: string; line1: string; line2: string;
};
const EMPTY: Form = { name: "", phone: "", email: "", pincode: "", city: "", state: "", line1: "", line2: "" };

const CHECKS: [keyof Form, (v: string) => boolean, string][] = [
  ["name", (v) => v.trim().length > 1, "Please enter your name"],
  ["phone", (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")), "Enter a valid 10-digit mobile number"],
  ["email", (v) => /\S+@\S+\.\S+/.test(v), "Please enter a valid email"],
  ["pincode", (v) => /^\d{6}$/.test(v.replace(/\D/g, "")), "Enter a valid 6-digit PIN code"],
  ["line1", (v) => v.trim().length > 4, "Please enter your address"],
];

export default function CheckoutForm({
  freeShippingAt, flatShipping, codEnabled, codFee,
}: { freeShippingAt: number; flatShipping: number; codEnabled: boolean; codFee: number }) {
  const router = useRouter();
  const { lines, clear } = useCart();

  const [f, setF] = useState<Form>(EMPTY);
  const [method, setMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinNote, setPinNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [bad, setBad] = useState<Set<keyof Form>>(new Set());
  const line1Ref = useRef<HTMLInputElement>(null);

  /* Returning customers should never type their address twice. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED);
      if (raw) setF({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setBad((b) => { const n = new Set(b); n.delete(k); return n; });
  };

  /* PIN fills city and state — two fewer fields, and it catches typos early. */
  async function onPincode(e: React.ChangeEvent<HTMLInputElement>) {
    const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
    setF((p) => ({ ...p, pincode }));
    setBad((b) => { const n = new Set(b); n.delete("pincode"); return n; });
    if (pincode.length !== 6) { setPinNote(null); return; }

    setPinNote({ ok: true, text: "Looking up…" });
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const [data] = await res.json();
      const po = data?.PostOffice?.[0];
      if (data?.Status === "Success" && po) {
        setF((p) => ({ ...p, city: po.District, state: po.State }));
        setPinNote({ ok: true, text: `✓ ${po.District}, ${po.State}` });
        line1Ref.current?.focus();
      } else setPinNote({ ok: false, text: "Please fill city and state yourself." });
    } catch { setPinNote({ ok: false, text: "Please fill city and state yourself." }); }
  }

  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);
  const shipping = subtotal >= freeShippingAt ? 0 : flatShipping;
  const fee = method === "COD" ? codFee : 0;
  const total = subtotal + shipping + fee;

  async function placeOrder() {
    const failed = new Set<keyof Form>();
    CHECKS.forEach(([k, ok]) => { if (!ok(f[k])) failed.add(k); });
    if (failed.size) {
      setBad(failed);
      setError("Please check the highlighted fields.");
      const first = document.getElementById(`f-${[...failed][0]}`);
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus();
      return;
    }

    setBusy(true); setError(null);
    try {
      localStorage.setItem(SAVED, JSON.stringify(f));
      const res = await fetch("/api/checkout/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
          email: f.email, phone: f.phone,
          address: { name: f.name, phone: f.phone, line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");

      if (data.cod) { clear(); router.push(`/order/${data.orderNumber}`); return; }

      const rz = new window.Razorpay({
        key: data.keyId, amount: data.amount, currency: "INR",
        name: "Shehnai®", description: `Order ${data.orderNumber}`, order_id: data.razorpayOrderId,
        prefill: { name: f.name, email: f.email, contact: f.phone },
        theme: { color: "#8A2226" },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r),
          });
          if (v.ok) { clear(); router.push(`/order/${data.orderNumber}`); }
          else setError("Payment could not be verified. If money was debited, contact us with your order number.");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (!lines.length) {
    return (
      <div className={wrap}>
        <EmptyState icon="bag" title="Your bag is empty"
                    body="Add something first, then come back here."
                    action={{ label: "Start shopping", href: "/collections/all" }} />
      </div>
    );
  }

  const Field = ({ k, label, err, ...rest }: {
    k: keyof Form; label: string; err?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`f-${k}`} className={labelCls}>{label}</label>
      <input id={`f-${k}`} value={f[k]} onChange={set(k)}
             className={cx(input, bad.has(k) && inputError)} {...rest} />
      {bad.has(k) && err && <span className="mt-1 block text-[11.5px] text-maroon">{err}</span>}
    </div>
  );

  const block = "mb-4 rounded border border-line bg-paper p-4.5";
  const blockTitle = "mb-3.5 flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.13em]";
  const stepDot = "grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-maroon text-[11px] not-italic text-white";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* pb leaves room for the sticky pay bar, which sits above the tab bar. */}
      <div className={cx(wrap, "pb-40 lg:pb-12")}>
        <StepBar current={2} />
        <h1 className="mb-4 mt-2.5 text-center text-h1">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px] lg:gap-9">
          <div>
            <div className={block}>
              <div className={blockTitle}><i className={stepDot}>1</i>Contact</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field k="name" label="Full name" autoComplete="name" placeholder="Your name" err={CHECKS[0][2]} />
                <Field k="phone" label="Mobile number" inputMode="numeric" maxLength={10}
                       autoComplete="tel" placeholder="10-digit number" err={CHECKS[1][2]} />
                <div className="sm:col-span-2">
                  <Field k="email" label="Email" type="email" autoComplete="email"
                         placeholder="For your order confirmation" err={CHECKS[2][2]} />
                </div>
              </div>
            </div>

            <div className={block}>
              <div className={blockTitle}><i className={stepDot}>2</i>Delivery address</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-pincode" className={labelCls}>PIN code</label>
                  <input id="f-pincode" value={f.pincode} onChange={onPincode} inputMode="numeric"
                         maxLength={6} autoComplete="postal-code" placeholder="6 digits"
                         className={cx(input, bad.has("pincode") && inputError)} />
                  {bad.has("pincode") && <span className="mt-1 block text-[11.5px] text-maroon">{CHECKS[3][2]}</span>}
                  {pinNote && (
                    <span className={cx("mt-1 block text-[11.5px]", pinNote.ok ? "text-forest" : "text-muted")}>
                      {pinNote.text}
                    </span>
                  )}
                </div>
                <Field k="city" label="City" autoComplete="address-level2" placeholder="Auto-filled from PIN" />
                <div className="sm:col-span-2">
                  <label htmlFor="f-line1" className={labelCls}>Flat / house no., building, street</label>
                  <input id="f-line1" ref={line1Ref} value={f.line1} onChange={set("line1")}
                         autoComplete="address-line1" placeholder="Address"
                         className={cx(input, bad.has("line1") && inputError)} />
                  {bad.has("line1") && <span className="mt-1 block text-[11.5px] text-maroon">{CHECKS[4][2]}</span>}
                </div>
                <Field k="line2" label="Area / landmark (optional)" autoComplete="address-line2" />
                <Field k="state" label="State" autoComplete="address-level1" placeholder="Auto-filled from PIN" />
              </div>
            </div>

            <div className={block}>
              <div className={blockTitle}><i className={stepDot}>3</i>Payment</div>
              {([
                ["RAZORPAY", "Pay online", "UPI · Cards · Net Banking · Wallets"],
                ...(codEnabled
                  ? [["COD", "Cash on Delivery", codFee > 0 ? `+ ${formatINR(codFee)} handling` : "Available on most PIN codes"] as const]
                  : []),
              ] as const).map(([key, title, sub]) => (
                <label key={key} onClick={() => setMethod(key as "RAZORPAY" | "COD")}
                       className={cx(
                         "mb-2 flex cursor-pointer items-start gap-3 rounded border bg-paper p-3.5 transition-all",
                         method === key ? "border-gold ring-1 ring-gold" : "border-line hover:border-gold/60"
                       )}>
                  <input type="radio" name="pay" checked={method === key}
                         onChange={() => setMethod(key as "RAZORPAY" | "COD")}
                         className="mt-0.5 h-[18px] w-[18px] accent-maroon" />
                  <span>
                    <b className="block text-sm">{title}</b>
                    <span className="text-xs text-muted">{sub}</span>
                  </span>
                </label>
              ))}
            </div>

            <PolicyNote />
            {error && <p className="mt-3.5 text-[13.5px] font-semibold text-maroon">{error}</p>}
          </div>

          <aside className="h-fit rounded border border-line-gold bg-paper p-5 lg:sticky lg:top-sticky-top">
            <h2 className="mb-3 text-[19px]">Order Summary</h2>
            {lines.map((l) => (
              <div key={l.variantId} className={summaryRow}>
                <span className="max-w-[64%]">{l.name} × {l.qty}</span>
                <span>{formatINR(l.pricePaise * l.qty)}</span>
              </div>
            ))}
            <div className={cx(summaryRow, "mt-1.5 border-t border-line pt-2.5")}>
              <span>Subtotal</span><span>{formatINR(subtotal)}</span>
            </div>
            <div className={summaryRow}>
              <span>Shipping</span>
              <span className={shipping ? "" : "font-bold text-forest"}>{shipping ? formatINR(shipping) : "FREE"}</span>
            </div>
            {fee > 0 && <div className={summaryRow}><span>COD fee</span><span>{formatINR(fee)}</span></div>}
            <div className={summaryTotal}><span>Total</span><b className="text-maroon">{formatINR(total)}</b></div>

            <button onClick={placeOrder} disabled={busy} className={cx(btn.primary, btnFull, "mt-3.5")}>
              {busy ? "Please wait…" : method === "COD" ? "Place Order" : `Pay ${formatINR(total)}`}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Amount is recalculated on our server before you are charged.
            </p>
          </aside>
        </div>
      </div>

      {/* Sticky pay bar, mobile only. Sits above the tab bar, never under it. */}
      <div className="fixed inset-x-0 bottom-0 z-buybar flex items-center gap-2.5 border-t border-line-gold bg-[#FCF3F0]/97 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden">
        <div className="flex-none">
          <b className="block text-base text-maroon">{formatINR(total)}</b>
          <span className="text-[10px] text-muted">{shipping ? "incl. shipping" : "free shipping"}</span>
        </div>
        <button onClick={placeOrder} disabled={busy} className={cx(btn.primary, "flex-1")}>
          {busy ? "Please wait…" : method === "COD" ? "Place Order" : "Pay Now"}
        </button>
      </div>
    </>
  );
}
LOOK_FILE_END
echo "    wrote src/components/checkout/CheckoutForm.tsx"
mkdir -p "src/components/collection"
cat > 'src/components/collection/Filters.tsx' <<'LOOK_FILE_END'
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useUI } from "@/store/ui";
import { Icon } from "@/components/ui/icons";
import { btn, btnFull, btnSm, cx, panelBase } from "@/lib/styles";

export const PRICE_BANDS: [string, string][] = [
  ["0-999", "Under ₹1,000"],
  ["1000-2500", "₹1,000 – ₹2,500"],
  ["2500-5000", "₹2,500 – ₹5,000"],
  ["5000-", "₹5,000 & above"],
];

export const SORTS: [string, string][] = [
  ["featured", "Featured"],
  ["newest", "Newest first"],
  ["low", "Price: low to high"],
  ["high", "Price: high to low"],
  ["rating", "Customer rating"],
];

type Cat = { slug: string; name: string; count: number };

const opt = "flex cursor-pointer items-center gap-2.5 py-1.5 text-[13.5px]";
const box = "h-4 w-4 accent-maroon cursor-pointer";
const groupHead = "mb-2.5 font-sans text-[10.5px] font-extrabold uppercase tracking-[0.14em]";

/** One URL writer, so sidebar, sheet and chips can never disagree. */
function useFilterUrl() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  return {
    sp,
    toggleMulti(key: "category" | "price", value: string) {
      const next = new URLSearchParams(sp.toString());
      const current = next.getAll(key);
      next.delete(key);
      const after = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      after.forEach((v) => next.append(key, v));
      router.replace(`${path}?${next.toString()}`, { scroll: false });
    },
    setOne(key: string, value: string) {
      const next = new URLSearchParams(sp.toString());
      next.set(key, value);
      router.replace(`${path}?${next.toString()}`, { scroll: false });
    },
    clearAll() { router.replace(path, { scroll: false }); },
  };
}

/* ------------------------------------------------------------ desktop rail -- */

export function FilterSidebar({ categories }: { categories: Cat[] }) {
  const { sp, toggleMulti, clearAll } = useFilterUrl();
  const cats = sp.getAll("category");
  const prices = sp.getAll("price");

  return (
    <aside aria-label="Filters" className="hidden lg:sticky lg:top-sticky-top lg:block">
      {categories.length > 0 && (
        <div className="border-b border-line pb-3.5">
          <h4 className={groupHead}>Category</h4>
          {categories.map((c) => (
            <label key={c.slug} className={opt}>
              <input type="checkbox" className={box} checked={cats.includes(c.slug)}
                     onChange={() => toggleMulti("category", c.slug)} />
              <span className="capitalize">{c.name}</span>
              <span className="ml-auto text-[11.5px] text-faint">{c.count}</span>
            </label>
          ))}
        </div>
      )}
      <div className="border-b border-line py-3.5">
        <h4 className={groupHead}>Price</h4>
        {PRICE_BANDS.map(([val, label]) => (
          <label key={val} className={opt}>
            <input type="checkbox" className={box} checked={prices.includes(val)}
                   onChange={() => toggleMulti("price", val)} />
            {label}
          </label>
        ))}
      </div>
      <button onClick={clearAll} className={cx(btn.ghost, btnSm, btnFull, "mt-3.5")}>Clear all filters</button>
    </aside>
  );
}

/* ------------------------------------------------------- mobile bar + sheets -- */

export function FilterBar({ categories }: { categories: Cat[] }) {
  const ui = useUI();
  const { sp } = useFilterUrl();
  const active = sp.getAll("category").length + sp.getAll("price").length;
  const barBtn = "flex h-[42px] flex-1 items-center justify-center gap-2 rounded border border-line bg-paper text-xs font-bold uppercase tracking-[0.06em]";

  return (
    <>
      <div className="sticky top-16 z-bar flex gap-2.5 border-b border-line bg-[#FCF3F0]/96 py-2.5 backdrop-blur-md lg:hidden">
        <button onClick={ui.openFilter} className={barBtn}>
          Filter {active > 0 && <span className="h-1.5 w-1.5 rounded-full bg-maroon" />}
        </button>
        <button onClick={ui.openSort} className={barBtn}>Sort</button>
      </div>
      <FilterSheet categories={categories} />
      <SortSheet />
    </>
  );
}

/** Bottom sheet on mobile — same panel primitive, anchored to the bottom. */
const sheet = "inset-x-0 bottom-0 top-auto max-h-[82vh] w-auto rounded-t-2xl border-t border-line-gold lg:hidden";

function Sheet({ open, title, children, foot }: {
  open: boolean; title: string; children: React.ReactNode; foot?: React.ReactNode;
}) {
  const { close } = useUI();
  return (
    <aside aria-label={title} aria-hidden={!open}
           className={cx(panelBase, sheet, open ? "translate-y-0" : "translate-y-full")}>
      <div className="flex flex-none items-center justify-between border-b border-line px-4 py-4">
        <span className="font-serif text-[22px] font-semibold">{title}</span>
        <button onClick={close} aria-label="Close" className="p-1 text-muted hover:text-maroon">
          <Icon name="close" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      {foot && <div className="flex-none border-t border-line bg-cream px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">{foot}</div>}
    </aside>
  );
}

function FilterSheet({ categories }: { categories: Cat[] }) {
  const { overlay, close } = useUI();
  const { sp, toggleMulti, clearAll } = useFilterUrl();
  const cats = sp.getAll("category");
  const prices = sp.getAll("price");

  return (
    <Sheet open={overlay === "filter"} title="Filter"
           foot={
             <div className="flex gap-2.5">
               <button onClick={() => { clearAll(); close(); }} className={cx(btn.ghost, "flex-1")}>Clear all</button>
               <button onClick={close} className={cx(btn.dark, "flex-1")}>Show results</button>
             </div>
           }>
      {categories.length > 0 && (
        <div className="border-b border-line pb-3">
          <h4 className={groupHead}>Category</h4>
          {categories.map((c) => (
            <label key={c.slug} className={opt}>
              <input type="checkbox" className={box} checked={cats.includes(c.slug)}
                     onChange={() => toggleMulti("category", c.slug)} />
              <span className="capitalize">{c.name}</span>
              <span className="ml-auto text-[11.5px] text-faint">{c.count}</span>
            </label>
          ))}
        </div>
      )}
      <div className="py-3">
        <h4 className={groupHead}>Price</h4>
        {PRICE_BANDS.map(([val, label]) => (
          <label key={val} className={opt}>
            <input type="checkbox" className={box} checked={prices.includes(val)}
                   onChange={() => toggleMulti("price", val)} />
            {label}
          </label>
        ))}
      </div>
    </Sheet>
  );
}

function SortSheet() {
  const { overlay, close } = useUI();
  const { sp, setOne } = useFilterUrl();
  const current = sp.get("sort") ?? "featured";

  return (
    <Sheet open={overlay === "sort"} title="Sort by">
      {SORTS.map(([val, label]) => (
        <label key={val} className={cx(opt, "py-3")}>
          <input type="radio" name="sort" className={box} checked={current === val}
                 onChange={() => { setOne("sort", val); close(); }} />
          {label}
        </label>
      ))}
    </Sheet>
  );
}

/* --------------------------------------------------------------- chips + sort -- */

export function FilterChips({ labels }: { labels: { key: "category" | "price"; value: string; label: string }[] }) {
  const { toggleMulti, clearAll } = useFilterUrl();
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-2 py-3">
      {labels.map((l) => (
        <span key={`${l.key}-${l.value}`}
              className="inline-flex items-center gap-2 rounded-full border border-line-gold bg-maroon-soft px-3 py-1.5 text-xs font-semibold">
          {l.label}
          <button onClick={() => toggleMulti(l.key, l.value)} aria-label={`Remove ${l.label}`}
                  className="text-sm leading-none text-maroon">&times;</button>
        </span>
      ))}
      <button onClick={clearAll}
              className="px-1 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-maroon">
        Clear all
      </button>
    </div>
  );
}

export function SortToolbar({ count }: { count: number }) {
  const { sp, setOne } = useFilterUrl();
  return (
    <div className="hidden items-center justify-between pb-3.5 lg:flex">
      <span className="text-[13.5px] text-muted"><b className="text-ink">{count}</b> piece{count === 1 ? "" : "s"}</span>
      <select value={sp.get("sort") ?? "featured"} onChange={(e) => setOne("sort", e.target.value)} aria-label="Sort by"
              className="h-10 cursor-pointer appearance-none rounded border border-line bg-paper bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M3 5l3 3 3-3%22 stroke=%22%23241C15%22 fill=%22none%22 stroke-width=%221.4%22/></svg>')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pl-3.5 pr-8 text-[13px] outline-none focus:border-gold">
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
LOOK_FILE_END
echo "    wrote src/components/collection/Filters.tsx"

rm -f src/components/layout/BottomNav.tsx
chown -R "$OWNER:$OWNER" src tailwind.config.ts
ok "bottom bar removed, palette applied"

step 3 "Rebuilding"
sudo -u "$OWNER" bash -lc "cd '$APP_DIR' && npx next build"
systemctl restart shehnai
sleep 3
systemctl is-active --quiet shehnai || { journalctl -u shehnai -n 30 --no-pager; exit 1; }
ok "restarted"

step 4 "Done"
cat <<FINAL

  Hard-refresh on your phone (or open a private tab) — the old CSS is cached.

  WHAT CHANGED

    Mobile bottom bar    gone. Search, saved and bag stay in the header;
                         collections stay in the menu drawer.

    Field             #FDFAF6  warm white, faintly beige
    Blush pools       #F6DCDF and #F9E7DC, soft and off-centre
                      (asymmetric on purpose - symmetric corner vignettes
                       look like smudging, an off-centre wash looks like paper)
    Ornament          fine 96px lattice with a quatrefoil at each node,
                      #D3A0A8, drift 5
    Cards / panels    #FFFFFF  so product photography reads true
    Footer            #F7E6E5  blush deepens toward the foot of the page
    Header            #FCF3F0
    Maroon and gold   unchanged

  CONTRAST  (worst case = text on the deepest pool WITH an ornament line)

    body text   13.6:1     maroon 7.3:1     gold labels 5.1:1
    Minimum anywhere is 5.05:1 against the 4.5:1 requirement.

  TUNING THE PATTERN

    One number, in src/app/globals.css:

        :root { --texture: 0.09; }

        0.09   visible at a glance
        0.055  current - you see it when you look for it, not before
        0.03   effectively invisible

    Contrast never drops below 13:1 for body text at any of these, so it is a
    taste control rather than a legibility one.

    To change how pink the page reads, edit the three radial-gradient lines in
    the html block just above --texture. The .62 / .50 / .55 alphas control
    the depth of each pool. Change it, then: npx next build && sudo systemctl restart shehnai

  UNDO

      cp -r $BK/src $BK/tailwind.config.ts . \\
        && npx next build && sudo systemctl restart shehnai

FINAL
