import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveBanner, deleteBanner } from "../actions";
import { Card, Field, Select, Checkbox, SubmitButton } from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

export const dynamic = "force-dynamic";

/** Placement -> required image sizes, shown on the form so nobody has to guess. */
type Preset = "hero" | "triptych" | "category" | "free";

// The hero frame is PORTRAIT - it sits in a tall arch beside the headline, so
// a landscape image gets badly cropped. The old 2400x1000 note was wrong.
const SPEC: Record<string, { desktop: string; mobile: string; note: string; preset: Preset }> = {
  HOME_HERO: { desktop: "1200 × 1400", mobile: "1080 × 1260", preset: "hero",
    note: "Portrait. The top ~25% curves away behind the arch - keep it empty." },
  HOME_TRIPTYCH: { desktop: "900 × 1200", mobile: "900 × 1200", preset: "triptych",
    note: "sortOrder 1 is the centre panel, the one currently shown. Top ~25% is arch-cropped." },
  CATEGORY_HEADER: { desktop: "1920 × 640", mobile: "1080 × 720", preset: "category",
    note: "Pick a vertical below, or it won't appear anywhere." },
  PROMO_STRIP: { desktop: "text only", mobile: "text only", preset: "free",
    note: "Uses the Title field only - no image needed." },
};

const PLACEMENTS = Object.keys(SPEC);

export default async function BannersPage() {
  await requireAdmin();
  const [banners, verticals] = await Promise.all([
    prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }], include: { vertical: true } }),
    prisma.vertical.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const vOptions = [{ value: "", label: "— none —" }, ...verticals.map((v) => ({ value: v.id, label: v.name }))];

  return (
    <>
      <h1 className="mb-1 font-serif text-3xl">Banners</h1>
      <p className="mb-5 text-[13px] text-[color:var(--muted)]">
        Position is controlled by <b>sortOrder</b>. For the homepage triptych, sortOrder 1 is the
        centre panel — that is how Murti Sringaar sits in the middle.
      </p>

      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        {banners.map((b) => {
          const spec = SPEC[b.placement];
          return (
            <Card key={b.id} title={`${b.placement} · #${b.sortOrder}`}>
              <form action={saveBanner} className="grid gap-2.5">
                <input type="hidden" name="id" value={b.id} />
                <Select label="Placement" name="placement" defaultValue={b.placement}
                  options={PLACEMENTS.map((p) => ({ value: p, label: p }))} />
                <p className="rounded bg-[#EFE3CB] px-2 py-1.5 text-[11.5px] text-maroon">{spec.note}</p>
                <Field label="Title" name="title" defaultValue={b.title} />
                <Field label="Subtitle" name="subtitle" defaultValue={b.subtitle} />
                <ImageUpload label="Desktop image" name="desktopUrl" defaultValue={b.desktopUrl} spec={spec.desktop} preset={spec.preset} />
                <ImageUpload label="Mobile image" name="mobileUrl" defaultValue={b.mobileUrl} spec={spec.mobile} preset={spec.preset} />
                <Field label="Alt text" name="alt" defaultValue={b.alt} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Link" name="href" defaultValue={b.href} hint="/collections/murti" />
                  <Field label="CTA label" name="ctaLabel" defaultValue={b.ctaLabel} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select label="Vertical (category header only)" name="verticalId" defaultValue={b.verticalId} options={vOptions} />
                  <Field label="Sort order" name="sortOrder" type="number" defaultValue={b.sortOrder} />
                </div>
                <Checkbox label="Active" name="isActive" defaultChecked={b.isActive} />
                <div className="flex gap-2"><SubmitButton>Save</SubmitButton></div>
              </form>
              <form action={deleteBanner} className="mt-2">
                <input type="hidden" name="id" value={b.id} />
                <button className="text-[11.5px] text-red-700">Delete this banner</button>
              </form>
            </Card>
          );
        })}
      </div>

      <Card title="Add a banner">
        <form action={saveBanner} className="grid max-w-[520px] gap-2.5">
          <Select label="Placement" name="placement" options={PLACEMENTS.map((p) => ({ value: p, label: p }))} />
          <Field label="Title" name="title" />
          <ImageUpload label="Desktop image" name="desktopUrl" spec="see placement above" preset="free" />
          <ImageUpload label="Mobile image" name="mobileUrl" spec="see placement above" preset="free" />
          <Field label="Alt text" name="alt" />
          <Field label="Link" name="href" />
          <Select label="Vertical" name="verticalId" options={vOptions} />
          <Field label="Sort order" name="sortOrder" type="number" defaultValue={0} />
          <Checkbox label="Active" name="isActive" defaultChecked />
          <SubmitButton>Create banner</SubmitButton>
        </form>
      </Card>
    </>
  );
}
