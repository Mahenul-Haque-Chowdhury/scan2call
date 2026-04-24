'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import Link from 'next/link';

const categories = [
  {
    title: 'Privacy & Security',
    faqs: [
      {
        question: 'How does Scan2Call protect my privacy?',
        answer:
          'All communication between a finder and tag owner is relayed through Scan2Call using Twilio Proxy sessions. The finder never sees your phone number, email, or name - at any point in the process.',
      },
      {
        question: 'Can the finder see my location?',
        answer:
          'No. However, when a tag is scanned you receive a notification showing the approximate scan location, helping you coordinate retrieval. The finder cannot see this - only you can.',
      },
      {
        question: 'Is my data stored in Australia?',
        answer:
          'Yes. All data is stored in the ap-southeast-2 (Sydney) region under the Australian Privacy Act.',
      },
      {
        question: 'How long does the anonymous relay session last?',
        answer:
          'Relay sessions auto-expire after a short window (typically 24 hours), after which the proxy number is recycled. You can also instantly disable any tag or block a contact from your dashboard.',
      },
    ],
  },
  {
    title: 'Using Your Tags',
    faqs: [
      {
        question: 'What happens when someone scans my tag?',
        answer:
          'They see a branded contact page with options to call, send an SMS, or message via WhatsApp. All channels route through our anonymous relay - no app download required on their end.',
      },
      {
        question: 'What kinds of tags are available?',
        answer:
          'We offer keychain tags, adhesive stickers, luggage tags, pet collar tags, and more. Browse our store for the full catalog.',
      },
      {
        question: 'How do I activate a tag?',
        answer:
          "After purchasing, scan the tag with your phone camera or enter the code on the packaging. You'll be guided through linking it to your account - the whole process takes under a minute.",
      },
      {
        question: 'Can I transfer a tag to someone else?',
        answer:
          'Yes. You can unlink a tag from your account at any time, after which it can be activated by another user.',
      },
    ],
  },
  {
    title: 'Billing & Subscription',
    faqs: [
      {
        question: 'Do I need a subscription?',
        answer:
          'Yes. A single subscription ($9.99/mo AUD or $99.99/yr) unlocks all features including unlimited tags, unlimited scans, WhatsApp relay, location tracking, and access to the tag store.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          'Yes, with no penalty. Cancel from your account settings and your access continues until the end of your current billing period.',
      },
      {
        question: 'What happens to my tags if I cancel?',
        answer:
          'Your tags will stop relaying contacts until you resubscribe. Your tag data is retained for 30 days after cancellation so you can easily resume.',
      },
    ],
  },
];

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
            {categories.map((cat) => (
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
