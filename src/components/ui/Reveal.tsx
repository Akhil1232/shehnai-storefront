"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/styles";

/** Fades content up once as it enters the viewport. */
export default function Reveal({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.unobserve(el); } },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className={cx("reveal", className)}>{children}</div>;
}
