// ─── Shimmer keyframe / SVG placeholder ──────────────────────────────────────

export function getShimmerSVG(w: number, h: number): string {
  return `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#e2e8f0" offset="20%" />
        <stop stop-color="#f1f5f9" offset="50%" />
        <stop stop-color="#e2e8f0" offset="70%" />
      </linearGradient>
      <linearGradient id="gd" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#334155" offset="20%" />
        <stop stop-color="#475569" offset="50%" />
        <stop stop-color="#334155" offset="70%" />
      </linearGradient>
      <pattern id="p" x="0" y="0" width="400%" height="400%">
        <rect width="${w * 4}" height="${h}" fill="url(#g)" />
        <animate attributeName="x" from="0" to="${w * -3}" dur="1s" repeatCount="indefinite" />
      </pattern>
      <pattern id="pd" x="0" y="0" width="400%" height="400%">
        <rect width="${w * 4}" height="${h}" fill="url(#gd)" />
        <animate attributeName="x" from="0" to="${w * -3}" dur="1s" repeatCount="indefinite" />
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#p)" />
  </svg>`;
}

export function shimmerToDataURL(w: number, h: number): string {
  const svg = getShimmerSVG(w, h);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// ─── CSS shimmer animation (injected once) ────────────────────────────────────

let shimmerInjected = false;
export function injectShimmerCSS() {
  if (shimmerInjected || typeof document === 'undefined') return;
  shimmerInjected = true;

  const style = document.createElement('style');
  style.textContent = `
      @keyframes __img_shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
      .__img_shimmer_bg {
        background: linear-gradient(
          90deg,
          #e2e8f0 25%,
          #f1f5f9 50%,
          #e2e8f0 75%
        );
        background-size: 200% 100%;
        animation: __img_shimmer 1.4s ease infinite;
      }
      @media (prefers-color-scheme: dark) {
        .__img_shimmer_bg {
          background: linear-gradient(
            90deg,
            #1e293b 25%,
            #334155 50%,
            #1e293b 75%
          );
          background-size: 200% 100%;
        }
      }
    `;
  document.head.appendChild(style);
}

// ─── Link preload injection ───────────────────────────────────────────────────

const preloadedHrefs = new Set<string>();

export function injectPreloadLink(href: string, imageSrcSet?: string, imageSizes?: string) {
  if (typeof document === 'undefined') return;
  if (preloadedHrefs.has(href)) return;
  preloadedHrefs.add(href);

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  if (imageSrcSet) link.setAttribute('imagesrcset', imageSrcSet);
  if (imageSizes) link.setAttribute('imagesizes', imageSizes);
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
}
