import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return "Price on request";

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    });

    return formatter.format(price);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="product-image"
          loading="lazy"
        />
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-title">{product.title}</h3>
        <p className="product-description">{product.description}</p>
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
