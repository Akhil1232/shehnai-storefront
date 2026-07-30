import { Fragment } from "react";
import { cx } from "@/lib/styles";

const STEPS = ["Bag", "Address & Payment", "Done"];

/** Bag -> Address & Payment -> Done. Removes the "how much longer" anxiety. */
export default function StepBar({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4" aria-label={`Step ${current} of 3`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const on = n === current;
        return (
          <Fragment key={label}>
            {i > 0 && <span className="h-px w-6 bg-line md:w-12" />}
            <span className={cx(
              "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]",
              on ? "text-maroon" : done ? "text-forest" : "text-faint"
            )}>
              <span className={cx(
                "grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] text-[10.5px]",
                on ? "border-maroon bg-maroon text-white"
                   : done ? "border-forest bg-forest text-white"
                          : "border-line bg-paper"
              )}>
                {done ? "\u2713" : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
