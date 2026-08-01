"use client";

import { useState } from "react";

export function DelhiveryTrackButton({ waybill }: { waybill: string }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ok"; status: string; at?: string }
  >({ kind: "idle" });

  async function check() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/admin/delhivery/track?waybill=${encodeURIComponent(waybill)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tracking failed.");
      if (!data.status) {
        setState({ kind: "error", message: "No tracking data yet — try again shortly." });
        return;
      }
      setState({ kind: "ok", status: data.status.status, at: data.status.statusDateTime });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Tracking failed." });
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={check}
        disabled={state.kind === "loading"}
        className="rounded border border-[color:var(--line)] px-3 py-1.5 text-[12px] font-semibold hover:bg-[color:var(--line)]/30 disabled:opacity-50"
      >
        {state.kind === "loading" ? "Checking…" : "Check Delhivery status"}
      </button>
      {state.kind === "ok" && (
        <p className="mt-1.5 text-[12.5px]">
          <span className="font-semibold">{state.status}</span>
          {state.at && <span className="text-[color:var(--muted)]"> · {state.at}</span>}
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-1.5 text-[12.5px] text-red-700">{state.message}</p>
      )}
    </div>
  );
}
