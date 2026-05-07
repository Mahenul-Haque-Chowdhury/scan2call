import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { CartProvider } from '@/providers/cart-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from '@/lib/seo';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;
const verificationOther: Record<string, string> = {};

if (bingVerification) verificationOther['msvalidate.01'] = bingVerification;
if (yandexVerification) verificationOther['yandex-verification'] = yandexVerification;

export const metadata: Metadata = {
  title: {
    default: 'Scan2Call - Privacy-First QR Identity Tags',
    template: '%s | Scan2Call',
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(siteUrl),
  alternates: { canonical: siteUrl },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Scan2Call - Privacy-First QR Identity Tags',
    description: SITE_DESCRIPTION,
    url: siteUrl,
    siteName: SITE_NAME,
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Scan2Call preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scan2Call - Privacy-First QR Identity Tags',
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  creator: 'GrayVally Software Solutions',
  publisher: 'GrayVally Software Solutions',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: googleVerification,
    other: Object.keys(verificationOther).length ? verificationOther : undefined,
  },
};

const themeScript = `
  (function() {
    var t = localStorage.getItem('scan2call-theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-text antialiased" suppressHydrationWarning>
        <CustomCursor />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
