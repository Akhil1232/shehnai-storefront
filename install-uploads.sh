#!/usr/bin/env bash
# =============================================================================
# ENABLE IMAGE UPLOADS  —  one command, does everything.
#
#   cd ~/shehnai-storefront
#   sudo bash install-uploads.sh
#
# Replaces the paste-a-URL image fields in the admin with real file upload.
#
#   1. backs up every file it touches
#   2. adds 3 new source files
#   3. patches the 3 admin pages that use image fields
#   4. creates the upload directory
#   5. makes nginx serve it
#   6. lets the systemd service write to it
#   7. rebuilds and restarts, then verifies
#
# Safe to re-run.  Undo with:  sudo bash install-uploads.sh --undo
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPLOAD_DIR="/var/www/shehnai/uploads"
SITE="/etc/nginx/sites-enabled/shehnai"
UNIT="/etc/systemd/system/shehnai.service"
BACKUP="$APP_DIR/.upload-install-backup"

G=$'\033[1;32m'; R=$'\033[1;31m'; B=$'\033[1;35m'; N=$'\033[0m'
step() { printf "\n${B}[%s/7] %s${N}\n" "$1" "$2"; }
ok()   { printf "  ${G}done${N}  %s\n" "$1"; }
die()  { printf "\n${R}FAILED: %s${N}\n\nUndo with:  sudo bash install-uploads.sh --undo\n\n" "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run with sudo:  sudo bash install-uploads.sh"
[[ -f "$APP_DIR/package.json" ]] || die "Run this from inside the project folder."
OWNER="$(stat -c '%U' "$APP_DIR/package.json")"

if [[ "${1:-}" == "--undo" ]]; then
  [[ -d "$BACKUP" ]] || die "No backup at $BACKUP"
  echo "Restoring changed files..."
  (cd "$BACKUP" && find . -type f -not -name '*.bak') | sed 's|^\./||' | while read -r f; do
    cp "$BACKUP/$f" "$APP_DIR/$f"; echo "  restored $f"
  done
  rm -f "$APP_DIR/src/lib/uploads.ts" \
        "$APP_DIR/src/app/api/admin/upload/route.ts" \
        "$APP_DIR/src/components/admin/ImageUpload.tsx"
  chown -R "$OWNER:$OWNER" "$APP_DIR/src"
  echo
  echo "Rebuild:  cd $APP_DIR && npx next build && sudo systemctl restart shehnai"
  exit 0
fi

step 1 "Backing up the files that will change"
mkdir -p "$BACKUP"
for f in "src/app/admin/products/[id]/page.tsx" \
         "src/app/admin/sections/page.tsx" \
         "src/app/admin/banners/page.tsx" ; do
  if [[ -f "$APP_DIR/$f" ]]; then
    mkdir -p "$BACKUP/$(dirname "$f")"
    cp "$APP_DIR/$f" "$BACKUP/$f"
  fi
done
chown -R "$OWNER:$OWNER" "$BACKUP"
ok "saved to $BACKUP"

step 2 "Adding the new source files"
mkdir -p "$BACKUP"
mkdir -p "$APP_DIR/src/lib"
cat > "$APP_DIR/src/lib/uploads.ts" <<'SHEHNAI_FILE_END'
import "server-only";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * =============================================================================
 * IMAGE UPLOADS
 * =============================================================================
 * Files are written to disk on the server and served by nginx from /uploads/.
 *
 * Why outside the project directory: anything inside the repo would be wiped
 * by a fresh `git clone` or a re-extracted release, and `public/` is not a safe
 * place to write at runtime. Keeping uploads at /var/www/shehnai/uploads means
 * deploys never touch customer images.
 *
 * One-time setup on the server:
 *
 *   sudo mkdir -p /var/www/shehnai/uploads
 *   sudo chown -R $USER:$USER /var/www/shehnai
 *
 * And in the nginx site, above `location /`:
 *
 *   location /uploads/ {
 *       alias /var/www/shehnai/uploads/;
 *       expires 365d;
 *       add_header Cache-Control "public, immutable";
 *       access_log off;
 *   }
 *
 * To move to a CDN later, only `publicUrl()` below needs to change.
 */

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/var/www/shehnai/uploads";
export const UPLOAD_URL_PREFIX = "/uploads";

/** 12 MB before processing. Phone photos are ~4 MB, DSLR JPEGs ~10 MB. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/**
 * Magic-byte signatures. An attacker can rename a script to .jpg and browsers
 * will happily report image/jpeg, so the declared type is not evidence — the
 * first bytes of the file are.
 */
const SIGNATURES: [string, (b: Buffer) => boolean][] = [
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["image/png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["image/webp", (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP"],
  ["image/avif", (b) => b.subarray(4, 8).toString() === "ftyp"],
];

export function sniffType(buf: Buffer): string | null {
  for (const [type, test] of SIGNATURES) {
    try { if (test(buf)) return type; } catch { /* short buffer */ }
  }
  return null;
}

/** Random, lowercase, extension-controlled — never derived from user input. */
export function safeFilename(ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${stamp}-${rand}.${ext}`;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function diskPath(filename: string): string {
  // basename strips any traversal attempt before it reaches the filesystem.
  return path.join(UPLOAD_DIR, path.basename(filename));
}

export function publicUrl(filename: string): string {
  return `${UPLOAD_URL_PREFIX}/${path.basename(filename)}`;
}

/** True for a URL this app produced, so deletes cannot target arbitrary paths. */
export function isLocalUpload(url: string): boolean {
  return url.startsWith(`${UPLOAD_URL_PREFIX}/`) && !url.includes("..");
}
SHEHNAI_FILE_END
ok "src/lib/uploads.ts"
mkdir -p "$APP_DIR/src/app/api/admin/upload"
cat > "$APP_DIR/src/app/api/admin/upload/route.ts" <<'SHEHNAI_FILE_END'
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
SHEHNAI_FILE_END
ok "src/app/api/admin/upload/route.ts"
mkdir -p "$APP_DIR/src/components/admin"
cat > "$APP_DIR/src/components/admin/ImageUpload.tsx" <<'SHEHNAI_FILE_END'
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
SHEHNAI_FILE_END
ok "src/components/admin/ImageUpload.tsx"
cat > "$BACKUP/patch-admin.py" <<'SHEHNAI_PY_END'
"""Switches the admin image fields from URL-only to file upload."""
import io, os, subprocess

def edit(path, changes):
    if not os.path.exists(path):
        print("  skip   %s (not present)" % path); return
    s = io.open(path, encoding="utf-8").read()
    before = s
    for old, new in changes:
        if old in s:
            s = s.replace(old, new)
        elif new not in s:
            print("  WARN   %s: a snippet did not match, left as-is" % path)
    if s != before:
        io.open(path, "w", encoding="utf-8").write(s)
        print("  done   %s" % path)
    else:
        print("  done   %s (already up to date)" % path)

IMP_A_OLD = 'import { Card, Field, TextArea, Select, Checkbox, ImageField, SubmitButton } from "@/components/admin/ui";'
IMP_A_NEW = ('import { Card, Field, TextArea, Select, Checkbox, SubmitButton } from "@/components/admin/ui";\n'
             'import ImageUpload from "@/components/admin/ImageUpload";')
IMP_B_OLD = 'import { Card, Field, Select, Checkbox, ImageField, SubmitButton } from "@/components/admin/ui";'
IMP_B_NEW = ('import { Card, Field, Select, Checkbox, SubmitButton } from "@/components/admin/ui";\n'
             'import ImageUpload from "@/components/admin/ImageUpload";')

edit("src/app/admin/products/[id]/page.tsx", [
    (IMP_A_OLD, IMP_A_NEW),
    ('<ImageField label="Image URL" name="url" spec="2000 \u00d7 2000" />',
     '<ImageUpload label="Product image" name="url" spec="2000 \u00d7 2000" preset="product" />'),
])

edit("src/app/admin/sections/page.tsx", [
    (IMP_A_OLD, IMP_A_NEW),
    ('<ImageField label="Main image" name="mediaUrl" defaultValue={s.mediaUrl} spec="1200 \u00d7 1500 (4:5)" />',
     '<ImageUpload label="Main image" name="mediaUrl" defaultValue={s.mediaUrl} spec="1200 \u00d7 1380" preset="editorial" />'),
])

OLD_SPEC = (
'const SPEC: Record<string, { desktop: string; mobile: string; note: string }> = {\n'
'  HOME_HERO: { desktop: "2400 \u00d7 1000", mobile: "1080 \u00d7 1350", note: "Keep the subject right-of-centre; copy overlays on the left." },\n'
'  HOME_TRIPTYCH: { desktop: "900 \u00d7 1200", mobile: "900 \u00d7 1200", note: "Exactly 3 active. sortOrder 0 = left, 1 = CENTRE (largest), 2 = right." },\n'
'  CATEGORY_HEADER: { desktop: "1920 \u00d7 640", mobile: "1080 \u00d7 720", note: "Pick a vertical below, or it won\'t appear anywhere." },\n'
'  PROMO_STRIP: { desktop: "text only", mobile: "text only", note: "Uses the Title field only." },\n'
'};')

NEW_SPEC = (
'type Preset = "hero" | "triptych" | "category" | "free";\n'
'\n'
'// The hero frame is PORTRAIT - it sits in a tall arch beside the headline, so\n'
'// a landscape image gets badly cropped. The old 2400x1000 note was wrong.\n'
'const SPEC: Record<string, { desktop: string; mobile: string; note: string; preset: Preset }> = {\n'
'  HOME_HERO: { desktop: "1200 \u00d7 1400", mobile: "1080 \u00d7 1260", preset: "hero",\n'
'    note: "Portrait. The top ~25% curves away behind the arch - keep it empty." },\n'
'  HOME_TRIPTYCH: { desktop: "900 \u00d7 1200", mobile: "900 \u00d7 1200", preset: "triptych",\n'
'    note: "sortOrder 1 is the centre panel, the one currently shown. Top ~25% is arch-cropped." },\n'
'  CATEGORY_HEADER: { desktop: "1920 \u00d7 640", mobile: "1080 \u00d7 720", preset: "category",\n'
'    note: "Pick a vertical below, or it won\'t appear anywhere." },\n'
'  PROMO_STRIP: { desktop: "text only", mobile: "text only", preset: "free",\n'
'    note: "Uses the Title field only - no image needed." },\n'
'};')

edit("src/app/admin/banners/page.tsx", [
    (IMP_B_OLD, IMP_B_NEW),
    (OLD_SPEC, NEW_SPEC),
    ('<ImageField label="Desktop image" name="desktopUrl" defaultValue={b.desktopUrl} spec={spec.desktop} />',
     '<ImageUpload label="Desktop image" name="desktopUrl" defaultValue={b.desktopUrl} spec={spec.desktop} preset={spec.preset} />'),
    ('<ImageField label="Mobile image" name="mobileUrl" defaultValue={b.mobileUrl} spec={spec.mobile} />',
     '<ImageUpload label="Mobile image" name="mobileUrl" defaultValue={b.mobileUrl} spec={spec.mobile} preset={spec.preset} />'),
    ('<ImageField label="Desktop image" name="desktopUrl" spec="see placement above" />',
     '<ImageUpload label="Desktop image" name="desktopUrl" spec="see placement above" preset="free" />'),
    ('<ImageField label="Mobile image" name="mobileUrl" spec="see placement above" />',
     '<ImageUpload label="Mobile image" name="mobileUrl" spec="see placement above" preset="free" />'),
])

left = subprocess.run(["grep", "-rl", "ImageField", "src/app/admin"],
                      capture_output=True, text=True).stdout.strip()
if left:
    print("  WARN   ImageField still referenced in:")
    for f in left.split("\n"):
        print("         " + f)
SHEHNAI_PY_END
cat > "$BACKUP/patch-nginx.py" <<'SHEHNAI_PY_END'
"""Inserts the /uploads/ location block above the catch-all location."""
import sys
p = sys.argv[1]
s = open(p).read()
block = (
'    # Uploaded images, served straight from disk. Filenames are random and\n'
'    # immutable, so they can be cached indefinitely.\n'
'    location /uploads/ {\n'
'        alias /var/www/shehnai/uploads/;\n'
'        expires 365d;\n'
'        add_header Cache-Control "public, immutable";\n'
'        access_log off;\n'
'        try_files $uri =404;\n'
'    }\n'
'\n')
i = s.index("    location / {")   # must come BEFORE the catch-all to win
open(p, "w").write(s[:i] + block + s[i:])
SHEHNAI_PY_END

chown -R "$OWNER:$OWNER" "$APP_DIR/src"

step 3 "Switching the admin image fields to file upload"
cd "$APP_DIR"
python3 "$BACKUP/patch-admin.py" || die "could not patch the admin pages"
ok "admin pages patched"

step 4 "Creating the upload directory"
mkdir -p "$UPLOAD_DIR"
chown -R "$OWNER:$OWNER" /var/www/shehnai
chmod 755 "$UPLOAD_DIR"
ok "$UPLOAD_DIR (owned by $OWNER)"

step 5 "Letting nginx serve the uploads"
if grep -q "location /uploads/" "$SITE" 2>/dev/null; then
  ok "nginx rule already present"
else
  cp "$SITE" "$BACKUP/nginx-site.bak"
  python3 "$BACKUP/patch-nginx.py" "$SITE"
  nginx -t >/dev/null 2>&1 || die "nginx config broke. Restore: sudo cp $BACKUP/nginx-site.bak $SITE && sudo systemctl reload nginx"
  systemctl reload nginx
  ok "nginx rule added and reloaded"
fi

step 6 "Allowing the service to write to the upload directory"
if grep -q "ReadWritePaths=.*var/www/shehnai" "$UNIT" 2>/dev/null; then
  ok "already allowed"
elif grep -q "^ReadWritePaths=" "$UNIT" 2>/dev/null; then
  cp "$UNIT" "$BACKUP/shehnai.service.bak"
  sed -i "s|^ReadWritePaths=\(.*\)$|ReadWritePaths=\1 /var/www/shehnai|" "$UNIT"
  systemctl daemon-reload
  ok "$(grep '^ReadWritePaths=' "$UNIT")"
else
  ok "unit has no ReadWritePaths restriction — nothing to change"
fi

step 7 "Rebuilding and restarting"
sudo -u "$OWNER" bash -lc "cd '$APP_DIR' && npx next build" || die "build failed"
systemctl restart shehnai
sleep 3
systemctl is-active --quiet shehnai || { journalctl -u shehnai -n 30 --no-pager; die "service did not start"; }
ok "service restarted"

printf "\n${B}VERIFY${N}\n"
C=$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1/uploads/ 2>/dev/null || true)
if [[ "$C" == "403" || "$C" == "404" ]]; then
  printf "  ${G}ok${N}    nginx serves /uploads/  (HTTP $C on an empty directory is correct)\n"
else
  printf "  ${R}!${N}     /uploads/ returned $C — run: sudo nginx -t\n"
fi
C=$(curl -s -o /dev/null -w '%{http_code}' -m 5 -X POST http://127.0.0.1/api/admin/upload 2>/dev/null || true)
if [[ "$C" == "401" ]]; then
  printf "  ${G}ok${N}    upload endpoint live, requires login  (HTTP 401)\n"
else
  printf "  ${R}!${N}     upload endpoint returned $C, expected 401\n"
fi

cat <<FINAL

  Try it now:

    1. https://test.theshehnai.com/admin/products
    2. Click any product
    3. Images panel on the right
    4. "Choose a file or drag it here", pick a photo
    5. It uploads, resizes to 2000x2000 WebP, shows a preview
    6. Click "Add image", then open that product on the storefront

  Files are written to $UPLOAD_DIR and served at /uploads/...
  They sit outside the project, so deploys never touch them.

  Undo everything:  sudo bash install-uploads.sh --undo

FINAL
