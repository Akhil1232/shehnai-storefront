"use client";

import { useRef, useState } from "react";

/**
 * File picker that uploads immediately and stores the resulting URL in a hidden
 * input, so the surrounding server action keeps working unchanged — it still
 * just reads a string from the form.
 *
 * Pasting a URL still works, for images already hosted elsewhere.
 */
export default function ImageUpload({
  label,
  name,
  defaultValue,
  spec,
  preset = "free",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  /** Human-readable size shown on the field, e.g. "2000 × 2000". */
  spec: string;
  /** Server-side resize preset — see PRESETS in api/admin/upload. */
  preset?: "product" | "hero" | "triptych" | "category" | "tile" | "editorial" | "free";
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("preset", preset);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");

      setUrl(data.url);
      setNote(
        `${data.width}×${data.height}, ${(data.bytes / 1024).toFixed(0)} KB ` +
        `(from ${(data.savedFrom / 1048576).toFixed(1)} MB)`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="block">
      <span className="mb-1 flex flex-wrap items-baseline gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink">{label}</span>
        <span className="rounded bg-[#EFE3CB] px-1.5 py-0.5 text-[10.5px] font-semibold text-maroon">{spec}</span>
      </span>

      {/* The server action reads this. Everything else is just UI. */}
      <input type="hidden" name={name} value={url} />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded border-2 border-dashed p-3 transition-colors ${
          dragging ? "border-gold bg-[#FCF8EF]" : "border-[color:var(--line)] bg-white"
        }`}
      >
        {url ? (
          <div className="flex items-start gap-3">
            {/* Plain img, not next/image: the URL changes on every upload and
                this is an admin preview, not a page asset worth optimising. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-20 flex-none rounded border border-[color:var(--line)] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="break-all text-[11px] text-[color:var(--muted)]">{url}</p>
              {note && <p className="mt-0.5 text-[11px] text-green-700">{note}</p>}
              <div className="mt-1.5 flex gap-3">
                <button type="button" onClick={() => inputRef.current?.click()}
                        className="text-[11.5px] font-semibold text-maroon">Replace</button>
                <button type="button" onClick={() => { setUrl(""); setNote(null); }}
                        className="text-[11.5px] text-[color:var(--muted)] hover:text-red-700">Clear</button>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
                  className="w-full py-4 text-center disabled:opacity-60">
            <span className="block text-[13px] font-semibold text-ink">
              {busy ? "Uploading…" : "Choose a file or drag it here"}
            </span>
            <span className="mt-0.5 block text-[11px] text-[color:var(--muted)]">
              JPEG, PNG, WebP or AVIF · up to 12 MB · resized and converted automatically
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />

      {error && <p className="mt-1 text-[11.5px] font-semibold text-red-700">{error}</p>}

      <details className="mt-1">
        <summary className="cursor-pointer text-[11px] text-[color:var(--muted)]">
          or paste a URL
        </summary>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded border border-[color:var(--line)] bg-white px-3 py-2 text-[13px]"
        />
      </details>
    </div>
  );
}
