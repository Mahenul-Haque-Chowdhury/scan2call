'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReplyEntry {
  id: string;
  subject: string;
  body: string;
  sentAt: string;
  sentBy?: { id: string; firstName: string; lastName: string; email: string } | null;
}

interface ContactMessageDetail {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'NEW' | 'REPLIED' | 'ARCHIVED';
  createdAt: string;
  repliedAt: string | null;
  replies: ReplyEntry[];
}

const STATUS_BADGE: Record<ContactMessageDetail['status'], string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  REPLIED: 'bg-emerald-500/20 text-emerald-400',
  ARCHIVED: 'bg-surface-raised text-text-dim',
};

export default function AdminContactMessageDetailPage() {
  const params = useParams<{ messageId: string }>();
  const [message, setMessage] = useState<ContactMessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('Scan2Call Support');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessage() {
      try {
        const result = await apiClient.get<{ data: ContactMessageDetail }>(
          `/admin/contact-messages/${params.messageId}`
        );
        setMessage(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact message');
      } finally {
        setLoading(false);
      }
    }
    if (params.messageId) fetchMessage();
  }, [params.messageId]);

  const handleReply = async () => {
    if (!message) return;
    if (!body.trim()) {
      setResult('Please enter a reply message.');
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const result = await apiClient.post<{ data: ContactMessageDetail }>(
        `/admin/contact-messages/${message.id}/reply`,
        { subject, body }
      );
      setMessage(result.data);
      setBody('');
      setResult('Reply sent successfully.');
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div>
        <Link
          href="/admin/contact-messages"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Link>
        <Alert variant="error" className="mt-6">
          {error || 'Message not found'}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/contact-messages"
        className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inbox
      </Link>

      <div className="mt-5 rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">{message.name}</h1>
            <p className="text-sm text-text-muted">{message.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_BADGE[message.status]
              }`}
            >
              {message.status}
            </span>
            <Badge variant="neutral">
              {new Date(message.createdAt).toLocaleString()}
            </Badge>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-bg/40 p-4 text-sm text-text">
          <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Reply</h2>
          <p className="mt-1 text-sm text-text-muted">
            Replies are sent from your Resend sender address.
          </p>

          {result && (
            <Alert variant={result.includes('successfully') ? 'success' : 'error'} className="mt-4">
              {result}
            </Alert>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Subject"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-2 w-full min-h-45 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Write your reply..."
              />
            </div>
            <Button onClick={handleReply} loading={sending} icon={<Send className="h-4 w-4" />}>
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Previous Replies</h2>
          <div className="mt-4 space-y-4">
            {message.replies.length === 0 ? (
              <p className="text-sm text-text-dim">No replies yet.</p>
            ) : (
              message.replies.map((reply) => (
                <div key={reply.id} className="rounded-md border border-border bg-bg/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text">{reply.subject}</p>
                    <span className="text-xs text-text-dim">
                      {new Date(reply.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-muted whitespace-pre-wrap">{reply.body}</p>
                  {reply.sentBy && (
                    <p className="mt-2 text-xs text-text-dim">
                      Sent by {reply.sentBy.firstName} {reply.sentBy.lastName}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
