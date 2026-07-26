"use client";

import { useFormStatus } from "react-dom";

/** Shared admin form primitives. Plain, dense, functional — this is a tool. */

export function SubmitButton({ children = "Save", variant = "primary" }: { children?: React.ReactNode; variant?: "primary" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 ${
        variant === "danger" ? "bg-red-700 hover:bg-red-800" : "bg-ink hover:bg-maroon"
      }`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function Field({
  label, name, defaultValue, type = "text", hint, required, placeholder, step,
}: {
  label: string; name: string; defaultValue?: string | number | null;
  type?: string; hint?: string; required?: boolean; placeholder?: string; step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded border border-[color:var(--line)] bg-white px-3 py-2 text-[13.5px]"
      />
      {hint && <span className="mt-1 block text-[11px] text-[color:var(--muted)]">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 4, hint }: {
  label: string; name: string; defaultValue?: string | null; rows?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded border border-[color:var(--line)] bg-white px-3 py-2 text-[13.5px]"
      />
      {hint && <span className="mt-1 block text-[11px] text-[color:var(--muted)]">{hint}</span>}
    </label>
  );
}

export function Select({ label, name, defaultValue, options, hint }: {
  label: string; name: string; defaultValue?: string | null;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded border border-[color:var(--line)] bg-white px-3 py-2 text-[13.5px]"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <span className="mt-1 block text-[11px] text-[color:var(--muted)]">{hint}</span>}
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 py-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#8A2226]" />
      <span className="text-[13px]">{label}</span>
    </label>
  );
}

/**
 * Image URL input that states the required dimensions right on the field —
 * so nobody has to go looking for the spec.
 */
export function ImageField({ label, name, defaultValue, spec }: {
  label: string; name: string; defaultValue?: string | null; spec: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex flex-wrap items-baseline gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink">{label}</span>
        <span className="rounded bg-[#EFE3CB] px-1.5 py-0.5 text-[10.5px] font-semibold text-maroon">{spec}</span>
      </span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder="https://res.cloudinary.com/…"
        className="w-full rounded border border-[color:var(--line)] bg-white px-3 py-2 text-[13px]"
      />
    </label>
  );
}

export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="mb-5 rounded border border-[color:var(--line)] bg-white">
      {title && (
        <header className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-2.5">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.12em]">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
