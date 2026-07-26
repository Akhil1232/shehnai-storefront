import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { lowStockVariants } from "@/lib/inventory";
import { formatINR } from "@/lib/money";
import { Card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAdmin();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [paidAgg, orderCount, pending, productCount, skuCount, lowStock, recent, oos] =
    await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "PAID", createdAt: { gte: since } },
        _sum: { totalPaise: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PACKED"] } } }),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.productVariant.count({ where: { isActive: true } }),
      lowStockVariants(),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.productVariant.count({ where: { isActive: true, stockQty: 0 } }),
    ]);

  const stats = [
    ["Revenue (30d)", formatINR(paidAgg._sum.totalPaise ?? 0)],
    ["Orders (30d)", String(orderCount)],
    ["Awaiting dispatch", String(pending)],
    ["Live products", String(productCount)],
    ["Active SKUs", String(skuCount)],
    ["Out of stock", String(oos)],
  ];

  return (
    <>
      <h1 className="mb-5 font-serif text-3xl">Dashboard</h1>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded border border-[color:var(--line)] bg-white p-4">
            <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--muted)]">{label}</span>
            <b className="mt-1 block font-serif text-2xl">{value}</b>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title={`Low stock (${lowStock.length})`}
          actions={<Link href="/admin/inventory" className="text-[11.5px] text-maroon">Manage →</Link>}
        >
          {lowStock.length === 0 ? (
            <p className="text-[13px] text-[color:var(--muted)]">Everything is above its threshold.</p>
          ) : (
            <table className="w-full text-[13px]">
              <tbody>
                {lowStock.slice(0, 12).map((v) => (
                  <tr key={v.id} className="border-b border-[color:var(--line)] last:border-0">
                    <td className="py-1.5">{v.name}</td>
                    <td className="py-1.5 font-mono text-[11.5px] text-[color:var(--muted)]">{v.sku}</td>
                    <td className={`py-1.5 text-right font-bold ${v.stockQty === 0 ? "text-red-700" : "text-amber-700"}`}>
                      {v.stockQty} left
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[11.5px] text-maroon">All →</Link>}>
          {recent.length === 0 ? (
            <p className="text-[13px] text-[color:var(--muted)]">No orders yet.</p>
          ) : (
            <table className="w-full text-[13px]">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-[color:var(--line)] last:border-0">
                    <td className="py-1.5">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono text-[12px] text-maroon">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-1.5 text-[color:var(--muted)]">{o.status}</td>
                    <td className="py-1.5 text-right font-semibold">{formatINR(o.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
