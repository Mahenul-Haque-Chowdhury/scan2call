"use client";

import Link from 'next/link';
import {
  Check,
  Zap,
  Globe,
  HeadphonesIcon,
  Building2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { useCurrency } from '@/providers/currency-provider';

const includedFeatures = [
  'Anonymous call, SMS & WhatsApp relay',
  'Real-time scan notifications with location',
  'Scan history and analytics',
  'Instant tag disable / block any contact',
  'Choose 1 to 5 years at checkout',
  'Optional auto-renewal before expiry',
];

// Base prices in AUD cents (the charge currency). The card headline is rendered in the
// visitor's local currency (approximate); prose/cadence stays AUD for clarity.
const plans = [
  {
    name: 'Stickers & Tags',
    priceCents: 725,
    cadence: '/year',
    summary: 'Car windshield, luggage, passport and standard QR stickers.',
    badge: 'Most popular',
    note: 'Pay only for the years you want, from 1 to 5.',
    highlight: true,
    savings: 'From $7.25/yr AUD - the everyday choice',
  },
  {
    name: 'Medical ID Band',
    priceCents: 1449,
    cadence: '/year',
    summary: 'Adjustable QR wristband for medical, dementia, or child safety.',
    badge: 'For people',
    note: 'Built for fast, reliable contact in an emergency.',
    highlight: false,
    savings: null,
  },
  {
    name: 'Find My Devices',
    priceCents: 2999,
    cadence: 'device + $7.25/yr AUD',
    summary: 'Pet Collar and Keychain trackers with Apple Find My and Google Find My Device.',
    badge: 'Smart tracking',
    note: 'Device price includes the first year of QR service.',
    highlight: false,
    savings: 'Renews at $7.25/yr AUD',
  },
];

const faqs = [
  {
    q: 'How does pricing work now?',
    a: 'The QR is the product. You buy a tag and choose how long you want it active, from 1 to 5 years. Stickers and tags are $7.25/year, the Medical ID Band is $14.49/year, and Find My devices are $29.99 (which includes the first year) plus $7.25/year after that.',
  },
  {
    q: 'What happens when my QR expires?',
    a: 'When a QR expires it stops relaying contact. Turn on auto-renewal at checkout and we will renew it for another year before it lapses, or renew it yourself anytime. We email you about a month before expiry.',
  },
  {
    q: 'Do I need an account or subscription?',
    a: 'No subscription. Create a free account to manage your tags, then buy exactly what you need from the store. Supermarket tags can be activated for free for their included period.',
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
  const { formatCompact, isBase } = useCurrency();
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
              Pay per year, only for what you protect
            </h1>
            <p className="mt-4 text-lg text-text-muted">
              No subscription. Buy a QR tag, choose 1 to 5 years at checkout, and turn on auto-renewal if you want it to never lapse.
            </p>
            {!isBase && (
              <p className="mt-2 text-xs text-text-dim">
                Prices shown in your local currency are approximate. You are charged in AUD.
              </p>
            )}
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
                      Best Seller
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
                    <span className="text-5xl font-bold tracking-tight text-gradient">{formatCompact(plan.priceCents)}</span>
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
                    {includedFeatures.map((f) => (
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
                    href="/store"
                    className={`mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                      plan.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary-hover glow-sm hover:glow-md'
                        : 'border border-primary/40 bg-transparent text-primary hover:bg-primary/10 hover:border-primary'
                    }`}
                  >
                    Browse the Store
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Auto-renew note */}
          <FadeIn delay={0.3} className="mt-8">
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface/70 p-5">
              <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-text-muted leading-relaxed">
                <span className="font-semibold text-text">Auto-renewal</span> is optional. Turn it on at
                checkout and we will renew your QR for one more year before it expires, charging your saved
                card. We send a reminder about a month before, and you can turn it off anytime.
              </p>
            </div>
          </FadeIn>

          {/* Enterprise / bulk */}
          <FadeIn
            delay={0.35}
            className="mt-6 rounded-3xl border border-border bg-surface/70 p-6 md:p-7 shadow-lg shadow-shadow"
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
              No credit card required to browse. No subscription, no lock-in.
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
