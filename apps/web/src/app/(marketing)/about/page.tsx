import type { Metadata } from 'next';
import { Shield, Globe, Users, Zap } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Scan2Call - the privacy-first QR identity tag system that helps reunite lost items with their owners.',
};

const values = [
  {
    icon: Shield,
    title: 'Privacy by Design',
    description:
      'We built the relay architecture before anything else. Your identity is never stored in a scannable format.',
  },
  {
    icon: Globe,
    title: 'Local & Compliant',
    description:
      'Built and operated in Australia. All data stays in Sydney (ap-southeast-2) under the Australian Privacy Act.',
  },
  {
    icon: Users,
    title: 'People First',
    description:
      'We designed for the moment someone picks up your lost keys. Simple, stress-free, no app required.',
  },
  {
    icon: Zap,
    title: 'Always On',
    description:
      'Our relay infrastructure runs 24/7. When someone finds your item at 3am, you hear about it.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-20 gradient-mesh">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Our Story
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
              About Scan2Call
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-text-muted max-w-2xl">
              Scan2Call is a privacy-first QR identity tag system designed to help people recover
              lost valuables. Our tags allow finders to contact owners without exposing any personal
              information - no phone numbers, no email addresses, no names.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-muted max-w-2xl">
              We started because we lost things, and existing solutions required finders to have
              apps, accounts, or full visibility of our contact details. We built something better.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight">What we stand for</h2>
          </FadeIn>
          <StaggerContainer stagger={0.1} className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <div className="group rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-6 hover:border-primary/25 transition-all duration-300">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted border border-primary/20 mb-4 group-hover:bg-primary transition-all duration-300">
                    <v.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{v.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-mesh-strong">
        <FadeIn className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to protect your world?
          </h2>
          <p className="text-text-muted mb-8">
            Join thousands of Australians who trust Scan2Call to keep them connected to what matters.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover glow-md transition-all"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 text-sm font-semibold text-text-secondary hover:border-primary/30 hover:text-text transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
