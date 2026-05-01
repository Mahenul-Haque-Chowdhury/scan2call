'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, MapPin, Flag, ChevronDown, AlertTriangle, CheckCircle, X, ImageIcon, Paperclip, ShieldCheck, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API = `${API_BASE}/api/v1`;

interface TagData {
  tagId: string;
  tagType: string;
  label: string;
  description: string;
  photoUrl: string | null;
  isLostMode: boolean;
  lostModeMessage: string | null;
  ownerFirstName: string;
  contactOptions: {
    call: boolean;
    sms: boolean;
    whatsapp: boolean;
    browserCall: boolean;
    sendLocation: boolean;
  };
}

type ContactMethod = 'call' | 'sms' | 'whatsapp' | 'location' | 'report';

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;

  const data = payload as {
    message?: unknown;
    error?: {
      message?: unknown;
    };
  };

  if (typeof data.error?.message === 'string' && data.error.message.trim()) {
    return data.error.message;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return fallback;
}

function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const TAG_TYPE_LABELS: Record<string, string> = {
  PET_COLLAR: 'Pet Collar',
  CAR_STICKER: 'Car Sticker',
  LUGGAGE_TAG: 'Luggage Tag',
  KEYCHAIN: 'Keychain',
  MEDICAL_BAND: 'Medical Band',
  GENERIC: 'Item',
};

const CONTACT_CONFIG: Record<string, { color: string; activeColor: string; bgLight: string; label: string; desc: string }> = {
  call: {
    color: 'text-green-700',
    activeColor: 'border-green-600 bg-green-600 text-white shadow-lg shadow-green-600/20',
    bgLight: 'bg-green-50 text-green-700',
    label: 'Call Owner',
    desc: 'Anonymous voice call via relay',
  },
  sms: {
    color: 'text-blue-700',
    activeColor: 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20',
    bgLight: 'bg-blue-50 text-blue-700',
    label: 'Send Text to Owner',
    desc: 'Send a message via anonymous relay',
  },
  whatsapp: {
    color: 'text-emerald-700',
    activeColor: 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
    bgLight: 'bg-emerald-50 text-emerald-700',
    label: 'Contact Via WhatsApp',
    desc: 'Connect on WhatsApp anonymously',
  },
  location: {
    color: 'text-cyan-700',
    activeColor: 'border-cyan-600 bg-cyan-600 text-white shadow-lg shadow-cyan-600/20',
    bgLight: 'bg-cyan-50 text-cyan-700',
    label: 'Send Location',
    desc: 'Share where you found this item',
  },
};

export default function ScanPageClient({ token }: { token: string }) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const [tag, setTag] = useState<TagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<'inactive' | 'deactivated' | 'not-found' | 'error' | null>(null);

  const [activeMethod, setActiveMethod] = useState<ContactMethod | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [reportImageName, setReportImageName] = useState<string | null>(null);
  const [reportImageUploading, setReportImageUploading] = useState(false);
  const [reportCaptchaToken, setReportCaptchaToken] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callDevice, setCallDevice] = useState<unknown>(null);
  const [activeCall, setActiveCall] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API}/scan/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const message = (body as { message?: string })?.message;
          if (!cancelled) {
            if (res.status === 404) {
              setFetchStatus('not-found');
              setFetchError('This tag was not found. It may have been removed or the link is incorrect.');
            } else if (res.status === 400) {
              if (typeof message === 'string' && message.toLowerCase().includes('not been activated')) {
                setFetchStatus('inactive');
                setFetchError(message);
              } else if (typeof message === 'string' && message.toLowerCase().includes('deactivated')) {
                setFetchStatus('deactivated');
                setFetchError(message);
              } else {
                setFetchStatus('error');
                setFetchError(message || 'Something went wrong. Please try again.');
              }
            } else {
              setFetchStatus('error');
              setFetchError(message || 'Something went wrong. Please try again.');
            }
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) setTag(json.data);
      } catch {
        if (!cancelled) {
          setFetchError('Unable to connect. Please check your internet connection and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const toggleMethod = useCallback((method: ContactMethod) => {
    setActiveMethod((prev) => (prev === method ? null : method));
    setActionError(null);
  }, []);

  const postAction = useCallback(async (url: string, body: Record<string, unknown>): Promise<boolean> => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(getApiErrorMessage(data, 'Request failed. Please try again.'));
      }
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleReportImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setActionError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError('Image must be under 5MB.');
      return;
    }

    setActionError(null);
    setReportImageUploading(true);

    try {
      const uploadUrlRes = await fetch(`${API}/scan/${token}/report-image-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      const uploadUrlBody = await uploadUrlRes.json().catch(() => null);
      if (!uploadUrlRes.ok) {
        throw new Error(getApiErrorMessage(uploadUrlBody, 'Could not prepare image upload.'));
      }

      const uploadData = (uploadUrlBody as {
        data?: {
          uploadUrl: string;
          publicUrl: string;
        };
      })?.data;

      if (!uploadData?.uploadUrl || !uploadData.publicUrl) {
        throw new Error('Invalid upload response from server.');
      }

      const uploadRes = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Image upload failed. Please try again.');
      }

      setReportImageUrl(uploadData.publicUrl);
      setReportImageName(file.name);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setReportImageUploading(false);
    }
  };

  const handleCall = async () => {
    setSubmitting(true);
    setActionError(null);
    setCallStatus('connecting');
    try {
      const res = await fetch(`${API}/communication/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data as { message?: string })?.message || 'Failed to initiate call.');
      }
      const json = await res.json();
      const { token: clientToken, identity } = json.data;

      const { Device } = await import('@twilio/voice-sdk');

      // Use SDK defaults for codec negotiation to avoid strict type mismatches across SDK versions.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device = new Device(clientToken) as any;
      setCallDevice(device);

      device.on('error', (err: Error) => {
        setActionError(err.message || 'Could not connect. Please try again.');
        setCallStatus('idle');
      });

      const call = await device.connect({ params: { To: identity } });
      setCallStatus('ringing');
      setActiveCall(call);

      call.on('accept', () => setCallStatus('connected'));
      call.on('disconnect', () => {
        setCallStatus('ended');
        setSuccess('Call ended. Thank you for helping return this item!');
        setActiveMethod(null);
      });
      call.on('error', (err: Error) => {
        setActionError(err.message || 'Call failed. Please try again.');
        setCallStatus('idle');
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to initiate call.');
      setCallStatus('idle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHangUp = () => {
    if (activeCall) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (activeCall as any).disconnect();
    }
    if (callDevice) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (callDevice as any).disconnectAll();
    }
    setCallStatus('ended');
    setActiveCall(null);
  };

  const handleSms = async () => {
    if (!smsMessage.trim()) {
      setActionError('Please enter a message.');
      return;
    }
    const ok = await postAction(`${API}/communication/sms`, {
      token,
      message: smsMessage.trim(),
    });
    if (ok) {
      setSuccess('Message sent to the owner anonymously!');
      setActiveMethod(null);
      setSmsMessage('');
    }
  };

  const handleWhatsApp = async () => {
    if (!whatsappMessage.trim()) {
      setActionError('Please enter a message.');
      return;
    }
    const ok = await postAction(`${API}/communication/whatsapp`, {
      token,
      message: whatsappMessage.trim(),
    });
    if (ok) {
      setSuccess('WhatsApp message sent to the owner!');
      setActiveMethod(null);
      setWhatsappMessage('');
    }
  };

  const handleReport = async () => {
    const captchaToken = reportCaptchaToken || (!turnstileSiteKey && isDevelopment ? 'dev-local-captcha' : null);
    if (!captchaToken) {
      setActionError('Please complete human verification before notifying the owner.');
      return;
    }

    const body: Record<string, unknown> = {
      captchaToken,
    };
    if (reportMessage.trim()) body.message = reportMessage.trim();
    if (reportImageUrl) body.finderImageUrl = reportImageUrl;

    const ok = await postAction(`${API}/scan/${token}/report-found`, body);
    if (ok) {
      setSuccess('Thank you! The owner has been notified that their item was found.');
      setActiveMethod(null);
      setReportMessage('');
      setReportImageUrl(null);
      setReportImageName(null);
      setReportCaptchaToken(null);
    }
  };

  const handleCaptchaVerify = useCallback((verifiedToken: string) => {
    setReportCaptchaToken(verifiedToken);
    setActionError(null);
  }, []);

  const handleCaptchaExpired = useCallback(() => {
    setReportCaptchaToken(null);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setReportCaptchaToken(null);
    setActionError('Could not verify captcha. Please refresh and try again.');
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setActionError('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setActionError(null);
    setLocationCoords(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGettingLocation(false);
        setLocationCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setActionError('Location permission denied. Please enable location services in your browser.');
        } else {
          setActionError('Unable to get your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSendLocation = async () => {
    if (!locationCoords) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`${API}/communication/send-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude,
          message: locationMessage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { message?: string }).message || 'Failed to send location');
      }
      setSuccess('Your location has been sent to the owner. Thank you!');
      setActiveMethod(null);
      setLocationMessage('');
      setLocationCoords(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to send location');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center gap-3 py-16">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </motion.div>
    );
  }

  if (fetchError || !tag) {
    const errorTitle = fetchStatus === 'inactive'
      ? 'Tag Not Active'
      : fetchStatus === 'deactivated'
        ? 'Tag Deactivated'
        : 'Tag Not Found';
    const errorMessage = fetchStatus === 'inactive'
      ? 'This tag is not active in our database. Please log in to activate it if you purchased the tag online or in store.'
      : fetchStatus === 'deactivated'
        ? 'This tag has been deactivated by its owner.'
        : fetchError || 'This tag could not be loaded. Please try again later.';

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100"
          >
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </motion.div>
          <h2 className="mt-4 text-lg font-semibold text-red-900">{errorTitle}</h2>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          {fetchStatus === 'inactive' && (
            <Link
              href="/login"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Log in to activate
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  const tagTypeLabel = TAG_TYPE_LABELS[tag.tagType] || 'Item';
  const displayName = tag.label || tagTypeLabel;
  const hasContactOptions = tag.contactOptions?.call || tag.contactOptions?.sms || tag.contactOptions?.whatsapp || tag.contactOptions?.sendLocation;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md space-y-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      >
        {tag.photoUrl ? (
          <motion.img
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            src={tag.photoUrl}
            alt={displayName}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-linear-to-br from-amber-50 to-yellow-100">
            <ImageIcon className="h-16 w-16 text-amber-300" />
          </div>
        )}

        <div className="p-5 text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
            className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
          >
            {tagTypeLabel}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-3 text-xl font-bold text-text"
          >
            {displayName}
          </motion.h1>
          {tag.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-1.5 text-sm text-text-muted"
            >
              {tag.description}
            </motion.p>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {tag.isLostMode && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100"
              >
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </motion.div>
              <div>
                <p className="text-sm font-bold text-red-800">This item has been reported lost</p>
                {tag.lostModeMessage && (
                  <p className="mt-1 text-sm text-red-700">{tag.lostModeMessage}</p>
                )}
                <p className="mt-1.5 text-xs text-red-600">
                  Please use the options below to help return this item to its owner.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-green-200 bg-green-50 p-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="flex-1 text-sm font-medium text-green-800">{success}</p>
              <button onClick={() => setSuccess(null)} className="shrink-0 text-green-600 hover:text-green-800" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasContactOptions && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <p className="text-center text-sm font-medium text-text">
            Found this item? Contact the owner anonymously.
          </p>

          {tag.contactOptions?.call && (
            <ContactButton
              method="call"
              activeMethod={activeMethod}
              onToggle={toggleMethod}
              icon={<Phone className="h-5 w-5" />}
              badge="Free"
              index={0}
            >
              <AnimatePresence>
                {activeMethod === 'call' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="mt-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      {callStatus === 'idle' && (
                        <>
                          <p className="text-sm text-text-muted">
                            Start an anonymous voice call directly from your browser. The owner will not see your number.
                          </p>
                          {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                          <button
                            onClick={handleCall}
                            disabled={submitting}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                          >
                            {submitting ? <Spinner size="sm" /> : <Phone className="h-4 w-4" />}
                            {submitting ? 'Connecting...' : 'Call Now'}
                          </button>
                        </>
                      )}
                      {callStatus === 'connecting' && (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <Spinner size="lg" className="text-green-600" />
                          <p className="text-sm font-medium text-text">Setting up secure connection...</p>
                        </div>
                      )}
                      {callStatus === 'ringing' && (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100"
                          >
                            <Phone className="h-7 w-7 text-green-600" />
                          </motion.div>
                          <p className="text-sm font-medium text-text">Ringing...</p>
                          <button
                            onClick={handleHangUp}
                            className="mt-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {callStatus === 'connected' && (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600"
                          >
                            <Phone className="h-7 w-7 text-white" />
                          </motion.div>
                          <p className="text-sm font-bold text-green-700">Connected</p>
                          <p className="text-xs text-text-muted">Call is in progress</p>
                          <button
                            onClick={handleHangUp}
                            className="mt-2 rounded-xl bg-red-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            End Call
                          </button>
                        </div>
                      )}
                      {callStatus === 'ended' && (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <p className="text-sm font-medium text-text">Call ended</p>
                          <button
                            onClick={() => setCallStatus('idle')}
                            className="text-sm font-medium text-green-700 underline hover:text-green-800"
                          >
                            Call again
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ContactButton>
          )}

          {tag.contactOptions?.sms && (
            <ContactButton
              method="sms"
              activeMethod={activeMethod}
              onToggle={toggleMethod}
              icon={<MessageCircle className="h-5 w-5" />}
              badge="Free"
              index={1}
            >
              <AnimatePresence>
                {activeMethod === 'sms' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="mt-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      <label htmlFor="sms-message" className="block text-sm font-medium text-text">
                        Your message
                      </label>
                      <textarea
                        id="sms-message"
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Hi, I found your item..."
                        rows={3}
                        className="mt-1.5 block w-full resize-none rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1.5 text-xs text-text-dim">
                        Your message will be sent anonymously to the owner via SMS.
                      </p>
                      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                      <button
                        onClick={handleSms}
                        disabled={submitting}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                      >
                        {submitting ? <Spinner size="sm" /> : <MessageCircle className="h-4 w-4" />}
                        {submitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ContactButton>
          )}

          {tag.contactOptions?.whatsapp && (
            <ContactButton
              method="whatsapp"
              activeMethod={activeMethod}
              onToggle={toggleMethod}
              icon={<WhatsAppIcon className="h-5 w-5" />}
              index={2}
            >
              <AnimatePresence>
                {activeMethod === 'whatsapp' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="mt-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      <label htmlFor="wa-message" className="block text-sm font-medium text-text">
                        Your message
                      </label>
                      <textarea
                        id="wa-message"
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        placeholder="Hi, I found your item..."
                        rows={3}
                        className="mt-1.5 block w-full resize-none rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="mt-1.5 text-xs text-text-dim">
                        Your message will be sent anonymously to the owner via WhatsApp.
                      </p>
                      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                      <button
                        onClick={handleWhatsApp}
                        disabled={submitting}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {submitting ? <Spinner size="sm" /> : <WhatsAppIcon className="h-4 w-4" />}
                        {submitting ? 'Sending...' : 'Send via WhatsApp'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ContactButton>
          )}

          {tag.contactOptions?.sendLocation && (
            <ContactButton
              method="location"
              activeMethod={activeMethod}
              onToggle={(method) => {
                toggleMethod(method);
                if (activeMethod !== 'location') {
                  setLocationCoords(null);
                  setLocationMessage('');
                  handleGetLocation();
                }
              }}
              icon={<MapPin className="h-5 w-5" />}
              index={3}
            >
              <AnimatePresence>
                {activeMethod === 'location' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="mt-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      {gettingLocation && (
                        <div className="flex items-center gap-3 py-4">
                          <Spinner size="sm" className="text-cyan-600" />
                          <p className="text-sm text-text-muted">Getting your location...</p>
                        </div>
                      )}
                      {!gettingLocation && locationCoords && (
                        <>
                          <div className="flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2">
                            <MapPin className="h-4 w-4 text-cyan-600" />
                            <p className="text-xs text-cyan-700">
                              Location captured: {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)}
                            </p>
                          </div>
                          <label htmlFor="location-message" className="mt-3 block text-sm font-medium text-text">
                            Message <span className="font-normal text-text-dim">(optional)</span>
                          </label>
                          <textarea
                            id="location-message"
                            value={locationMessage}
                            onChange={(e) => setLocationMessage(e.target.value)}
                            placeholder="e.g., Found near the park bench..."
                            rows={2}
                            className="mt-1.5 block w-full resize-none rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                          {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                          <button
                            onClick={handleSendLocation}
                            disabled={submitting}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-60"
                          >
                            {submitting ? <Spinner size="sm" /> : <MapPin className="h-4 w-4" />}
                            {submitting ? 'Sending...' : 'Send Location to Owner'}
                          </button>
                        </>
                      )}
                      {!gettingLocation && !locationCoords && actionError && (
                        <div className="py-2">
                          <p className="text-sm text-red-600">{actionError}</p>
                          <button
                            onClick={handleGetLocation}
                            className="mt-2 text-sm font-medium text-cyan-700 underline hover:text-cyan-800"
                          >
                            Try again
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ContactButton>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {hasContactOptions && (
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-dim">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}
        <button
          onClick={() => toggleMethod('report')}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-medium transition-all ${
            activeMethod === 'report'
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-border bg-surface text-text-muted hover:border-amber-300 hover:text-amber-700'
          }`}
        >
          <Flag className="h-4 w-4" />
          Report as Found
        </button>
        <AnimatePresence>
          {activeMethod === 'report' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mt-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <label htmlFor="report-message" className="block text-sm font-medium text-text">
                  Message <span className="font-normal text-text-dim">(optional)</span>
                </label>
                <textarea
                  id="report-message"
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="e.g., I found it at the park near..."
                  rows={3}
                  className="mt-1.5 block w-full resize-none rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                <div className="mt-3 rounded-xl border border-border bg-surface-raised p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-text">Attach image <span className="font-normal text-text-dim">(optional)</span></p>
                      <p className="text-xs text-text-dim">JPG, PNG, or WebP up to 5MB.</p>
                    </div>
                    <label
                      htmlFor="report-image"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-surface"
                    >
                      {reportImageUploading ? <Spinner size="sm" /> : <Paperclip className="h-4 w-4" />}
                      {reportImageUploading ? 'Uploading...' : reportImageUrl ? 'Replace' : 'Upload'}
                    </label>
                  </div>

                  <input
                    id="report-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReportImageChange}
                    className="sr-only"
                  />

                  {reportImageName && (
                    <p className="mt-2 text-xs text-text-dim">Attached: {reportImageName}</p>
                  )}

                  {reportImageUrl && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={reportImageUrl}
                        alt="Finder attachment preview"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  {reportImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportImageUrl(null);
                        setReportImageName(null);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove image
                    </button>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-border bg-surface-raised p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-text">Human verification</p>
                  </div>

                  {turnstileSiteKey ? (
                    <div className="mt-2">
                      <TurnstileWidget
                        siteKey={turnstileSiteKey}
                        onVerify={handleCaptchaVerify}
                        onExpired={handleCaptchaExpired}
                        onError={handleCaptchaError}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">
                      Captcha key is not configured. Reporting works in local development only.
                    </p>
                  )}
                </div>

                {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                <button
                  onClick={handleReport}
                  disabled={submitting || reportImageUploading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                >
                  {submitting ? <Spinner size="sm" /> : <Flag className="h-4 w-4" />}
                  {submitting ? 'Reporting...' : 'Notify the Owner'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="pb-2 text-center text-xs text-text-dim"
      >
        All communication is anonymous. Your identity stays private.
      </motion.p>
    </motion.div>
  );
}

function ContactButton({
  method,
  activeMethod,
  onToggle,
  icon,
  badge,
  children,
  index = 0,
}: {
  method: ContactMethod;
  activeMethod: ContactMethod | null;
  onToggle: (m: ContactMethod) => void;
  icon: ReactNode;
  badge?: string;
  children: ReactNode;
  index?: number;
}) {
  const isActive = activeMethod === method;
  const config = CONTACT_CONFIG[method];
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        onClick={() => onToggle(method)}
        className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all min-h-17 ${
          isActive
            ? config.activeColor
            : 'border-border bg-surface text-text hover:border-border-hover hover:shadow-md'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isActive ? 'bg-white/20' : config.bgLight
        }`}>
          <span className={isActive ? 'text-white' : config.color}>{icon}</span>
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold">{config.label}</span>
          {badge && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive ? 'bg-white/20 text-white' : config.bgLight
            }`}>{badge}</span>
          )}
          <p className={`mt-0.5 text-xs ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
            {config.desc}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-5 w-5 shrink-0" />
        </motion.div>
      </motion.button>
      {children}
    </motion.div>
  );
}

function TurnstileWidget({
  siteKey,
  onVerify,
  onExpired,
  onError,
}: {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let disposed = false;

    const renderWidget = () => {
      if (disposed || !containerRef.current || !window.turnstile) return;

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => onExpired(),
        'error-callback': () => onError(),
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');

    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderWidget, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = 'true';
      script.addEventListener('load', renderWidget, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      disposed = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onExpired, onError]);

  return <div ref={containerRef} className="min-h-16" />;
}
