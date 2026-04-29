'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  Shield, Phone, MapPin, QrCode, User,
  PawPrint, Car, Luggage, KeyRound, HeartPulse, ArrowRight,
  EyeOff, ShieldCheck, Lock, Globe, Star, CheckCircle2,
  Zap, Users, ScanLine, Clock,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

const products = [
  {
    name: 'Luggage Tag',
    description: 'Durable tags so finders can reach you at the airport.',
    icon: Luggage,
    image: '/images/products/luggage-tag.png',
    iconColor: 'text-violet-400',
    badge: 'Most Popular',
    price: '$14.99',
  },
  {
    name: 'Pet Collar Tag',
    description: 'Keep your furry friends safe with scannable collar tags.',
    icon: PawPrint,
    image: '/images/products/pet-collar-tag.png',
    iconColor: 'text-amber-400',
    badge: 'Most Popular',
    price: '$12.99',
  },
  {
    name: 'Keychain Tag',
    description: 'Attach to keys, bags, or anything you carry daily.',
    icon: KeyRound,
    image: '/images/products/keychain-tag.png',
    iconColor: 'text-emerald-400',
    badge: null,
    price: '$7.99',
  },
  {
    name: 'Car Windshield Sticker',
    description: 'Window stickers for anonymous contact if your car is bumped.',
    icon: Car,
    image: '/images/products/car-sticker.png',
    iconColor: 'text-blue-400',
    badge: null,
    price: '$8.99',
  },
  {
    name: 'Passport Sticker & Standard Stickers',
    description: 'Low-profile stickers for passports, notebooks, and everyday gear.',
    icon: QrCode,
    image: '/images/products/passport.png',
    iconColor: 'text-yellow-400',
    badge: 'Featured',
    price: '$6.99',
  },
  {
    name: 'Medical ID Band',
    description: 'Wristbands with emergency contact relay built in.',
    icon: HeartPulse,
    image: '/images/products/medical-band.png',
    iconColor: 'text-rose-400',
    badge: null,
    price: '$14.99',
  },
];

const steps = [
  {
    icon: QrCode,
    title: 'Sign in & Subscribe',
    description: 'Create your account and activate the one plan to protect every tag.',
    number: '01',
  },
  {
    icon: Shield,
    title: 'Get Tags (online or in-store)',
    description: 'Order online or pick up pre-assigned tags at a physical store.',
    number: '02',
  },
  {
    icon: Phone,
    title: 'Activate Tags',
    description: 'Sign in, scan, and link each tag to your account in seconds.',
    number: '03',
  },
  {
    icon: MapPin,
    title: 'Attach & Stay Protected',
    description: 'Attach the tag to your item. Finders can contact you anonymously.',
    number: '04',
  },
];

const stats = [
  { icon: Users, value: '1,000+', label: 'Tags Activated' },
  { icon: Zap, value: '< 60s', label: 'Avg. Response Time' },
  { icon: ScanLine, value: '100%', label: 'Anonymous Relay' },
  { icon: Clock, value: '24 / 7', label: 'Always Active' },
];

const privacyFeatures = [
  {
    icon: EyeOff,
    title: 'Hidden Identity',
    description: 'Your phone number, email, and address are never exposed. Finders contact you through temporary proxy numbers.',
  },
  {
    icon: ShieldCheck,
    title: 'Auto-Expiring Relay',
    description: 'Calls and messages are routed through proxy numbers that expire automatically after a short window.',
  },
  {
    icon: Lock,
    title: 'End-to-End Control',
    description: 'Disable any tag instantly. Block unwanted contacts. You decide who can reach you and when.',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    location: 'Melbourne, VIC',
    text: "My dog escaped while I was at work. A stranger scanned his collar tag and called me within minutes. Got him back safe. Absolute lifesaver.",
    stars: 5,
    tag: 'Pet Collar',
  },
  {
    name: 'James T.',
    location: 'Sydney, NSW',
    text: "Left my bag at the airport. The finder scanned my luggage tag, messaged me, and I had it back before my next flight. Incredible service.",
    stars: 5,
    tag: 'Luggage Tag',
  },
  {
    name: 'Rachel K.',
    location: 'Brisbane, QLD',
    text: "Someone bumped my parked car and actually reached out because of my Scan2Call sticker. Got my repair sorted without a police report fuss.",
    stars: 5,
    tag: 'Car Sticker',
  },
  {
    name: 'Daniel P.',
    location: 'Perth, WA',
    text: "My passport sticker saved me on a trip. Someone scanned it at the hotel and I got it back without exposing my details.",
    stars: 5,
    tag: 'Passport Sticker',
  },
  {
    name: 'Leah R.',
    location: 'Adelaide, SA',
    text: "The medical band gave my family peace of mind. In an emergency, the right contact could reach me fast and privately.",
    stars: 5,
    tag: 'Medical Band',
  },
];

const pricingFeatures = [
  'Unlimited active tags',
  'Anonymous call & SMS relay',
  'WhatsApp message relay',
  'Real-time location alerts',
  'Full store access',
  'Instant tag disable / block',
  'Australian data residency',
  'Cancel anytime',
];

const ease = [0.16, 1, 0.3, 1] as const;
const HERO_FIRST_SWAP_DELAY_MS = 4200;
const HERO_SWAP_INTERVAL_MS = 6000;
const heroSlides = [
  '/images/hero-collage.png',
  '/images/sca2callhero.png',
] as const;

export default function HomePageClient() {
  const heroRef = useRef<HTMLElement>(null);
  const [availableHeroSlides, setAvailableHeroSlides] = useState<string[]>([heroSlides[0]]);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadedSlides = new Set<string>([heroSlides[0]]);

    heroSlides.forEach((src) => {
      const preloadImage = new window.Image();
      preloadImage.onload = () => {
        if (cancelled) return;
        loadedSlides.add(src);
        setAvailableHeroSlides((prev) => {
          const next = heroSlides.filter((slideSrc) => loadedSlides.has(slideSrc));
          if (next.length === prev.length && next.every((slideSrc, idx) => slideSrc === prev[idx])) {
            return prev;
          }
          return next;
        });
      };
      preloadImage.onerror = () => {
        // Keep slideshow stable if optional assets are not present yet.
      };
      preloadImage.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (availableHeroSlides.length <= 1) {
      return;
    }

    let recurringSwapId: number | undefined;
    const firstSwapId = window.setTimeout(() => {
      setActiveHeroSlide((prev) => (prev + 1) % availableHeroSlides.length);
      recurringSwapId = window.setInterval(() => {
        setActiveHeroSlide((prev) => (prev + 1) % availableHeroSlides.length);
      }, HERO_SWAP_INTERVAL_MS);
    }, HERO_FIRST_SWAP_DELAY_MS);

    return () => {
      window.clearTimeout(firstSwapId);
      if (recurringSwapId !== undefined) {
        window.clearInterval(recurringSwapId);
      }
    };
  }, [availableHeroSlides.length]);

  useEffect(() => {
    if (activeHeroSlide >= availableHeroSlides.length) {
      setActiveHeroSlide(0);
    }
  }, [activeHeroSlide, availableHeroSlides.length]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.14]);
  const safeActiveHeroSlide = activeHeroSlide < availableHeroSlides.length ? activeHeroSlide : 0;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[70vh] flex items-center overflow-hidden bg-black">
        <motion.div className="absolute inset-0 z-0" style={{ scale: heroScale }}>
          {availableHeroSlides.map((slideSrc, index) => (
            <motion.div
              key={slideSrc}
              initial={false}
              animate={{ opacity: index === safeActiveHeroSlide ? 1 : 0 }}
              transition={{ duration: 0.45, ease }}
              className="absolute inset-0"
            >
              <Image
                src={slideSrc}
                alt="Scan2Call QR tags protecting pets, luggage, and keys"
                fill
                priority={index === 0}
                className={`object-cover ${
                  slideSrc === '/images/sca2callhero.png'
                    ? 'object-[center_78%]'
                    : 'object-[center_12%]'
                } brightness-110 contrast-105 saturate-105`}
                sizes="100vw"
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/62 via-black/50 to-black/90" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        <motion.div className="relative z-10 w-full text-white">
          <div className="mx-auto max-w-7xl px-6 pt-28 pb-16 lg:pb-20">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                    Privacy-First QR Tags
                  </span>
                </div>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease }}
              >
                Secure your world
                <br className="hidden sm:block" />
                <span className="block sm:whitespace-nowrap">
                  with a{' '}
                  <span>
                    <span className="text-white">simple</span>{' '}
                    <span className="text-gradient">QR Code Solution.</span>
                  </span>
                </span>
              </motion.h1>

              <motion.p
                className="mt-7 text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
              >
                Our QR tags let anyone who finds your lost item contact you instantly -
                without ever seeing your phone number, email, or address.
              </motion.p>

              <motion.div
                className="mt-10 flex items-center gap-4 flex-wrap"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover glow-md hover:glow-lg hover:scale-[1.03] active:scale-[0.98]"
                >
                  Get Started - $2.99/mo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30 backdrop-blur-sm"
                >
                  See How It Works
                </Link>
              </motion.div>

              <motion.div
                className="mt-8 flex items-center flex-wrap gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {['No contracts', 'AU Data Residency', 'Cancel anytime', '100% anonymous'].map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/8 border border-white/12 px-3 py-1 text-xs text-white/60"
                  >
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {chip}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 opacity-30">
          <span className="text-xs text-white tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent"
          />
        </div>
      </section>

      {/* ─── Stats Strip ─────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-8 lg:px-10 py-5 lg:py-4">
          <div className="marquee md:hidden">
            <div className="marquee-track">
              {[...stats, ...stats].map((stat, i) => (
                <div key={`${stat.label}-${i}`} className="inline-flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted border border-primary/20">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-text font-display leading-none">
                      {stat.value}
                    </span>
                    <span className="text-xs text-text-muted">
                      {stat.label}
                    </span>
                  </div>
                  <span className="mx-2 h-1 w-1 rounded-full bg-border" />
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-4 gap-6 xl:gap-10">
            {stats.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.08}>
                <div className="flex items-center gap-3 xl:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted border border-primary/20">
                    <stat.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 whitespace-nowrap">
                    <span className="text-lg lg:text-xl font-bold text-text font-display leading-none">
                      {stat.value}
                    </span>{' '}
                    <span className="text-[11px] lg:text-xs text-text-muted">
                      {stat.label}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Product Showcase ─────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh-strong opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">
          <FadeIn className="text-center mb-20">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Our Products
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Tags for every{' '}
              <span className="text-gradient">situation</span>
            </h2>
            <p className="mt-5 text-text-muted max-w-xl mx-auto text-lg">
              From pets to parking, we have a tag designed for exactly what you need.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => (
              <FadeIn key={product.name} delay={i * 0.1}>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-16 text-center">
            <Link
              href="/store"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover glow-sm hover:glow-md hover:scale-[1.03] active:scale-[0.98]"
            >
              Browse the Full Store
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────── */}
      <section className="py-28 relative overflow-hidden bg-surface/40">
        <div className="absolute inset-0 gradient-mesh opacity-60" />

        <div className="relative mx-auto max-w-7xl px-6">
          <FadeIn className="text-center mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Simple Setup
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Up and running in{' '}
              <span className="text-gradient">minutes</span>
            </h2>
            <p className="mt-4 text-text-muted max-w-xl mx-auto text-lg">
              Four steps from signup to full protection. No hardware hacks, no technical skills needed.
            </p>
          </FadeIn>

          <div className="relative">
            <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <StaggerContainer stagger={0.12} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <StaggerItem key={step.title}>
                  <div className="group relative flex flex-col items-start text-left p-6 rounded-2xl border border-primary/20 bg-surface/80 backdrop-blur-sm shadow-lg shadow-black/30 hover:border-primary/40 transition-all duration-300 hover:bg-surface hover:-translate-y-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted border border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-widest text-primary/70 uppercase">
                            Step {step.number}
                          </div>
                          <h3 className="text-lg font-semibold tracking-tight text-text group-hover:text-primary transition-colors duration-300">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-text-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <FadeIn delay={0.1} className="mt-10 text-center">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover glow-sm hover:glow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Your Favorite Tag Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ─── Privacy Promise ──────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/3 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <FadeIn>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent mb-4">
                Built for Trust
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Privacy is{' '}
                <span className="text-gradient-ice">not optional.</span>
              </h2>
              <p className="mt-5 text-text-muted text-lg leading-relaxed max-w-lg">
                When someone scans your tag, all communication flows through our anonymous relay.
                Finders never see your personal details - ever.
              </p>

              <div className="mt-10 space-y-5">
                {privacyFeatures.map((feat) => (
                  <div key={feat.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle border border-accent/20">
                      <feat.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-text">{feat.title}</div>
                      <div className="mt-1 text-sm text-text-muted leading-relaxed">{feat.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-xl border border-accent/20 bg-bg/80 backdrop-blur-sm px-5 py-4 max-w-sm glow-ice">
                <Globe className="h-5 w-5 text-accent shrink-0" />
                <p className="text-sm text-text-muted">
                  All data stored in{' '}
                  <span className="text-text font-medium">Sydney, Australia</span>{' '}
                  under the Australian Privacy Act.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.15} className="mt-14 lg:mt-0">
              <RelayDiagram />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────── */}
      <section className="py-28 bg-surface/30 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />

        <div className="relative mx-auto max-w-7xl px-6">
          <FadeIn className="text-center mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Real Stories
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              People who got their things{' '}
              <span className="text-gradient">back</span>
            </h2>
          </FadeIn>

          <div className="marquee">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={`${t.name}-${i}`} className="w-[360px] sm:w-[420px]">
                  <TestimonialCard testimonial={t} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing CTA ──────────────────────────── */}
      <section className="py-28 gradient-mesh-strong relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6">
          <FadeIn className="text-center">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-6">
              Simple Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Affordable pricing.{" "}
              <span className="text-gradient">One subscription.</span>
            </h2>
            <p className="mt-4 text-text-muted text-lg max-w-2xl mx-auto">
              Same plan, billed yearly - or save more with our 5-year discount. Includes unlimited tags, scans, and full relay access.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {pricingFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 backdrop-blur-sm px-3 py-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover glow-md hover:glow-lg hover:scale-[1.03] active:scale-[0.98]"
            >
              Start Protecting Today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-sm font-semibold text-text-secondary hover:border-primary/30 hover:text-text transition-colors"
            >
              View Full Pricing
            </Link>
          </FadeIn>

          <FadeIn delay={0.25} className="mt-6 text-center">
            <p className="text-xs text-text-dim">No credit card required to browse. Cancel anytime.</p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

/* ── Product Card ────────────────────────────────── */

interface Product {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  iconColor: string;
  badge: string | null;
  price: string;
}

function ProductCard({ product }: { product: Product }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggleFlip = () => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) {
      setIsFlipped((prev) => !prev);
    }
  };

  const handleResetFlip = () => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: none)').matches) {
      setIsFlipped(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative rounded-2xl border border-border bg-surface/80 backdrop-blur-sm overflow-hidden h-full cursor-pointer"
      onClick={handleToggleFlip}
      onMouseLeave={handleResetFlip}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-3xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <div className="relative min-h-[360px] [perspective:1200px]">
        <div
          className={`relative min-h-[360px] transition-transform duration-900 ease-in-out will-change-transform [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <div className="absolute inset-0 flex flex-col [backface-visibility:hidden]">
            <div className="relative h-52 bg-gradient-to-b from-surface-raised/50 to-surface/50 overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />

              {product.badge && (
                <span className="absolute top-3 left-3 text-[10px] font-bold text-primary bg-primary/15 border border-primary/25 rounded-full px-2.5 py-1 backdrop-blur-sm">
                  {product.badge}
                </span>
              )}
            </div>

            <div className="p-5 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised border border-border">
                  <product.icon className={`h-4 w-4 ${product.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">
                  {product.name}
                </h3>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-between p-5 bg-surface/95 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-dim">
                Details
              </div>
              <h3 className="mt-3 text-lg font-semibold text-text">
                {product.name}
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                {(() => {
                  const stories: Record<string, string> = {
                    'Pet Collar Tag': 'When your pet slips out, a quick scan turns a stranger into a helping hand in minutes.',
                    'Car Windshield Sticker': 'Leave a parking lot with peace of mind knowing a finder can reach you without exposing your number.',
                    'Luggage Tag': 'Missed a bag? A simple scan reconnects you before the carousel has even stopped.',
                    'Keychain Tag': 'Lost keys become found keys when anyone can reach you with a single scan.',
                    'Medical ID Band': 'Emergency details stay private, but the right help reaches you fast when it matters most.',
                  };
                  return stories[product.name] ?? 'A simple scan turns a moment of loss into a quick, private reconnection.';
                })()}
              </p>
            </div>

              <div className="flex flex-col gap-3">
                <span className="text-lg font-bold text-primary">
                  {product.price}
                  <span className="text-xs font-normal text-text-dim"> AUD</span>
                </span>
                <Link
                  href="/store"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Visit Store <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Relay Diagram ─────────────────────────────── */

function RelayDiagram() {
  return (
    <div className="relative rounded-3xl border border-border bg-surface/60 backdrop-blur-sm p-8 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-8 text-center">
        How the relay works
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary-muted p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">Finder</div>
            <div className="text-xs text-text-muted">Scans your QR tag</div>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-medium text-primary/80 bg-primary/10 rounded-full px-2 py-1 border border-primary/20">Anonymous</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="h-5 w-px bg-gradient-to-b from-border to-accent/40"
          />
          <div className="text-[10px] text-text-dim">Routed through</div>
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
            className="h-5 w-px bg-gradient-to-b from-accent/40 to-border"
          />
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-accent/30 bg-accent-subtle p-4 glow-ice">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-accent">Scan2Call Relay</div>
            <div className="text-xs text-text-muted">Temporary proxy • Auto-expires</div>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-medium text-accent bg-accent/10 rounded-full px-2 py-1 border border-accent/20">Encrypted</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.4 }}
            className="h-5 w-px bg-gradient-to-b from-border to-primary/40"
          />
          <div className="text-[10px] text-text-dim">Delivered to</div>
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.6 }}
            className="h-5 w-px bg-gradient-to-b from-primary/40 to-border"
          />
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-300">You</div>
            <div className="text-xs text-emerald-100/70">Receive call, SMS, or WhatsApp</div>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-medium text-emerald-200 bg-emerald-500/15 rounded-full px-2 py-1 border border-emerald-400/30">Safe</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-text-dim justify-center">
        <EyeOff className="h-3.5 w-3.5" />
        Your identity is never revealed to the finder
      </div>
    </div>
  );
}

/* ── Testimonial Card ──────────────────────────── */

interface Testimonial {
  name: string;
  location: string;
  text: string;
  stars: number;
  tag: string;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative flex flex-col rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-6 h-full overflow-hidden cursor-default"
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
        ))}
      </div>

      <p className="text-sm text-text-secondary leading-relaxed flex-1 whitespace-normal">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{testimonial.name}</div>
          <div className="text-xs text-text-dim">{testimonial.location}</div>
        </div>
        <span className="text-xs font-medium text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
          {testimonial.tag}
        </span>
      </div>
    </motion.div>
  );
}
