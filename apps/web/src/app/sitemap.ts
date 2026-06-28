import type { MetadataRoute } from 'next';
import { PUBLIC_SITE_LINKS } from '@/lib/seo';

const BASE_URL = process.env.APP_URL || 'https://scan2call.com.au';
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3003';

interface Product {
  slug: string;
  updatedAt: string;
}

interface BlogPost {
  slug: string;
  publishedAt: string | null;
  updatedAt?: string;
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog-posts?pageSize=200`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const priorityByPath: Record<string, number> = {
    '/': 1,
    '/store': 0.9,
    '/pricing': 0.9,
    '/how-it-works': 0.8,
    '/about': 0.8,
    '/blog': 0.7,
    '/faq': 0.7,
    '/contact': 0.5,
  };
  const weeklyPages = new Set(['/', '/store', '/blog']);
  const staticPages: MetadataRoute.Sitemap = [
    ...PUBLIC_SITE_LINKS.map((link) => ({
      url: link.path === '/' ? BASE_URL : `${BASE_URL}${link.path}`,
      lastModified: new Date(),
      changeFrequency: weeklyPages.has(link.path) ? 'weekly' as const : 'monthly' as const,
      priority: priorityByPath[link.path] ?? 0.5,
    })),
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/data-deletion`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // Fetch dynamic product + blog pages from the API.
  const [products, posts] = await Promise.all([fetchProducts(), fetchBlogPosts()]);

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/store/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt ? new Date(post.updatedAt || post.publishedAt || '') : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...blogPages];
}
