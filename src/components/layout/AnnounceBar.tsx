export default function AnnounceBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="truncate border-b border-[color:var(--line-gold)] bg-maroon px-4 py-2 text-center text-[9.5px] uppercase tracking-[0.14em] text-[#F3E3C8] sm:py-[9px] sm:text-[10.5px] sm:tracking-[0.18em]">
      {text}
    </div>
  );
}
