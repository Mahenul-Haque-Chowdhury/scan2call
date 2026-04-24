'use client';

import Link from 'next/link';
import { Check, Zap, Globe, HeadphonesIcon } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

const features = [
  'Unlimited QR identity tags',
  'Unlimited scans and relay contacts',
  'Anonymous call, SMS & WhatsApp relay',
  'Real-time scan notifications with location',
  'Scan history and analytics',
  'Full access to the tag store',
  'Instant tag disable / block any contact',
  'Priority support',
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings at any time with no penalty.',
  },
  {
    q: 'Do tags work without a subscription?',
    a: 'Tags require an active subscription to relay contacts. Without one, scanning your tag shows a friendly "contact unavailable" message.',
  },
  {
    q: 'Are there limits on tags or scans?',
    a: 'No. Both plans include unlimited active tags and unlimited relay contacts.',
  },
];

const highlights = [
  { icon: Zap, label: 'Instant activation' },
  { icon: Globe, label: 'AU data residency' },
  { icon: HeadphonesIcon, label: 'Priority support' },
];

export default function PricingClient() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-text-muted">
              One plan. Everything included.{' '}
              <span className="text-gradient-ice">No hidden fees.</span>
            </p>
          </FadeIn>

          {/* Highlights */}
          <FadeIn delay={0.1} className="mt-8 flex items-center justify-center gap-6 flex-wrap">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center gap-2 text-sm text-text-muted">
                <h.icon className="h-4 w-4 text-primary" />
                {h.label}
              </div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Monthly */}
            <FadeIn delay={0.1}>
              <div className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-8 transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:shadow-shadow">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold">Monthly</h2>
                  <span className="text-xs text-text-dim bg-surface-raised rounded-full px-2.5 py-1 border border-border">
                    Flexible
                  </span>
                </div>
                <p className="text-sm text-text-muted mb-5">Pay month-to-month. Cancel anytime.</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-5xl font-bold tracking-tight text-gradient">$9.99</span>
                  <span className="text-text-dim">/mo AUD</span>
                </div>
                <p className="text-xs text-text-dim mb-8">Billed monthly</p>

                <ul className="space-y-3 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                      <span className="text-sm text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="mt-8 block w-full rounded-xl border border-primary/40 bg-transparent py-3 text-center text-sm font-semibold text-primary transition-all hover:bg-primary/10 hover:border-primary"
                >
                  Get Started
                </Link>
              </div>
            </FadeIn>

            {/* Yearly - best value */}
            <FadeIn delay={0.2}>
              <div className="group relative flex h-full flex-col rounded-2xl border-2 border-primary/40 bg-surface p-8 transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 glow-primary">
                {/* Top badge */}
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap shadow-md shadow-primary/30">
                  ✦ Best Value - Save 17%
                </span>

                <div className="flex items-center justify-between mb-1 mt-1">
                  <h2 className="text-lg font-bold">Yearly</h2>
                  <span className="text-xs font-semibold text-accent bg-accent-subtle rounded-full px-2.5 py-1 border border-accent/20">
                    ~$8.33/mo
                  </span>
                </div>
                <p className="text-sm text-text-muted mb-5">Lock in savings for the full year.</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-5xl font-bold tracking-tight text-gradient">$99.99</span>
                  <span className="text-text-dim">/yr AUD</span>
                </div>
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-sm text-text-dim line-through">$119.88</span>
                  <span className="text-xs font-semibold text-accent">Save $19.89</span>
                </div>

                <ul className="space-y-3 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="mt-8 block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover glow-sm hover:glow-md"
                >
                  Get Started - Save 17%
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Guarantee note */}
          <FadeIn delay={0.3} className="mt-6 text-center">
            <p className="text-sm text-text-dim">
              No credit card required to browse. Cancel anytime with no penalty.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="py-16 bg-surface/30">
        <div className="mx-auto max-w-2xl px-6">
          <FadeIn className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight">Common questions</h2>
          </FadeIn>
          <StaggerContainer stagger={0.08} className="space-y-4">
            {faqs.map((faq) => (
              <StaggerItem key={faq.q}>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <div className="font-semibold text-sm text-text mb-2">{faq.q}</div>
                  <div className="text-sm text-text-muted leading-relaxed">{faq.a}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.2} className="mt-6 text-center">
            <Link href="/faq" className="text-sm text-primary hover:underline underline-offset-4">
              View all FAQs →
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
