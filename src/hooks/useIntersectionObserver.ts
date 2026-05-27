import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  rootMargin?: string;
  threshold?: number | number[];
  root?: Element | null;
  /** Once intersected, stop observing */
  triggerOnce?: boolean;
  disabled?: boolean;
}

interface UseIntersectionObserverResult<T extends Element> {
  ref: React.RefCallback<T>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver<T extends Element = HTMLDivElement>({
  rootMargin = "0px",
  threshold = 0,
  root = null,
  triggerOnce = true,
  disabled = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult<T> {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<T | null>(null);

  const ref: React.RefCallback<T> = (node) => {
    // Cleanup previous observation
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (disabled || !node) {
      elementRef.current = node;
      return;
    }

    elementRef.current = node;

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [observedEntry] = entries;
        setEntry(observedEntry);

        if (observedEntry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce && observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { rootMargin, threshold, root }
    );

    observerRef.current.observe(node);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref, isIntersecting, entry };
}