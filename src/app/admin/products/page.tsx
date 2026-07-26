import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; vertical?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const [products, verticals] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : {}),
        ...(sp.status ? { status: sp.status as never } : {}),
        ...(sp.vertical ? { vertical: { slug: sp.vertical } } : {}),
      },
      include: {
        vertical: true,
        category: true,
        variants: { where: { isActive: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.vertical.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Products <span className="text-base text-[color:var(--muted)]">({products.length})</span></h1>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=products" className="rounded border border-ink px-3 py-2 text-[12.5px] font-semibold">Export CSV</a>
          <Link href="/admin/products/new" className="rounded bg-ink px-4 py-2 text-[12.5px] font-semibold text-white">New product</Link>
        </div>
      </div>

      <form className="mb-4 flex flex-wrap gap-2 rounded border border-[color:var(--line)] bg-white p-3">
        <input name="q" defaultValue={sp.q} placeholder="Search name…" className="flex-1 rounded border border-[color:var(--line)] px-3 py-1.5 text-[13px]" />
        <select name="vertical" defaultValue={sp.vertical ?? ""} className="rounded border border-[color:var(--line)] px-2 py-1.5 text-[13px]">
          <option value="">All verticals</option>
          {verticals.map((v) => <option key={v.id} value={v.slug}>{v.name}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border border-[color:var(--line)] px-2 py-1.5 text-[13px]">
          <option value="">Any status</option>
          {["PUBLISHED", "DRAFT", "ARCHIVED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rounded bg-ink px-4 py-1.5 text-[12.5px] font-semibold text-white">Filter</button>
      </form>

      <div className="overflow-x-auto rounded border border-[color:var(--line)] bg-white">
        <table className="w-full text-[13px]">
          <thead className="border-b border-[color:var(--line)] bg-[#FAF7F0] text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-[10.5px] [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-[0.1em]">
              <th>Product</th><th>Collection</th><th>SKUs</th><th>Price</th><th>Stock</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((n, v) => n + v.stockQty, 0);
              const price = p.variants[0]?.pricePaise ?? 0;
              return (
                <tr key={p.id} className="border-b border-[color:var(--line)] last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-maroon">{p.name}</Link>
                    <span className="block font-mono text-[11px] text-[color:var(--muted)]">{p.slug}</span>
                  </td>
                  <td className="px-3 py-2 text-[color:var(--muted)]">{p.vertical.name}{p.category ? ` · ${p.category.name}` : ""}</td>
                  <td className="px-3 py-2">{p.variants.length}</td>
                  <td className="px-3 py-2">{formatINR(price)}</td>
                  <td className={`px-3 py-2 font-semibold ${stock === 0 ? "text-red-700" : stock < 6 ? "text-amber-700" : ""}`}>{stock}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${p.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-700"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right"><Link href={`/admin/products/${p.id}`} className="text-[11.5px] text-maroon">Edit →</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-center text-[13px] text-[color:var(--muted)]">No products match.</p>}
      </div>
    </>
  );
}
