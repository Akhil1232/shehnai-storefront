"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-side cart, persisted to localStorage. Prices held here are for DISPLAY
 * ONLY — /api/checkout/create re-reads every price from the database before
 * charging, so a tampered localStorage cannot change what someone pays.
 */
export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName?: string | null;
  sku: string;
  imageUrl?: string | null;
  pricePaise: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, qty: l.qty + qty } : l
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty }] };
        }),

      remove: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),

      setQty: (variantId, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.variantId !== variantId)
              : s.lines.map((l) => (l.variantId === variantId ? { ...l, qty } : l)),
        })),

      clear: () => set({ lines: [] }),

      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
      subtotal: () => get().lines.reduce((n, l) => n + l.pricePaise * l.qty, 0),
    }),
    { name: "shehnai-cart", partialize: (s) => ({ lines: s.lines }) }
  )
);
