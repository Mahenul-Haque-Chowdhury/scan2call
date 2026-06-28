import HomePageClient from './_components/home-page-client';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  createMetadata,
  createOrganizationSchema,
  createSiteNavigationSchema,
} from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Scan2Call - Privacy-First QR Identity Tags',
  description: SITE_DESCRIPTION,
  path: '/',
  keywords: [
    'privacy-first qr tags',
    'lost item recovery',
    'anonymous contact relay',
    'qr identity tag',
    'scan2call',
  ],
});

export default function HomePage() {
  const organizationSchema = createOrganizationSchema();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/'),
    inLanguage: 'en-AU',
    publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/store')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const siteNavigationSchema = createSiteNavigationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
      />
      <HomePageClient />
    </>
  );
}
