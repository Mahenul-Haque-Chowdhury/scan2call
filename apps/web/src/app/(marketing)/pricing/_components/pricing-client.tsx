"use client";

import Link from 'next/link';
import { Check, Zap, Globe, HeadphonesIcon, Building2, Sparkles, ShieldCheck } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { useAuth } from '@/providers/auth-provider';

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

const plans = [
  {
    name: 'Monthly',
    price: '$2.99',
    cadence: '/mo AUD',
    summary: 'Best for trying Scan2Call with zero long-term commitment.',
    badge: 'Most flexible',
    note: 'Cancel anytime. Perfect for getting started fast.',
    cta: 'Start Monthly',
    ctaHref: '/register',
    highlight: false,
    savings: null,
  },
  {
    name: 'Yearly',
    price: '$14.49',
    cadence: '/yr AUD',
    summary: 'The best value for most customers - lock in the lowest ongoing rate.',
    badge: 'Best value',
    note: 'One payment, full access for the year.',
    cta: 'Get Yearly Access',
    ctaHref: '/register',
    highlight: true,
    savings: 'Save with the annual plan',
  },
  {
    name: '5 Years',
    price: '$79.49',
    cadence: '/5 yrs AUD',
    summary: 'Maximum savings for long-term users, families, and power sellers.',
    badge: 'Locked-in value',
    note: 'A strong long-term choice with the most predictable pricing.',
    cta: 'Lock in 5 Years',
    ctaHref: '/register',
    highlight: false,
    savings: 'Best for long-term peace of mind',
  },
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
  {
    q: 'Do you offer business or bulk pricing?',
    a: 'Yes. Enterprise, bulk orders, and custom business proposals are available for larger rollouts and resellers.',
  },
];

const highlights = [
  { icon: Zap, label: 'Instant activation' },
  { icon: Globe, label: 'AU data residency' },
  { icon: HeadphonesIcon, label: 'Priority support' },
];

export default function PricingClient() {
  const { user } = useAuth();
  const ctaHref = user ? '/subscription' : '/register';

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-20 gradient-mesh text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-70">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Simple pricing that makes sense
            </h1>
            <p className="mt-4 text-lg text-text-muted">
              Choose a plan that fits how you protect your tags today, then scale when you’re ready.
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
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <FadeIn key={plan.name} delay={0.1 + index * 0.08}>
                <div
                  className={`group relative flex h-full flex-col rounded-3xl border bg-surface p-8 transition-all duration-300 ${
                    plan.highlight
                      ? 'border-primary/60 shadow-2xl shadow-primary/10 glow-primary scale-[1.01]'
                      : 'border-border hover:border-border-hover hover:shadow-lg hover:shadow-shadow'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap shadow-md shadow-primary/30">
                      Most Popular
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold tracking-tight">{plan.name}</h2>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${
                        plan.highlight
                          ? 'text-accent bg-accent-subtle border-accent/20'
                          : 'text-text-dim bg-surface-raised border-border'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <p className="text-sm text-text-muted mb-5 leading-relaxed">{plan.summary}</p>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-5xl font-bold tracking-tight text-gradient">{plan.price}</span>
                    <span className="text-text-dim">{plan.cadence}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs text-text-dim">{plan.note}</span>
                  </div>

                  {plan.savings && (
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {plan.savings}
                    </div>
                  )}

                  <ul className="space-y-3 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            plan.highlight ? 'text-primary' : 'text-accent'
                          }`}
                        />
                        <span className="text-sm text-text-secondary">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={ctaHref}
                    className={`mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                      plan.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary-hover glow-sm hover:glow-md'
                        : 'border border-primary/40 bg-transparent text-primary hover:bg-primary/10 hover:border-primary'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn
            delay={0.35}
            className="mt-8 rounded-3xl border border-border bg-surface/70 p-6 md:p-7 shadow-lg shadow-shadow"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                  <Building2 className="h-3.5 w-3.5" />
                  Enterprise / Bulk Orders
                </div>
                <h3 className="text-xl font-bold tracking-tight text-text">
                  Need a business proposal, bulk tags, or team pricing?
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  For schools, retailers, councils, resellers, and larger rollouts, we can tailor volume
                  pricing, branded onboarding, and a custom rollout plan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  Request Proposal
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text-secondary hover:border-primary/30 hover:text-text transition-colors"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
          </FadeIn>

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
