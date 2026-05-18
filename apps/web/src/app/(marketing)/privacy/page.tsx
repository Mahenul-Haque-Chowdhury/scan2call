import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description: 'Scan2Call privacy policy - how we collect, use, and protect your personal information.',
  path: '/privacy',
  keywords: ['scan2call privacy policy', 'data protection', 'qr tag privacy'],
});

const sections = [
  { title: '1. Policy Provider', content: 'Scan2Call uses the Privacy Policy published by its parent company, ZTEC Group Pty Ltd (ABN: 82 697 931 445).' },
  { title: '2. Information We Collect', content: 'We collect information you provide when creating an account, subscription, or contact request, along with service data generated through tag scans and relay sessions.' },
  { title: '3. How We Use Your Information', content: 'Your information is used to operate Scan2Call, facilitate anonymous relay communication, manage subscriptions, respond to enquiries, and improve service reliability.' },
  { title: '4. Third-Party Services', content: 'Scan2Call may use providers such as Stripe, Twilio, and Cloudflare R2 to deliver payments, communication relay, and storage. Those providers maintain their own privacy practices.' },
  { title: '5. Full Privacy Policy', content: 'The full governing Privacy Policy is available at https://ztecgroup.au/privacy-policy.' },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-sm text-text-dim">Scan2Call follows the privacy policy of ZTEC Group Pty Ltd (ABN: 82 697 931 445).</p>
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
                  {s.title === '5. Full Privacy Policy' ? (
                    <a
                      href="https://ztecgroup.au/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Open ZTEC Group Privacy Policy
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
