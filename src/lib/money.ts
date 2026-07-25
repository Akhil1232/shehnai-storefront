// All money in this codebase is an integer number of PAISE.
// 189900 paise === ₹1,899.00 === what Razorpay expects.

export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);
export const paiseToRupees = (paise: number) => paise / 100;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 189900 -> "₹1,899" */
export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

/** 189900, 249900 -> 24 (percent off, rounded) */
export function discountPercent(pricePaise: number, mrpPaise: number): number {
  if (!mrpPaise || mrpPaise <= pricePaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
