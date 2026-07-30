/** Every line icon in the chrome, one definition each. */
export const PATHS = {
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  bag: "M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 016 0v2",
  heart: "M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 00-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 000-7.1z",
  home: "M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  menu: "M3 6h18M3 12h18M3 18h18",
  truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 18a2 2 0 104 0 2 2 0 10-4 0M15 18a2 2 0 104 0 2 2 0 10-4 0",
  shield: "M12 3l8 3v6c0 5-3.5 8.2-8 9-4.5-.8-8-4-8-9V6zM9 12l2 2 4-4",
  swap: "M4 9h11a5 5 0 010 10H8M8 5L4 9l4 4",
  cash: "M3 7h11v8H3zM14 10h4l3 3v2h-7z",
  box: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8",
  back: "M15 18l-6-6 6-6",
  check: "M20 6L9 17l-5-5",
  close: "M18 6L6 18M6 6l12 12",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
