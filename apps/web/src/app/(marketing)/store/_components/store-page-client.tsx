'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Star, ShoppingCart, Check, Package } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/motion';

interface ProductImage {
  url: string;
  altText: string;
  sortOrder: number;
}

interface Product {
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

interface ProductsResponse {
  data: Product[];
  meta: { page: number; pageSize: number; total: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function StorePageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddToCart = useCallback((product: Product) => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        priceInCents: product.priceInCents,
        image: product.images[0]?.url,
      },
      1,
    );
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  }, [addItem]);

  const AddToCartButton = useCallback(
    ({ product }: { product: Product }) => {
      const added = addedIds.has(product.id);
      return (
        <motion.button
          onClick={() => handleAddToCart(product)}
          className={`relative w-full flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded-xl overflow-hidden transition-colors duration-300 ${
            added
              ? 'bg-success/15 text-success border border-success/30'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover glow-sm hover:glow-md'
          }`}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] as const }}
                className="flex items-center gap-1.5"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.05 }}
                >
                  <Check className="h-4 w-4" />
                </motion.span>
                Added!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] as const }}
                className="flex items-center gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      );
    },
    [addedIds, handleAddToCart],
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const json: ProductsResponse = await res.json();
        const sorted = [...json.data].sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.name.localeCompare(b.name);
        });
        if (!cancelled) setProducts(sorted);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const canPurchase = isAuthenticated && !!user?.hasActiveSubscription;

  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-16 gradient-mesh">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
              Store
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Tag Store</h1>
            <p className="mt-3 text-lg text-text-muted max-w-xl">
              Browse our range of QR identity tags. Attach them to anything you want to protect.
            </p>
          </FadeIn>

          {!canPurchase && !isLoading && (
            <FadeIn delay={0.1} className="mt-5">
              <div className="inline-flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary-muted px-4 py-2.5 text-sm">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <span className="text-text-secondary">
                  <Link href="/pricing" className="text-primary font-medium hover:underline">Subscribe</Link>
                  {' '}to purchase tags from the store.
                </span>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="max-w-lg">
              <Alert variant="error">
                {error}
                <button
                  onClick={() => window.location.reload()}
                  className="ml-2 underline underline-offset-2 hover:no-underline"
                >
                  Try again
                </button>
              </Alert>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="h-12 w-12 text-text-dim mb-4" strokeWidth={1.5} />
              <p className="text-text-muted">No products available at this time.</p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-primary/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-shadow"
                >
                  {/* Image */}
                  <Link href={`/store/${product.slug}`}>
                    <div className="relative aspect-square bg-surface-raised overflow-hidden">
                      {product.images.length > 0 && product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-text-dim">
                          <ImageIcon className="h-12 w-12" strokeWidth={1} />
                        </div>
                      )}

                      {/* Overlay badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
                        {product.isFeatured && product.isInStock && (
                          <Badge variant="primary" className="shadow-sm">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Featured
                          </Badge>
                        )}
                        {!product.isInStock && (
                          <Badge variant="error" className="ml-auto">Out of Stock</Badge>
                        )}
                      </div>

                      {/* Compare-at price ribbon */}
                      {product.compareAtPrice && product.isInStock && (
                        <div className="absolute bottom-0 right-0 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-tl-lg">
                          SALE
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <div className="flex-1">
                      <Link href={`/store/${product.slug}`}>
                        <h2 className="text-sm font-semibold leading-snug transition-colors group-hover:text-primary line-clamp-2">
                          {product.name}
                        </h2>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted leading-relaxed">
                        {product.shortDescription}
                      </p>
                    </div>

                    {/* Price + tag type */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-primary">
                          ${formatPrice(product.priceInCents)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-text-dim line-through">
                            ${formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                        <span className="text-xs text-text-dim">AUD</span>
                      </div>
                      <Badge variant="neutral" className="shrink-0 text-[10px]">
                        {product.tagType}
                      </Badge>
                    </div>

                    {/* CTA */}
                    {!product.isInStock ? (
                      <button disabled className="w-full h-10 px-4 text-xs font-medium rounded-xl bg-surface-raised text-text-dim cursor-not-allowed opacity-50 border border-border">
                        Out of Stock
                      </button>
                    ) : canPurchase ? (
                      <AddToCartButton product={product} />
                    ) : (
                      <Link
                        href="/subscription"
                        className="flex items-center justify-center w-full h-10 px-4 text-xs font-medium rounded-xl bg-surface-raised text-text-secondary border border-border hover:bg-surface-overlay hover:border-border-hover transition-colors"
                      >
                        Subscribe to Purchase
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
