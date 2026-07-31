import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveVertical, saveCategory, deleteCategory } from "../actions";
import { Card, Field, TextArea, Checkbox, SubmitButton } from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  await requireAdmin();

  const verticals = await prisma.vertical.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  });

  return (
    <>
      <h1 className="mb-1 font-serif text-3xl">Collections</h1>
      <p className="mb-5 max-w-[70ch] text-[13px] text-[color:var(--muted)]">
        The four collections and their sub-categories. The <b>card image</b> below is
        what appears on the home page under &ldquo;Four houses, one bench&rdquo;. Leave it
        empty and the card falls back to the first product photo in that collection.
      </p>

      {verticals.map((v) => (
        <Card key={v.id} title={`${v.name} · ${v._count.products} products · /collections/${v.slug}`}>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <form action={saveVertical} className="grid gap-3">
              <input type="hidden" name="id" value={v.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" name="name" defaultValue={v.name} required />
                <Field label="Devanagari name" name="devName" defaultValue={v.devName}
                       hint="Shown small under the name on the card." />
              </div>
              <TextArea label="Description" name="description" defaultValue={v.description} rows={2}
                        hint="Appears under the heading on the collection page." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={v.sortOrder}
                       hint="Left to right on the home page." />
                <div className="self-end">
                  <Checkbox label="Visible on the site" name="isActive" defaultChecked={v.isActive} />
                </div>
              </div>
              <ImageUpload
                label="Card image (home page)"
                name="bannerUrl"
                defaultValue={v.bannerUrl}
                spec="800 × 800"
                preset="tile"
              />
              <p className="text-[11.5px] text-[color:var(--muted)]">
                Square. The top ~25% curves away behind the arch — keep it empty.
                This is <b>not</b> the wide strip on the collection page; that is a
                <Link href="/admin/banners" className="mx-1 text-maroon">Collection page banner</Link>.
              </p>
              <div><SubmitButton>Save {v.name}</SubmitButton></div>
            </form>

            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em]">
                Sub-categories ({v.categories.length})
              </h3>
              {v.categories.map((c) => (
                <form key={c.id} action={saveCategory}
                      className="mb-2 rounded border border-[color:var(--line)] p-2.5">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Name" name="name" defaultValue={c.name} />
                    <Field label="Sort" name="sortOrder" type="number" defaultValue={c.sortOrder} />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Checkbox label="Active" name="isActive" defaultChecked={c.isActive} />
                    <SubmitButton>Save</SubmitButton>
                  </div>
                  <p className="mt-1 font-mono text-[10.5px] text-[color:var(--muted)]">{c.slug}</p>
                </form>
              ))}

              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] font-semibold text-maroon">
                  + Add a sub-category
                </summary>
                <form action={saveCategory} className="mt-2 grid gap-2 rounded border border-[color:var(--line)] p-2.5">
                  <input type="hidden" name="verticalId" value={v.id} />
                  <Field label="Name" name="name" required />
                  <Field label="Slug" name="slug" hint="Leave blank to generate." />
                  <Field label="Sort order" name="sortOrder" type="number" defaultValue={v.categories.length} />
                  <Checkbox label="Active" name="isActive" defaultChecked />
                  <SubmitButton>Add</SubmitButton>
                </form>
              </details>

              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] text-[color:var(--muted)]">
                  Remove a sub-category
                </summary>
                <div className="mt-2 rounded border border-[color:var(--line)] p-2.5">
                  <p className="mb-2 text-[11.5px] text-[color:var(--muted)]">
                    Only possible once no products are assigned to it.
                  </p>
                  {v.categories.map((c) => (
                    <form key={c.id} action={deleteCategory} className="flex items-center gap-2 py-1">
                      <input type="hidden" name="id" value={c.id} />
                      <span className="text-[12px]">{c.name}</span>
                      <button className="ml-auto text-[11px] text-red-700">Delete</button>
                    </form>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
