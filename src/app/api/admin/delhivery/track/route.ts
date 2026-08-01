import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { trackShipment } from "@/lib/delhivery";

export const runtime = "nodejs";

/** Admin-only. Fetched on demand from the order detail page — not polled. */
export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const waybill = new URL(req.url).searchParams.get("waybill");
  if (!waybill) return NextResponse.json({ error: "Missing waybill" }, { status: 400 });

  try {
    const status = await trackShipment(waybill);
    return NextResponse.json({ status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tracking failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
