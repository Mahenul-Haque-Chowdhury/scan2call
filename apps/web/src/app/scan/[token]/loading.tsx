import { Spinner } from '@/components/ui/spinner';

export default function ScanLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
