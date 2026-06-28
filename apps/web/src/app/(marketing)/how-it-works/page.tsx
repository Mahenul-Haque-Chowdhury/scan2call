import HowItWorksClient from './_components/how-it-works-client';
import { absoluteUrl, createMetadata, createBreadcrumbSchema } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'How It Works - Anonymous QR Lost & Found',
  description:
    'See how Scan2Call QR tags reunite you with lost items while keeping your phone number, email, and address private. Scan, relay, reconnect - no app needed for finders.',
  path: '/how-it-works',
  keywords: [
    'how QR lost and found works',
    'how Scan2Call works',
    'anonymous QR contact',
    'QR tag privacy',
    'scan QR to contact owner',
  ],
});

const howToSteps = [
  {
    name: 'Create your account',
    text: 'Sign up for free, then buy the QR tags you need. No subscription required.',
  },
  {
    name: 'Get your tags',
    text: 'Order tags online or pick up pre-assigned tags from a physical store.',
  },
  {
    name: 'Activate each tag',
    text: 'Sign in, scan the QR code, and link each tag to your account in seconds.',
  },
  {
    name: 'Attach and stay protected',
    text: 'Attach the tag to your item. Anyone who finds it can contact you anonymously through the relay, without ever seeing your phone number, email, or address.',
  },
];

export default function HowItWorksPage() {
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How Scan2Call works',
    description:
      'How to protect your belongings with Scan2Call privacy-first QR identity tags, from sign-up to anonymous contact relay.',
    inLanguage: 'en-AU',
    totalTime: 'PT5M',
    step: howToSteps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${absoluteUrl('/how-it-works')}#step-${index + 1}`,
    })),
  };

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'How it Works', path: '/how-it-works' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HowItWorksClient />
    </>
  );
}
