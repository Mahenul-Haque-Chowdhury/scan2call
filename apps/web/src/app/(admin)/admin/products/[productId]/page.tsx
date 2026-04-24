'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  priceInCents: number;
  compareAtPrice: number | null;
  sku: string;
  stockQuantity: number;
  isInStock: boolean;
  tagType: string | null;
  includesTagCount: number;
  images: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { orderItems: number };
}

const TAG_TYPE_LABELS: Record<string, string> = {
  PET_COLLAR: 'Pet Collar',
  CAR_STICKER: 'Car Sticker',
  LUGGAGE_TAG: 'Luggage Tag',
  KEYCHAIN: 'Keychain',
  MEDICAL_BAND: 'Medical Band',
  GENERIC: 'Generic',
};

export default function AdminProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const result = await apiClient.get<{ data: ProductDetail }>(
          `/admin/products/${params.productId}`,
        );
        setProduct(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    if (params.productId) fetchProduct();
  }, [params.productId]);

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/products/${product.id}`);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setDeleting(false);
      setShowDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <Alert variant="error" className="mt-6">
          {error || 'Product not found'}
        </Alert>
      </div>
    );
  }

  const mainImage = product.images[selectedImage] || product.images[0] || null;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.priceInCents
      ? Math.round((1 - product.priceInCents / product.compareAtPrice) * 100)
      : null;

  return (
    <div>
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />}>
              Edit
            </Button>
          </Link>
          {!product.deletedAt && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setShowDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Deleted banner */}
      {product.deletedAt && (
        <Alert variant="warning" className="mt-4">
          This product was deleted on{' '}
          {new Date(product.deletedAt).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          . It is no longer visible in the store.
        </Alert>
      )}

      {/* Header */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text font-display">
            {product.name}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-mono text-text-dim">{product.sku}</span>
            <span className="text-text-dim">·</span>
            <span className="font-mono text-text-dim">{product.slug}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="neutral">Inactive</Badge>
          )}
          {product.isFeatured && <Badge variant="warning">Featured</Badge>}
          {product.deletedAt && <Badge variant="error">Deleted</Badge>}
        </div>
      </div>

      {/* Content grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Left column - Images */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Main image */}
            <div className="aspect-square bg-surface-raised flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage.url}
                  alt={mainImage.altText || product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-text-dim/40">
                  <ImageIcon className="h-16 w-16" />
                  <p className="mt-2 text-sm">No images</p>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-14 w-14 rounded-md border-2 overflow-hidden shrink-0 transition-colors ${
                      idx === selectedImage
                        ? 'border-primary'
                        : 'border-transparent hover:border-border-hover'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `Image ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">
              Pricing & Inventory
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-text-dim">Price</p>
                <p className="mt-1 text-xl font-bold text-primary">
                  ${(product.priceInCents / 100).toFixed(2)}
                </p>
              </div>
              {product.compareAtPrice && (
                <div>
                  <p className="text-xs text-text-dim">Compare At</p>
                  <p className="mt-1 text-lg text-text-muted line-through">
                    ${(product.compareAtPrice / 100).toFixed(2)}
                  </p>
                  {discount && (
                    <span className="text-xs text-success font-semibold">
                      -{discount}% off
                    </span>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-text-dim">Stock</p>
                <p className={`mt-1 text-lg font-semibold ${product.stockQuantity === 0 ? 'text-error' : 'text-text'}`}>
                  {product.stockQuantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-dim">Orders</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {product._count.orderItems}
                </p>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">
              Product Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-text-dim shrink-0">Tag Type</span>
                <span className="font-medium text-text text-right">
                  {product.tagType ? TAG_TYPE_LABELS[product.tagType] || product.tagType : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-text-dim shrink-0">Tags Included</span>
                <span className="font-medium text-text">{product.includesTagCount}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-text-dim shrink-0">Sort Order</span>
                <span className="font-medium text-text">{product.sortOrder}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-text-dim shrink-0">Created</span>
                <span className="font-medium text-text">
                  {new Date(product.createdAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-text-dim shrink-0">Updated</span>
                <span className="font-medium text-text">
                  {new Date(product.updatedAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Description card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">
              Description
            </h2>
            {product.shortDescription && (
              <p className="text-sm font-medium text-text mb-3">
                {product.shortDescription}
              </p>
            )}
            {product.description ? (
              <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-text-dim italic">No description set.</p>
            )}
          </div>

          {/* SEO card */}
          {(product.metaTitle || product.metaDescription) && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">
                SEO
              </h2>
              {product.metaTitle && (
                <div className="mb-2">
                  <p className="text-xs text-text-dim">Meta Title</p>
                  <p className="text-sm text-text">{product.metaTitle}</p>
                </div>
              )}
              {product.metaDescription && (
                <div>
                  <p className="text-xs text-text-dim">Meta Description</p>
                  <p className="text-sm text-text-muted">{product.metaDescription}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-overlay" onClick={() => !deleting && setShowDelete(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text">Delete Product</h3>
            <p className="mt-2 text-sm text-text-muted">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-text">{product.name}</span>?
              This will hide it from the store.
            </p>
            {product._count.orderItems > 0 && (
              <p className="mt-2 text-xs text-warning">
                This product has {product._count.orderItems} order{product._count.orderItems !== 1 ? 's' : ''} linked to it.
              </p>
            )}
            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
