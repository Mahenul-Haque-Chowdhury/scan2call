import type { Metadata } from 'next';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Scan2Call terms of service - the rules and conditions for using our platform.',
};

const sections = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using Scan2Call, you agree to be bound by these Terms of Service and our Privacy Policy.' },
  { title: '2. Service Description', content: 'Scan2Call provides privacy-first QR identity tags with anonymous relay communication between tag owners and finders.' },
  { title: '3. Subscription', content: 'Access to Scan2Call features requires an active subscription at $9.99/mo AUD. Subscriptions are billed monthly or annually through Stripe and may be cancelled at any time.' },
  { title: '4. User Responsibilities', content: 'You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.' },
  { title: '5. Limitation of Liability', content: 'Scan2Call is provided "as is" without warranty. We are not liable for any loss or damage arising from the use of our service.' },
];

export default function TermsPage() {
  return (
    <>
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
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
