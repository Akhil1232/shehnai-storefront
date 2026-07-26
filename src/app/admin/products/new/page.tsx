import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveProduct } from "../../actions";
import { Card, Field, TextArea, Select, SubmitButton } from "@/components/admin/ui";

export default async function NewProductPage() {
  await requireAdmin();
  const verticals = await prisma.vertical.findMany({
    orderBy: { sortOrder: "asc" },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <h1 className="mb-5 font-serif text-3xl">New product</h1>
      <form action={saveProduct} className="max-w-[720px]">
        <Card title="Basics">
          <div className="grid gap-3">
            <Field label="Name" name="name" required />
            <Field label="Slug" name="slug" hint="Leave blank to generate from the name." />
            <TextArea label="Description" name="description" />
            <Select label="Vertical" name="verticalId" options={verticals.map((v) => ({ value: v.id, label: v.name }))} />
            <Select
              label="Category"
              name="categoryId"
              options={[
                { value: "", label: "— none —" },
                ...verticals.flatMap((v) => v.categories.map((c) => ({ value: c.id, label: `${v.name} › ${c.name}` }))),
              ]}
              hint="Must belong to the vertical selected above."
            />
          </div>
        </Card>

        <Card title="Opening price">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Price (₹)" name="price" type="number" step="1" required hint="In rupees. Stored as paise." />
            <Field label="MRP (₹)" name="mrp" type="number" step="1" hint="Leave 0 for no strike-through." />
          </div>
          <p className="mt-3 text-[12px] text-[color:var(--muted)]">
            A default SKU is generated automatically. Add images, stock and extra variants on the next screen.
          </p>
        </Card>

        <SubmitButton>Create product</SubmitButton>
      </form>
    </>
  );
}
