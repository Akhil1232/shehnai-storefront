import Image from "next/image";
import JewelArt from "./JewelArt";
import { UPLOAD_URL_PREFIX_PUBLIC } from "@/lib/image-source";

/**
 * One place that decides how a product is pictured: the uploaded photograph if
 * there is one, otherwise a concept render. Every grid, gallery, cart line and
 * rail goes through this, so the fallback stays consistent.
 */
export default function ProductMedia({
  url, alt, seed, category,
  sizes = "(max-width:640px) 50vw, 25vw",
  priority = false,
}: {
  url?: string | null;
  alt: string;
  seed: string;
  category?: string | null;
  sizes?: string;
  priority?: boolean;
}) {
  if (!url) return <JewelArt seed={seed} category={category} />;

  /**
   * WHY `unoptimized` FOR UPLOADS
   *
   * next/image normally routes an image through Next's optimizer, which reads
   * the file from the `public/` folder on disk. Our uploads are NOT in public/
   * — they live at /var/www/shehnai/uploads and are served by nginx. The
   * optimizer cannot find them there, returns 404, and the browser shows a
   * broken-image icon (with the alt text visible).
   *
   * `unoptimized` skips the optimizer and emits a plain <img src="/uploads/…">,
   * which nginx serves directly. Nothing is lost: the upload endpoint already
   * resized the file and converted it to WebP with sharp, so a second pass
   * would only add CPU work.
   */
  const isUpload = url.startsWith(UPLOAD_URL_PREFIX_PUBLIC);

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isUpload}
      className="object-cover"
    />
  );
}
