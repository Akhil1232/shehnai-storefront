export default function AnnounceBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="border-b border-[color:var(--line-gold)] bg-maroon px-4 py-[9px] text-center text-[10.5px] uppercase tracking-[0.18em] text-[#F3E3C8]">
      {text}
    </div>
  );
}
