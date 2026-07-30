"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useUI } from "@/store/ui";
import { Icon } from "@/components/ui/icons";
import { btn, btnFull, btnSm, cx, panelBase } from "@/lib/styles";

export const PRICE_BANDS: [string, string][] = [
  ["0-999", "Under ₹1,000"],
  ["1000-2500", "₹1,000 – ₹2,500"],
  ["2500-5000", "₹2,500 – ₹5,000"],
  ["5000-", "₹5,000 & above"],
];

export const SORTS: [string, string][] = [
  ["featured", "Featured"],
  ["newest", "Newest first"],
  ["low", "Price: low to high"],
  ["high", "Price: high to low"],
  ["rating", "Customer rating"],
];

type Cat = { slug: string; name: string; count: number };

const opt = "flex cursor-pointer items-center gap-2.5 py-1.5 text-[13.5px]";
const box = "h-4 w-4 accent-maroon cursor-pointer";
const groupHead = "mb-2.5 font-sans text-[10.5px] font-extrabold uppercase tracking-[0.14em]";

/** One URL writer, so sidebar, sheet and chips can never disagree. */
function useFilterUrl() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  return {
    sp,
    toggleMulti(key: "category" | "price", value: string) {
      const next = new URLSearchParams(sp.toString());
      const current = next.getAll(key);
      next.delete(key);
      const after = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      after.forEach((v) => next.append(key, v));
      router.replace(`${path}?${next.toString()}`, { scroll: false });
    },
    setOne(key: string, value: string) {
      const next = new URLSearchParams(sp.toString());
      next.set(key, value);
      router.replace(`${path}?${next.toString()}`, { scroll: false });
    },
    clearAll() { router.replace(path, { scroll: false }); },
  };
}

/* ------------------------------------------------------------ desktop rail -- */

export function FilterSidebar({ categories }: { categories: Cat[] }) {
  const { sp, toggleMulti, clearAll } = useFilterUrl();
  const cats = sp.getAll("category");
  const prices = sp.getAll("price");

  return (
    <aside aria-label="Filters" className="hidden lg:sticky lg:top-sticky-top lg:block">
      {categories.length > 0 && (
        <div className="border-b border-line pb-3.5">
          <h4 className={groupHead}>Category</h4>
          {categories.map((c) => (
            <label key={c.slug} className={opt}>
              <input type="checkbox" className={box} checked={cats.includes(c.slug)}
                     onChange={() => toggleMulti("category", c.slug)} />
              <span className="capitalize">{c.name}</span>
              <span className="ml-auto text-[11.5px] text-faint">{c.count}</span>
            </label>
          ))}
        </div>
      )}
      <div className="border-b border-line py-3.5">
        <h4 className={groupHead}>Price</h4>
        {PRICE_BANDS.map(([val, label]) => (
          <label key={val} className={opt}>
            <input type="checkbox" className={box} checked={prices.includes(val)}
                   onChange={() => toggleMulti("price", val)} />
            {label}
          </label>
        ))}
      </div>
      <button onClick={clearAll} className={cx(btn.ghost, btnSm, btnFull, "mt-3.5")}>Clear all filters</button>
    </aside>
  );
}

/* ------------------------------------------------------- mobile bar + sheets -- */

export function FilterBar({ categories }: { categories: Cat[] }) {
  const ui = useUI();
  const { sp } = useFilterUrl();
  const active = sp.getAll("category").length + sp.getAll("price").length;
  const barBtn = "flex h-[42px] flex-1 items-center justify-center gap-2 rounded border border-line bg-paper text-xs font-bold uppercase tracking-[0.06em]";

  return (
    <>
      <div className="sticky top-16 z-bar flex gap-2.5 border-b border-line bg-[#F3E9D3]/96 py-2.5 backdrop-blur-md lg:hidden">
        <button onClick={ui.openFilter} className={barBtn}>
          Filter {active > 0 && <span className="h-1.5 w-1.5 rounded-full bg-maroon" />}
        </button>
        <button onClick={ui.openSort} className={barBtn}>Sort</button>
      </div>
      <FilterSheet categories={categories} />
      <SortSheet />
    </>
  );
}

/** Bottom sheet on mobile — same panel primitive, anchored to the bottom. */
const sheet = "inset-x-0 bottom-0 top-auto max-h-[82vh] w-auto rounded-t-2xl border-t border-line-gold lg:hidden";

function Sheet({ open, title, children, foot }: {
  open: boolean; title: string; children: React.ReactNode; foot?: React.ReactNode;
}) {
  const { close } = useUI();
  return (
    <aside aria-label={title} aria-hidden={!open}
           className={cx(panelBase, sheet, open ? "translate-y-0" : "translate-y-full")}>
      <div className="flex flex-none items-center justify-between border-b border-line px-4 py-4">
        <span className="font-serif text-[22px] font-semibold">{title}</span>
        <button onClick={close} aria-label="Close" className="p-1 text-muted hover:text-maroon">
          <Icon name="close" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      {foot && <div className="flex-none border-t border-line bg-cream px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">{foot}</div>}
    </aside>
  );
}

function FilterSheet({ categories }: { categories: Cat[] }) {
  const { overlay, close } = useUI();
  const { sp, toggleMulti, clearAll } = useFilterUrl();
  const cats = sp.getAll("category");
  const prices = sp.getAll("price");

  return (
    <Sheet open={overlay === "filter"} title="Filter"
           foot={
             <div className="flex gap-2.5">
               <button onClick={() => { clearAll(); close(); }} className={cx(btn.ghost, "flex-1")}>Clear all</button>
               <button onClick={close} className={cx(btn.dark, "flex-1")}>Show results</button>
             </div>
           }>
      {categories.length > 0 && (
        <div className="border-b border-line pb-3">
          <h4 className={groupHead}>Category</h4>
          {categories.map((c) => (
            <label key={c.slug} className={opt}>
              <input type="checkbox" className={box} checked={cats.includes(c.slug)}
                     onChange={() => toggleMulti("category", c.slug)} />
              <span className="capitalize">{c.name}</span>
              <span className="ml-auto text-[11.5px] text-faint">{c.count}</span>
            </label>
          ))}
        </div>
      )}
      <div className="py-3">
        <h4 className={groupHead}>Price</h4>
        {PRICE_BANDS.map(([val, label]) => (
          <label key={val} className={opt}>
            <input type="checkbox" className={box} checked={prices.includes(val)}
                   onChange={() => toggleMulti("price", val)} />
            {label}
          </label>
        ))}
      </div>
    </Sheet>
  );
}

function SortSheet() {
  const { overlay, close } = useUI();
  const { sp, setOne } = useFilterUrl();
  const current = sp.get("sort") ?? "featured";

  return (
    <Sheet open={overlay === "sort"} title="Sort by">
      {SORTS.map(([val, label]) => (
        <label key={val} className={cx(opt, "py-3")}>
          <input type="radio" name="sort" className={box} checked={current === val}
                 onChange={() => { setOne("sort", val); close(); }} />
          {label}
        </label>
      ))}
    </Sheet>
  );
}

/* --------------------------------------------------------------- chips + sort -- */

export function FilterChips({ labels }: { labels: { key: "category" | "price"; value: string; label: string }[] }) {
  const { toggleMulti, clearAll } = useFilterUrl();
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-2 py-3">
      {labels.map((l) => (
        <span key={`${l.key}-${l.value}`}
              className="inline-flex items-center gap-2 rounded-full border border-line-gold bg-maroon-soft px-3 py-1.5 text-xs font-semibold">
          {l.label}
          <button onClick={() => toggleMulti(l.key, l.value)} aria-label={`Remove ${l.label}`}
                  className="text-sm leading-none text-maroon">&times;</button>
        </span>
      ))}
      <button onClick={clearAll}
              className="px-1 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-maroon">
        Clear all
      </button>
    </div>
  );
}

export function SortToolbar({ count }: { count: number }) {
  const { sp, setOne } = useFilterUrl();
  return (
    <div className="hidden items-center justify-between pb-3.5 lg:flex">
      <span className="text-[13.5px] text-muted"><b className="text-ink">{count}</b> piece{count === 1 ? "" : "s"}</span>
      <select value={sp.get("sort") ?? "featured"} onChange={(e) => setOne("sort", e.target.value)} aria-label="Sort by"
              className="h-10 cursor-pointer appearance-none rounded border border-line bg-paper bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M3 5l3 3 3-3%22 stroke=%22%23241C15%22 fill=%22none%22 stroke-width=%221.4%22/></svg>')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pl-3.5 pr-8 text-[13px] outline-none focus:border-gold">
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
