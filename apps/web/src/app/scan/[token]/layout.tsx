import Link from 'next/link';

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scan-theme flex min-h-screen flex-col">
      {/* Yellow accent strip */}
      <div className="h-1 bg-linear-to-r from-yellow-500 via-yellow-400 to-yellow-500" />

      {/* Minimal branded header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-md items-center justify-center px-6 h-14">
          <Link href="/" className="text-lg font-bold tracking-tight font-display">
            Scan<span className="text-yellow-600">2</span>Call
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">{children}</main>

      <footer className="border-t border-border py-4 text-center text-xs text-text-dim">
        Powered by{' '}
        <Link href="/" className="hover:text-text-muted transition-colors">
          Scan2Call
        </Link>{' '}
        - Privacy-first QR identity tags
      </footer>
    </div>
  );
}
