import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "../actions";
import { Card, Field, TextArea, SubmitButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin(["OWNER", "ADMIN"]);
  const s = await getSettings();

  return (
    <>
      <h1 className="mb-5 font-serif text-3xl">Settings</h1>
      <form action={saveSettings} className="max-w-[560px]">
        <Card title="Announcement bar">
          <TextArea label="Text" name="announcement" defaultValue={s.announcement} rows={2}
            hint="Leave blank to hide the maroon bar at the top of the site." />
        </Card>

        <Card title="Shipping">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Free shipping above (₹)" name="freeShippingThreshold" type="number" defaultValue={s.freeShippingThresholdPaise / 100} />
            <Field label="Flat shipping charge (₹)" name="flatShipping" type="number" defaultValue={s.flatShippingPaise / 100} />
          </div>
        </Card>

        <Card title="Contact">
          <div className="grid gap-3">
            <Field label="Support email" name="supportEmail" defaultValue={s.supportEmail} />
            <Field label="Support phone" name="supportPhone" defaultValue={s.supportPhone} />
            <Field label="WhatsApp link" name="whatsapp" defaultValue={s.whatsapp} />
            <Field label="Instagram link" name="instagram" defaultValue={s.instagram} />
          </div>
        </Card>

        <SubmitButton>Save settings</SubmitButton>
      </form>
    </>
  );
}
