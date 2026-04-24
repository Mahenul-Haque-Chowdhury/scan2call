'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  ImageIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface Product {
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

const TAG_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'PET_COLLAR', label: 'Pet Collar' },
  { value: 'CAR_STICKER', label: 'Car Sticker' },
  { value: 'LUGGAGE_TAG', label: 'Luggage Tag' },
  { value: 'KEYCHAIN', label: 'Keychain' },
  { value: 'MEDICAL_BAND', label: 'Medical Band' },
  { value: 'GENERIC', label: 'Generic' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tagTypeFilter, setTagTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const pageSize = 15;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (search) params.set('search', search);
      if (tagTypeFilter) params.set('tagType', tagTypeFilter);

      const result = await apiClient.get<{
        data: Product[];
        meta: { page: number; pageSize: number; total: number };
      }>(`/admin/products?${params.toString()}`);

      setProducts(result.data);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, tagTypeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete(product: Product) {
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/products/${product.id}`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const firstImage = (p: Product) => p.images[0]?.url ?? null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text font-display">
            Products
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {total} product{total !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button icon={<Plus className="h-4 w-4" />}>Add Product</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
          <input
            type="text"
            placeholder="Search by name, SKU, or slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md text-sm bg-surface-raised text-text placeholder:text-text-dim border border-border hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
          />
        </div>
        <Select
          options={TAG_TYPE_OPTIONS}
          value={tagTypeFilter}
          onChange={(e) => {
            setTagTypeFilter(e.target.value);
            setPage(1);
          }}
          className="sm:w-44"
        />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" className="mt-6" dismissible>
          {error}
        </Alert>
      )}

      {/* Products Table */}
      <div className="mt-6 rounded-xl border border-border bg-surface overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-semibold text-text-dim uppercase tracking-wider">
          <span className="col-span-4">Product</span>
          <span className="col-span-2">Price</span>
          <span className="col-span-2">Tag Type</span>
          <span className="col-span-1">Stock</span>
          <span className="col-span-1">Orders</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1"></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-text-dim/40" />
            <p className="mt-3 text-sm font-medium text-text-muted">No products found</p>
            <p className="mt-1 text-xs text-text-dim">
              {search || tagTypeFilter
                ? 'Try adjusting your filters.'
                : 'Create your first product to get started.'}
            </p>
            {!search && !tagTypeFilter && (
              <Link href="/admin/products/new" className="mt-4">
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-4 items-center transition-colors hover:bg-surface-raised/50"
              >
                {/* Product info */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg border border-border bg-surface-raised flex items-center justify-center overflow-hidden shrink-0">
                    {firstImage(product) ? (
                      <img
                        src={firstImage(product)!}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-text-dim/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-medium text-text hover:text-primary transition-colors truncate block"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-text-dim font-mono truncate">
                      {product.sku}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="md:col-span-2 flex items-center gap-2">
                  <span className="md:hidden text-xs text-text-dim">Price:</span>
                  <span className="text-sm font-semibold text-primary">
                    ${(product.priceInCents / 100).toFixed(2)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.priceInCents && (
                    <span className="text-xs text-text-dim line-through">
                      ${(product.compareAtPrice / 100).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Tag Type */}
                <div className="md:col-span-2">
                  <span className="md:hidden text-xs text-text-dim">Type: </span>
                  <span className="text-sm text-text-muted">
                    {product.tagType ? TAG_TYPE_LABELS[product.tagType] || product.tagType : '—'}
                  </span>
                </div>

                {/* Stock */}
                <div className="md:col-span-1">
                  <span className="md:hidden text-xs text-text-dim">Stock: </span>
                  <span className={`text-sm ${product.stockQuantity === 0 ? 'text-error' : 'text-text-muted'}`}>
                    {product.stockQuantity}
                  </span>
                </div>

                {/* Orders */}
                <div className="md:col-span-1">
                  <span className="md:hidden text-xs text-text-dim">Orders: </span>
                  <span className="text-sm text-text-muted">{product._count.orderItems}</span>
                </div>

                {/* Status */}
                <div className="md:col-span-1 flex flex-wrap gap-1">
                  {product.deletedAt ? (
                    <Badge variant="error">Deleted</Badge>
                  ) : product.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">Inactive</Badge>
                  )}
                  {product.isFeatured && (
                    <Badge variant="warning">Featured</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex justify-end relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === product.id ? null : product.id);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-text-dim hover:text-text hover:bg-surface-overlay transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenu === product.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-surface shadow-lg shadow-shadow py-1">
                        <Link
                          href={`/admin/products/${product.id}`}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Product
                        </Link>
                        {!product.deletedAt && (
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              setDeleteTarget(product);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors w-full text-left"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Product
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-text-dim">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-raised disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 flex items-center justify-center rounded-md text-sm transition-colors ${
                    page === pageNum
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-text-muted hover:bg-surface-raised'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-raised disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-overlay" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text">Delete Product</h3>
            <p className="mt-2 text-sm text-text-muted">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-text">{deleteTarget.name}</span>? This will
              hide it from the store. This action can be undone by an admin.
            </p>
            {deleteTarget._count.orderItems > 0 && (
              <p className="mt-2 text-xs text-warning">
                This product has {deleteTarget._count.orderItems} order{deleteTarget._count.orderItems !== 1 ? 's' : ''} linked to it.
              </p>
            )}
            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(null)}
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
