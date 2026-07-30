"use client";

import { create } from "zustand";

type ToastState = { message: string | null; show: (m: string) => void; hide: () => void };

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    clearTimeout(timer);
    timer = setTimeout(() => set({ message: null }), 2400);
  },
  hide: () => set({ message: null }),
}));
