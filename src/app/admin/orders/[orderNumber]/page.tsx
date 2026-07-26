import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { updateOrder } from "../../actions";
import { Card, Field, TextArea, Select, SubmitButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  await requireAdmin();
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const a = order.shippingAddress as Record<string, string>;

  return (
    <>
      <Link href="/admin/orders" className="text-[11.5px] text-maroon">← Orders</Link>
      <h1 className="mb-1 font-mono text-2xl font-bold">{order.orderNumber}</h1>
      <p className="mb-5 text-[13px] text-[color:var(--muted)]">
        {order.createdAt.toLocaleString("en-IN")} · {order.paymentMethod} · {order.paymentStatus}
      </p>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <Card title="Items">
            <table className="w-full text-[13px]">
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-b border-[color:var(--line)] last:border-0">
                    <td className="py-2">
                      {i.productName}{i.variantName ? ` · ${i.variantName}` : ""}
                      <span className="block font-mono text-[11px] text-[color:var(--muted)]">{i.sku}</span>
                    </td>
                    <td className="py-2 text-center">× {i.qty}</td>
                    <td className="py-2 text-right font-semibold">{formatINR(i.lineTotalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 border-t border-[color:var(--line)] pt-3 text-[13px]">
              <div className="flex justify-between py-0.5"><span>Subtotal</span><span>{formatINR(order.subtotalPaise)}</span></div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between py-0.5 text-maroon"><span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span><span>−{formatINR(order.discountPaise)}</span></div>
              )}
              <div className="flex justify-between py-0.5"><span>Shipping</span><span>{formatINR(order.shippingPaise)}</span></div>
              <div className="flex justify-between border-t border-[color:var(--line)] pt-2 text-[16px] font-bold"><span>Total</span><span>{formatINR(order.totalPaise)}</span></div>
            </div>
          </Card>

          <Card title="Fulfilment">
            <form action={updateOrder} className="grid max-w-[420px] gap-2.5">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <Select label="Status" name="status" defaultValue={order.status}
                options={["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((s) => ({ value: s, label: s }))} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Carrier" name="carrier" defaultValue={order.carrier} hint="Delhivery, BlueDart…" />
                <Field label="Tracking number" name="trackingNumber" defaultValue={order.trackingNumber} />
              </div>
              <TextArea label="Internal notes" name="notes" defaultValue={order.notes} rows={2} />
              <SubmitButton>Update order</SubmitButton>
            </form>
          </Card>
        </div>

        <div>
          <Card title="Customer">
            <p className="text-[13.5px]">{order.email}</p>
            <p className="text-[13.5px] text-[color:var(--muted)]">{order.phone}</p>
          </Card>
          <Card title="Shipping address">
            <address className="text-[13.5px] not-italic leading-relaxed">
              <b>{a.name}</b><br />
              {a.line1}<br />
              {a.line2 && <>{a.line2}<br /></>}
              {a.city}, {a.state}<br />
              {a.pincode}<br />
              {a.phone}
            </address>
          </Card>
          {order.razorpayPaymentId && (
            <Card title="Payment">
              <p className="break-all font-mono text-[11.5px]">{order.razorpayPaymentId}</p>
              <p className="mt-1 text-[11.5px] text-[color:var(--muted)]">Look this ID up in the Razorpay dashboard for refunds.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
