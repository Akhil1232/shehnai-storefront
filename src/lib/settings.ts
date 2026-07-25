import { prisma } from "./prisma";

/**
 * Site-wide config that the admin can edit without a deploy. Add a key here,
 * add a field to the admin settings form, done — no migration needed.
 */
export type SiteSettings = {
  announcement: string;
  freeShippingThresholdPaise: number;
  flatShippingPaise: number;
  codFeePaise: number;
  codEnabled: boolean;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  instagram: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement:
    "Free pan-India shipping over ₹999 · New: The Kundan Bridal Edit is live",
  freeShippingThresholdPaise: 99900,
  flatShippingPaise: 9900,
  codFeePaise: 0,
  codEnabled: true,
  supportEmail: "care@shehnai.in",
  supportPhone: "+91 00000 00000",
  whatsapp: "https://wa.me/910000000000",
  instagram: "https://instagram.com/shehnai",
};

export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.setting.findMany();
  const fromDb = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...fromDb } as SiteSettings;
}

export function shippingFor(subtotalPaise: number, s: SiteSettings): number {
  return subtotalPaise >= s.freeShippingThresholdPaise ? 0 : s.flatShippingPaise;
}
