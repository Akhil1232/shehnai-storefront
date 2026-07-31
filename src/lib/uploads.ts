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
