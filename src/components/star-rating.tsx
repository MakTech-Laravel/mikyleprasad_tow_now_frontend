import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: string;
  fillColor?: string;
  textColor?: string;
}

export default function StarRating({
  rating,
  max = 5,
  size = 'h-4 w-4',
  fillColor = 'fill-primary',
  textColor = 'text-primary',
}: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        // How much of this star should be filled: 0 (empty) → 1 (full)
        const fill = Math.min(1, Math.max(0, rating - i));

        return (
          <div key={i} className="relative inline-block">
            {/* Base layer — always the empty/muted star */}
            <Star className={`${size} ${fillColor} ${textColor}`} />

            {/* Top layer — filled star, clipped to `fill * 100%` width */}
            {fill > 0 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} ${fillColor} ${textColor}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
