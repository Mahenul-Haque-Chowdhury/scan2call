'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = `${API_BASE}/api/v1`;

const iconSpring = { type: 'spring' as const, stiffness: 300, damping: 20, delay: 0.1 };

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [resendEmail, setResendEmail] = useState(email || '');

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    setResendEmail(email || '');
  }, [email]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function verifyToken() {
      setVerifying(true);
      setVerifyError(null);
      try {
        const res = await fetch(`${API_PREFIX}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Verification failed');
        }
        if (!cancelled) setVerified(true);
      } catch (err) {
        if (!cancelled) setVerifyError(err instanceof Error ? err.message : 'Invalid or expired verification link.');
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }
    verifyToken();
    return () => { cancelled = true; };
  }, [token]);

  async function handleResend() {
    const targetEmail = resendEmail.trim().toLowerCase();
    if (!targetEmail) return;
    setResendLoading(true);
    setResendError(null);
    setResendSuccess(false);
    try {
      const res = await fetch(`${API_PREFIX}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: targetEmail }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to resend verification email');
      }
      setResendSuccess(true);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  }

  if (token) {
    if (verifying) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Spinner size="lg" className="mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Verifying your email</h1>
          <p className="mt-2 text-sm text-text-muted">Please wait while we verify your email address...</p>
        </motion.div>
      );
    }

    if (verified) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={iconSpring}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-muted"
          >
            <CheckCircle className="h-7 w-7 text-success" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-2xl font-bold">Email verified successfully!</motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-2 text-sm text-text-muted">Your email has been verified. You can now sign in to your account.</motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Link href="/login"><Button className="mt-6">Go to Sign In</Button></Link>
          </motion.div>
        </motion.div>
      );
    }

    if (verifyError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={iconSpring}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-muted"
          >
            <XCircle className="h-7 w-7 text-error" />
          </motion.div>
          <h1 className="mt-5 text-2xl font-bold">Verification failed</h1>
          <p className="mt-2 text-sm text-error">{verifyError}</p>
          {(email || !verified) && (
            <div className="mt-6">
              {!email && (
                <div className="mx-auto mb-4 max-w-sm text-left">
                  <Input
                    label="Email"
                    type="email"
                    id="resend-email-error"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              )}
              <Button onClick={handleResend} loading={resendLoading} variant="secondary">
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </Button>
              {resendSuccess && <p className="mt-3 text-sm text-success">Verification email sent! Check your inbox.</p>}
              {resendError && <p className="mt-3 text-sm text-error">{resendError}</p>}
            </div>
          )}
          <Link href="/login" className="mt-4 inline-block text-sm text-text-muted hover:text-text transition-colors">&larr; Back to sign in</Link>
        </motion.div>
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={iconSpring}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted"
      >
        <Mail className="h-7 w-7 text-primary" />
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
        {email
          ? `We've sent a verification link to ${email}. Click the link to activate your account.`
          : 'We have sent a verification link to your email address. Click the link to activate your account.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 rounded-xl bg-surface-raised p-5"
      >
        <p className="text-sm text-text-muted">Didn&apos;t receive the email? Check your spam folder or resend below.</p>
        <div className="mx-auto mt-3 max-w-sm text-left">
          {!email && (
            <Input
              label="Email"
              type="email"
              id="resend-email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          )}
          <Button onClick={handleResend} loading={resendLoading} variant="secondary" className="mt-3 w-full">
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </Button>
        </div>
        {resendSuccess && <p className="mt-3 text-sm text-success">Verification email sent! Check your inbox.</p>}
        {resendError && <p className="mt-3 text-sm text-error">{resendError}</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/login" className="mt-6 inline-block text-sm text-text-muted hover:text-text transition-colors">&larr; Back to sign in</Link>
      </motion.div>
    </motion.div>
  );
}
