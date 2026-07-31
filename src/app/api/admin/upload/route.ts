import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import {
  MAX_UPLOAD_BYTES, ACCEPTED, sniffType, safeFilename,
  ensureUploadDir, diskPath, publicUrl, isLocalUpload,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts an image, normalises it, writes it to disk, returns its URL.
 *
 * Every upload is re-encoded through sharp rather than stored as received.
 * That does three useful things at once: it guarantees the bytes really are an
 * image, it strips EXIF (which can carry GPS coordinates from a phone), and it
 * caps the dimensions so a 40 MP photo does not become a 12 MB page asset.
 */

/** Longest edge per slot. Matches what the storefront actually renders. */
const PRESETS: Record<string, { w: number; h: number; fit: "cover" | "inside" }> = {
  product:   { w: 2000, h: 2000, fit: "cover" },   // 1:1
  hero:      { w: 1200, h: 1400, fit: "cover" },   // 4:4.7 portrait
  triptych:  { w: 900,  h: 1200, fit: "cover" },   // 3:4
  category:  { w: 1920, h: 640,  fit: "cover" },   // 3:1
  tile:      { w: 800,  h: 800,  fit: "cover" },   // 1:1
  editorial: { w: 1200, h: 1380, fit: "cover" },   // 4:4.6
  free:      { w: 2400, h: 2400, fit: "inside" },  // no crop
};

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const preset = String(form.get("preset") ?? "free");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1048576} MB.` },
      { status: 413 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the declared MIME type.
  const actual = sniffType(buf);
  if (!actual || !ACCEPTED.includes(actual as (typeof ACCEPTED)[number])) {
    return NextResponse.json(
      { error: "That does not look like a JPEG, PNG, WebP or AVIF image." },
      { status: 415 }
    );
  }

  const { w, h, fit } = PRESETS[preset] ?? PRESETS.free;

  try {
    const out = await sharp(buf, { failOn: "error" })
      .rotate()                                   // honour EXIF orientation, then drop it
      .resize(w, h, { fit, withoutEnlargement: true, position: "attention" })
      .webp({ quality: 85 })
      .toBuffer();

    await ensureUploadDir();
    const filename = safeFilename("webp");
    await fs.writeFile(diskPath(filename), out);

    const meta = await sharp(out).metadata();
    return NextResponse.json({
      url: publicUrl(filename),
      width: meta.width,
      height: meta.height,
      bytes: out.length,
      savedFrom: buf.length,
    });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Could not process that image." }, { status: 400 });
  }
}

/** Removes a previously uploaded file. Only ever touches our own /uploads/. */
export async function DELETE(req: Request) {
  try {
    await requireAdmin(["OWNER", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!isLocalUpload(url)) {
    return NextResponse.json({ error: "Not an uploaded file." }, { status: 400 });
  }
  try {
    await fs.unlink(diskPath(url.split("/").pop()!));
  } catch { /* already gone */ }
  return NextResponse.json({ ok: true });
}
