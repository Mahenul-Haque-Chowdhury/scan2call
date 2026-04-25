function getBrowserApiOrigin(): string {
  const { protocol, hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3003';
  }

  const normalizedHost = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  if (normalizedHost.startsWith('api.')) {
    return `${protocol}//${normalizedHost}`;
  }

  return `${protocol}//api.${normalizedHost}`;
}

export function getApiOrigin(): string {
  if (typeof window !== 'undefined') {
    return getBrowserApiOrigin();
  }

  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3003';
}
