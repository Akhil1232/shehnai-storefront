import { Icon, type IconName } from "@/components/ui/icons";

const ITEMS: [IconName, string, string][] = [
  ["shield", "Premium Quality", "Checked before packing"],
  ["truck", "Dispatch in 2–3 Days", "Tracking shared on dispatch"],
  ["swap", "Replacement Support", "With an unboxing video"],
  ["cash", "Cash on Delivery", "On most PIN codes"],
];

export default function TrustRow() {
  return (
    <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 md:gap-6">
      {ITEMS.map(([icon, title, sub]) => (
        <div key={title}>
          <Icon name={icon} className="mx-auto mb-2 h-6 w-6 text-gold-deep" />
          <b className="block font-serif text-base font-semibold md:text-[16.5px]">{title}</b>
          <span className="hidden text-[11.5px] text-muted sm:block">{sub}</span>
        </div>
      ))}
    </div>
  );
}
