import "server-only";

/**
 * =============================================================================
 * DELHIVERY
 * =============================================================================
 * Thin wrapper around Delhivery's Business (B2C) API — pincode serviceability,
 * shipment creation (waybill generation), and tracking. Plain fetch, no SDK;
 * Delhivery's endpoints are simple enough that a dependency isn't worth it.
 *
 * DELHIVERY_API_BASE_URL:
 *   staging  -> https://staging-express.delhivery.com
 *   live     -> https://track.delhivery.com
 * Staging tokens/pickup locations are separate from production ones — get
 * both from the Delhivery One dashboard.
 */

function baseUrl() {
  return process.env.DELHIVERY_API_BASE_URL ?? "https://staging-express.delhivery.com";
}

function token() {
  const t = process.env.DELHIVERY_API_TOKEN;
  if (!t) throw new Error("DELHIVERY_API_TOKEN is not set");
  return t;
}

function authHeaders() {
  return {
    Authorization: `Token ${token()}`,
    Accept: "application/json",
  };
}

// ------------------------------------------------------------ serviceability --

export type ServiceabilityResult = {
  serviceable: boolean;
  prepaidAvailable: boolean;
  city?: string;
  state?: string;
};

export async function checkServiceability(pincode: string): Promise<ServiceabilityResult> {
  const res = await fetch(
    `${baseUrl()}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Delhivery serviceability check failed (${res.status})`);

  const data = await res.json();
  const row = data?.delivery_codes?.[0]?.postal_code;
  if (!row) return { serviceable: false, prepaidAvailable: false };

  return {
    serviceable: true,
    prepaidAvailable: row.pre_paid === "Y",
    city: row.city,
    state: row.state_code,
  };
}

// ------------------------------------------------------------ shipment create --

export type CreateShipmentInput = {
  orderNumber: string;
  totalPaise: number;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: { productName: string; qty: number }[];
  /** Total shipment weight. Defaults to 500g if the catalogue has no weight on record. */
  weightGrams?: number;
};

export type CreateShipmentResult = { waybill: string };

/**
 * Creates the shipment and mints a waybill. Requires DELHIVERY_PICKUP_LOCATION
 * to exactly match a pickup location already registered on the Delhivery
 * account — a typo here fails the whole call.
 */
export async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  const pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION;
  if (!pickupLocation) throw new Error("DELHIVERY_PICKUP_LOCATION is not set");

  const amountRupees = (input.totalPaise / 100).toFixed(2);

  const shipment = {
    name: input.address.name,
    add: [input.address.line1, input.address.line2].filter(Boolean).join(", "),
    pin: input.address.pincode,
    city: input.address.city,
    state: input.address.state,
    country: "India",
    phone: input.address.phone,
    order: input.orderNumber,
    payment_mode: "Prepaid",
    products_desc: input.items.map((i) => `${i.productName} x${i.qty}`).join(", ").slice(0, 500),
    cod_amount: "0",
    total_amount: amountRupees,
    weight: String(input.weightGrams ?? 500),
    shipping_mode: "Surface",
    address_type: "home",
  };

  const payload = {
    shipments: [shipment],
    pickup_location: { name: pickupLocation },
  };

  const res = await fetch(`${baseUrl()}/api/cmu/create.json`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`,
  });

  const data = await res.json().catch(() => null);
  const pkg = data?.packages?.[0];

  if (!res.ok || !pkg?.waybill) {
    const reason =
      (Array.isArray(pkg?.remarks) ? pkg.remarks.join(", ") : pkg?.remarks) ||
      data?.rmk ||
      `Delhivery could not create the shipment (${res.status}).`;
    throw new Error(reason);
  }

  return { waybill: pkg.waybill };
}

// ------------------------------------------------------------------ tracking --

export type TrackingStatus = {
  status: string;
  statusType?: string;
  statusDateTime?: string;
  instructions?: string;
};

// -------------------------------------------------------------- freight rate --

export type FreightChargeInput = {
  destinationPincode: string;
  weightGrams: number;
};

/**
 * Quotes the actual freight charge for a destination pincode off Delhivery's
 * own zone-based rate card (the same one your contract is billed against),
 * rather than a flat site-wide shipping fee. Returns paise, or null if the
 * quote couldn't be obtained — callers should fall back to a flat rate rather
 * than fail checkout when this happens.
 */
export async function getFreightCharge(input: FreightChargeInput): Promise<number | null> {
  const originPincode = process.env.DELHIVERY_ORIGIN_PINCODE;
  if (!originPincode) throw new Error("DELHIVERY_ORIGIN_PINCODE is not set");

  const params = new URLSearchParams({
    md: "S", // Surface
    ss: "Delivered",
    o_pin: originPincode,
    d_pin: input.destinationPincode,
    cgm: String(input.weightGrams),
    pt: "Prepaid",
  });
  const clientName = process.env.DELHIVERY_CLIENT_NAME;
  if (clientName) params.set("cl", clientName);

  const res = await fetch(`${baseUrl()}/api/kinko/v1/invoice/charges/.json?${params.toString()}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const row = Array.isArray(data) ? data[0] : data;
  const amount = row?.total_amount ?? row?.charge_total ?? row?.gross_amount;
  // A real courier charge is never ₹0 — a zero here means the rate card has no
  // entry for this zone (contract gap on Delhivery's side), not a genuine free
  // rate. Treat it as "no quote" so callers fall back to the flat rate instead
  // of accidentally shipping for free.
  return typeof amount === "number" && amount > 0 ? Math.round(amount * 100) : null;
}

export async function trackShipment(waybill: string): Promise<TrackingStatus | null> {
  const res = await fetch(
    `${baseUrl()}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Delhivery tracking failed (${res.status})`);

  const data = await res.json();
  const shipment = data?.ShipmentData?.[0]?.Shipment;
  if (!shipment) return null;

  return {
    status: shipment.Status?.Status ?? "Unknown",
    statusType: shipment.Status?.StatusType,
    statusDateTime: shipment.Status?.StatusDateTime,
    instructions: shipment.Status?.Instructions,
  };
}
