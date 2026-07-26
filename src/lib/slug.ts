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
 * Category code for a SKU.
 *
 * Single word  -> first three letters   ("mala" -> MAL)
 * Multiple words -> initials, up to 3   ("swagat-lapel-pin" -> SLP)
 *
 * The initials rule matters: every Wedding category begins with "swagat", so
 * taking the first three letters would give all four the code SWA and collide
 * on the unique SKU constraint.
 */
export function categoryCode(slug: string): string {
  const words = slug.split(/[-_\s]+/).filter(Boolean);
  const raw =
    words.length > 1
      ? words.map((w) => w[0]).join("").slice(0, 3)
      : (words[0] ?? "gen").slice(0, 3);
  return raw.replace(/[^a-zA-Z]/g, "").toUpperCase().padEnd(2, "X");
}

/**
 * SHN-MEN-BRO-0042
 * Stable, sortable, and readable on a packing slip. `seq` should come from a
 * per-category counter so numbers don't collide.
 */
export function buildSku(
  verticalSlug: string,
  categorySlug: string,
  seq: number
): string {
  const v = PREFIX[verticalSlug] ?? verticalSlug.slice(0, 3).toUpperCase();
  return `SHN-${v}-${categoryCode(categorySlug)}-${String(seq).padStart(4, "0")}`;
}

export function orderNumber(seq: number, date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `SHN-${dd}${mm}-${String(seq).padStart(4, "0")}`;
}
