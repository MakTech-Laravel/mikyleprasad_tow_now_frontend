import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageLoadingState } from '@/components/image/image.types';

interface UseImageLoaderOptions {
  src: string;
  fallbackSrc?: string;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoadingStateChange?: (state: ImageLoadingState) => void;
  shouldLoad: boolean;
}

interface UseImageLoaderResult {
  currentSrc: string;
  loadingState: ImageLoadingState;
  handleLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  handleError: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Pass as ref={imgRef} on the <img> element */
  imgRef: (node: HTMLImageElement | null) => void;
  /** Pass as ref to useImperativeHandle (kept in sync with imgRef internally) */
  imperativeRef: React.RefObject<HTMLImageElement | null>;
}

export function useImageLoader({
  src,
  fallbackSrc,
  onLoad,
  onError,
  onLoadingStateChange,
  shouldLoad,
}: UseImageLoaderOptions): UseImageLoaderResult {
  // ─── Derived-state-during-render ──────────────────────────────────────────
  // Official React pattern for "reset state when a prop changes" — avoids
  // calling setState synchronously inside a useEffect body.
  // Docs: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevSrc, setPrevSrc] = useState(src);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loadingState, setLoadingState] = useState<ImageLoadingState>(
    shouldLoad ? 'loading' : 'idle',
  );

  const imperativeRef = useRef<HTMLImageElement>(null);
  const hasFallenBack = useRef(false);

  // Synchronously update state during render when src changes.
  // React will flush an extra render immediately — no useEffect needed.
  if (prevSrc !== src) {
    setPrevSrc(src);
    setCurrentSrc(src);
    setLoadingState(shouldLoad ? 'loading' : 'idle');
    hasFallenBack.current = false;
  }

  // ─── shouldLoad: idle → loading (derived-state-during-render) ────────────
  const prevShouldLoad = useRef(shouldLoad);
  if (shouldLoad && !prevShouldLoad.current) {
    prevShouldLoad.current = true;
    if (loadingState === 'idle') {
      setLoadingState('loading');
    }
  }

  // ─── Callback ref — handles both DOM node access + cache-hit detection ────
  // Using a callback ref means setState runs inside a DOM mutation callback,
  // NOT synchronously in a useEffect body → satisfies react-hooks/set-state-in-effect.
  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      // Keep imperativeRef in sync so useImperativeHandle in Image.tsx works
      (imperativeRef as React.MutableRefObject<HTMLImageElement | null>).current = node;

      // Cache-hit: browser already has this image, onLoad may not fire
      if (node && node.complete && node.naturalWidth > 0) {
        setLoadingState('loaded');
      }
    },
    // Re-evaluate the cache check whenever src changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src],
  );

  // ─── Notify parent of state changes ───────────────────────────────────────
  // This is a legitimate "sync to external system" effect — it calls an
  // external callback; it does NOT call our own setState. No lint violation.
  useEffect(() => {
    onLoadingStateChange?.(loadingState);
  }, [loadingState, onLoadingStateChange]);

  // ─── Event handlers ───────────────────────────────────────────────────────
  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      setLoadingState('loaded');
      onLoad?.(event);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!hasFallenBack.current && fallbackSrc) {
        hasFallenBack.current = true;
        setCurrentSrc(fallbackSrc);
        setLoadingState('loading');
        return;
      }
      setLoadingState('error');
      onError?.(event);
    },
    [fallbackSrc, onError],
  );

  return {
    currentSrc,
    loadingState,
    handleLoad,
    handleError,
    imgRef,
    imperativeRef,
  };
}
