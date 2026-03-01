'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const FASHION_IMAGES = [
  '/images/woman-sunglasses-hat-black.png',
  '/images/woman-silhouette-black-hat-sunglasses-turtleneck.png',
  '/images/woman-silhouette-fitness.png',
  '/images/woman-silhouette-stylish.png',
  '/images/woman-with-umbrella.png',
  '/images/woman-singing.png',
  '/images/woman-running.png',
  '/images/woman-walking.png',
  '/images/woman-shopping.png',
];

/**
 * Renders a randomly-selected fashion illustration (woman*.png) as a perfect square.
 * The image is chosen on client mount to avoid SSR hydration mismatches.
 * Transparent background is preserved (no fill, object-fit: contain).
 */
export function FashionIllustration() {
  const [imgIndex, setImgIndex] = useState<number | null>(null);

  useEffect(() => {
    setImgIndex(Math.floor(Math.random() * FASHION_IMAGES.length));
  }, []);

  if (imgIndex === null) return null;

  return (
    <div className="fashion-illustration">
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Image
          src={FASHION_IMAGES[imgIndex]}
          alt=""
          fill
          style={{ objectFit: 'contain' }}
          unoptimized
        />
      </div>
    </div>
  );
}
