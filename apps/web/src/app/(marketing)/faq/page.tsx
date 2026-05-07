import FaqClient from './_components/faq-client';
import { createMetadata, absoluteUrl, SITE_NAME } from '@/lib/seo';
import { faqCategories } from './faq-data';

export const metadata = createMetadata({
  title: 'FAQ',
  description: 'Frequently asked questions about Scan2Call QR identity tags and privacy-first lost item recovery.',
  path: '/faq',
  keywords: ['scan2call faq', 'qr tag questions', 'lost item recovery help'],
});

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((category) =>
      category.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    ),
    url: absoluteUrl('/faq'),
    name: `${SITE_NAME} FAQ`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqClient />
    </>
  );
}
