import type { Metadata } from 'next';

type OpenGraphImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export const SITE_NAME = 'Scan2Call';
export const SITE_DESCRIPTION =
  'Protect your valuables with anonymous QR tags. When someone finds your lost item, they can contact you without ever seeing your personal details.';
export const DEFAULT_OG_IMAGE = '/images/sca2callhero.png';

export function getSiteUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://scan2call.net';
}

export function absoluteUrl(path = '/'): string {
  return new URL(path, getSiteUrl()).toString();
}

export function createMetadata(input: {
  title: string;
  description: string;
  path?: string;
  images?: OpenGraphImage[];
  openGraphType?: 'website';
  keywords?: string[];
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path || '/');
  const ogImages: OpenGraphImage[] = input.images?.length
    ? input.images
    : [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} preview`,
        },
      ];

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: ogImages.map((image) => image.url),
    },
    robots: input.noindex ? { index: false, follow: false } : undefined,
  };
}
