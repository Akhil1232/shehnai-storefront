import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(sp.status ? { status: sp.status as never } : {}),
      ...(sp.q
        ? { OR: [{ orderNumber: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { phone: { contains: sp.q } }] }
        : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Orders <span className="text-base text-[color:var(--muted)]">({orders.length})</span></h1>
        <a href="/api/admin/export?type=orders" className="rounded border border-ink px-3 py-2 text-[12.5px] font-semibold">Export CSV</a>
      </div>

      <form className="mb-4 flex flex-wrap gap-2 rounded border border-[color:var(--line)] bg-white p-3">
        <input name="q" defaultValue={sp.q} placeholder="Order number, email or phone…" className="flex-1 rounded border border-[color:var(--line)] px-3 py-1.5 text-[13px]" />
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border border-[color:var(--line)] px-2 py-1.5 text-[13px]">
          <option value="">Any status</option>
          {["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="rounded bg-ink px-4 py-1.5 text-[12.5px] font-semibold text-white">Filter</button>
      </form>

      <div className="overflow-x-auto rounded border border-[color:var(--line)] bg-white">
        <table className="w-full text-[13px]">
          <thead className="border-b border-[color:var(--line)] bg-[#FAF7F0] text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-[10.5px] [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-[0.1em]">
              <th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[color:var(--line)] last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono text-[12px] font-semibold text-maroon">{o.orderNumber}</Link>
                </td>
                <td className="px-3 py-2 text-[color:var(--muted)]">{o.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="px-3 py-2">{o.email}<span className="block text-[11px] text-[color:var(--muted)]">{o.phone}</span></td>
                <td className="px-3 py-2">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : o.paymentStatus === "FAILED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                    {o.paymentMethod} · {o.paymentStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-[11.5px] uppercase">{o.status}</td>
                <td className="px-3 py-2 font-semibold">{formatINR(o.totalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-[13px] text-[color:var(--muted)]">No orders yet.</p>}
      </div>
    </>
  );
}
