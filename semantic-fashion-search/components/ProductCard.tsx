import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import type { Product } from '@/types';
import { StarRating } from '@/components/StarRating';
import { FeedbackPopover } from '@/components/FeedbackPopover';

interface ProductCardProps {
  product: Product;
  sessionRatings?: {
    getRating: (productId: string) => number;
    rate: (productId: string, rating: number) => void;
    saveFeedback: (productId: string, text: string) => void;
  };
  persistentRatings?: {
    getRating: (productId: string) => number;
    rate: (productId: string, rating: number) => void;
    saveFeedback: (productId: string, text: string) => void;
  };
}

interface RatingStats {
  totalRatings: number;
  avgRating: number;
  percent3Plus: number;
  percent5Star: number;
}

export function ProductCard({ product, sessionRatings, persistentRatings }: ProductCardProps) {
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Decode common HTML entities safely
  const decodeHtmlEntities = (text: string): string => {
    const entities: Record<string, string> = {
      '&#039;': "'",
      '&apos;': "'",
      '&quot;': '"',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&nbsp;': ' ',
    };

    return text.replace(/&#?\w+;/g, (match) => entities[match] || match);
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Price on request';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    });

    return formatter.format(price);
  };

  // Determine what to show for brand/vendor
  const displayBrand = (() => {
    // Use brand if it's valid (not "Unknown" or empty)
    if (product.brand &&
        product.brand.toLowerCase() !== 'unknown' &&
        product.brand.trim() !== '') {
      return product.brand;
    }
    // Fall back to merchant name if available
    if (product.merchantName && product.merchantName.trim() !== '') {
      return product.merchantName;
    }
    // No brand to show
    return null;
  })();

  // Only show description if it exists and isn't "null" string
  const showDescription = product.description &&
                          product.description !== 'null' &&
                          product.description.trim() !== '';

  // Fetch community rating stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await fetch(`/api/ratings/stats?productIds=${product.id}`);
        if (response.ok) {
          const data = await response.json();
          const productStats = data.stats?.[product.id];
          if (productStats && productStats.totalRatings >= 5) {
            setStats(productStats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch rating stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [product.id]);

  // Determine current rating based on authentication status
  const currentRating = session?.user?.id
    ? persistentRatings?.getRating(product.id) || 0
    : sessionRatings?.getRating(product.id) || 0;

  // Handle rating submission
  const handleRate = async (rating: number) => {
    if (session?.user?.id) {
      // Authenticated user - save to database
      persistentRatings?.rate(product.id, rating);
      // Refetch stats after rating
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/ratings/stats?productIds=${product.id}`);
          if (response.ok) {
            const data = await response.json();
            const productStats = data.stats?.[product.id];
            if (productStats && productStats.totalRatings >= 5) {
              setStats(productStats);
            }
          }
        } catch (error) {
          console.error('Failed to refetch stats:', error);
        }
      }, 500);
    } else {
      // Anonymous user - save to sessionStorage
      sessionRatings?.rate(product.id, rating);
    }

    // Show feedback popover for low ratings (1-2 stars)
    if (rating <= 2) {
      setShowFeedback(true);
    } else {
      setShowFeedback(false);
    }
  };

  // Handle feedback submission from the popover
  const handleFeedbackSubmit = (text: string) => {
    if (text.trim()) {
      if (session?.user?.id) {
        persistentRatings?.saveFeedback(product.id, text.trim());
      } else {
        sessionRatings?.saveFeedback(product.id, text.trim());
      }
    }
    setShowFeedback(false);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {!imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="product-image"
            loading="lazy"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="product-image-placeholder">
            <span>Image unavailable</span>
          </div>
        )}
        {product.onSale && (
          <div className="sale-badge">SALE</div>
        )}
      </div>
      <div className="product-info">
        {displayBrand && <p className="product-brand">{decodeHtmlEntities(displayBrand)}</p>}
        <h3 className="product-title">{decodeHtmlEntities(product.title)}</h3>
        {showDescription && <p className="product-description">{decodeHtmlEntities(product.description)}</p>}
        {product.onSale && (
          <p className="sale-notice">This item is currently on sale</p>
        )}
        <p className="product-price">{formatPrice(product.price, product.currency)}</p>

        {/* Star Rating */}
        {(sessionRatings || persistentRatings) && (
          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              How relevant are these results?
            </div>
            <StarRating
              rating={currentRating}
              onRate={handleRate}
              size={20}
            />

            {/* Low-rating feedback popover */}
            {showFeedback && (
              <FeedbackPopover
                onSubmit={handleFeedbackSubmit}
                onDismiss={() => setShowFeedback(false)}
              />
            )}

            {/* Community Stats */}
            {stats && stats.totalRatings >= 5 && (
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '6px',
              }}>
                {stats.percent3Plus}% found relevant • {stats.percent5Star}% gave 5 stars
              </div>
            )}
          </div>
        )}

        <div className="product-actions">
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="product-link"
          >
            View Product
          </a>
        </div>
      </div>
    </div>
  );
}
