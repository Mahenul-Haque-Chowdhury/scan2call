'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = `${API_BASE}/api/v1`;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_PREFIX}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Something went wrong. Please try again.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {success ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-muted"
          >
            <Mail className="h-7 w-7 text-success" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-2xl font-bold"
          >
            Check your email
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-sm text-text-muted"
          >
            If an account with that email exists, a reset link has been sent. Please check your inbox and spam folder.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/login" className="mt-6 inline-block text-sm text-text-muted hover:text-text transition-colors">
              &larr; Back to sign in
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          variants={stagger}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-1 text-sm text-text-muted">Enter your email and we will send you a reset link.</p>
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} className="mt-4">
              <Alert variant="error">{error}</Alert>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
              <motion.div variants={fadeUp}>
                <Input label="Email" type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button type="submit" loading={isSubmitting} className="w-full">
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </motion.div>
            </motion.div>
          </form>

          <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-text-muted">
            <Link href="/login" className="font-medium text-primary hover:underline">&larr; Back to sign in</Link>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
