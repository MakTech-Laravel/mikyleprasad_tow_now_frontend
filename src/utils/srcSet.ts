import type { Breakpoint, ImageLoader, CDNProvider } from "@/components/image/image.types";

// ─── Default width buckets (mirrors Next.js) ─────────────────────────────────
export const DEFAULT_DEVICE_SIZES = [
  640, 750, 828, 1080, 1200, 1920, 2048, 3840,
];
export const DEFAULT_IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];

// ─── Built-in CDN loaders ─────────────────────────────────────────────────────

export function cloudinaryLoader(baseURL: string): ImageLoader {
  return ({ src, width, quality = 75 }) => {
    const params = `f_auto,c_limit,w_${width},q_${quality}`;
    const cloudName = baseURL.replace(/\/$/, "");
    return `https://res.cloudinary.com/${cloudName}/image/upload/${params}/${src}`;
  };
}

export function imgixLoader(baseURL: string): ImageLoader {
  return ({ src, width, quality = 75 }) => {
    const base = baseURL.replace(/\/$/, "");
    const cleanSrc = src.startsWith("/") ? src : `/${src}`;
    return `${base}${cleanSrc}?auto=format&fit=max&w=${width}&q=${quality}`;
  };
}

export function bunnyLoader(baseURL: string): ImageLoader {
  return ({ src, width, quality = 75 }) => {
    const base = baseURL.replace(/\/$/, "");
    const cleanSrc = src.startsWith("/") ? src : `/${src}`;
    return `${base}${cleanSrc}?width=${width}&quality=${quality}&format=auto`;
  };
}

export function defaultLoader({ src, width, quality = 75 }: { src: string; width: number; quality?: number }): string {
  // Attempt Vite's built-in image optimizer query params when available
  // Falls back to the raw src for simple cases
  if (src.startsWith("http") || src.startsWith("//")) {
    return src; // external URLs — no transformation
  }
  // local assets: append hint params (stripped by most bundlers unless you use
  // a vite-plugin-image-optimizer that reads them)
  return `${src}?w=${width}&q=${quality}`;
}

// ─── Loader resolver ──────────────────────────────────────────────────────────

export function resolveLoader(
  cdn: CDNProvider = "none",
  cdnBaseURL = "",
  customLoader?: ImageLoader
): ImageLoader {
  if (customLoader) return customLoader;
  switch (cdn) {
    case "cloudinary":
      return cloudinaryLoader(cdnBaseURL);
    case "imgix":
      return imgixLoader(cdnBaseURL);
    case "bunny":
      return bunnyLoader(cdnBaseURL);
    default:
      return defaultLoader;
  }
}

// ─── srcSet builder ───────────────────────────────────────────────────────────

export function buildSrcSet(
  src: string,
  widths: number[],
  loader: ImageLoader,
  quality: number
): string {
  return widths
    .map((w) => `${loader({ src, width: w, quality })} ${w}w`)
    .join(", ");
}

// ─── sizes string builder ─────────────────────────────────────────────────────

export function buildSizes(sizes: Breakpoint[] | string | undefined): string {
  if (!sizes) return "100vw";
  if (typeof sizes === "string") return sizes;

  return sizes
    .map((bp) => {
      if (bp.maxWidth !== undefined) {
        return `(max-width: ${bp.maxWidth}px) ${bp.size}`;
      }
      if (bp.minWidth !== undefined) {
        return `(min-width: ${bp.minWidth}px) ${bp.size}`;
      }
      return bp.size; // no condition = default (last entry)
    })
    .join(", ");
}

// ─── Pick widths appropriate for the intrinsic width ──────────────────────────

export function getAllWidths(
  width: number | undefined,
  deviceSizes: number[],
  imageSizes: number[]
): number[] {
  if (!width) return deviceSizes;

  const allSizes = [...imageSizes, ...deviceSizes].sort((a, b) => a - b);

  // Filter to widths that are <= 2× intrinsic (no upscaling beyond 2×)
  const maxWidth = width * 2;
  return allSizes.filter((w) => w <= maxWidth);
}