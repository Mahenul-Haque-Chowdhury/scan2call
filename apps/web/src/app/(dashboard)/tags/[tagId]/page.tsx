'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api-client';
import {
  ArrowLeft,
  Camera,
  X,
  AlertTriangle,
  History,
  Trash2,
  Edit2,
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  MapPinned,
  Copy,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Scan {
  id: string;
  ipAddress: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  contactInitiated: boolean;
  createdAt: string;
}

interface Tag {
  id: string;
  token: string;
  type: string;
  status: string;
  label: string | null;
  description: string | null;
  isLostMode: boolean;
  lostModeMessage: string | null;
  allowVoiceCall: boolean;
  allowSms: boolean;
  allowWhatsApp: boolean;
  allowSendLocation: boolean;
  photoUrl: string | null;
  createdAt: string;
  activatedAt: string | null;
  scans: Scan[];
  scanCount: number;
}

interface TagDetailResponse {
  data: Tag;
}

const TAG_TYPE_LABELS: Record<string, string> = {
  PET_COLLAR: 'Pet Collar',
  CAR_STICKER: 'Car Sticker',
  LUGGAGE_TAG: 'Luggage Tag',
  KEYCHAIN: 'Keychain',
  MEDICAL_BAND: 'Medical Band',
  GENERIC: 'Generic',
};

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'error' | 'neutral' | 'info' | 'warning'> = {
  ACTIVE: 'success',
  LOST: 'error',
  INACTIVE: 'neutral',
  FOUND: 'info',
  DEACTIVATED: 'neutral',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
});

function SlideToggle({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-surface-raised'}`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

export default function TagDetailPage() {
  const params = useParams<{ tagId: string }>();
  const router = useRouter();
  const tagId = params.tagId;

  const [tag, setTag] = useState<Tag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVoice, setEditVoice] = useState(false);
  const [editSms, setEditSms] = useState(false);
  const [editWhatsApp, setEditWhatsApp] = useState(false);
  const [editSendLocation, setEditSendLocation] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [contactSavingKey, setContactSavingKey] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSaved, setContactSaved] = useState(false);

  const [showLostForm, setShowLostForm] = useState(false);
  const [lostMessage, setLostMessage] = useState('');
  const [lostSaving, setLostSaving] = useState(false);
  const [lostError, setLostError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchTag = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<TagDetailResponse>(`/tags/${tagId}`);
      setTag(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tag.');
    } finally {
      setIsLoading(false);
    }
  }, [tagId]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  useEffect(() => {
    if (!tag) return;
    setEditVoice(tag.allowVoiceCall);
    setEditSms(tag.allowSms);
    setEditWhatsApp(tag.allowWhatsApp);
    setEditSendLocation(tag.allowSendLocation);
  }, [tag]);

  function enterEditMode() {
    if (!tag) return;
    setEditLabel(tag.label || '');
    setEditDescription(tag.description || '');
    setEditError(null);
    setIsEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    try {
      const body: Record<string, unknown> = {
        label: editLabel.trim() || null,
        description: editDescription.trim() || null,
      };
      const result = await apiClient.patch<TagDetailResponse>(
        `/tags/${tagId}`,
        body,
      );
      setTag(result.data);
      setIsEditing(false);
    } catch (err) {
      setEditError(
        err instanceof ApiError ? err.message : 'Failed to update tag.',
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function handleContactPreferenceChange(
    key: 'allowVoiceCall' | 'allowSms' | 'allowWhatsApp' | 'allowSendLocation',
    value: boolean,
  ) {
    if (!tag || contactSavingKey) return;

    const previousValue = tag[key];
    setContactError(null);
    setContactSavingKey(key);

    setTag({
      ...tag,
      [key]: value,
    });

    try {
      const result = await apiClient.patch<TagDetailResponse>(
        `/tags/${tagId}`,
        { [key]: value },
      );
      setTag(result.data);
      setContactSaved(true);
    } catch (err) {
      setTag({
        ...tag,
        [key]: previousValue,
      });
      setContactError(
        err instanceof ApiError
          ? err.message
          : 'Failed to update contact preferences.',
      );
    } finally {
      setContactSavingKey(null);
    }
  }

  useEffect(() => {
    if (!contactSaved) return;

    const timeoutId = window.setTimeout(() => {
      setContactSaved(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [contactSaved]);

  async function handleLostModeToggle(e: React.FormEvent) {
    e.preventDefault();
    if (!tag) return;
    setLostSaving(true);
    setLostError(null);
    try {
      const newIsLost = !tag.isLostMode;
      const body: Record<string, unknown> = { isLostMode: newIsLost };
      if (newIsLost && lostMessage.trim()) {
        body.lostModeMessage = lostMessage.trim();
      }
      const result = await apiClient.patch<TagDetailResponse>(
        `/tags/${tagId}/lost-mode`,
        body,
      );
      setTag(result.data);
      setShowLostForm(false);
      setLostMessage('');
    } catch (err) {
      setLostError(
        err instanceof ApiError
          ? err.message
          : 'Failed to toggle lost mode.',
      );
    } finally {
      setLostSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/tags/${tagId}`);
      router.push('/tags');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to delete tag.',
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const { uploadUrl, publicUrl } = await apiClient.post<{
        data: { uploadUrl: string; publicUrl: string; key: string };
      }>('/media/upload-url', {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        folder: 'tag-photos',
      }).then((res) => res.data);

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      const result = await apiClient.patch<TagDetailResponse>(
        `/tags/${tagId}`,
        { photoUrl: publicUrl },
      );
      setTag(result.data);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload photo.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoRemove() {
    if (!tag?.photoUrl) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await apiClient.patch<TagDetailResponse>(
        `/tags/${tagId}`,
        { photoUrl: null },
      );
      setTag(result.data);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to remove photo.',
      );
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Spinner size="lg" className="text-text-dim" />
          <p className="text-sm text-text-muted">Loading tag details...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !tag) {
    return (
      <div>
        <Link
          href="/tags"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tags
        </Link>
        <Alert variant="error" className="mt-8">
          <div className="text-center">
            <p>{error}</p>
            <button
              onClick={fetchTag}
              className="mt-3 text-sm font-medium text-error underline hover:opacity-80"
            >
              Try again
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!tag) return null;

  const scanUrl = `${window.location.origin}/scan/${tag.token}`;
  const editableContactPreferences = [
    {
      id: 'edit-allow-voice-calls',
      label: 'Allow Voice Calls',
      description: 'Let finders place anonymous relay calls.',
      icon: Phone,
      checked: editVoice,
      onChange: (value: boolean) => {
        setEditVoice(value);
        void handleContactPreferenceChange('allowVoiceCall', value);
      },
    },
    {
      id: 'edit-allow-sms',
      label: 'Allow SMS',
      description: 'Allow finders to send anonymous text messages.',
      icon: MessageSquare,
      checked: editSms,
      onChange: (value: boolean) => {
        setEditSms(value);
        void handleContactPreferenceChange('allowSms', value);
      },
    },
    {
      id: 'edit-allow-whatsapp',
      label: 'Allow WhatsApp',
      description: 'Suggested while travelling overseas.',
      icon: MessageCircle,
      checked: editWhatsApp,
      onChange: (value: boolean) => {
        setEditWhatsApp(value);
        void handleContactPreferenceChange('allowWhatsApp', value);
      },
    },
    {
      id: 'edit-allow-send-location',
      label: 'Allow Send Location',
      description: 'Let finders share their GPS location with you.',
      icon: MapPinned,
      checked: editSendLocation,
      onChange: (value: boolean) => {
        setEditSendLocation(value);
        void handleContactPreferenceChange('allowSendLocation', value);
      },
    },
  ];

  const renderActionsCard = (className?: string) => (
    <motion.div {...cardAnim(0.12)} className={className}>
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-text">Actions</h2>
        <div className="mt-4 space-y-3">
          {tag.isLostMode ? (
            <Button
              variant="outline"
              className="w-full border-warning/30 text-warning hover:bg-warning/10"
              icon={<AlertTriangle className="h-4 w-4" />}
              onClick={() => {
                setShowLostForm(true);
                setLostError(null);
              }}
            >
              Disable Lost Mode
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              icon={<AlertTriangle className="h-4 w-4" />}
              onClick={(e) => {
                handleLostModeToggle(
                  e as unknown as React.FormEvent,
                );
              }}
              disabled={lostSaving}
              loading={lostSaving}
            >
              {lostSaving ? 'Enabling...' : 'Re-enable Lost Mode'}
            </Button>
          )}

          <AnimatePresence>
            {showLostForm && tag.isLostMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-warning/20 bg-warning/5 p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Are you sure?</p>
                    <p className="mt-1 text-text-muted">
                      Disabling lost mode means finders will <strong>not</strong> be able to contact you
                      if this item is lost or misplaced. Your tag will remain scannable but no contact
                      options will be shown.
                    </p>
                  </div>
                </div>
                {lostError && (
                  <p className="text-sm text-error">{lostError}</p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={lostSaving}
                    loading={lostSaving}
                    onClick={(e) =>
                      handleLostModeToggle(e as unknown as React.FormEvent)
                    }
                  >
                    {lostSaving ? 'Disabling...' : 'Yes, Disable'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLostForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            href={`/tags/${tagId}/scans`}
            className="block"
          >
            <Button variant="secondary" className="w-full" icon={<History className="h-4 w-4" />}>
              View All Scan History
            </Button>
          </Link>

          {!showDeleteConfirm ? (
            <Button
              variant="ghost"
              className="w-full text-error hover:bg-error-muted"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Tag
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg border border-error/20 bg-error-muted p-4 space-y-3"
            >
              <p className="text-sm font-medium text-error">
                Are you sure you want to delete this tag? This action cannot
                be undone.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  loading={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link
          href="/tags"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tags
        </Link>
      </motion.div>

      <motion.div {...cardAnim(0.05)} className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display text-text">
            {tag.label || 'Unnamed Tag'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {TAG_TYPE_LABELS[tag.type] || tag.type}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[tag.status] || 'neutral'} className="text-sm px-3 py-1">
          {tag.status}
        </Badge>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert variant="error" className="mt-4">{error}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {!tag.isLostMode && tag.status === 'ACTIVE' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Alert variant="warning" title="Lost Mode is Disabled" className="mt-4">
            <p>Your tag is not protected. If this item is lost, finders won&apos;t be able to contact you.</p>
          </Alert>
        </motion.div>
      )}

      {tag.status === 'FOUND' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Alert variant="info" title="Item Reported Found" className="mt-4">
            <p>Someone has reported finding your item. Check your notifications.</p>
          </Alert>
        </motion.div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <motion.div {...cardAnim(0.1)}>
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text">Photo</h2>
              <div className="mt-4 flex flex-col items-center gap-4">
                {tag.photoUrl ? (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <img
                      src={tag.photoUrl}
                      alt={tag.label || 'Tag photo'}
                      className="h-48 w-48 rounded-xl border border-border object-cover"
                    />
                    <button
                      onClick={handlePhotoRemove}
                      disabled={uploading}
                      className="absolute -right-2 -top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-error text-white shadow-md transition-colors hover:opacity-80 disabled:opacity-50"
                      title="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-raised">
                    <Camera className="h-12 w-12 text-text-dim" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button variant="secondary" size="sm" disabled={uploading} asChild>
                    <span>
                      {uploading ? 'Uploading...' : tag.photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-text-dim">JPG, PNG or WebP. Max 5MB.</p>
                {uploadError && (
                  <p className="text-sm text-error">{uploadError}</p>
                )}
              </div>
            </Card>
          </motion.div>

          {renderActionsCard('lg:hidden')}

          <motion.div {...cardAnim(0.15)}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Tag Information</h2>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={enterEditMode} icon={<Edit2 className="h-3.5 w-3.5" />}>
                    Edit
                  </Button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 space-y-3 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="text-text-muted">Token</span>
                      <span className="font-mono font-medium text-text">{tag.token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Label</span>
                      <span className="font-medium text-text">
                        {tag.label || <span className="text-text-dim">--</span>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Description</span>
                      <span className="max-w-[60%] text-right font-medium text-text">
                        {tag.description || (
                          <span className="text-text-dim">--</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total Scans</span>
                      <span className="font-medium text-text">{tag.scanCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Created</span>
                      <span className="font-medium text-text">
                        {formatDate(tag.createdAt)}
                      </span>
                    </div>
                    {tag.activatedAt && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Activated</span>
                        <span className="font-medium text-text">
                          {formatDate(tag.activatedAt)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.form
                    key="edit"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onSubmit={handleSaveEdit}
                    className="mt-4 space-y-4"
                  >
                    <Input
                      label="Label"
                      id="edit-label"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Give this tag a name"
                      disabled={editSaving}
                    />
                    <Textarea
                      label="Description"
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      placeholder="Additional details..."
                      disabled={editSaving}
                    />

                    {editError && (
                      <p className="text-sm text-error">{editError}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={editSaving} loading={editSaving}>
                        {editSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={editSaving}>
                        Cancel
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          <motion.div {...cardAnim(0.18)}>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-text">Contact Preferences</h2>
                <div className="flex min-h-5 min-w-32 items-center justify-end">
                  <AnimatePresence mode="wait">
                    {contactSavingKey ? (
                      <motion.span
                        key="saving"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm font-medium text-text-muted"
                      >
                        Saving...
                      </motion.span>
                    ) : contactSaved && !contactError ? (
                      <motion.span
                        key="saved"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm font-medium text-success"
                      >
                        Saved Preference
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <motion.div
                className="mt-4 space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p className="text-xs text-text-muted">
                  Choose how finders can contact you for this tag.
                </p>

                <div className="overflow-hidden rounded-xl border border-border bg-surface-raised/30">
                  {editableContactPreferences.map((pref, idx) => {
                    const Icon = pref.icon;
                    return (
                      <div
                        key={pref.id}
                        className={`flex items-center justify-between gap-3 px-3 py-3 ${idx < editableContactPreferences.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${pref.checked ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-surface text-text-dim'}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <label htmlFor={pref.id} className="block cursor-pointer text-sm font-medium text-text">
                              {pref.label}
                            </label>
                            <p className="mt-0.5 text-xs text-text-muted">{pref.description}</p>
                          </div>
                        </div>

                        <SlideToggle
                          id={pref.id}
                          checked={pref.checked}
                          onChange={pref.onChange}
                          disabled={contactSavingKey !== null}
                        />
                      </div>
                    );
                  })}
                </div>

                {contactError && (
                  <p className="text-sm text-error">{contactError}</p>
                )}
              </motion.div>
            </Card>
          </motion.div>

          <motion.div {...cardAnim(0.2)}>
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text">QR Code Link</h2>
              <p className="mt-2 text-sm text-text-muted">
                This is the URL encoded in your tag&apos;s QR code.
              </p>
              <div className="mt-3 rounded-md bg-surface-raised p-3 flex items-center justify-between gap-2">
                <code className="break-all text-sm text-text-muted">{scanUrl}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(scanUrl)}
                  className="shrink-0 text-text-dim hover:text-text transition-colors"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          {renderActionsCard('hidden lg:block')}

          <motion.div {...cardAnim(0.18)}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Recent Scans</h2>
                {tag.scanCount > 0 && (
                  <Link
                    href={`/tags/${tagId}/scans`}
                    className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                  >
                    View all
                  </Link>
                )}
              </div>

              {(!tag.scans || tag.scans.length === 0) ? (
                <p className="mt-4 text-sm text-text-muted">
                  No scans recorded yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {tag.scans.map((scan, i) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22 + i * 0.04, duration: 0.3 }}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-text">
                          {scan.city && scan.country
                            ? `${scan.city}, ${scan.country}`
                            : scan.country || 'Unknown location'}
                        </p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatDate(scan.createdAt)}
                        </p>
                      </div>
                      <Badge variant={scan.contactInitiated ? 'success' : 'neutral'}>
                        {scan.contactInitiated ? 'Contacted' : 'View only'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
