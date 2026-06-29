import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { countryToCurrency } from '@/lib/currency';

// Sets the visitor's default display currency from Cloudflare's geo header. Runs once
// per request; only writes the cookie when the user hasn't already chosen a currency
// (so a manual override is never clobbered). Display only - we always charge AUD.

const CURRENCY_COOKIE = 's2c_currency';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Respect an existing choice (geo default or manual override).
  if (request.cookies.has(CURRENCY_COOKIE)) {
    return response;
  }

  // Cloudflare adds CF-IPCountry when the domain is proxied through Cloudflare.
  const country = request.headers.get('cf-ipcountry');
  const currency = countryToCurrency(country);

  response.cookies.set(CURRENCY_COOKIE, currency, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  // Skip static assets and API routes; only need this on page navigations.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
