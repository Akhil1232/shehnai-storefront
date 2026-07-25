import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";

export default function Footer({
  settings,
  verticals,
}: {
  settings: SiteSettings;
  verticals: { id: string; slug: string; name: string }[];
}) {
  return (
    <footer className="relative border-t border-[color:var(--line-gold)] bg-beige-deep text-[color:var(--muted)]">
      <div className="scallop" aria-hidden />
      <div className="wrap grid grid-cols-1 gap-[34px] pb-[30px] pt-[42px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="font-serif text-[26px] text-ink">Shehnai®</span>
          <p className="my-3.5 max-w-[36ch] text-[13px]">
            A modern ethnic jewellery &amp; accessories house from India — for men,
            women, weddings, and your Thakurji.
          </p>
          <span className="font-dev text-[15px] text-gold-bright">
            शहनाई · हर बात, बारीकी से
          </span>
        </div>

        <div>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink">Shop</h4>
          {verticals.map((v) => (
            <Link key={v.id} href={`/collections/${v.slug}`} className="block py-1.5 text-[13.5px] hover:text-gold-bright">
              {v.name}
            </Link>
          ))}
          <Link href="/collections/all" className="block py-1.5 text-[13.5px] hover:text-gold-bright">
            All Jewellery
          </Link>
        </div>

        <div>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink">Company</h4>
          <Link href="/about" className="block py-1.5 text-[13.5px] hover:text-gold-bright">About Us</Link>
          <a href={`mailto:${settings.supportEmail}`} className="block py-1.5 text-[13.5px] hover:text-gold-bright">Contact Us</a>
          <a href={settings.whatsapp} className="block py-1.5 text-[13.5px] hover:text-gold-bright">WhatsApp</a>
        </div>

        <div>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink">Policies</h4>
          <Link href="/policies/shipping" className="block py-1.5 text-[13.5px] hover:text-gold-bright">Shipping Policy</Link>
          <Link href="/policies/returns" className="block py-1.5 text-[13.5px] hover:text-gold-bright">Return &amp; Exchange</Link>
          <Link href="/policies/privacy" className="block py-1.5 text-[13.5px] hover:text-gold-bright">Privacy Policy</Link>
          <Link href="/policies/terms" className="block py-1.5 text-[13.5px] hover:text-gold-bright">Terms &amp; Conditions</Link>
        </div>
      </div>

      <div className="wrap flex flex-wrap justify-between gap-3.5 border-t border-[color:var(--line)] py-5 text-[11.5px]">
        <span>© {new Date().getFullYear()} Shehnai® · Ethnic Accessories. All rights reserved.</span>
        <span>UPI · Cards · Net Banking · Wallets · COD</span>
      </div>
    </footer>
  );
}
