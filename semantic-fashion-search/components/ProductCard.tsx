import Image from 'next/image';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="product-image"
          loading="lazy"
        />
        {product.onSale && (
          <div className="sale-badge">SALE</div>
        )}
      </div>
      <div className="product-info">
        {displayBrand && <p className="product-brand">{displayBrand}</p>}
        <h3 className="product-title">{product.title}</h3>
        {showDescription && <p className="product-description">{product.description}</p>}
        {product.onSale && (
          <p className="sale-notice">This item is currently on sale</p>
        )}
        <p className="product-price">{formatPrice(product.price, product.currency)}</p>
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
