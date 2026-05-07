import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient, { Product } from './product-detail-client';
import { absoluteUrl, createMetadata } from '@/lib/seo';
import { getApiOrigin } from '@/lib/api-origin';

const API_BASE = getApiOrigin();

async function fetchProduct(productSlug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${productSlug}`, {
      next: { revalidate: 300 },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch product');

    const json: { data: Product } = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { productSlug: string };
}): Promise<Metadata> {
  const product = await fetchProduct(params.productSlug);

  if (!product) {
    return createMetadata({
      title: 'Product not found',
      description: 'This product could not be found.',
      path: `/store/${params.productSlug}`,
      noindex: true,
    });
  }

  const description = product.shortDescription || product.description;
  const ogImages = product.images.length
    ? product.images.map((img) => ({ url: img.url, alt: img.altText || product.name }))
    : undefined;

  return createMetadata({
    title: product.name,
    description,
    path: `/store/${product.slug}`,
    images: ogImages,
    openGraphType: 'product',
    keywords: ['scan2call store', 'qr identity tag', product.name.toLowerCase()],
    noindex: !product.isActive,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: { productSlug: string };
}) {
  const product = await fetchProduct(params.productSlug);

  if (!product) {
    notFound();
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.images.map((img) => img.url),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Scan2Call',
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/store/${product.slug}`),
      priceCurrency: 'AUD',
      price: (product.priceInCents / 100).toFixed(2),
      availability: product.isInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
