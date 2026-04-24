'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  priceInCents: number;
  compareAtPrice: number | null;
  sku: string;
  stockQuantity: number;
  tagType: string | null;
  includesTagCount: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImage[];
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  priceInCents: string;
  compareAtPrice: string;
  sku: string;
  stockQuantity: string;
  tagType: string;
  includesTagCount: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
  metaTitle: string;
  metaDescription: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  priceInCents: '',
  compareAtPrice: '',
  sku: '',
  stockQuantity: '0',
  tagType: '',
  includesTagCount: '1',
  isActive: true,
  isFeatured: false,
  sortOrder: '0',
  metaTitle: '',
  metaDescription: '',
};

const TAG_TYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'PET_COLLAR', label: 'Pet Collar' },
  { value: 'CAR_STICKER', label: 'Car Sticker' },
  { value: 'LUGGAGE_TAG', label: 'Luggage Tag' },
  { value: 'KEYCHAIN', label: 'Keychain' },
  { value: 'MEDICAL_BAND', label: 'Medical Band' },
  { value: 'GENERIC', label: 'Generic' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch existing product ───
  useEffect(() => {
    if (!productId) return;

    async function load() {
      try {
        const result = await apiClient.get<{ data: ProductData }>(`/admin/products/${productId}`);
        const product = result.data;
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          priceInCents: String(product.priceInCents),
          compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
          sku: product.sku,
          stockQuantity: String(product.stockQuantity),
          tagType: product.tagType || '',
          includesTagCount: String(product.includesTagCount),
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          sortOrder: String(product.sortOrder),
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
        });
        setImages(product.images || []);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [productId]);

  // ─── Auto-generate slug from name ───
  function handleNameChange(name: string) {
    const updated: Partial<FormState> = { name };
    if (!isEdit || !form.slug) {
      updated.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    setForm((f) => ({ ...f, ...updated }));
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  // ─── Validation ───
  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
      errs.slug = 'Lowercase letters, numbers, and dashes only';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';

    const price = parseInt(form.priceInCents, 10);
    if (isNaN(price) || price < 0) errs.priceInCents = 'Enter a valid price in cents';

    if (form.compareAtPrice) {
      const compare = parseInt(form.compareAtPrice, 10);
      if (isNaN(compare) || compare < 0) errs.compareAtPrice = 'Enter a valid price';
    }

    const stock = parseInt(form.stockQuantity, 10);
    if (isNaN(stock) || stock < 0) errs.stockQuantity = 'Must be 0 or more';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Image upload ───
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setSubmitError(null);

    try {
      for (const file of Array.from(files)) {
        // 1. Get presigned URL (response wrapped in { data } envelope)
        const result = await apiClient.post<{
          data: { uploadUrl: string; key: string; publicUrl: string };
        }>('/media/upload-url', {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder: 'products',
        });
        const { uploadUrl, key, publicUrl } = result.data;

        // 2. Upload directly to S3/R2
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        // 3. Add to local images state (will save with product)
        setImages((prev) => [
          ...prev,
          {
            id: `temp-${key}`,
            url: publicUrl,
            altText: null,
            sortOrder: prev.length,
          },
        ]);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Submit ───
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      sku: form.sku.trim(),
      priceInCents: parseInt(form.priceInCents, 10),
      stockQuantity: parseInt(form.stockQuantity, 10),
      includesTagCount: parseInt(form.includesTagCount, 10),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
    };

    if (form.shortDescription.trim()) payload.shortDescription = form.shortDescription.trim();
    if (form.compareAtPrice) payload.compareAtPrice = parseInt(form.compareAtPrice, 10);
    if (form.tagType) payload.tagType = form.tagType;
    if (form.metaTitle.trim()) payload.metaTitle = form.metaTitle.trim();
    if (form.metaDescription.trim()) payload.metaDescription = form.metaDescription.trim();

    try {
      let savedProduct: ProductData;

      if (isEdit) {
        const patchResult = await apiClient.patch<{ data: ProductData }>(`/admin/products/${productId}`, payload);
        savedProduct = patchResult.data;
      } else {
        const postResult = await apiClient.post<{ data: ProductData }>('/admin/products', payload);
        savedProduct = postResult.data;
      }

      // Save images - create new ProductImage records for temp images
      const newImages = images.filter((img) => img.id.startsWith('temp-'));
      for (const img of newImages) {
        const imagePayload: Record<string, unknown> = {
          url: img.url,
          sortOrder: img.sortOrder,
        };
        if (img.altText) imagePayload.altText = img.altText;
        await apiClient.post(`/admin/products/${savedProduct.id}/images`, imagePayload);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/admin/products/${savedProduct.id}`);
      }, 600);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading state ───
  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* Title */}
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-text font-display">
        {isEdit ? 'Edit Product' : 'New Product'}
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        {isEdit ? 'Update product details and images.' : 'Add a new product to the store catalog.'}
      </p>

      {/* Alerts */}
      {submitError && (
        <Alert variant="error" className="mt-4" dismissible>
          {submitError}
        </Alert>
      )}
      {submitSuccess && (
        <Alert variant="success" className="mt-4">
          Product {isEdit ? 'updated' : 'created'} successfully! Redirecting...
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* ─── Basic Info ─── */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-5">
            Basic Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Product Name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Pet Collar QR Tag"
              error={errors.name}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setField('slug', e.target.value)}
                placeholder="pet-collar-qr-tag"
                error={errors.slug}
                hint="URL-friendly identifier (auto-generated from name)"
                required
              />
              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setField('sku', e.target.value)}
                placeholder="SC-PET-001"
                error={errors.sku}
                required
              />
            </div>
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Full product description..."
              error={errors.description}
              required
            />
            <Input
              label="Short Description"
              value={form.shortDescription}
              onChange={(e) => setField('shortDescription', e.target.value)}
              placeholder="Brief summary (optional)"
              hint="Max 500 characters, used in product cards"
            />
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-5">
            Pricing & Inventory
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Price (cents AUD)"
              type="number"
              value={form.priceInCents}
              onChange={(e) => setField('priceInCents', e.target.value)}
              placeholder="1999"
              error={errors.priceInCents}
              hint={form.priceInCents ? `$${(parseInt(form.priceInCents) / 100).toFixed(2)} AUD` : 'Enter price in cents'}
              required
            />
            <Input
              label="Compare At Price (cents)"
              type="number"
              value={form.compareAtPrice}
              onChange={(e) => setField('compareAtPrice', e.target.value)}
              placeholder="2499"
              error={errors.compareAtPrice}
              hint="Original price for showing a discount"
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={form.stockQuantity}
              onChange={(e) => setField('stockQuantity', e.target.value)}
              error={errors.stockQuantity}
              min={0}
            />
          </div>
        </section>

        {/* ─── Tag Settings ─── */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-5">
            Tag Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tag Type"
              options={TAG_TYPE_OPTIONS}
              value={form.tagType}
              onChange={(e) => setField('tagType', e.target.value)}
            />
            <Input
              label="Includes Tag Count"
              type="number"
              value={form.includesTagCount}
              onChange={(e) => setField('includesTagCount', e.target.value)}
              hint="Number of tags included per purchase"
              min={0}
            />
          </div>
        </section>

        {/* ─── Images ─── */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-5">
            Product Images
          </h2>

          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {images.map((img, idx) => (
                <div key={img.id} className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-surface-raised">
                  <img
                    src={img.url}
                    alt={img.altText || `Image ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-bg/80 text-text-muted hover:text-error hover:bg-bg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-accent/40 bg-surface-raised/50 py-8 px-4 cursor-pointer transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                <p className="mt-2 text-sm text-text-muted">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-text-dim/50" />
                <p className="mt-2 text-sm text-text-muted">
                  Click to upload images
                </p>
                <p className="text-xs text-text-dim mt-1">
                  JPEG, PNG, or WebP · Max 5MB each
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
        </section>

        {/* ─── Visibility ─── */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-5">
            Visibility & Ordering
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                />
                <div>
                  <span className="text-sm font-medium text-text">Active</span>
                  <p className="text-xs text-text-dim">Product is visible in the store</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setField('isFeatured', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                />
                <div>
                  <span className="text-sm font-medium text-text">Featured</span>
                  <p className="text-xs text-text-dim">Show on featured products section</p>
                </div>
              </label>
            </div>
            <Input
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', e.target.value)}
              hint="Lower numbers appear first"
              className="sm:max-w-50"
            />
          </div>
        </section>

        {/* ─── SEO ─── */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-5">
            SEO (Optional)
          </h2>
          <div className="space-y-4">
            <Input
              label="Meta Title"
              value={form.metaTitle}
              onChange={(e) => setField('metaTitle', e.target.value)}
              placeholder="Custom page title for search engines"
              hint="Max 200 characters"
            />
            <Textarea
              label="Meta Description"
              value={form.metaDescription}
              onChange={(e) => setField('metaDescription', e.target.value)}
              placeholder="Custom description for search engines"
              hint="Max 500 characters"
              className="min-h-20"
            />
          </div>
        </section>

        {/* ─── Submit ─── */}
        <div className="flex items-center justify-between pb-8">
          <Link href="/admin/products">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            loading={saving}
            icon={<Save className="h-4 w-4" />}
          >
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
