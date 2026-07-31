import Link from "next/link";
import { cx, wrap } from "@/lib/styles";
import type { SiteSettings } from "@/lib/settings";
import type { NavVertical } from "./Header";

const ftLink = "block py-1.5 text-[13.5px] text-muted hover:text-gold-deep";
const ftHead = "mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.16em] font-sans";

export default function Footer({
  settings, verticals,
}: { settings: SiteSettings; verticals: NavVertical[] }) {
  return (
    <footer className="relative mt-5 border-t border-line-gold bg-beige-deep">
      {/* Scalloped gold-foil edge from the packaging. */}
      <div aria-hidden className="h-3.5 bg-scallop bg-[length:24px_14px] bg-repeat-x" />

      <div className={cx(wrap, "grid gap-7 pb-7 pt-9 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-8")}>
        <div>
          <div className="font-serif text-[26px] font-semibold">Shehnai&reg;</div>
          <p className="my-3 max-w-[34ch] text-[13.5px] text-muted">
            A modern ethnic jewellery &amp; accessories house from India &mdash; for men, women,
            weddings, and murti sringaar.
          </p>
          <span className="font-dev text-[15px] text-maroon">शहनाई · हर बात, बारीकी से</span>
        </div>

        <div>
          <h4 className={ftHead}>Shop</h4>
          {verticals.map((v) => (
            <Link key={v.id} href={`/collections/${v.slug}`} className={ftLink}>{v.name}</Link>
          ))}
          <Link href="/collections/all" className={ftLink}>All Jewellery</Link>
        </div>

        <div>
          <h4 className={ftHead}>Help</h4>
          <Link href="/policies/shipping" className={ftLink}>Shipping Policy</Link>
          <Link href="/policies/returns" className={ftLink}>Replacement Policy</Link>
          <Link href="/policies/privacy" className={ftLink}>Privacy Policy</Link>
          <Link href="/policies/terms" className={ftLink}>Terms &amp; Conditions</Link>
        </div>

        <div>
          <h4 className={ftHead}>Contact</h4>
          <a href={`mailto:${settings.supportEmail}`} className={ftLink}>{settings.supportEmail}</a>
          <a href={settings.whatsapp} className={ftLink}>WhatsApp</a>
          <a href={settings.instagram} className={ftLink}>Instagram</a>
        </div>
      </div>

      <div className={cx(wrap, "flex flex-wrap justify-between gap-3 border-t border-line py-4 text-[11.5px] text-muted")}>
        <span>&copy; {new Date().getFullYear()} Shehnai&reg; &middot; Ethnic Accessories</span>
        <span>UPI &middot; Cards &middot; Net Banking &middot; Wallets &middot; COD</span>
      </div>
    </footer>
  );
}
