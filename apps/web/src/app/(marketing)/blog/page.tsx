import Link from 'next/link';
import { ArrowRight, CalendarDays, SearchX } from 'lucide-react';
import { createMetadata } from '@/lib/seo';
import { getApiOrigin } from '@/lib/api-origin';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string | null;
  tags: string[];
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface BlogResponse {
  data: BlogPost[];
  meta: { page: number; pageSize: number; total: number };
}

export const metadata = createMetadata({
  title: 'Blog - QR Tag Guides & Lost & Found Tips',
  description:
    'Guides and updates from Scan2Call on QR identity tags, lost item recovery, pet and luggage safety, and privacy-first contact.',
  path: '/blog',
  keywords: [
    'QR tag guides',
    'lost and found tips',
    'pet safety QR tag',
    'luggage tracking tips',
    'QR tag blog',
  ],
});

async function getPosts(): Promise<BlogResponse> {
  try {
    const res = await fetch(`${getApiOrigin()}/api/v1/blog-posts?pageSize=24`, {
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      throw new Error('Failed to load blog posts');
    }

    return res.json();
  } catch {
    return { data: [], meta: { page: 1, pageSize: 24, total: 0 } };
  }
}

function formatDate(value: string | null) {
  if (!value) return 'Draft';
  return new Intl.DateTimeFormat('en-AU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function BlogPage() {
  const { data: posts } = await getPosts();
  const featured = posts.find((post) => post.isFeatured) ?? posts[0];
  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts;

  return (
    <main className="min-h-screen bg-bg">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Scan2Call Blog
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
                Practical guides for safer lost item recovery.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
                Learn how QR identity tags, anonymous relay, and simple privacy-first workflows
                help people return pets, bags, keys, and equipment faster.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-5">
              <p className="text-sm font-semibold text-text">Built around real finder moments</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Short, useful articles for customers who need clear answers before they tag
                something important.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {posts.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <SearchX className="h-10 w-10 text-text-dim" />
            <h2 className="mt-4 text-xl font-semibold text-text">No blog posts yet</h2>
            <p className="mt-2 max-w-md text-sm text-text-muted">
              Published posts from the admin panel will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:border-primary/40 lg:grid-cols-[0.95fr_1.05fr]"
              >
                <div className="aspect-[16/10] bg-surface-raised lg:aspect-auto">
                  {featured.coverImageUrl ? (
                    <img
                      src={featured.coverImageUrl}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-72 items-center justify-center bg-primary-muted">
                      <span className="text-sm font-semibold text-primary">Scan2Call</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {featured.category || 'Featured'}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">{featured.excerpt}</p>
                  <div className="mt-6 flex items-center justify-between gap-4 text-sm">
                    <span className="inline-flex items-center gap-2 text-text-dim">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(featured.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      Read article
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/40 hover:bg-surface-raised"
                  >
                    <div className="aspect-[16/9] bg-surface-raised">
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-primary-muted">
                          <span className="text-xs font-semibold text-primary">Scan2Call</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3 text-xs text-text-dim">
                        <span>{post.category || 'Guide'}</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-text">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-muted">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
