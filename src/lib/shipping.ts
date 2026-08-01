import "server-only";
import { shippingFor, type SiteSettings } from "./settings";
import { checkServiceability, getFreightCharge } from "./delhivery";

export type ShippingQuote = {
  shippingPaise: number;
  serviceable: boolean;
  codAvailable: boolean;
};

/**
 * The one place that decides what an order's shipping costs. Above the free
 * threshold it's free regardless of destination. Below it, tries a live
 * Delhivery freight quote for the destination pincode; if Delhivery can't be
 * reached, falls back to the flat rate from Settings so checkout never breaks
 * because of an upstream hiccup.
 *
 * `serviceable`/`codAvailable` default to true when the Delhivery check
 * itself fails — we only want to block an order on an explicit "no", not on
 * a network error.
 */
export async function computeShipping(args: {
  subtotalPaise: number;
  weightGrams: number;
  pincode: string;
  paymentMethod: "RAZORPAY" | "COD";
  settings: SiteSettings;
}): Promise<ShippingQuote> {
  const { subtotalPaise, weightGrams, pincode, paymentMethod, settings } = args;

  let serviceable = true;
  let codAvailable = true;
  try {
    const svc = await checkServiceability(pincode);
    serviceable = svc.serviceable;
    codAvailable = svc.codAvailable;
  } catch (err) {
    console.error("[shipping] serviceability check failed", err);
  }

  if (subtotalPaise >= settings.freeShippingThresholdPaise) {
    return { shippingPaise: 0, serviceable, codAvailable };
  }

  try {
    const quoted = await getFreightCharge({
      destinationPincode: pincode,
      weightGrams,
      paymentMode: paymentMethod === "COD" ? "COD" : "Prepaid",
    });
    if (quoted !== null) return { shippingPaise: quoted, serviceable, codAvailable };
  } catch (err) {
    console.error("[shipping] freight quote failed", err);
  }

  return { shippingPaise: shippingFor(subtotalPaise, settings), serviceable, codAvailable };
}
