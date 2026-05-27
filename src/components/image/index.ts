// ─── Primary component ────────────────────────────────────────────────────────
export { default } from "@/components/image/image";
export { default as Image } from "@/components/image/image";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ImageProps,
  ImageLoader,
  ImageLoaderProps,
  ImageLoadingState,
  PlaceholderType,
  ObjectFit,
  ObjectPosition,
  Breakpoint,
  CDNProvider,
} from "@/components/image/image.types";

// ─── Hooks (consumers may want these) ────────────────────────────────────────
export { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
export { useImageLoader } from "@/hooks/useImageLoader";

// ─── Utilities (useful for SSR LQIP generation, CDN URLs, etc.) ───────────────
export {
  buildSrcSet,
  buildSizes,
  getAllWidths,
  resolveLoader,
  cloudinaryLoader,
  imgixLoader,
  bunnyLoader,
  defaultLoader,
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
} from "@/utils/srcSet";

export {
  shimmerToDataURL,
  injectPreloadLink,
  injectShimmerCSS,
} from "@/utils/placeholder";