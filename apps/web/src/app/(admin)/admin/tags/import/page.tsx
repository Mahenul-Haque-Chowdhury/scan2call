import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Import Tags',
  description: 'Import Scan2Call tag tokens from a CSV file.',
};

export default function AdminImportTagsPage() {
  return (
    <div>
      <Link
        href="/admin/tags"
        className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tags
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-text font-display">
          Import Tags
        </h1>
        <p className="mt-2 text-text-muted">
          Upload a CSV file containing pre-generated tag tokens to add them to the system.
        </p>
      </div>

      <div className="mt-8 max-w-lg">
        <div className="rounded-lg border-2 border-dashed border-border bg-surface p-12 text-center transition-colors hover:border-primary/50 hover:bg-surface-raised">
          <Upload className="mx-auto h-8 w-8 text-text-dim" />
          <p className="mt-4 text-sm font-medium text-text-muted">
            Drag and drop a CSV file here, or click to browse
          </p>
          <p className="mt-2 text-xs text-text-dim">
            CSV format: one token per row, 12-character base62 strings
          </p>
          <input type="file" accept=".csv" className="mt-4" />
        </div>

        <Button className="mt-6">
          Import Tags
        </Button>
      </div>
    </div>
  );
}
