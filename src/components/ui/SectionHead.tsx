import Rule from "./Rule";

export default function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow?: string | null;
  title: string;
  sub?: string | null;
  align?: "center" | "left";
}) {
  const centred = align === "center";
  return (
    <div className={centred ? "mx-auto mb-1 max-w-[640px] text-center" : "text-left"}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="my-2 text-[clamp(26px,3.2vw,38px)] tracking-[0.01em]">{title}</h2>
      {sub && <p className="text-[14.5px] text-[color:var(--muted)]">{sub}</p>}
      {centred && <Rule className="mt-3" />}
    </div>
  );
}
