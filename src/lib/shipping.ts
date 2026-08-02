import "server-only";
import { shippingFor, type SiteSettings } from "./settings";
import { checkServiceability, getFreightCharge } from "./delhivery";

export type ShippingQuote = {
  shippingPaise: number;
  serviceable: boolean;
};

/**
 * The one place that decides what an order's shipping costs. Above the free
 * threshold it's free regardless of destination. Below it, tries a live
 * Delhivery freight quote for the destination pincode; if Delhivery can't be
 * reached, falls back to the flat rate from Settings so checkout never breaks
 * because of an upstream hiccup.
 *
 * `serviceable` defaults to true when the Delhivery check itself fails — we
 * only want to block an order on an explicit "no", not on a network error.
 */
export async function computeShipping(args: {
  subtotalPaise: number;
  weightGrams: number;
  pincode: string;
  settings: SiteSettings;
}): Promise<ShippingQuote> {
  const { subtotalPaise, weightGrams, pincode, settings } = args;

  let serviceable = true;
  try {
    const svc = await checkServiceability(pincode);
    serviceable = svc.serviceable;
  } catch (err) {
    console.error("[shipping] serviceability check failed", err);
  }

  if (subtotalPaise >= settings.freeShippingThresholdPaise) {
    return { shippingPaise: 0, serviceable };
  }

  try {
    const quoted = await getFreightCharge({ destinationPincode: pincode, weightGrams });
    if (quoted !== null) return { shippingPaise: quoted, serviceable };
  } catch (err) {
    console.error("[shipping] freight quote failed", err);
  }

  return { shippingPaise: shippingFor(subtotalPaise, settings), serviceable };
}
