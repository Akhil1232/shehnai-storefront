export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const PREFIX: Record<string, string> = {
  mens: "MEN",
  womens: "WMN",
  murti: "MUR",
  wedding: "WED",
};

/**
 * SHN-MEN-BRC-0042
 * Stable, sortable, and readable on a packing slip. `seq` should come from a
 * per-category counter so numbers don't collide.
 */
export function buildSku(
  verticalSlug: string,
  categorySlug: string,
  seq: number
): string {
  const v = PREFIX[verticalSlug] ?? verticalSlug.slice(0, 3).toUpperCase();
  const c = categorySlug.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase();
  return `SHN-${v}-${c}-${String(seq).padStart(4, "0")}`;
}

export function orderNumber(seq: number, date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `SHN-${dd}${mm}-${String(seq).padStart(4, "0")}`;
}
