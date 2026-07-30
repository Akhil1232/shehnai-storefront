import Link from "next/link";
import { Fragment } from "react";

/** Always say where the visitor is, and give them one level back. */
export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3.5 text-[11.5px] text-muted">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {last || !it.href
              ? <span className="font-semibold text-ink">{it.label}</span>
              : <Link href={it.href} className="hover:text-maroon">{it.label}</Link>}
            {!last && <span className="opacity-40">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
