import Link from 'next/link';
import StorePageClient from './_components/store-page-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Shop QR Tags - Pet, Luggage, Car, Passport & Medical',
  description:
    'Buy privacy-first QR tags for pets, luggage, cars, passports, keys, and medical IDs. Finders contact you anonymously with no app required. Ships across Australia and worldwide.',
  path: '/store',
  keywords: [
    'buy QR pet tag',
    'QR luggage tag',
    'car windshield QR sticker',
    'passport QR sticker',
    'keychain QR tag',
    'medical ID QR band',
    'QR tag store Australia',
  ],
});

export default function StorePage() {
  return (
    <>
      <StorePageClient />

      {/* Server-rendered SEO content: indexable, keyword-rich, internally linked */}
      <section className="border-t border-border bg-surface/30 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            QR tags for everything you can lose
          </h2>
          <p className="mt-4 leading-relaxed text-text-muted">
            Every Scan2Call tag is a privacy-first QR code. When someone finds your lost item and
            scans it, they reach you through an anonymous relay - they can call, text, or message you
            on WhatsApp without ever seeing your phone number, email, or address. There is no app to
            download for the finder, and you choose how long each QR stays active (1 to 5 years) at
            checkout. See exactly{' '}
            <Link href="/how-it-works" className="text-primary hover:underline">
              how it works
            </Link>{' '}
            or compare{' '}
            <Link href="/pricing" className="text-primary hover:underline">
              QR tag pricing
            </Link>
            .
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-text">Pet collar QR tags</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                A scannable pet ID tag for dog and cat collars. If your pet wanders off, a finder
                scans the tag and reaches you in seconds - no microchip scanner needed. Our Pet
                Collar tag also works with Apple Find My and Google Find My Device.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text">Luggage &amp; travel tags</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Durable QR luggage tags and passport stickers for suitcases, backpacks, and travel
                documents. A great way to get a lost bag or passport back without printing your
                personal details on the outside.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text">Car windshield stickers</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Anonymous contact for your parked car. If someone bumps your vehicle or needs you to
                move it, they can reach you through the relay without exposing your number.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text">Medical ID bands &amp; keychains</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Medical ID QR bands keep emergency contact details private until they are needed, and
                keychain QR tags protect keys, bags, and everyday carry. Browse the full range above.
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm text-text-muted">
            Tags ship across Australia ($5 flat) and worldwide ($10 flat). Have a question first?
            Read the{' '}
            <Link href="/faq" className="text-primary hover:underline">
              frequently asked questions
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
