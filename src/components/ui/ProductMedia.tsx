import Image from "next/image";
import JewelArt from "./JewelArt";

/**
 * One place that decides how a product is pictured: real photograph if the
 * admin has uploaded one, otherwise a concept render. Every grid, gallery,
 * cart line and rail goes through this, so the fallback is consistent.
 */
export default function ProductMedia({
  url,
  alt,
  seed,
  category,
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
  if (url) {
    return <Image src={url} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return <JewelArt seed={seed} category={category} />;
}
