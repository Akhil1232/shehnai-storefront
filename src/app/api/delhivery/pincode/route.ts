import { NextResponse } from "next/server";
import { checkServiceability } from "@/lib/delhivery";

export const runtime = "nodejs";

/** Public. Powers the "check delivery to your PIN code" widget on the PDP. */
export async function GET(req: Request) {
  const pincode = (new URL(req.url).searchParams.get("pincode") ?? "").replace(/\D/g, "");
  if (pincode.length !== 6) {
    return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
  }

  try {
    const result = await checkServiceability(pincode);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not check delivery availability.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
