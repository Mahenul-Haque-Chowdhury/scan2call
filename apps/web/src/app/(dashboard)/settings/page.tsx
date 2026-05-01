'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { apiClient, ApiError } from '@/lib/api-client';
import { CheckCircle, AlertCircle, Bell, CreditCard, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

interface UserProfile { id: string; email: string; firstName: string; lastName: string; phone: string | null; }

const baseCountryOptions = [
  { code: '+61', label: 'Australia (+61)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+1', label: 'Canada (+1)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+62', label: 'Indonesia (+62)' },
  { code: '+353', label: 'Ireland (+353)' },
  { code: '+972', label: 'Israel (+972)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+52', label: 'Mexico (+52)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+64', label: 'New Zealand (+64)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+63', label: 'Philippines (+63)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
  { code: '+46', label: 'Sweden (+46)' },
  { code: '+41', label: 'Switzerland (+41)' },
  { code: '+66', label: 'Thailand (+66)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+1', label: 'United States (+1)' },
  { code: '+84', label: 'Vietnam (+84)' },
];

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
});

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+61');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customCountryCode, setCustomCountryCode] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneVerifySuccess, setPhoneVerifySuccess] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{ data: UserProfile }>('/users/me');
        if (!cancelled) {
          const p = result.data;
          setFirstName(p.firstName || '');
          setLastName(p.lastName || '');
          if (p.phone) {
            const matching = baseCountryOptions.find((opt) => p.phone?.startsWith(opt.code));
            if (matching) {
              setPhoneCountryCode(matching.code);
              setPhoneNumber(p.phone.slice(matching.code.length).trim());
            } else if (p.phone.startsWith('+')) {
              const match = p.phone.match(/^\+\d{1,3}/);
              const code = match ? match[0] : '+61';
              setCustomCountryCode(code);
              setPhoneCountryCode(code);
              setPhoneNumber(p.phone.slice(code.length).trim());
            } else {
              setPhoneCountryCode('+61');
              setPhoneNumber(p.phone);
            }
          } else {
            setPhoneCountryCode('+61');
            setPhoneNumber('');
          }
        }
      } catch {
        if (!cancelled && user) { setFirstName(user.firstName || ''); setLastName(user.lastName || ''); }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleProfileSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setProfileSaving(true); setProfileError(null); setProfileSuccess(false);
    try {
      const trimmedLocal = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
      const formattedPhone = trimmedLocal ? `${phoneCountryCode}${trimmedLocal}` : null;
      await apiClient.patch('/users/me', { firstName: firstName.trim(), lastName: lastName.trim(), phone: formattedPhone });
      setProfileSuccess(true); await refreshUser(); setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) { setProfileError(err instanceof ApiError ? err.message : 'Failed to update profile.'); }
    finally { setProfileSaving(false); }
  }, [firstName, lastName, phoneCountryCode, phoneNumber, refreshUser]);

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setPasswordError(null); setPasswordSuccess(false);
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    setPasswordSaving(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(true); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) { setPasswordError(err instanceof ApiError ? err.message : 'Failed to change password.'); }
    finally { setPasswordSaving(false); }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSendPhoneOtp = useCallback(async () => {
    setPhoneOtpSending(true); setPhoneVerifyError(null); setPhoneVerifySuccess(false);
    try { await apiClient.post('/auth/send-phone-otp'); setPhoneOtpSent(true); }
    catch (err) { setPhoneVerifyError(err instanceof ApiError ? err.message : 'Failed to send verification code.'); }
    finally { setPhoneOtpSending(false); }
  }, []);

  const handleVerifyPhone = useCallback(async () => {
    if (phoneOtpCode.length !== 6) { setPhoneVerifyError('Please enter the 6-digit code.'); return; }
    setPhoneVerifying(true); setPhoneVerifyError(null);
    try {
      await apiClient.post('/auth/verify-phone', { code: phoneOtpCode });
      setPhoneVerifySuccess(true); setPhoneOtpSent(false); setPhoneOtpCode(''); await refreshUser();
      setTimeout(() => setPhoneVerifySuccess(false), 5000);
    } catch (err) { setPhoneVerifyError(err instanceof ApiError ? err.message : 'Invalid verification code.'); }
    finally { setPhoneVerifying(false); }
  }, [phoneOtpCode, refreshUser]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true); setDeleteError(null);
    try { await apiClient.delete('/users/me'); await logout(); router.replace('/'); }
    catch (err) { setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete account.'); setDeleting(false); }
  }, [deleteConfirmText, logout, router]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences." />

      {user && !user.phoneVerified && (
        <a
          href="#phone-section"
          className="mt-6 flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 transition-colors hover:bg-amber-400/15"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Verify your phone number</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80">Add and verify a phone number so finders can reach you via call, SMS, and WhatsApp.</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">Set up &rarr;</span>
        </a>
      )}

      <motion.div {...cardAnim(0)}>
        <Card className="mt-8">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-text">Profile</h2>
            <p className="mt-1 text-sm text-text-muted">Update your personal information.</p>
            {profileLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-text-muted"><Spinner size="sm" />Loading profile...</div>
            ) : (
              <form onSubmit={handleProfileSave} className="mt-6 max-w-md space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-muted">Email</label>
                  <input type="email" id="email" value={user?.email || ''} disabled className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text-dim" />
                  <p className="mt-1 text-xs text-text-dim">Email cannot be changed.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-muted">First name</label>
                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-muted">Last name</label>
                    <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div id="phone-section">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-text-muted">Phone</label>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      id="phoneCountryCode"
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="h-10 rounded-xl border border-border bg-surface-raised px-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {customCountryCode && !baseCountryOptions.some((opt) => opt.code === customCountryCode) && (
                        <option value={customCountryCode}>{customCountryCode} (Custom)</option>
                      )}
                      {baseCountryOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="4XX XXX XXX"
                      className="block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-dim">Used for SMS notifications and anonymous call relay.</p>
                  {user?.phoneVerified ? (
                    <Badge variant="success" className="mt-2 gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>
                  ) : phoneNumber ? (
                    <div className="mt-2">
                      <Badge variant="warning" className="gap-1"><AlertCircle className="h-3 w-3" />Not Verified</Badge>
                      {!phoneOtpSent ? (
                        <button type="button" onClick={handleSendPhoneOtp} disabled={phoneOtpSending} className="ml-2 text-xs font-medium text-primary hover:underline disabled:opacity-50">{phoneOtpSending ? 'Sending...' : 'Verify'}</button>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          <input type="text" value={phoneOtpCode} onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" maxLength={6} className="w-28 rounded-xl border border-border bg-surface-raised px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          <Button size="sm" onClick={handleVerifyPhone} disabled={phoneVerifying || phoneOtpCode.length !== 6} type="button">{phoneVerifying ? 'Verifying...' : 'Confirm'}</Button>
                          <button type="button" onClick={handleSendPhoneOtp} disabled={phoneOtpSending} className="text-xs text-text-muted hover:text-text disabled:opacity-50">Resend</button>
                        </div>
                      )}
                      {phoneVerifySuccess && <p className="mt-2 text-xs text-success">Phone verified successfully!</p>}
                      {phoneVerifyError && <p className="mt-2 text-xs text-error">{phoneVerifyError}</p>}
                    </div>
                  ) : null}
                </div>
                {profileError && <p className="text-sm text-error">{profileError}</p>}
                {profileSuccess && <p className="text-sm text-success">Profile updated successfully.</p>}
                <Button type="submit" loading={profileSaving}>{profileSaving ? 'Saving...' : 'Save Changes'}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...cardAnim(0.08)} className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { href: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Configure scan alerts, email, and push preferences.' },
          { href: '/settings/billing', icon: CreditCard, label: 'Billing', desc: 'Manage payment methods and view invoices.' },
        ].map((item) => (
          <motion.div key={item.href} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
            <Link href={item.href} className="group block rounded-2xl border border-border bg-surface p-6 transition-all hover:border-border-hover hover:shadow-lg hover:shadow-shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-raised text-text-muted group-hover:text-primary transition-colors"><item.icon className="h-4 w-4" /></div>
                <div>
                  <h2 className="font-semibold text-text">{item.label}</h2>
                  <p className="mt-0.5 text-sm text-text-muted">{item.desc}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div {...cardAnim(0.12)}>
        <Card className="mt-6">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-text">Change Password</h2>
            <p className="mt-1 text-sm text-text-muted">Update your password to keep your account secure.</p>
            <form onSubmit={handlePasswordChange} className="mt-6 max-w-md space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-text-muted">Current password</label>
                <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-text-muted">New password</label>
                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-muted">Confirm new password</label>
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {passwordError && <p className="text-sm text-error">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-success">Password changed successfully.</p>}
              <Button type="submit" loading={passwordSaving}>{passwordSaving ? 'Changing...' : 'Change Password'}</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...cardAnim(0.16)}>
        <Card className="mt-6 border-error/30!">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-error">Danger Zone</h2>
            <p className="mt-1 text-sm text-text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
            {!showDeleteConfirm ? (
              <Button variant="danger" className="mt-4" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 max-w-md rounded-xl border border-error/30 bg-error-muted p-4">
                <p className="text-sm font-medium text-error">Are you sure? This will permanently delete your account, all tags, and all data.</p>
                <p className="mt-2 text-sm text-text-muted">Type <span className="font-mono font-bold text-text">DELETE</span> below to confirm.</p>
                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE to confirm" className="mt-2 block w-full rounded-xl border border-error/40 bg-surface-raised px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-error focus:outline-none focus:ring-1 focus:ring-error" />
                {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}
                <div className="mt-3 flex gap-3">
                  <Button variant="danger" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting} loading={deleting}>{deleting ? 'Deleting...' : 'Permanently Delete Account'}</Button>
                  <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(null); }}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
