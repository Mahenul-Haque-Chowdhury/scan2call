'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string | null;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: { firstName: string; lastName: string; email: string } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Posts' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

function formatDate(value: string | null) {
  if (!value) return 'Not published';
  return new Intl.DateTimeFormat('en-AU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 15;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const result = await apiClient.get<{
        data: BlogPost[];
        meta: { page: number; pageSize: number; total: number };
      }>(`/admin/blog-posts?${params.toString()}`);

      setPosts(result.data);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete(post: BlogPost) {
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/blog-posts/${post.id}`);
      setDeleteTarget(null);
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog post');
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">Blog</h1>
          <p className="mt-1 text-sm text-text-muted">
            {total} post{total !== 1 ? 's' : ''} in the content library
          </p>
        </div>
        <Link href="/office/blog/new">
          <Button icon={<Plus className="h-4 w-4" />}>New Post</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Search by title, slug, or excerpt..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface-raised pl-9 pr-3 text-sm text-text placeholder:text-text-dim transition-colors hover:border-border-hover focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="sm:w-44"
        />
      </div>

      {error && (
        <Alert variant="error" className="mt-6" dismissible>
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim md:grid">
          <span className="col-span-5">Post</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-2">Published</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1"></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-text-dim/40" />
            <p className="mt-3 text-sm font-medium text-text-muted">No blog posts found</p>
            <p className="mt-1 text-xs text-text-dim">
              {search || statusFilter
                ? 'Try adjusting your filters.'
                : 'Create your first blog post to publish the blog page.'}
            </p>
            {!search && !statusFilter && (
              <Link href="/office/blog/new" className="mt-4">
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                  New Post
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative grid grid-cols-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-raised/50 md:grid-cols-12 md:gap-4 md:px-6"
              >
                <div className="min-w-0 md:col-span-5">
                  <Link
                    href={`/office/blog/${post.id}/edit`}
                    className="block truncate text-sm font-medium text-text transition-colors hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-1 truncate font-mono text-xs text-text-dim">/{post.slug}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="md:hidden text-xs text-text-dim">Category: </span>
                  <span className="text-sm text-text-muted">{post.category || 'Guide'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="md:hidden text-xs text-text-dim">Published: </span>
                  <span className="text-sm text-text-muted">{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex flex-wrap gap-1 md:col-span-2">
                  {post.deletedAt ? (
                    <Badge variant="error">Deleted</Badge>
                  ) : post.isPublished ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="neutral">Draft</Badge>
                  )}
                  {post.isFeatured && <Badge variant="warning">Featured</Badge>}
                </div>
                <div className="relative flex justify-end md:col-span-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenu(openMenu === post.id ? null : post.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface-overlay hover:text-text"
                    aria-label="Open post actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenu === post.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg shadow-shadow">
                        {post.isPublished && (
                          <Link
                            href={`/blog/${post.slug}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
                          >
                            <Eye className="h-4 w-4" />
                            View Public
                          </Link>
                        )}
                        <Link
                          href={`/office/blog/${post.id}/edit`}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Post
                        </Link>
                        {!post.deletedAt && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);
                              setDeleteTarget(post);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Post
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-text-dim">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface-raised disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface-raised disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-overlay"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text">Delete Blog Post</h3>
            <p className="mt-2 text-sm text-text-muted">
              Delete <span className="font-semibold text-text">{deleteTarget.title}</span>? This
              hides it from the public blog.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
