import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * CSV export. /api/admin/export?type=products|stock|orders
 * `stock` is deliberately shaped as the stocktake import format, so you can
 * export it, count, and paste it straight back into the bulk import box.
 */
const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: Record<string, unknown>[]) => {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

export async function GET(req: Request) {
  await requireAdmin();
  const type = new URL(req.url).searchParams.get("type") ?? "products";
  let rows: Record<string, unknown>[] = [];

  if (type === "stock") {
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: { select: { name: true } } },
      orderBy: { sku: "asc" },
    });
    rows = variants.map((v) => ({
      sku: v.sku,
      counted_qty: v.stockQty, // overwrite this column during the count
      product: v.product.name,
      option: v.optionValue ?? "",
      reserved: v.reservedQty,
      low_stock_at: v.lowStockAt,
    }));
  } else if (type === "orders") {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
    rows = orders.map((o) => ({
      order_number: o.orderNumber,
      date: o.createdAt.toISOString(),
      status: o.status,
      payment: `${o.paymentMethod}/${o.paymentStatus}`,
      email: o.email,
      phone: o.phone,
      total_rupees: o.totalPaise / 100,
    }));
  } else {
    const products = await prisma.product.findMany({
      include: {
        vertical: { select: { name: true } },
        category: { select: { name: true } },
        variants: true,
      },
      orderBy: { name: "asc" },
    });
    rows = products.flatMap((p) =>
      p.variants.map((v) => ({
        sku: v.sku,
        name: p.name,
        slug: p.slug,
        vertical: p.vertical.name,
        category: p.category?.name ?? "",
        option: v.optionValue ?? "",
        price_rupees: v.pricePaise / 100,
        mrp_rupees: v.mrpPaise / 100,
        stock: v.stockQty,
        status: p.status,
        badge: p.badge,
      }))
    );
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shehnai-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
