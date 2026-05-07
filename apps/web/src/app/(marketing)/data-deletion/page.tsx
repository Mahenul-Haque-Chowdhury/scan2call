import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Data Deletion Instructions',
  description: 'How to request deletion of your Scan2Call account and associated personal data.',
  path: '/data-deletion',
  keywords: ['scan2call data deletion', 'account deletion', 'privacy request'],
});

const sections = [
  {
    title: '1. How To Request Deletion',
    content:
      'To request deletion of your Scan2Call account and associated personal data, email support@scan2call.net from the email address registered to your account with the subject "Data Deletion Request".',
  },
  {
    title: '2. Verification Process',
    content:
      'We may ask you to verify account ownership before processing the request so that we do not delete data for the wrong person.',
  },
  {
    title: '3. What We Delete',
    content:
      'Once verified, we will delete your account profile and associated personal data stored in Scan2Call, including contact details and account-linked service data, unless retention is required for legal, security, fraud-prevention, or billing obligations.',
  },
  {
    title: '4. Processing Time',
    content:
      'Verified deletion requests are processed within a reasonable timeframe. If extra verification is required, we will contact you using your registered email address.',
  },
  {
    title: '5. Contact',
    content:
      'If you have questions about deletion or privacy, contact support@scan2call.net.',
  },
];

export default function DataDeletionPage() {
  return (
    <>
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Data Deletion Instructions</h1>
            <p className="mt-4 text-sm text-text-dim">Last updated: April 2026</p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <StaggerContainer stagger={0.08} className="space-y-8">
            {sections.map((section) => (
              <StaggerItem key={section.title}>
                <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-6">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  <p className="mt-3 leading-relaxed text-text-muted">{section.content}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}