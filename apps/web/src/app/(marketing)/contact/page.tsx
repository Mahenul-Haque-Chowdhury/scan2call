'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { FadeIn } from '@/components/ui/motion';
import Link from 'next/link';
import { Mail, MessageCircle, Clock, Phone } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@scan2call.net',
    note: "We'll reply within 24 hours",
  },
  {
    icon: MessageCircle,
    label: 'Live Chat',
    value: 'Available in dashboard',
    note: 'Available for all subscribers',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: 'Callback available',
    note: 'Include your number and a good time to reach you.',
  },
  {
    icon: Clock,
    label: 'Response Time',
    value: 'Within 24 hours',
    note: 'Monday – Friday, 9am–5pm AEST',
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'Failed to send message.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-20 gradient-mesh">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              Get in Touch
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Contact us</h1>
            <p className="mt-4 text-lg text-text-muted max-w-xl">
              Have a question or need help? We&apos;re happy to assist.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="lg:grid lg:grid-cols-5 lg:gap-12">
            {/* Left: contact info */}
            <FadeIn className="lg:col-span-2 mb-10 lg:mb-0">
              <div className="space-y-6">
                {contactInfo.map((c) => (
                  <div key={c.label} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-muted border border-primary/20">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-text-dim mb-0.5">
                        {c.label}
                      </div>
                      <div className="text-sm font-medium text-text">{c.value}</div>
                      <div className="text-xs text-text-dim">{c.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Right: form */}
            <FadeIn delay={0.1} className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-7">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-muted border border-success/20">
                      <Mail className="h-6 w-6 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Message sent!</h3>
                    <p className="text-text-muted text-sm max-w-xs">
                      Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-sm text-primary hover:underline underline-offset-4 mt-2"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="mb-5">
                        <Alert variant="error">{error}</Alert>
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <Input
                        label="Name"
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                      <Input
                        label="Email"
                        type="email"
                        id="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                      <Textarea
                        label="Message"
                        id="message"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help?"
                        className="min-h-32"
                      />
                      <p className="text-xs text-text-dim">
                        By sending this message, you agree to our{' '}
                        <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                          Privacy Policy
                        </Link>{' '}
                        and consent to be contacted about your request.
                      </p>
                      <Button type="submit" loading={isSubmitting} className="w-full">
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
