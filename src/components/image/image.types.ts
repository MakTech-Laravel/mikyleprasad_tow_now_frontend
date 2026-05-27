import type { CSSProperties, ImgHTMLAttributes, ReactElement } from "react";

// ─── Loader Types ───────────────────────────────────────────────────────────
export type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

export type ImageLoader = (props: ImageLoaderProps) => string;

// ─── Layout & Fit ────────────────────────────────────────────────────────────
export type ObjectFit = "contain" | "cover" | "fill" | "none" | "scale-down";
export type ObjectPosition = CSSProperties["objectPosition"];

// ─── Placeholder ─────────────────────────────────────────────────────────────
export type PlaceholderType = "blur" | "shimmer" | "color" | "empty";

// ─── Loading State ───────────────────────────────────────────────────────────
export type ImageLoadingState = "idle" | "loading" | "loaded" | "error";

// ─── Breakpoint for Responsive ───────────────────────────────────────────────
export type Breakpoint = {
  /** Max viewport width in px */
  maxWidth?: number;
  /** Min viewport width in px */
  minWidth?: number;
  /** Image display width at this breakpoint (e.g. "100vw", "50vw", "400px") */
  size: string;
};

// ─── CDN Presets ─────────────────────────────────────────────────────────────
export type CDNProvider = "cloudinary" | "imgix" | "bunny" | "custom" | "none";

// ─── Main Props ──────────────────────────────────────────────────────────────
export interface ImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    | "src"
    | "srcSet"
    | "width"
    | "height"
    | "loading"
    | "placeholder"
    | "sizes"   // overridden below to accept Breakpoint[] | string
    | "onLoad"
    | "onError"
  > {
  // ─── Required ──────────────────────────────────────────────────────────────
  /** Image source URL */
  src: string;
  /** Accessible description — never skip this */
  alt: string;

  // ─── Sizing ────────────────────────────────────────────────────────────────
  /** Intrinsic width in px. Required unless fill=true */
  width?: number;
  /** Intrinsic height in px. Required unless fill=true */
  height?: number;
  /**
   * When true, the image stretches to fill its parent container.
   * Parent must have `position: relative | absolute | fixed`.
   */
  fill?: boolean;

  // ─── Performance / Loading ─────────────────────────────────────────────────
  /**
   * Marks image as high-priority.
   * - Sets loading="eager" and fetchpriority="high"
   * - Injects a <link rel="preload"> in <head> automatically
   * - Skip lazy-loading
   */
  priority?: boolean;
  /**
   * Image quality 1–100 (used by loaders that support it).
   * @default 75
   */
  quality?: number;
  /**
   * Array of widths to pre-generate in the srcSet.
   * @default [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
   */
  deviceSizes?: number[];
  /**
   * Fine-grained widths for small images / icons.
   * @default [16, 32, 48, 64, 96, 128, 256, 384]
   */
  imageSizes?: number[];
  /**
   * HTML sizes attribute for selecting srcSet entries.
   * Accepts an array of breakpoint rules or a raw string.
   */
  sizes?: Breakpoint[] | string;

  // ─── Placeholder ───────────────────────────────────────────────────────────
  /**
   * Placeholder strategy while the image loads.
   * - "blur"    — blurred preview (requires blurDataURL)
   * - "shimmer" — animated shimmer skeleton (default)
   * - "color"   — flat color fill (set via placeholderColor)
   * - "empty"   — no placeholder
   * @default "shimmer"
   */
  placeholder?: PlaceholderType;
  /**
   * Base-64 encoded LQIP used when placeholder="blur".
   * Generate server-side with sharp, plaiceholder, etc.
   */
  blurDataURL?: string;
  /**
   * Blur radius applied to the blurDataURL preview.
   * @default 20
   */
  blurRadius?: number;
  /**
   * Background color for placeholder="color".
   * @default "#e2e8f0"
   */
  placeholderColor?: string;

  // ─── Layout ────────────────────────────────────────────────────────────────
  /** CSS object-fit value @default "cover" */
  objectFit?: ObjectFit;
  /** CSS object-position value @default "center" */
  objectPosition?: ObjectPosition;
  /**
   * Explicit aspect ratio (e.g. "16/9", "4/3", "1/1").
   * When provided without height, height is inferred.
   */
  aspectRatio?: string;

  // ─── Loader / CDN ──────────────────────────────────────────────────────────
  /**
   * Custom loader function for CDN/image-service URL generation.
   * Receives { src, width, quality } and must return a URL string.
   */
  loader?: ImageLoader;
  /**
   * Built-in CDN preset. Requires the src to be the public ID / path.
   * For "cloudinary" — set cdnBaseURL to your cloud name.
   * For "imgix"      — set cdnBaseURL to your imgix domain.
   * For "bunny"      — set cdnBaseURL to your BunnyCDN pull zone URL.
   */
  cdn?: CDNProvider;
  /** Base URL / cloud name for the selected CDN preset */
  cdnBaseURL?: string;

  // ─── Error Handling ────────────────────────────────────────────────────────
  /**
   * Fallback src shown when the main image fails to load.
   */
  fallbackSrc?: string;
  /**
   * Custom React node rendered instead of a broken-image state.
   */
  fallbackElement?: ReactElement;

  // ─── Intersection / Lazy ───────────────────────────────────────────────────
  /**
   * Margin around the viewport for triggering load (IntersectionObserver rootMargin).
   * @default "200px"
   */
  lazyBoundary?: string;
  /**
   * Root element for IntersectionObserver (defaults to viewport).
   */
  lazyRoot?: Element | null;

  // ─── Callbacks ─────────────────────────────────────────────────────────────
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Called whenever the internal loading state changes */
  onLoadingStateChange?: (state: ImageLoadingState) => void;

  // ─── Misc ──────────────────────────────────────────────────────────────────
  /** Extra className applied to the wrapper div */
  wrapperClassName?: string;
  /** Extra styles applied to the wrapper div */
  wrapperStyle?: CSSProperties;
  /** Disable the srcSet generation (useful for SVGs / GIFs) */
  unoptimized?: boolean;
  /**
   * When true, forces the img element to be rendered without a wrapper.
   * Loses placeholder and fill support.
   */
  unwrapped?: boolean;
}