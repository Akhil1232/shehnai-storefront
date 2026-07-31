/**
 * Shared between server and client, so it must not import anything Node-only.
 *
 * Uploaded images are served by nginx from outside the project directory.
 * next/image's optimizer only reads from `public/`, so anything under this
 * prefix has to bypass it — see the note in components/ui/ProductMedia.tsx.
 */
export const UPLOAD_URL_PREFIX_PUBLIC = "/uploads/";

export const isUploadedImage = (url?: string | null): boolean =>
  !!url && url.startsWith(UPLOAD_URL_PREFIX_PUBLIC);
