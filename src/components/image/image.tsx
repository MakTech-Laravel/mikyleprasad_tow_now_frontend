import { forwardRef, useEffect, useImperativeHandle, useMemo, type CSSProperties } from 'react';
import type { ImageProps } from '@/components/image/image.types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useImageLoader } from '@/hooks/useImageLoader';
import {
  buildSrcSet,
  buildSizes,
  getAllWidths,
  resolveLoader,
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
} from '@/utils/srcSet';
import { injectShimmerCSS, injectPreloadLink } from '@/utils/placeholder';

// ─── Inject shimmer CSS once at module load ───────────────────────────────────
if (typeof document !== 'undefined') {
  injectShimmerCSS();
}

// ─── Broken image icon (inline SVG data URL) ──────────────────────────────────
const BROKEN_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>`;

// ─── Component ────────────────────────────────────────────────────────────────

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    // Required
    src,
    alt,
    // Sizing
    width,
    height,
    fill = false,
    // Performance
    priority = false,
    quality = 75,
    deviceSizes = DEFAULT_DEVICE_SIZES,
    imageSizes = DEFAULT_IMAGE_SIZES,
    sizes,
    // Placeholder
    placeholder = 'shimmer',
    blurDataURL,
    blurRadius = 20,
    placeholderColor = '#e2e8f0',
    // Layout
    objectFit = 'cover',
    objectPosition = 'center',
    aspectRatio,
    // Loader / CDN
    loader,
    cdn = 'none',
    cdnBaseURL = '',
    // Error
    fallbackSrc,
    fallbackElement,
    // Lazy
    lazyBoundary = '200px',
    lazyRoot = null,
    // Callbacks
    onLoad,
    onError,
    onLoadingStateChange,
    // Misc
    wrapperClassName,
    wrapperStyle,
    unoptimized = false,
    unwrapped = false,
    className,
    style,
    ...rest
  },
  externalRef,
) {
  // ─── Lazy-load trigger ──────────────────────────────────────────────────────
  const { ref: wrapperRef, isIntersecting } = useIntersectionObserver({
    rootMargin: lazyBoundary,
    root: lazyRoot,
    triggerOnce: true,
    disabled: priority, // priority images skip lazy loading
  });

  const shouldLoad = priority || isIntersecting;

  // ─── Loader resolution ──────────────────────────────────────────────────────
  const resolvedLoader = useMemo(
    () => resolveLoader(cdn, cdnBaseURL, loader),
    [cdn, cdnBaseURL, loader],
  );

  // ─── srcSet + sizes ─────────────────────────────────────────────────────────
  const { srcSetStr, sizesStr } = useMemo(() => {
    if (unoptimized) return { srcSetStr: undefined, sizesStr: undefined };

    const allWidths = getAllWidths(width, deviceSizes, imageSizes);
    const srcSetStr = buildSrcSet(src, allWidths, resolvedLoader, quality);
    const sizesStr = buildSizes(sizes);
    return { srcSetStr, sizesStr };
  }, [src, width, quality, deviceSizes, imageSizes, sizes, resolvedLoader, unoptimized]);

  // ─── Preload for priority images ────────────────────────────────────────────
  useEffect(() => {
    if (priority && !unoptimized) {
      injectPreloadLink(src, srcSetStr, sizesStr);
    }
  }, [priority, src, srcSetStr, sizesStr, unoptimized]);

  // ─── Image loading state machine ────────────────────────────────────────────
  const {
    currentSrc,
    loadingState,
    handleLoad,
    handleError,
    imgRef, // callback ref — passed as ref={imgRef} on <img>
    imperativeRef, // RefObject   — used by useImperativeHandle below
  } = useImageLoader({
    src,
    fallbackSrc,
    onLoad,
    onError,
    onLoadingStateChange,
    shouldLoad,
  });

  // Forward the underlying DOM node to any external ref on <Image>
  useImperativeHandle(externalRef, () => imperativeRef.current!);

  const isLoaded = loadingState === 'loaded';
  const isError = loadingState === 'error';

  // ─── Placeholder background ─────────────────────────────────────────────────
  const placeholderStyle = useMemo((): CSSProperties => {
    if (isLoaded) return {};

    if (placeholder === 'blur' && blurDataURL) {
      return {
        backgroundImage: `url(${blurDataURL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: `blur(${blurRadius}px)`,
        transform: 'scale(1.05)', // hide blur edges
      };
    }

    if (placeholder === 'color') {
      return { backgroundColor: placeholderColor };
    }

    // shimmer → CSS class handles it
    if (placeholder === 'shimmer') {
      return {};
    }

    return {};
  }, [placeholder, blurDataURL, blurRadius, placeholderColor, isLoaded]);

  // ─── Compute wrapper dimensions ─────────────────────────────────────────────
  const wrapperDimensions = useMemo((): CSSProperties => {
    if (fill) {
      return {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      };
    }

    const computedStyle: CSSProperties = { position: 'relative' };

    if (width) computedStyle.width = width;
    if (aspectRatio) {
      computedStyle.aspectRatio = aspectRatio;
    } else if (height) {
      computedStyle.height = height;
    } else if (width) {
      computedStyle.height = 'auto';
    }

    return computedStyle;
  }, [fill, width, height, aspectRatio]);

  // ─── Unwrapped mode ─────────────────────────────────────────────────────────
  if (unwrapped) {
    return (
      <img
        ref={imgRef}
        src={shouldLoad ? currentSrc : undefined}
        srcSet={shouldLoad ? srcSetStr : undefined}
        sizes={sizesStr}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={className}
        style={{
          objectFit,
          objectPosition,
          ...style,
        }}
        {...rest}
      />
    );
  }

  // ─── Full wrapped render ─────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className={[
        '__img_wrapper',
        wrapperClassName,
        placeholder === 'shimmer' && !isLoaded ? '__img_shimmer_bg' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        overflow: 'hidden',
        ...wrapperDimensions,
        ...placeholderStyle,
        ...wrapperStyle,
      }}
    >
      {/* Blur backdrop layer — fades out once loaded */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${blurRadius}px)`,
            transform: 'scale(1.1)',
            zIndex: 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}

      {/* Error state */}
      {isError && !fallbackSrc && (
        <>
          {fallbackElement ?? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
              }}
              aria-label={`Image failed to load: ${alt}`}
              role="img"
            >
              <img
                src={BROKEN_IMAGE_SVG}
                alt=""
                aria-hidden="true"
                style={{ width: 48, height: 48, opacity: 0.5 }}
              />
            </div>
          )}
        </>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={shouldLoad ? currentSrc : undefined}
        srcSet={shouldLoad && !unoptimized ? srcSetStr : undefined}
        sizes={sizesStr}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error — fetchPriority is not yet in all TS DOM libs
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={className}
        style={{
          position: fill ? 'absolute' : 'relative',
          inset: fill ? 0 : undefined,
          width: fill ? '100%' : width ? '100%' : 'auto',
          height: fill ? '100%' : 'auto',
          objectFit,
          objectPosition,
          display: 'block',
          zIndex: 1,
          // Fade-in transition
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
          // Prevent layout shift — keep the element in flow even while invisible
          visibility: shouldLoad ? 'visible' : 'hidden',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
});

Image.displayName = 'Image';

export default Image;
