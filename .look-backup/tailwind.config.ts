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
        rose: "#C98A93", // damask motif
        forest: "#2F6B4F",
        // Blush-beige, taken from the packaging.
        // Baby pink from the damask reference (hue 357, light 95.5%).
        beige: { DEFAULT: "#FCEBEC", deep: "#F8DDE0" },
        cream: "#FDF1F2",
        paper: "#FFFFFF",
        // Semantic aliases used for text and hairlines.
        muted: "rgba(36,28,21,.68)",
        faint: "rgba(36,28,21,.42)",
        line: { DEFAULT: "rgba(138,34,38,.13)", gold: "rgba(201,162,75,.42)" },
        header: "#FDF0F1", // sticky header / floating bars
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
        // Damask motif from the reference. Visible weight is set by --texture
        // in globals.css — one number to tune.
        damask: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27180%27%20height%3D%27240%27%20viewBox%3D%270%200%20180%20240%27%3E%3Cdefs%3E%3Cg%20id%3D%27m%27%3E%3Cpath%20d%3D%27M0%20-84%20C13%20-68%2014%20-46%200%20-34%20Z%27%2F%3E%3Cpath%20d%3D%27M0%20-80%20C-16%20-66%20-22%20-44%20-12%20-32%20C-4%20-42%20-3%20-62%200%20-80%20Z%27%2F%3E%3Cpath%20d%3D%27M4%20-60%20C26%20-60%2040%20-44%2036%20-26%20C28%20-38%2016%20-48%204%20-50%20Z%27%2F%3E%3Cpath%20d%3D%27M8%20-34%20C34%20-34%2050%20-18%2046%200%20C42%20-12%2030%20-22%2014%20-24%20C20%20-18%2024%20-12%2022%20-6%20C14%20-14%208%20-24%208%20-34%20Z%27%2F%3E%3Cpath%20d%3D%27M6%20-8%20C30%20-6%2044%208%2040%2024%20C32%2012%2020%204%206%204%20Z%27%2F%3E%3Cpath%20d%3D%27M8%2012%20C30%2014%2042%2030%2036%2046%20C32%2034%2022%2026%2010%2024%20C16%2032%2018%2040%2014%2046%20C8%2036%206%2022%208%2012%20Z%27%2F%3E%3Cpath%20d%3D%27M0%2034%20C13%2050%2014%2070%200%2084%20Z%27%2F%3E%3Cpath%20d%3D%27M0%2038%20C-14%2052%20-18%2068%20-10%2080%20C-4%2068%20-2%2052%200%2038%20Z%27%2F%3E%3Cpath%20d%3D%27M30%20-49.2%20A3.2%203.2%200%201%201%2030%20-42.8%20A3.2%203.2%200%201%201%2030%20-49.2%20Z%27%2F%3E%3Cpath%20d%3D%27M46%20-9.0%20A3.0%203.0%200%201%201%2046%20-3.0%20A3.0%203.0%200%201%201%2046%20-9.0%20Z%27%2F%3E%3Cpath%20d%3D%27M40%2027.2%20A2.8%202.8%200%201%201%2040%2032.8%20A2.8%202.8%200%201%201%2040%2027.2%20Z%27%2F%3E%3Cpath%20d%3D%27M18%2053.4%20A2.6%202.6%200%201%201%2018%2058.6%20A2.6%202.6%200%201%201%2018%2053.4%20Z%27%2F%3E%3Cg%20transform%3D%27scale%28-1%2C1%29%27%3E%3Cpath%20d%3D%27M0%20-84%20C13%20-68%2014%20-46%200%20-34%20Z%27%2F%3E%3Cpath%20d%3D%27M0%20-80%20C-16%20-66%20-22%20-44%20-12%20-32%20C-4%20-42%20-3%20-62%200%20-80%20Z%27%2F%3E%3Cpath%20d%3D%27M4%20-60%20C26%20-60%2040%20-44%2036%20-26%20C28%20-38%2016%20-48%204%20-50%20Z%27%2F%3E%3Cpath%20d%3D%27M8%20-34%20C34%20-34%2050%20-18%2046%200%20C42%20-12%2030%20-22%2014%20-24%20C20%20-18%2024%20-12%2022%20-6%20C14%20-14%208%20-24%208%20-34%20Z%27%2F%3E%3Cpath%20d%3D%27M6%20-8%20C30%20-6%2044%208%2040%2024%20C32%2012%2020%204%206%204%20Z%27%2F%3E%3Cpath%20d%3D%27M8%2012%20C30%2014%2042%2030%2036%2046%20C32%2034%2022%2026%2010%2024%20C16%2032%2018%2040%2014%2046%20C8%2036%206%2022%208%2012%20Z%27%2F%3E%3Cpath%20d%3D%27M0%2034%20C13%2050%2014%2070%200%2084%20Z%27%2F%3E%3Cpath%20d%3D%27M0%2038%20C-14%2052%20-18%2068%20-10%2080%20C-4%2068%20-2%2052%200%2038%20Z%27%2F%3E%3Cpath%20d%3D%27M30%20-49.2%20A3.2%203.2%200%201%201%2030%20-42.8%20A3.2%203.2%200%201%201%2030%20-49.2%20Z%27%2F%3E%3Cpath%20d%3D%27M46%20-9.0%20A3.0%203.0%200%201%201%2046%20-3.0%20A3.0%203.0%200%201%201%2046%20-9.0%20Z%27%2F%3E%3Cpath%20d%3D%27M40%2027.2%20A2.8%202.8%200%201%201%2040%2032.8%20A2.8%202.8%200%201%201%2040%2027.2%20Z%27%2F%3E%3Cpath%20d%3D%27M18%2053.4%20A2.6%202.6%200%201%201%2018%2058.6%20A2.6%202.6%200%201%201%2018%2053.4%20Z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fdefs%3E%3Cg%20fill%3D%27%23C98A93%27%3E%3Cuse%20href%3D%27%23m%27%20x%3D%2790.0%27%20y%3D%27120.0%27%2F%3E%3Cuse%20href%3D%27%23m%27%20x%3D%270%27%20y%3D%270%27%2F%3E%3Cuse%20href%3D%27%23m%27%20x%3D%27180%27%20y%3D%270%27%2F%3E%3Cuse%20href%3D%27%23m%27%20x%3D%270%27%20y%3D%27240%27%2F%3E%3Cuse%20href%3D%27%23m%27%20x%3D%27180%27%20y%3D%27240%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',
        band: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27120%27%20height%3D%2728%27%20viewBox%3D%270%200%20120%2028%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23A9762F%27%20stroke-width%3D%271%27%20opacity%3D%270.5%27%3E%3Cpath%20d%3D%27M0%2014%20Q15%200%2030%2014%20Q45%2028%2060%2014%20Q75%200%2090%2014%20Q105%2028%20120%2014%27%2F%3E%3Cpath%20d%3D%27M0%2014%20Q15%2028%2030%2014%20Q45%200%2060%2014%20Q75%2028%2090%2014%20Q105%200%20120%2014%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27%23A9762F%27%20opacity%3D%270.55%27%3E%3Ccircle%20cx%3D%270%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%2760%27%20cy%3D%2714%27%20r%3D%272.6%27%2F%3E%3Ccircle%20cx%3D%2790%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3Ccircle%20cx%3D%27120%27%20cy%3D%2714%27%20r%3D%272%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',      // horizontal divider between sections      
        scallop: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2714%27%20viewBox%3D%270%200%2024%2014%27%3E%3Cpath%20d%3D%27M0%201.6%20H24%27%20stroke%3D%27%23C9A24B%27%20stroke-width%3D%271%27%20fill%3D%27none%27%20opacity%3D%270.55%27%2F%3E%3Cpath%20d%3D%27M0%202%20Q6%2022%2012%202%20Q18%2022%2024%202%27%20fill%3D%27none%27%20stroke%3D%27%23C9A24B%27%20stroke-width%3D%271.35%27%2F%3E%3C%2Fsvg%3E")',
        jewel: "linear-gradient(158deg,#FFFFFF,#FCEFF1)", // product art field
      },
      // Named layers, so nothing ever guesses a z-index. Ordered bottom to top.
      zIndex: {
        bar: "30",      // sticky filter/sort bar
        header: "#FDF0F1", // sticky header / floating bars
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
