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
  };
  isActive: boolean;
}

export default function AdminQrTemplatesPage() {
  const [templates, setTemplates] = useState<QrTemplate[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(2);
  const [foregroundColor, setForegroundColor] = useState('#0f172a');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [saving, setSaving] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ data: QrTemplate[] }>('/admin/qr-templates');
      setTemplates(response.data);
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

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-text font-display">QR Templates</h1>
      <p className="mt-2 text-text-muted">Manage QR design templates for batch generation.</p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Create Template</h2>
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
            {saving ? 'Saving...' : 'Create Template'}
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Existing Templates</h2>
          {loading ? (
            <p className="mt-4 text-sm text-text-dim">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="mt-4 text-sm text-text-dim">No templates yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="rounded-md border border-border bg-surface-raised p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-text">{template.name}</h3>
                      {template.description && (
                        <p className="mt-1 text-sm text-text-dim">{template.description}</p>
                      )}
                      <p className="mt-2 text-xs text-text-dim">
                        {template.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleToggleActive(template)}>
                      {template.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                  {previewUrls[template.id] && (
                    <img
                      src={previewUrls[template.id]}
                      alt={`${template.name} preview`}
                      className="mt-3 w-32 rounded bg-white p-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
