"use client";

import { create } from "zustand";

/** Which overlay is open. Only ever one at a time. */
type Overlay = null | "menu" | "cart" | "search" | "filter" | "sort";

type UIState = {
  overlay: Overlay;
  openMenu: () => void;
  openCart: () => void;
  openSearch: () => void;
  openFilter: () => void;
  openSort: () => void;
  close: () => void;
};

export const useUI = create<UIState>((set) => ({
  overlay: null,
  openMenu: () => set({ overlay: "menu" }),
  openCart: () => set({ overlay: "cart" }),
  openSearch: () => set({ overlay: "search" }),
  openFilter: () => set({ overlay: "filter" }),
  openSort: () => set({ overlay: "sort" }),
  close: () => set({ overlay: null }),
}));
