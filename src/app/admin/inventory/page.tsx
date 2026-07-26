import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { adjustStock, importStockCsv } from "../actions";
import { Card, SubmitButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const REASONS = ["PURCHASE", "RETURN", "DAMAGE", "ADJUSTMENT", "STOCKTAKE"] as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; applied?: string; errors?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      ...(sp.q
        ? { OR: [{ sku: { contains: sp.q, mode: "insensitive" } }, { product: { name: { contains: sp.q, mode: "insensitive" } } }] }
        : {}),
      ...(sp.filter === "low" ? { stockQty: { lte: 5 } } : {}),
      ...(sp.filter === "out" ? { stockQty: 0 } : {}),
    },
    include: { product: { select: { name: true, slug: true, id: true } } },
    orderBy: [{ stockQty: "asc" }],
    take: 400,
  });

  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { variant: { select: { sku: true, product: { select: { name: true } } } } },
  });

  const totalUnits = variants.reduce((n, v) => n + v.stockQty, 0);
  const stockValue = variants.reduce((n, v) => n + v.stockQty * (v.costPaise ?? 0), 0);

  return (
    <>
      <h1 className="mb-1 font-serif text-3xl">Inventory</h1>
      <p className="mb-5 text-[13px] text-[color:var(--muted)]">
        {variants.length} active SKUs · {totalUnits} units on hand · stock at cost {formatINR(stockValue)}
      </p>

      {sp.applied && (
        <p className="mb-4 rounded bg-green-50 px-3 py-2 text-[13px] text-green-900">
          Applied {sp.applied} stocktake corrections.{sp.errors ? ` Issues: ${sp.errors}` : ""}
        </p>
      )}

      <form className="mb-4 flex flex-wrap gap-2 rounded border border-[color:var(--line)] bg-white p-3">
        <input name="q" defaultValue={sp.q} placeholder="Search SKU or product…" className="flex-1 rounded border border-[color:var(--line)] px-3 py-1.5 text-[13px]" />
        <select name="filter" defaultValue={sp.filter ?? ""} className="rounded border border-[color:var(--line)] px-2 py-1.5 text-[13px]">
          <option value="">All</option>
          <option value="low">Low stock only</option>
          <option value="out">Out of stock only</option>
        </select>
        <button className="rounded bg-ink px-4 py-1.5 text-[12.5px] font-semibold text-white">Filter</button>
        <a href="/api/admin/export?type=stock" className="rounded border border-ink px-3 py-1.5 text-[12.5px] font-semibold">Export for stocktake</a>
      </form>

      <div className="mb-5 overflow-x-auto rounded border border-[color:var(--line)] bg-white">
        <table className="w-full text-[13px]">
          <thead className="border-b border-[color:var(--line)] bg-[#FAF7F0] text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-[10.5px] [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-[0.1em]">
              <th>SKU</th><th>Product</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Threshold</th><th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const available = v.stockQty - v.reservedQty;
              return (
                <tr key={v.id} className="border-b border-[color:var(--line)] last:border-0">
                  <td className="px-3 py-2 font-mono text-[11.5px]">{v.sku}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${v.product.id}`} className="text-maroon">{v.product.name}</Link>
                    {v.optionValue && <span className="text-[color:var(--muted)]"> · {v.optionValue}</span>}
                  </td>
                  <td className="px-3 py-2 font-semibold">{v.stockQty}</td>
                  <td className="px-3 py-2 text-[color:var(--muted)]">{v.reservedQty}</td>
                  <td className={`px-3 py-2 font-bold ${available === 0 ? "text-red-700" : available <= v.lowStockAt ? "text-amber-700" : "text-green-800"}`}>
                    {available}
                  </td>
                  <td className="px-3 py-2 text-[color:var(--muted)]">{v.lowStockAt}</td>
                  <td className="px-3 py-2">
                    <form action={adjustStock} className="flex items-center gap-1">
                      <input type="hidden" name="variantId" value={v.id} />
                      <select name="mode" className="rounded border border-[color:var(--line)] px-1 py-1 text-[11.5px]">
                        <option value="delta">+/−</option>
                        <option value="set">Set to</option>
                      </select>
                      <input name="value" type="number" required placeholder="0" className="w-16 rounded border border-[color:var(--line)] px-1.5 py-1 text-[12px]" />
                      <select name="reason" className="rounded border border-[color:var(--line)] px-1 py-1 text-[11.5px]">
                        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input name="note" placeholder="note" className="w-24 rounded border border-[color:var(--line)] px-1.5 py-1 text-[12px]" />
                      <button className="rounded bg-ink px-2 py-1 text-[11.5px] font-semibold text-white">Go</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {variants.length === 0 && <p className="p-6 text-center text-[13px] text-[color:var(--muted)]">Nothing matches.</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Bulk stocktake (CSV)">
          <p className="mb-3 text-[12.5px] text-[color:var(--muted)]">
            Export above, count on the shop floor, paste back here. One row per SKU:
            <code className="mx-1 rounded bg-[#F4F1EA] px-1">sku,counted_qty</code>.
            Each row becomes a correcting ledger movement — nothing is silently overwritten.
          </p>
          <form action={importStockCsv}>
            <textarea
              name="csv"
              rows={8}
              placeholder={"sku,counted_qty\nSHN-MEN-BRC-0001,16\nSHN-WMN-NEC-0001,7"}
              className="w-full rounded border border-[color:var(--line)] px-3 py-2 font-mono text-[12px]"
            />
            <div className="mt-2"><SubmitButton>Apply stocktake</SubmitButton></div>
          </form>
        </Card>

        <Card title="Recent movements">
          <table className="w-full text-[12.5px]">
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-[color:var(--line)] last:border-0">
                  <td className="py-1.5 font-mono text-[11px] text-[color:var(--muted)]">{m.variant.sku}</td>
                  <td className="py-1.5">{m.variant.product.name}</td>
                  <td className="py-1.5 text-[11px] uppercase text-[color:var(--muted)]">{m.reason}</td>
                  <td className={`py-1.5 text-right font-bold ${m.delta > 0 ? "text-green-800" : m.delta < 0 ? "text-red-700" : "text-[color:var(--muted)]"}`}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                  <td className="py-1.5 text-right text-[11px] text-[color:var(--muted)]">
                    {m.createdAt.toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && <p className="text-[13px] text-[color:var(--muted)]">No movements yet.</p>}
        </Card>
      </div>
    </>
  );
}
