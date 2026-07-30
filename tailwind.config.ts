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
        gold: { DEFAULT: "#C9A24B", deep: "#9C6F2E", pale: "#E7D3B1" },
        forest: "#2F6B4F",
        beige: { DEFAULT: "#EFE3CB", deep: "#E8DABE" },
        cream: "#F7F0DE",
        paper: "#FCF8EF",
        // Semantic aliases used for text and hairlines.
        muted: "rgba(36,28,21,.62)",
        faint: "rgba(36,28,21,.42)",
        line: { DEFAULT: "rgba(36,28,21,.13)", gold: "rgba(201,162,75,.45)" },
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
        soft: "0 2px 8px rgba(36,28,21,.06)",
        card: "0 8px 24px rgba(36,28,21,.10)",
        lift: "0 20px 48px rgba(122,35,51,.16)",
        // The gold double-border used around hero and arch frames.
        frame: "0 0 0 5px #FCF8EF, 0 0 0 6px rgba(201,162,75,.45), 0 20px 48px rgba(122,35,51,.16)",
      },
      backgroundImage: {
        // Decorative only. NONE of these sit behind body copy — a pattern
        // under text is what made the old build feel noisy and hard to read.
        // Page texture. Drawn at full strength here; its visible weight is
        // set by --texture in globals.css so it is one number to tune.
        jaali: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27168%27%20height%3D%27168%27%20viewBox%3D%270%200%20168%20168%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23A9762F%27%20stroke-width%3D%271%27%3E%3Ccircle%20cx%3D%270%27%20cy%3D%270%27%20r%3D%2784.0%27%2F%3E%3Ccircle%20cx%3D%27168%27%20cy%3D%270%27%20r%3D%2784.0%27%2F%3E%3Ccircle%20cx%3D%270%27%20cy%3D%27168%27%20r%3D%2784.0%27%2F%3E%3Ccircle%20cx%3D%27168%27%20cy%3D%27168%27%20r%3D%2784.0%27%2F%3E%3Ccircle%20cx%3D%2784.0%27%20cy%3D%2784.0%27%20r%3D%2784.0%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%238E5B22%27%20stroke-width%3D%271%27%20opacity%3D%270.9%27%3E%3Cpath%20d%3D%27M84.0%2063.0%20L105.0%2084.0%20L84.0%20105.0%20L63.0%2084.0%20Z%27%2F%3E%3Cpath%20d%3D%27M0%20-21%20L21%200%20L0%2021%20L-21%200%20Z%27%2F%3E%3Cpath%20d%3D%27M168%20-21%20L189%200%20L168%2021%20L147%200%20Z%27%2F%3E%3Cpath%20d%3D%27M0%20147%20L21%20168%20L0%20189%20L-21%20168%20Z%27%2F%3E%3Cpath%20d%3D%27M168%20147%20L189%20168%20L168%20189%20L147%20168%20Z%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27%23A9762F%27%3E%3Ccircle%20cx%3D%2784.0%27%20cy%3D%270%27%20r%3D%272.2%27%2F%3E%3Ccircle%20cx%3D%270%27%20cy%3D%2784.0%27%20r%3D%272.2%27%2F%3E%3Ccircle%20cx%3D%27168%27%20cy%3D%2784.0%27%20r%3D%272.2%27%2F%3E%3Ccircle%20cx%3D%2784.0%27%20cy%3D%27168%27%20r%3D%272.2%27%2F%3E%3Ccircle%20cx%3D%2784.0%27%20cy%3D%2784.0%27%20r%3D%272.6%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',
        band: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27120%27%20height%3D%2728%27%20viewBox%3D%270%200%20120%2028%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23A9762F%27%20stroke-width%3D%271%27%20opacity%3D%270.5%27%3E%3Cpath%20d%3D%27M0%2014%20Q15%200%2030%2014%20Q45%2028%2060%2014%20Q75%200%2090%2014%20Q105%2028%20120%2014%27%2F%3E%3Cpath%20d%3D%27M0%2014%20Q15%2028%2030%2014%20Q45%200%2060%2014%20Q75%2028%2090%2014%20Q105%200%20120%2014%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27%23A9762F%27%20opacity%3D%270.55%27%3E%3Ccircle%20cx%3D%270%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%2760%27%20cy%3D%2714%27%20r%3D%272.6%27%2F%3E%3Ccircle%20cx%3D%2790%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%27120%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',      // horizontal divider between sections      
        scallop: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2714%27%20viewBox%3D%270%200%2024%2014%27%3E%3Cpath%20d%3D%27M0%201.6%20H24%27%20stroke%3D%27%23C9A24B%27%20stroke-width%3D%271%27%20fill%3D%27none%27%20opacity%3D%270.55%27%2F%3E%3Cpath%20d%3D%27M0%202%20Q6%2022%2012%202%20Q18%2022%2024%202%27%20fill%3D%27none%27%20stroke%3D%27%23C9A24B%27%20stroke-width%3D%271.35%27%2F%3E%3C%2Fsvg%3E")',
        jewel: "linear-gradient(158deg,#F8F1E2,#EBDCBF)",
      },
      // Named layers, so nothing ever guesses a z-index. Ordered bottom to top.
      zIndex: {
        bar: "30",      // sticky filter/sort bar
        header: "40",   // sticky site header
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
