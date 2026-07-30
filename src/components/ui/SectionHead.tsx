import Rule from "./Rule";
import { cx, eyebrow as eyebrowCls } from "@/lib/styles";

export default function SectionHead({
  eyebrow, title, sub, center = false, rule = false,
}: {
  eyebrow?: string; title: string; sub?: string | null; center?: boolean; rule?: boolean;
}) {
  return (
    <div className={cx("mb-5", center && "mx-auto max-w-[600px] text-center")}>
      {eyebrow && <span className={eyebrowCls}>{eyebrow}</span>}
      <h2 className={cx("my-1.5", center ? "text-h1" : "text-h2")}>{title}</h2>
      {sub && <p className="text-sm text-muted">{sub}</p>}
      {rule && <Rule />}
    </div>
  );
}
