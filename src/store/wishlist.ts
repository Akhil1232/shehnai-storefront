"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Saved pieces. Client-only; no account needed to use it. */
type WishState = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => boolean; // returns the new state
  clear: () => void;
};

export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      slugs: [],
      has: (slug) => get().slugs.includes(slug),
      toggle: (slug) => {
        const on = !get().slugs.includes(slug);
        set((s) => ({ slugs: on ? [...s.slugs, slug] : s.slugs.filter((x) => x !== slug) }));
        return on;
      },
      clear: () => set({ slugs: [] }),
    }),
    { name: "shehnai-wishlist" }
  )
);
