import type { Metadata } from 'next';
import ScanPageClient from './scan-page-client';

interface ScanPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: ScanPageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: 'Contact the Owner',
    description: `You found an item with tag ${token}. Use the options below to contact the owner anonymously.`,
    robots: { index: false, follow: false },
  };
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { token } = await params;
  return <ScanPageClient token={token} />;
}
