'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import Link from 'next/link';
import { faqCategories } from '../faq-data';

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left gap-4 group"
      >
        <span className="font-medium text-text group-hover:text-primary transition-colors duration-200">
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full border border-border group-hover:border-primary/30 group-hover:bg-primary-muted transition-colors duration-200"
        >
          <ChevronDown className="h-3.5 w-3.5 text-text-dim group-hover:text-primary" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-text-muted leading-relaxed text-sm pr-10">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqClient() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-20 gradient-mesh text-center">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              FAQ
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Frequently asked questions
            </h1>
            <p className="mt-4 text-lg text-text-muted">
              Everything you need to know about Scan2Call.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <StaggerContainer stagger={0.12} className="space-y-10">
            {faqCategories.map((cat) => (
              <StaggerItem key={cat.title}>
                <h2 className="text-xs font-semibold tracking-widest uppercase text-accent mb-5">
                  {cat.title}
                </h2>
                <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm px-6">
                  {cat.faqs.map((faq) => (
                    <AccordionItem key={faq.question} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Still have questions */}
          <FadeIn delay={0.2} className="mt-14">
            <div className="rounded-2xl border border-accent/20 bg-accent-subtle p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
              <p className="text-text-muted text-sm mb-5">
                Our team is happy to help with anything not covered here.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover glow-sm transition-all"
              >
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
