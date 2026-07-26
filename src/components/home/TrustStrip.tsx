const ITEMS = [
  { title: "Premium Quality", sub: "Hand-finished, quality-checked", d: "M12 2l2.5 5.5L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" },
  { title: "7-Day Exchanges", sub: "Easy returns on unused pieces", d: "M4 9h11a5 5 0 010 10H8M8 5L4 9l4 4" },
  { title: "Free Shipping", sub: "On orders over ₹999", d: "M4 10h16v10H4zM8 10V7a4 4 0 018 0v3" },
  { title: "Cash on Delivery", sub: "Available on most PIN codes", d: "M3 7h11v8H3zM14 10h4l3 3v2h-7z" },
];

export default function TrustStrip() {
  return (
    <section className="py-[clamp(14px,1.8vw,24px)]">
      <div className="wrap">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-[color:var(--line-gold)] py-5 text-center sm:gap-y-[26px] sm:py-7 lg:grid-cols-4 lg:gap-6">
          {ITEMS.map((i) => (
            <div key={i.title}>
              {/* Icons are desktop-only; on mobile the words carry it. */}
              <svg viewBox="0 0 24 24" className="mx-auto mb-2.5 hidden h-7 w-7 fill-none stroke-gold stroke-[1.3] sm:block">
                <path d={i.d} />
              </svg>
              <b className="block font-serif text-[14px] font-semibold text-ink sm:text-[16.5px]">{i.title}</b>
              <span className="hidden text-[11.5px] text-[color:var(--muted)] sm:block">{i.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
