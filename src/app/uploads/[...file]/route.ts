import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_DIR } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * =============================================================================
 * SERVES UPLOADED IMAGES
 * =============================================================================
 * A plain Node route handler that reads a file off disk and streams it back.
 *
 * WHY THIS EXISTS
 * Uploads live at /var/www/shehnai/uploads, outside the project, so a deploy or
 * a fresh git clone never wipes customer images. But that also puts them
 * outside `public/`, which is the only place Next serves static files from.
 *
 * The obvious fix is an nginx `location /uploads/` block. That works, but it
 * means the app only functions when nginx is configured to match — and certbot
 * rewrites that config, so the two drift apart. Serving through Node instead
 * makes the app self-contained: it behaves the same in dev, in production, and
 * on any host, with no web-server configuration at all.
 *
 * nginx can still be pointed at the same directory later as a pure speed
 * optimisation. If that block exists, nginx answers first and this handler is
 * never reached. Nothing breaks either way — that is the point.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params;

  /**
   * Path traversal guard. A request for /uploads/../../etc/passwd must not
   * escape the upload directory. Two defences, because one is never enough:
   *   1. basename() on the last segment discards any directory part.
   *   2. the resolved path is checked to still sit inside UPLOAD_DIR.
   */
  const name = path.basename(file[file.length - 1] ?? "");
  const full = path.resolve(UPLOAD_DIR, name);
  if (!full.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(name).toLowerCase();
  const type = CONTENT_TYPES[ext];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(full);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;

    return new Response(stream, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        // Filenames are random and content never changes, so these can be
        // cached forever. Replacing an image produces a new filename.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
