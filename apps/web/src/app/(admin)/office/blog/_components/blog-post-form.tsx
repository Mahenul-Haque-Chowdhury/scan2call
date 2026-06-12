'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string;
  isPublished: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  category: '',
  tags: '',
  isPublished: false,
  isFeatured: false,
  metaTitle: '',
  metaDescription: '',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface BlogPostFormProps {
  postId?: string;
}

export default function BlogPostForm({ postId }: BlogPostFormProps) {
  const router = useRouter();
  const isEdit = !!postId;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    async function loadPost() {
      try {
        const result = await apiClient.get<{ data: BlogPostData }>(`/admin/blog-posts/${postId}`);
        const post = result.data;
        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: post.coverImageUrl || '',
          category: post.category || '',
          tags: post.tags.join(', '),
          isPublished: post.isPublished,
          isFeatured: post.isFeatured,
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
        });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function handleTitleChange(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: !isEdit || !current.slug ? slugify(title) : current.slug,
    }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.slug.trim()) next.slug = 'Slug is required';
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      next.slug = 'Use lowercase letters, numbers, and dashes only';
    }
    if (!form.excerpt.trim()) next.excerpt = 'Excerpt is required';
    if (!form.content.trim()) next.content = 'Content is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      coverImageUrl: form.coverImageUrl.trim() || null,
      category: form.category.trim() || null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      metaTitle: form.metaTitle.trim() || null,
      metaDescription: form.metaDescription.trim() || null,
    };

    try {
      if (isEdit) {
        await apiClient.patch(`/admin/blog-posts/${postId}`, payload);
      } else {
        await apiClient.post('/admin/blog-posts', payload);
      }
      router.push('/office/blog');
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/office/blog"
            className="mb-3 inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">
            {isEdit ? 'Edit Blog Post' : 'New Blog Post'}
          </h1>
        </div>
        <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
          {isEdit ? 'Save Changes' : 'Create Post'}
        </Button>
      </div>

      {submitError && (
        <Alert variant="error" dismissible>
          {submitError}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            error={errors.title}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(event) => setField('slug', slugify(event.target.value))}
            error={errors.slug}
            hint="Used in the public URL."
          />
          <Textarea
            label="Excerpt"
            value={form.excerpt}
            onChange={(event) => setField('excerpt', event.target.value)}
            error={errors.excerpt}
            maxLength={500}
            hint="A short summary for cards and search previews."
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(event) => setField('content', event.target.value)}
            error={errors.content}
            className="min-h-96 font-mono"
            hint="Use blank lines for paragraphs. Headings can start with ## or ###."
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text">Publishing</h2>
            <label className="mt-4 flex items-center gap-3 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setField('isPublished', event.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface-raised text-primary"
              />
              Published
            </label>
            <label className="mt-3 flex items-center gap-3 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setField('isFeatured', event.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface-raised text-primary"
              />
              Featured on blog
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text">Details</h2>
            <Input
              label="Category"
              value={form.category}
              onChange={(event) => setField('category', event.target.value)}
              placeholder="Guide"
            />
            <Input
              label="Tags"
              value={form.tags}
              onChange={(event) => setField('tags', event.target.value)}
              hint="Comma separated."
            />
            <Input
              label="Cover image URL"
              value={form.coverImageUrl}
              onChange={(event) => setField('coverImageUrl', event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text">SEO</h2>
            <Input
              label="Meta title"
              value={form.metaTitle}
              onChange={(event) => setField('metaTitle', event.target.value)}
            />
            <Textarea
              label="Meta description"
              value={form.metaDescription}
              onChange={(event) => setField('metaDescription', event.target.value)}
              className="min-h-24"
            />
          </div>
        </aside>
      </div>
    </form>
  );
}
