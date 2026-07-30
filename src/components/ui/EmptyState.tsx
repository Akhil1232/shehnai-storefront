import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { btn, btnSm, cx } from "@/lib/styles";

/** Every dead end gets an explanation and a way out. */
export default function EmptyState({
  icon = "box", title, body, action,
}: {
  icon?: IconName; title: string; body?: string;
  action?: { label: string; href: string } | { label: string; onClick: () => void };
}) {
  return (
    <div className="px-5 py-16 text-center">
      <Icon name={icon} className="mx-auto mb-4 h-14 w-14 stroke-gold [stroke-width:1.2]" />
      <h3 className="text-[19px]">{title}</h3>
      {body && <p className="mx-auto mt-1.5 max-w-[42ch] text-[13.5px] text-muted">{body}</p>}
      {action && (
        <div className="mt-4">
          {"href" in action
            ? <Link href={action.href} className={cx(btn.line, btnSm)}>{action.label}</Link>
            : <button onClick={action.onClick} className={cx(btn.line, btnSm)}>{action.label}</button>}
        </div>
      )}
    </div>
  );
}
