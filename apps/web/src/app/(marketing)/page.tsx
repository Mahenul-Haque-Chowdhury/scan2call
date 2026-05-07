import HomePageClient from './_components/home-page-client';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, createMetadata } from '@/lib/seo';

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
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/sca2call-logo.png'),
    parentOrganization: {
      '@type': 'Organization',
      name: 'ZTAC Group',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'AU',
      },
    },
    founder: {
      '@type': 'Organization',
      name: 'GrayVally Software Solutions',
      url: 'https://grayvally.tech',
    },
    sameAs: [
      'https://scan2call.net',
    ],
  };

  const grayvallySchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GrayVally Software Solutions',
    url: 'https://grayvally.tech',
  };

  const ztacSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ZTAC Group',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/store')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(grayvallySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ztacSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomePageClient />
    </>
  );
}
