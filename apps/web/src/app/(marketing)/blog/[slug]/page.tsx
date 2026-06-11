import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { createMetadata } from '@/lib/seo';
import { getApiOrigin } from '@/lib/api-origin';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  author: { firstName: string; lastName: string } | null;
}

interface BlogPostResponse {
  data: BlogPost;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const res = await fetch(`${getApiOrigin()}/api/v1/blog-posts/${slug}`, {
    next: { revalidate: 120 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load blog post');

  const json: BlogPostResponse = await res.json();
  return json.data;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-AU', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function renderContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (block.startsWith('## ')) {
        return (
          <h2 key={index} className="mt-10 text-2xl font-bold tracking-tight text-text">
            {block.replace(/^##\s+/, '')}
          </h2>
        );
      }

      if (block.startsWith('### ')) {
        return (
          <h3 key={index} className="mt-8 text-xl font-semibold text-text">
            {block.replace(/^###\s+/, '')}
          </h3>
        );
      }

      return (
        <p key={index} className="mt-5 text-base leading-8 text-text-muted">
          {block}
        </p>
      );
    });
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) {
    return createMetadata({
      title: 'Blog Post Not Found',
      description: 'This Scan2Call blog post could not be found.',
      path: `/blog/${params.slug}`,
      noindex: true,
    });
  }

  return createMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    images: post.coverImageUrl
      ? [{ url: post.coverImageUrl, alt: post.title }]
      : undefined,
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const date = formatDate(post.publishedAt);
  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : 'Scan2Call';

  return (
    <main className="min-h-screen bg-bg">
      <article>
        <header className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-6 pb-10 pt-28">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Blog
            </Link>
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {post.category || 'Scan2Call Guide'}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-text sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-text-muted">{post.excerpt}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-text-dim">
                {date && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {date}
                  </span>
                )}
                <span>{authorName}</span>
              </div>
            </div>
          </div>
          {post.coverImageUrl && (
            <div className="mx-auto max-w-5xl px-6 pb-10">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="aspect-[16/8] w-full rounded-xl border border-border object-cover"
              />
            </div>
          )}
        </header>

        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="prose prose-invert max-w-none">{renderContent(post.content)}</div>
          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
