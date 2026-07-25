export default function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto h-[1.5px] w-11 bg-gold ${className}`}>
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold bg-cream" />
    </div>
  );
}
