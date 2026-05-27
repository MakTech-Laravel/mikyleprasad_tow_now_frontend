import { startTransition, useEffect, useState } from 'react';

interface SvgIconProps {
  /** Path to the SVG file, e.g. "/icons/truck.svg" */
  src: string;
  /** Width & height in px (or any CSS value). Default: 24 */
  size?: number | string;
  /** Overrides the SVG's fill color via currentColor */
  color?: string;
  /** Extra Tailwind / CSS classes */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export function SvgIcon({
  src,
  size = 24,
  color,
  className = '',
  ariaLabel: ariaLabel,
}: SvgIconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    startTransition(() => {
      setSvgContent(null);
      setError(false);
    });

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        // Strip XML declaration and doctypes, keep only the <svg>...</svg>
        const clean = text
          .replace(/<\?xml[^?]*\?>/gi, '')
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .trim();
        setSvgContent(clean);
      })
      .catch(() => setError(true));
  }, [src]);

  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  if (error) {
    return (
      <span
        title={`Could not load SVG: ${src}`}
        style={{ width: sizeValue, height: sizeValue, display: 'inline-block' }}
        className={`rounded bg-muted ${className}`}
      />
    );
  }

  if (!svgContent) {
    return (
      <span
        style={{ width: sizeValue, height: sizeValue, display: 'inline-block' }}
        className={`animate-pulse rounded bg-muted ${className}`}
      />
    );
  }

  // Inject width, height, and currentColor into the raw SVG string
  const injected = svgContent
    // Set dimensions
    .replace(/<svg/, `<svg width="${sizeValue}" height="${sizeValue}"`)
    // Remove any hardcoded width/height attrs that were already there (simple approach)
    .replace(/(<svg[^>]*)\s+width="[^"]*"/, '$1')
    .replace(/(<svg[^>]*)\s+height="[^"]*"/, '$1')
    // Re-add them cleanly
    .replace('<svg', `<svg width="${sizeValue}" height="${sizeValue}"`);

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color: color, width: sizeValue, height: sizeValue, flexShrink: 0 }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled SVG fetch
      dangerouslySetInnerHTML={{ __html: injected }}
    />
  );
}
