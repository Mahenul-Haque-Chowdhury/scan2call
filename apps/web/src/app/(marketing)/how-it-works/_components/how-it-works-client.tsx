'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag, ScanLine, ShieldCheck, Bell,
  ArrowRight, Phone, MessageSquare, Smartphone,
  EyeOff, Lock, Globe,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

const steps = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Get Your Tags',
    description:
      'Purchase Scan2Call QR tags from our store. Each tag has a unique, non-sequential token that cannot be guessed or forged.',
    detail: 'Available as collar tags, stickers, luggage tags, keychains, and more.',
  },
  {
    number: '02',
    icon: ScanLine,
    title: 'Activate & Attach',
    description:
      'Link each tag to your account in under a minute, then attach it to whatever you want to protect.',
    detail: 'Keys, luggage, pets, laptops, cars - anything that matters to you.',
  },
  {
    number: '03',
    icon: Phone,
    title: 'Someone Finds Your Item',
    description:
      'When a finder scans the QR code, they see a branded contact page with options to call, text, or WhatsApp you.',
    detail: 'No app download required. Works on any smartphone camera.',
  },
  {
    number: '04',
    icon: ShieldCheck,
    title: 'Anonymous Relay',
    description:
      'All communication is relayed through Scan2Call. The finder never sees your real phone number, email, or any personal detail.',
    detail: 'Relay sessions auto-expire. You stay in full control.',
  },
];

const channels = [
  { icon: Phone, label: 'Voice Call', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: MessageSquare, label: 'SMS', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: Smartphone, label: 'WhatsApp', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
];

const guarantees = [
  { icon: EyeOff, text: 'Your number is never revealed' },
  { icon: Lock, text: 'Sessions auto-expire for safety' },
  { icon: Bell, text: 'You get a notification on every scan' },
  { icon: Globe, text: 'AU data residency, Privacy Act compliant' },
];

export default function HowItWorksClient() {
  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden pt-32 pb-20 gradient-mesh">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              The Full Picture
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              How Scan<span className="text-primary">2</span>Call works
            </h1>
            <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
              From purchase to protection in minutes. Your identity stays hidden at every step.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-6">
            {steps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.1}>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="group flex gap-6 rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-7 hover:border-primary/25 hover:bg-surface transition-all duration-300"
                >
                  {/* Number + icon column */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted border border-primary/25 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <step.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 min-h-[2rem] bg-gradient-to-b from-primary/20 to-transparent" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black text-primary/50 font-display tracking-widest group-hover:text-primary/70 transition-colors">
                        {step.number}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-text-muted leading-relaxed">{step.description}</p>
                    <p className="mt-2 text-sm text-text-dim">{step.detail}</p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Contact channels */}
      <section className="py-20 bg-surface/30 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh-strong opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6">
          <FadeIn className="text-center mb-12">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent mb-4">
              Contact Options
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three ways to reach you - all anonymous
            </h2>
            <p className="mt-3 text-text-muted max-w-xl mx-auto">
              Finders choose how they want to get in touch. All channels go through our relay.
            </p>
          </FadeIn>

          <StaggerContainer stagger={0.1} className="grid gap-4 sm:grid-cols-3">
            {channels.map((ch) => (
              <StaggerItem key={ch.label}>
                <div className={`flex flex-col items-center gap-3 rounded-2xl border p-8 text-center ${ch.bg} transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-bg/50`}>
                    <ch.icon className={`h-7 w-7 ${ch.color}`} />
                  </div>
                  <span className="font-semibold text-text">{ch.label}</span>
                  <span className="text-xs text-text-dim">Fully relayed, anonymous</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              What we guarantee
            </h2>
          </FadeIn>
          <StaggerContainer stagger={0.08} className="grid gap-4 sm:grid-cols-2">
            {guarantees.map((g) => (
              <StaggerItem key={g.text}>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-surface/60 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted border border-primary/20">
                    <g.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">{g.text}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-mesh-strong">
        <FadeIn className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to protect what matters?
          </h2>
          <p className="mt-3 text-text-muted">
            One plan, $9.99/mo, cancel anytime.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover glow-md hover:glow-lg transition-all"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold text-text-secondary hover:border-primary/30 hover:text-text transition-colors"
            >
              Browse the Store
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
