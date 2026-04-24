import type { Metadata } from 'next';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Scan2Call privacy policy - how we collect, use, and protect your personal information.',
};

const sections = [
  { title: '1. Information We Collect', content: 'We collect information you provide when creating an account (email, phone number) and data generated through the use of our service (scan events, relay sessions).' },
  { title: '2. How We Use Your Information', content: 'Your information is used to facilitate anonymous relay communication between tag owners and finders, manage your subscription, and improve our services.' },
  { title: '3. Data Storage', content: 'All data is stored in the ap-southeast-2 (Sydney) region in compliance with the Australian Privacy Act 1988.' },
  { title: '4. Third-Party Services', content: 'We use Twilio for communication relay, Stripe for payment processing, and Cloudflare R2 for asset storage. Each provider has their own privacy policy.' },
  { title: '5. Contact', content: 'For privacy-related enquiries, please contact us at privacy@scan2call.com.au.' },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-sm text-text-dim">Last updated: January 2025</p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <StaggerContainer stagger={0.08} className="space-y-8">
            {sections.map((s) => (
              <StaggerItem key={s.title}>
                <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-6">
                  <h2 className="text-xl font-semibold">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-text-muted">{s.content}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
