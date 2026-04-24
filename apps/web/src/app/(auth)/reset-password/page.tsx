'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-muted"
        >
          <XCircle className="h-7 w-7 text-error" />
        </motion.div>
        <h1 className="mt-5 text-2xl font-bold">Invalid reset link</h1>
        <p className="mt-2 text-sm text-text-muted">This password reset link is invalid or missing. Please request a new one.</p>
        <Link href="/forgot-password"><Button className="mt-6">Request New Reset Link</Button></Link>
        <div className="mt-4">
          <Link href="/login" className="text-sm text-text-muted hover:text-text transition-colors">&larr; Back to sign in</Link>
        </div>
      </motion.div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_PREFIX}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to reset password. The link may have expired.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
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
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-muted"
          >
            <CheckCircle className="h-7 w-7 text-success" />
          </motion.div>
          <h1 className="mt-5 text-2xl font-bold">Password reset successfully!</h1>
          <p className="mt-2 text-sm text-text-muted">Your password has been updated. You can now sign in with your new password.</p>
          <Link href="/login"><Button className="mt-6">Go to Sign In</Button></Link>
        </motion.div>
      ) : (
        <motion.div key="form" variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="mt-1 text-sm text-text-muted">Choose a strong password for your account.</p>
          </motion.div>
          {error && <motion.div variants={fadeUp} className="mt-4"><Alert variant="error">{error}</Alert></motion.div>}
          <form onSubmit={handleSubmit} className="mt-6">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
              <motion.div variants={fadeUp}>
                <Input label="New Password" type="password" id="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" />
              </motion.div>
              <motion.div variants={fadeUp}>
                <Input label="Confirm Password" type="password" id="confirmPassword" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" />
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button type="submit" loading={isSubmitting} className="w-full">{isSubmitting ? 'Resetting...' : 'Reset Password'}</Button>
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
