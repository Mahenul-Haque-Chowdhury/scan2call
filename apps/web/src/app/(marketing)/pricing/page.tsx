import Link from 'next/link';
import PricingClient from './_components/pricing-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'QR Tag Pricing - Plans from $7.25/year',
  description:
    'Scan2Call pricing: QR tags from $7.25/year, Medical ID Band $14.49/year, and Find My devices from $29.99. Choose 1 to 5 years, optional auto-renewal, no subscription.',
  path: '/pricing',
  keywords: [
    'QR tag price',
    'QR tag cost Australia',
    'pet tag price',
    'Find My QR tag price',
    'medical ID band price',
    'lost item protection',
    'no subscription QR tag',
  ],
});

export default function PricingPage() {
  return (
    <>
      <PricingClient />

      {/* Server-rendered SEO content: indexable pricing explainer + internal links */}
      <section className="border-t border-border bg-surface/30 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Simple QR tag pricing, no subscription
          </h2>
          <p className="mt-4 leading-relaxed text-text-muted">
            With Scan2Call there is no monthly subscription. The QR tag itself is the product: you
            buy a tag and choose how long you want it active, from 1 to 5 years. Stickers and tags
            are $7.25 per year, the Medical ID Band is $14.49 per year, and Find My devices (the Pet
            Collar and Keychain tags) are $29.99 including the first year, then $7.25 per year to
            renew the QR. You can turn on optional auto-renewal at checkout so your QR never lapses.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold text-text">How much does a QR tag cost?</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Car, luggage, passport, and standard stickers start at $7.25 per year. The Medical ID
                Band is $14.49 per year. The Pet Collar and Keychain Find My devices are $29.99 with
                the first year included. Browse everything in the{' '}
                <Link href="/store" className="text-primary hover:underline">
                  store
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text">What happens when my QR expires?</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                When a QR expires it stops relaying contact, and scanning it shows a friendly notice.
                Renew it - or leave auto-renewal on - and it works again instantly. Your tag data is
                kept, so renewing is one step.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text">How much is shipping?</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Shipping is a $5 flat rate within Australia and $10 flat worldwide. See{' '}
                <Link href="/how-it-works" className="text-primary hover:underline">
                  how Scan2Call works
                </Link>{' '}
                or read the full{' '}
                <Link href="/faq" className="text-primary hover:underline">
                  FAQ
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
