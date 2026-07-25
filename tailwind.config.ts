import type { Config } from "tailwindcss";

/**
 * The palette is derived from the Shehnai packaging: peach/blush, deep
 * maroon-red, antique gold. Every value also exists as a CSS variable in
 * globals.css so it can be themed at runtime later.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        onyx: "#120D0A",
        ink: "#241C15",
        maroon: { DEFAULT: "#8A2226", deep: "#5A0F12" },
        gold: { DEFAULT: "#C9A24B", bright: "#9C6F2E", deep: "#A9762F" },
        emerald: { DEFAULT: "#2F6B4F" },
        cream: "#F7F0DE",
        peach: "#E7D3B1",
        beige: { DEFAULT: "#EFE3CB", deep: "#E8DABE" },
        paper: "#FCF8EF",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        dev: ["var(--font-dev)", "var(--font-serif)", "serif"],
      },
      borderRadius: { arch: "180px 180px 6px 6px" },
      maxWidth: { wrap: "1280px" },
      transitionTimingFunction: { silk: "cubic-bezier(.2,.7,.3,1)" },
    },
  },
  plugins: [],
} satisfies Config;
