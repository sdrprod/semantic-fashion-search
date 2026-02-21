'use client';

import { useState, useEffect } from 'react';

interface StarRatingProps {
  /** Current rating (1-5, or 0 for unrated) */
  rating: number;
  /** Callback when user clicks a star */
  onRate?: (rating: number) => void;
  /** Size of stars in pixels */
  size?: number;
  /** Read-only mode (no interaction) */
  readonly?: boolean;
  /** Show numeric rating alongside stars */
  showNumber?: boolean;
  /** Half-star precision (future feature, default false) */
  halfStars?: boolean;
}

/**
 * Star Rating Component
 *
 * Features:
 * - Interactive 1-5 star rating
 * - Hover preview
 * - Re-clickable (can change rating)
 * - Modular for future half-star support
 *
 * Usage:
 *   <StarRating rating={4} onRate={(r) => handleRate(r)} />
 */
export function StarRating({
  rating,
  onRate,
  size = 20,
  readonly = false,
  showNumber = false,
  halfStars = false, // Future feature
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  // Track the last clicked rating locally so the UI doesn't flash to 0
  // while waiting for the parent to propagate the updated rating prop.
  const [confirmedRating, setConfirmedRating] = useState(rating);

  // Sync confirmedRating when the parent prop changes (e.g., loaded from DB)
  useEffect(() => {
    setConfirmedRating(rating);
  }, [rating]);

  const displayRating = hoverRating !== null ? hoverRating : confirmedRating;
  const totalStars = 5;

  // Relevance label per star level
  const RELEVANCE_LABELS: Record<number, string> = {
    1: 'Not relevant',
    2: 'Slightly relevant',
    3: 'Somewhat relevant',
    4: 'Very relevant',
    5: 'Excellent match',
  };

  const handleClick = (starIndex: number) => {
    if (readonly || !onRate) return;
    // Update confirmed rating immediately so the UI doesn't flash while
    // the parent re-renders with the new rating prop.
    setConfirmedRating(starIndex);
    onRate(starIndex);
  };

  const handleMouseEnter = (starIndex: number) => {
    if (readonly || !onRate) return;
    setHoverRating(starIndex);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  return (
    <div className="flex items-center gap-1">
      <div
        className={`flex items-center gap-0.5 ${
          !readonly && onRate ? 'cursor-pointer' : 'cursor-default'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: totalStars }, (_, i) => {
          const starIndex = i + 1;
          const isFilled = starIndex <= displayRating;

          return (
            <button
              key={starIndex}
              type="button"
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              disabled={readonly || !onRate}
              className={`
                transition-all duration-150
                ${!readonly && onRate ? 'hover:scale-110' : ''}
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 rounded
              `}
              aria-label={RELEVANCE_LABELS[starIndex]}
              title={readonly ? undefined : RELEVANCE_LABELS[starIndex]}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={isFilled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                className={`
                  transition-colors duration-150
                  ${isFilled
                    ? hoverRating !== null
                      ? 'text-yellow-400'
                      : 'text-yellow-500'
                    : 'text-gray-300'
                  }
                `}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {showNumber && rating > 0 && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(halfStars ? 1 : 0)}
        </span>
      )}

      {!readonly && onRate && (
        <span className="text-xs text-gray-400 ml-1">
          {hoverRating !== null
            ? RELEVANCE_LABELS[hoverRating]
            : confirmedRating > 0
              ? RELEVANCE_LABELS[confirmedRating]
              : 'Rate relevance'}
        </span>
      )}
    </div>
  );
}

/**
 * Compact star rating display (read-only, for stats)
 */
export function StarRatingDisplay({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <StarRating
      rating={rating}
      size={size}
      readonly={true}
      showNumber={true}
    />
  );
}
