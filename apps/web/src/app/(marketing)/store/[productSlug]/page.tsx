import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient, { Product } from './product-detail-client';
import { absoluteUrl, createMetadata, createBreadcrumbSchema, SITE_NAME } from '@/lib/seo';
import { getApiOrigin } from '@/lib/api-origin';

const API_BASE = getApiOrigin();

type ProductFetchResult =
  | { status: 'found'; product: Product }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

export const dynamic = 'force-dynamic';

async function fetchProduct(productSlug: string): Promise<ProductFetchResult> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${productSlug}`, {
      next: { revalidate: 300 },
    });

    if (res.status === 404) return { status: 'not-found' };
    if (!res.ok) throw new Error('Failed to fetch product');

    const json: { data: Product } = await res.json();
    return json.data
      ? { status: 'found', product: json.data }
      : { status: 'not-found' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to load product',
    };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;
  const result = await fetchProduct(productSlug);

  if (result.status !== 'found') {
    return createMetadata({
      title: 'Product not found',
      description: 'This product could not be found.',
      path: `/store/${productSlug}`,
      noindex: true,
    });
  }

  const product = result.product;
  const description = product.shortDescription || product.description;
  const ogImages = product.images.length
    ? product.images.map((img) => ({ url: img.url, alt: img.altText || product.name }))
    : undefined;

  return createMetadata({
    title: product.name,
    description,
    path: `/store/${product.slug}`,
    images: ogImages,
    keywords: ['scan2call store', 'qr identity tag', product.name.toLowerCase()],
    noindex: !product.isActive,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const result = await fetchProduct(productSlug);

  if (result.status === 'not-found') {
    notFound();
  }

  if (result.status === 'error') {
    return <ProductDetailClient initialProduct={null} initialError={null} />;
  }

  const product = result.product;

  // Find My devices (Pet Collar, Keychain) are priced as a flat device price that
  // includes year 1; everything else is the per-year QR price.
  const offerPriceInCents =
    product.hasFindMy && product.devicePriceInCents
      ? product.devicePriceInCents
      : product.priceInCents;

  // Offers should carry a validity date; use ~1 year out.
  const priceValidUntilDate = new Date();
  priceValidUntilDate.setFullYear(priceValidUntilDate.getFullYear() + 1);
  const priceValidUntil = priceValidUntilDate.toISOString().slice(0, 10);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.images.map((img) => img.url),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/store/${product.slug}`),
      priceCurrency: 'AUD',
      price: (offerPriceInCents / 100).toFixed(2),
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.isInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Store', path: '/store' },
    { name: product.name, path: `/store/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
