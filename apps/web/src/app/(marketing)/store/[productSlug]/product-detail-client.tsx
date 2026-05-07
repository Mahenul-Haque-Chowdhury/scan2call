'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ImageIcon, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getApiOrigin } from '@/lib/api-origin';

export interface ProductImage {
  url: string;
  altText: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  priceInCents: number;
  compareAtPrice: number | null;
  sku: string;
  stockQuantity: number;
  isInStock: boolean;
  tagType: string;
  includesTagCount: number;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  canPurchase: boolean;
}

const API_BASE = getApiOrigin();

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function ProductDetailClient({
  initialProduct,
  initialError,
}: {
  initialProduct: Product | null;
  initialError?: string | null;
}) {
  const params = useParams();
  const productSlug = params.productSlug as string;

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [isLoading, setIsLoading] = useState(!initialProduct && !initialError);
  const [error, setError] = useState<string | null>(initialError || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    if (initialProduct || initialError) {
      return;
    }

    let cancelled = false;

    async function fetchProduct() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/products/${productSlug}`);
        if (res.status === 404) {
          if (!cancelled) setError('Product not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch product');
        const json: { data: Product } = await res.json();
        if (!cancelled) {
          setProduct(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load product');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [productSlug, initialProduct, initialError]);

  const canPurchase = isAuthenticated && !!user?.hasActiveSubscription;

  function handleAddToCart() {
    if (!product) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        priceInCents: product.priceInCents,
        image: product.images[0]?.url,
      },
      quantity,
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
        <div className="mt-12 flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
        <div className="mt-12">
          <Alert variant="error">
            {error || 'Product not found'}
            <Link
              href="/store"
              className="ml-2 underline underline-offset-2 hover:no-underline"
            >
              Return to Store
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  const sortedImages = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </motion.div>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-surface-raised">
            {sortedImages.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={sortedImages[selectedImage]?.url}
                  alt={sortedImages[selectedImage]?.altText || product.name}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
            ) : (
              <div className="flex h-full items-center justify-center text-text-dim">
                <ImageIcon className="h-20 w-20" strokeWidth={1} />
              </div>
            )}
          </div>

          {sortedImages.length > 1 && (
            <div className="mt-4 flex gap-3">
              {sortedImages.map((img, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-16 w-16 overflow-hidden rounded-md border-2 transition-all ${
                    idx === selectedImage
                      ? 'border-primary shadow-sm shadow-primary/20'
                      : 'border-border hover:border-border-hover'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.altText || `${product.name} thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {product.name}
          </h1>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 flex items-baseline gap-3"
          >
            <span className="text-2xl font-bold text-primary">
              ${formatPrice(product.priceInCents)} AUD
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-text-dim line-through">
                ${formatPrice(product.compareAtPrice)}
              </span>
            )}
          </motion.div>

          <p className="mt-4 leading-relaxed text-text-muted">{product.description}</p>

          <div className="mt-6 space-y-0 text-sm">
            {[
              { label: 'Tag Type', value: product.tagType },
              ...(product.includesTagCount > 0
                ? [{ label: 'Tags Included', value: String(product.includesTagCount) }]
                : []),
              { label: 'SKU', value: product.sku, mono: true },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.04, duration: 0.3 }}
                className="flex justify-between border-b border-border py-2.5"
              >
                <span className="text-text-dim">{row.label}</span>
                <span className={`font-medium ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.37, duration: 0.3 }}
              className="flex justify-between border-b border-border py-2.5"
            >
              <span className="text-text-dim">Availability</span>
              {product.isInStock ? (
                <Badge variant="success">
                  In Stock ({product.stockQuantity} available)
                </Badge>
              ) : (
                <Badge variant="error">Out of Stock</Badge>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-8 space-y-3"
          >
            {product.isInStock && canPurchase && (
              <div className="flex items-center gap-3">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-text-muted"
                >
                  Qty
                </label>
                <div className="flex items-center rounded-md border border-border">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-text-muted transition-colors hover:text-text"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stockQuantity, q + 1),
                      )
                    }
                    className="px-3 py-2 text-text-muted transition-colors hover:text-text"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {!product.isInStock ? (
              <Button disabled className="w-full">
                Out of Stock
              </Button>
            ) : canPurchase ? (
              <Button onClick={handleAddToCart} className="w-full">
                {addedToCart ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            ) : (
              <Link
                href="/subscription"
                className="inline-flex w-full items-center justify-center h-10 px-4 text-sm gap-2 rounded-lg font-medium transition-all duration-200 bg-surface-raised text-text border border-border hover:bg-surface-overlay hover:border-border-hover"
              >
                Subscribe to Purchase
              </Link>
            )}

            {!canPurchase && product.isInStock && (
              <p className="text-center text-xs text-text-dim">
                Active subscription required to purchase
              </p>
            )}

            {canPurchase && addedToCart && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link
                  href="/store/cart"
                  className="block text-center text-sm font-medium text-text-muted transition-colors hover:text-primary"
                >
                  View Cart ->
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
