import FaqClient from './_components/faq-client';
import { createMetadata, absoluteUrl, SITE_NAME } from '@/lib/seo';
import { faqCategories } from './faq-data';

export const metadata = createMetadata({
  title: 'FAQ - QR Tags, Pricing, Privacy & Renewals',
  description:
    'Answers to common questions about Scan2Call QR identity tags: how the anonymous relay works, pricing and renewals, activation, and privacy.',
  path: '/faq',
  keywords: [
    'Scan2Call FAQ',
    'QR tag questions',
    'how does a QR tag work',
    'QR tag renewal',
    'lost item recovery help',
  ],
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
