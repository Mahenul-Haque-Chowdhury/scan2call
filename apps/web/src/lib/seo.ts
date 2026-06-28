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

// Legal / company entity (kept consistent across JSON-LD, llms.txt, footer).
export const COMPANY_LEGAL_NAME = 'ZTEC Group Pty Ltd';
export const COMPANY_ABN = '82 697 931 445';
export const CONTACT_EMAIL = 'contact@scan2call.com.au';
export const DEVELOPER_NAME = 'GrayVally Software Solutions';
export const DEVELOPER_URL = 'https://grayvally.tech';
export const COMPANY_ADDRESS = {
  streetAddress: '1 Silas Street',
  addressLocality: 'East Fremantle',
  addressRegion: 'WA',
  postalCode: '6158',
  addressCountry: 'AU',
} as const;
export const PUBLIC_SITE_LINKS = [
  { path: '/', name: 'Home' },
  { path: '/how-it-works', name: 'How It Works' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/store', name: 'Store' },
  { path: '/blog', name: 'Blog' },
  { path: '/faq', name: 'FAQ' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
] as const;

export function getSiteUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://scan2call.com.au';
}

export function absoluteUrl(path = '/'): string {
  return new URL(path, getSiteUrl()).toString();
}

export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: COMPANY_LEGAL_NAME,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/sca2call-logo.png'),
    },
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      ...COMPANY_ADDRESS,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: CONTACT_EMAIL,
      areaServed: 'AU',
      availableLanguage: 'en',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: COMPANY_LEGAL_NAME,
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'ABN',
        value: COMPANY_ABN,
      },
      address: {
        '@type': 'PostalAddress',
        ...COMPANY_ADDRESS,
      },
    },
    founder: {
      '@type': 'Organization',
      name: DEVELOPER_NAME,
      url: DEVELOPER_URL,
    },
  };
}

export function createBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createSiteNavigationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAME} primary navigation`,
    itemListElement: PUBLIC_SITE_LINKS.map((link, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: link.name,
      url: absoluteUrl(link.path),
    })),
  };
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
      locale: 'en_AU',
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
