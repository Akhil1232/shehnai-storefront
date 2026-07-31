import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveSection } from "../actions";
import { Card, Field, TextArea, Select, Checkbox, SubmitButton } from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

export const dynamic = "force-dynamic";

export default async function SectionsPage() {
  await requireAdmin();
  const [sections, products] = await Promise.all([
    prisma.homeSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const pOptions = [{ value: "", label: "— none —" }, ...products.map((p) => ({ value: p.id, label: p.name }))];

  return (
    <>
      <h1 className="mb-1 font-serif text-3xl">Home Sections</h1>
      <p className="mb-5 text-[13px] text-[color:var(--muted)]">
        &ldquo;The Flagship Piece&rdquo;, &ldquo;The Bridal Edit&rdquo; and the rest. Edit the copy, swap the
        featured product, reorder or hide — no deploy needed.
      </p>

      {sections.map((s) => {
        const swatches = ((s.config as { swatches?: { label: string; hex: string }[] } | null)?.swatches ?? [])
          .map((w) => `${w.label}:${w.hex}`).join("\n");

        return (
          <Card key={s.id} title={`${s.key} · ${s.kind}`}>
            <form action={saveSection} className="grid max-w-[640px] gap-2.5">
              <input type="hidden" name="id" value={s.id} />
              <Field label="Eyebrow" name="eyebrow" defaultValue={s.eyebrow} hint="Small gold caps above the heading." />
              <Field label="Heading" name="heading" defaultValue={s.heading} />
              <TextArea label="Body" name="body" defaultValue={s.body} rows={3} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="CTA label" name="ctaLabel" defaultValue={s.ctaLabel} />
                <Field label="CTA link" name="ctaHref" defaultValue={s.ctaHref} hint="Blank = links to the featured product." />
              </div>
              <Select label="Featured product" name="productId" defaultValue={s.productId} options={pOptions} />
              <ImageUpload label="Main image" name="mediaUrl" defaultValue={s.mediaUrl} spec="1200 × 1380" preset="editorial" />
              <TextArea label="Mini images (one URL per line, max 2)" name="miniUrls" defaultValue={s.miniUrls.join("\n")} rows={2} hint="800 × 800 each. Hidden on mobile by design." />
              <TextArea label="Swatch chips" name="swatches" defaultValue={swatches} rows={2} hint="One per line, format Label:#HEX — e.g. Antique Brass:#C9A24B" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={s.sortOrder} />
                <div>
                  <Checkbox label="Image on the right" name="reversed" defaultChecked={s.reversed} />
                  <Checkbox label="Active" name="isActive" defaultChecked={s.isActive} />
                </div>
              </div>
              <SubmitButton>Save section</SubmitButton>
            </form>
          </Card>
        );
      })}
    </>
  );
}
