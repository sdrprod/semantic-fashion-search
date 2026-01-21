import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { FeedbackButtons } from '@/components/FeedbackButtons';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

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
        <div className="product-actions">
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="product-link"
          >
            View Product
          </a>
          <FeedbackButtons productId={product.id} />
        </div>
      </div>
    </div>
  );
}
