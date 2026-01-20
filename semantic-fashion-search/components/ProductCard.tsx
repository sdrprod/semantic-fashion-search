import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import type { Product } from '@/types';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
  sessionRatings?: {
    getRating: (productId: string) => number;
    rate: (productId: string, rating: number) => void;
  };
  persistentRatings?: {
    getRating: (productId: string) => number;
    rate: (productId: string, rating: number) => Promise<boolean>;
    isLoaded: boolean;
  };
}

interface ProductStats {
  totalRatings: number;
  percent3Plus: number;
  percent5Star: number;
}

export function ProductCard({ product, sessionRatings, persistentRatings }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { data: session } = useSession();

  // Determine which rating system to use (authenticated vs anonymous)
  const isAuthenticated = !!session?.user?.id;
  const currentRating = isAuthenticated && persistentRatings
    ? persistentRatings.getRating(product.id)
    : sessionRatings?.getRating(product.id) || 0;

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

  // Fetch community stats for this product
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await fetch(`/api/ratings/stats?productIds=${product.id}`);
        if (response.ok) {
          const data = await response.json();
          const productStats = data.stats?.[product.id];
          if (productStats && productStats.totalRatings >= 5) {
            setStats({
              totalRatings: productStats.totalRatings,
              percent3Plus: productStats.percent3Plus,
              percent5Star: productStats.percent5Star,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch product stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    // Only fetch if we have rating hooks available (indicates feature is enabled)
    if (sessionRatings || persistentRatings) {
      fetchStats();
    }
  }, [product.id, sessionRatings, persistentRatings]);

  // Handle rating submission
  const handleRate = async (rating: number) => {
    if (isAuthenticated && persistentRatings) {
      // Authenticated user - save to database
      const success = await persistentRatings.rate(product.id, rating);
      if (success) {
        // Refetch stats after rating to show updated percentages
        const response = await fetch(`/api/ratings/stats?productIds=${product.id}`);
        if (response.ok) {
          const data = await response.json();
          const productStats = data.stats?.[product.id];
          if (productStats && productStats.totalRatings >= 5) {
            setStats({
              totalRatings: productStats.totalRatings,
              percent3Plus: productStats.percent3Plus,
              percent5Star: productStats.percent5Star,
            });
          }
        }
      }
    } else if (sessionRatings) {
      // Anonymous user - save to session storage
      sessionRatings.rate(product.id, rating);
    }
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

        {/* Star Rating Section */}
        {(sessionRatings || persistentRatings) && (
          <div className="rating-section" style={{ marginTop: '12px', marginBottom: '12px' }}>
            <StarRating
              rating={currentRating}
              onRate={handleRate}
              size={20}
            />

            {/* Community Stats */}
            {stats && (
              <div style={{ marginTop: '6px' }}>
                <p style={{
                  fontSize: '11px',
                  color: '#666',
                  lineHeight: '1.4'
                }}>
                  {stats.percent3Plus}% rated 3+ stars • {stats.percent5Star}% gave 5 stars
                </p>
              </div>
            )}

            {/* First to rate message */}
            {!stats && !isLoadingStats && currentRating === 0 && (
              <p style={{
                fontSize: '11px',
                color: '#999',
                marginTop: '6px',
                fontStyle: 'italic'
              }}>
                Be the first to rate this item
              </p>
            )}
          </div>
        )}

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
  );
}
