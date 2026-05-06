'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { fetchWithAuth } from '@/lib/auth';
import { getApiOrigin } from '@/lib/api-origin';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface QrTemplate {
  id: string;
  name: string;
  description?: string | null;
  config: {
    size?: number;
    margin?: number;
    foregroundColor?: string;
    backgroundColor?: string;
    layout?: 'STANDARD' | 'BRANDED_4X6';
    layoutWidth?: number;
  };
  isActive: boolean;
  isDefault?: boolean;
}

export default function AdminQrTemplatesPage() {
  const [templates, setTemplates] = useState<QrTemplate[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(2);
  const [foregroundColor, setForegroundColor] = useState('#0f172a');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [layout, setLayout] = useState<'STANDARD' | 'BRANDED_4X6'>('STANDARD');
  const [layoutWidth, setLayoutWidth] = useState(1200);
  const [saving, setSaving] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ data: QrTemplate[] }>('/admin/qr-templates');
      const nextTemplates = response.data;
      setTemplates(nextTemplates);

      const nextDefault = nextTemplates.find((template) => template.isDefault)?.id ?? null;
      setDefaultTemplateId(nextDefault);
      setSelectedTemplateId((current) => {
        if (current) return current;
        if (nextDefault) return nextDefault;
        return nextTemplates[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apiOrigin = getApiOrigin();

    async function loadPreviews() {
      const nextUrls: Record<string, string> = {};
      for (const template of templates) {
        try {
          const res = await fetchWithAuth(
            `${apiOrigin}/api/v1/admin/qr-templates/${template.id}/preview?format=svg`,
            { method: 'GET' },
          );
          if (!res.ok) continue;
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          nextUrls[template.id] = url;
        } catch {
          // ignore
        }
      }

      if (!cancelled) {
        Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = nextUrls;
        setPreviewUrls(nextUrls);
      } else {
        Object.values(nextUrls).forEach((url) => URL.revokeObjectURL(url));
      }
    }

    if (templates.length > 0) {
      loadPreviews();
    } else {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = {};
      setPreviewUrls({});
    }

    return () => {
      cancelled = true;
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [templates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/admin/qr-templates', {
        name: name.trim(),
        description: description.trim() || null,
        config: {
          size,
          margin,
          foregroundColor,
          backgroundColor,
          layout,
          layoutWidth: layout === 'BRANDED_4X6' ? layoutWidth : undefined,
        },
        isActive: true,
      });
      setName('');
      setDescription('');
      await loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: QrTemplate) => {
    setError(null);
    try {
      await apiClient.patch(`/admin/qr-templates/${template.id}`, {
        isActive: !template.isActive,
      });
      await loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update template');
    }
  };

  const handleApplyDefault = async () => {
    if (!selectedTemplateId) return;
    setApplying(true);
    setError(null);
    try {
      const response = await apiClient.patch<{ data: { templateId: string | null } }>(
        '/admin/qr-templates/default',
        { templateId: selectedTemplateId },
      );
      const nextDefault = response.data?.templateId ?? selectedTemplateId;
      setDefaultTemplateId(nextDefault);
      setTemplates((current) =>
        current.map((template) => ({
          ...template,
          isDefault: template.id === nextDefault,
        })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update default design');
    } finally {
      setApplying(false);
    }
  };

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  const renderDesignPreview = (
    template: QrTemplate,
    variant: 'small' | 'large',
  ) => {
    const background = template.config.backgroundColor ?? '#ffffff';
    const qrUrl = previewUrls[template.id];
    
    if (template.config.layout === 'BRANDED_4X6') {
      const imgClass = variant === 'large' ? 'h-64 object-contain' : 'h-32 object-contain';
      return (
        <div className="flex items-center justify-center">
          {qrUrl ? (
            <img src={qrUrl} alt={`${template.name} QR preview`} className={imgClass} />
          ) : (
            <div className={`${imgClass} w-24 rounded-xl bg-surface`} />
          )}
        </div>
      );
    }

    const sizes = variant === 'large'
      ? { wrap: 'rounded-3xl p-6', qrWrap: 'p-4', qrSize: 'h-44 w-44', text: 'text-lg', label: 'text-xs' }
      : { wrap: 'rounded-2xl p-4', qrWrap: 'p-2.5', qrSize: 'h-20 w-20', text: 'text-sm', label: 'text-[10px]' };

    return (
      <div
        className={`relative flex flex-col items-center justify-center gap-3 border border-border/70 ${sizes.wrap}`}
        style={{ backgroundColor: background }}
      >
        <p className={`text-center font-semibold uppercase tracking-[0.18em] ${sizes.label} text-white/80`}>
          Scan The QR Code To Contact The Owner
        </p>
        <div className={`rounded-2xl bg-white shadow-sm ${sizes.qrWrap}`}>
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`${template.name} QR preview`}
              className={`${sizes.qrSize}`}
            />
          ) : (
            <div className={`${sizes.qrSize} rounded-xl bg-surface`} />
          )}
        </div>
        <p className={`font-display font-semibold tracking-wide ${sizes.text}`}>
          <span className="text-white">Scan</span>
          <span style={{ color: '#E2B914' }}>2</span>
          <span className="text-white">Call</span>
        </p>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-text font-display">QR Designs</h1>
      <p className="mt-2 text-text-muted">Manage QR design templates for batch generation.</p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-text">QR Designs</h2>
              {defaultTemplateId && (
                <p className="text-xs text-text-dim">
                  Default design selected
                </p>
              )}
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-text-dim">Loading designs...</p>
            ) : templates.length === 0 ? (
              <p className="mt-4 text-sm text-text-dim">No designs yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTemplateId(template.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedTemplateId(template.id);
                      }
                    }}
                    className={`w-full rounded-xl border border-border bg-surface-raised p-4 text-left transition hover:border-primary/50 ${
                      template.id === selectedTemplateId ? 'border-primary/70 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {renderDesignPreview(template, 'small')}
                        <div>
                          <h3 className="font-medium text-text">{template.name}</h3>
                          {template.description && (
                            <p className="mt-1 text-sm text-text-dim">{template.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-xs text-text-dim">
                            <span>{template.isActive ? 'Active' : 'Inactive'}</span>
                            {template.id === defaultTemplateId && (
                              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleToggleActive(template)}>
                        {template.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Create Design</h2>
            <div>
              <label className="block text-sm font-medium text-text-muted">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-muted">Layout</label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as 'STANDARD' | 'BRANDED_4X6')}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="BRANDED_4X6">4x6 Branded</option>
                </select>
              </div>
              {layout === 'BRANDED_4X6' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted">Layout Width (px)</label>
                  <input
                    type="number"
                    min={400}
                    max={2400}
                    value={layoutWidth}
                    onChange={(e) => setLayoutWidth(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-muted">Size</label>
                <input
                  type="number"
                  min={100}
                  max={800}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted">Margin</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-muted">Foreground</label>
                <input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-surface p-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted">Background</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-surface p-1"
                />
              </div>
            </div>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving...' : 'Create Design'}
            </Button>
          </form>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Selected Preview</h2>
              <p className="mt-1 text-sm text-text-dim">
                {selectedTemplate ? selectedTemplate.name : 'Choose a design to preview'}
              </p>
            </div>
            <Button
              size="sm"
              disabled={!selectedTemplate || applying || selectedTemplate?.id === defaultTemplateId}
              onClick={handleApplyDefault}
            >
              {selectedTemplate?.id === defaultTemplateId
                ? 'Default Applied'
                : applying
                  ? 'Applying...'
                  : 'Apply as Default'}
            </Button>
          </div>

          <div className="mt-6">
            {selectedTemplate ? (
              <div className="space-y-4">
                {renderDesignPreview(selectedTemplate, 'large')}
                {selectedTemplate.id === defaultTemplateId && (
                  <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                    This design is the current default for new tag batches.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-10 text-center text-sm text-text-dim">
                Select a design to see a large preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
