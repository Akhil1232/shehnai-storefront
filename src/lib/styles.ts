/**
 * =============================================================================
 * CLASS RECIPES
 * =============================================================================
 * Repeated Tailwind combinations, named once. Import these instead of copying
 * long class strings around — changing a button style should mean editing one
 * line here, not hunting through twenty components.
 *
 * These are plain strings, not CSS classes, so they compose with per-use
 * utilities and the last utility still wins as Tailwind intends. That is the
 * whole point: no stylesheet rule can silently override a component.
 */

/** Joins class names, dropping falsy values. */
export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ layout -- */

export const wrap = "mx-auto w-full max-w-[1300px] px-5 md:px-8";

/** Standard vertical rhythm for a page section. */
export const section = "py-11 md:py-16";

/* ----------------------------------------------------------------- buttons -- */

const btnBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded px-6 py-3 " +
  "text-[11.5px] font-extrabold uppercase tracking-[0.14em] whitespace-nowrap " +
  "border transition-colors duration-200 active:translate-y-px " +
  "disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0";

export const btn = {
  primary: cx(btnBase, "border-maroon bg-maroon text-white hover:border-maroon-deep hover:bg-maroon-deep"),
  dark: cx(btnBase, "border-ink bg-ink text-cream hover:border-maroon hover:bg-maroon"),
  gold: cx(btnBase, "border-gold bg-gold text-onyx hover:border-gold-deep hover:bg-gold-deep hover:text-white"),
  line: cx(btnBase, "border-ink bg-transparent text-ink hover:bg-ink hover:text-cream"),
  ghost: cx(btnBase, "border-line bg-paper text-ink hover:border-gold"),
};

/** Shrinks any of the above. Append after the variant. */
export const btnSm = "min-h-[38px] px-4 py-2 text-[10.5px]";
export const btnFull = "w-full";

export const linkArrow =
  "inline-flex items-center gap-1.5 border-b border-transparent py-1.5 " +
  "text-[11.5px] font-extrabold uppercase tracking-[0.13em] text-maroon hover:border-maroon";

/* -------------------------------------------------------------- typography -- */

export const eyebrow =
  "text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-gold-deep";
export const micro =
  "text-[11px] font-bold uppercase tracking-[0.13em]";
export const bodySm = "text-[13.5px] text-muted";

/* ------------------------------------------------------------------- forms -- */

export const input =
  "h-12 w-full rounded border border-line bg-paper px-3.5 text-sm " +
  "outline-none transition-colors focus:border-gold placeholder:text-faint";

export const inputError = "border-maroon focus:border-maroon";

export const label =
  "mb-1.5 block text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-ink-soft";

/* ------------------------------------------------------------------ panels -- */

export const card = "overflow-hidden rounded border border-line bg-paper";

/** Full-height side drawer / right panel. Add `translate-x-0` when open. */
export const panelBase =
  "fixed inset-y-0 z-panel flex w-[min(420px,92vw)] flex-col bg-beige " +
  "transition-transform duration-300 ease-silk";

export const backdrop =
  "fixed inset-0 z-backdrop bg-onyx/50 transition-opacity duration-250 ease-silk";

/**
 * The warm field product art sits on, so every card matches.
 * Deliberately a plain gradient: the page already carries the jaali texture,
 * and a second pattern here competes with the jewellery itself.
 */
export const jewelField = "relative overflow-hidden bg-jewel";

/* ------------------------------------------------------------------ tables -- */

export const summaryRow = "flex justify-between gap-3 py-1.5 text-[13.5px]";
export const summaryTotal =
  "mt-2 flex justify-between border-t border-line pt-3 text-[17px] font-extrabold";
