import { getSettings } from "@/lib/settings";
import CartView from "@/components/cart/CartView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Bag" };

export default async function CartPage() {
  const s = await getSettings();
  return <CartView freeShippingAt={s.freeShippingThresholdPaise} flatShipping={s.flatShippingPaise} />;
}
