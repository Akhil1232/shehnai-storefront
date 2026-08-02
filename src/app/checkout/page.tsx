import { getSettings } from "@/lib/settings";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

/**
 * Server wrapper so shipping thresholds come from Settings rather than being
 * hardcoded in the client. The whole checkout is ONE screen — no address step,
 * no review step, no separate payment page.
 */
export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <CheckoutForm
      freeShippingAt={s.freeShippingThresholdPaise}
      flatShipping={s.flatShippingPaise}
    />
  );
}
