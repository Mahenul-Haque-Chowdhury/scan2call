import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Terms of Service',
  description: 'Scan2Call terms of service - the rules and conditions for using our platform.',
  path: '/terms',
  keywords: ['scan2call terms', 'terms of service', 'qr tag terms'],
});

const sections = [
  { title: '1. Terms Provider', content: 'Scan2Call uses the Terms of Service published by its parent company, ZTEC Group Pty Ltd (ABN: 82 697 931 445).' },
  { title: '2. Acceptance of Terms', content: 'By accessing or using Scan2Call, you agree to the governing Terms of Service and Privacy Policy supplied by ZTEC Group Pty Ltd.' },
  { title: '3. Service Description', content: 'Scan2Call provides lost-and-found QR tag services, including tag activation, scan handling, and privacy-first relay communication between owners and finders.' },
  { title: '4. User Responsibilities', content: 'You are responsible for maintaining accurate account details, safeguarding your credentials, and using the platform lawfully.' },
  { title: '5. Full Terms of Service', content: 'The full governing Terms of Service are available at https://ztecgroup.au/terms-of-service.' },
];

export default function TermsPage() {
  return (
    <>
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-4 text-sm text-text-dim">Scan2Call follows the terms of ZTEC Group Pty Ltd (ABN: 82 697 931 445).</p>
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
                  {s.title === '5. Full Terms of Service' ? (
                    <a
                      href="https://ztecgroup.au/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Open ZTEC Group Terms of Service
                    </a>
                  ) : null}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
