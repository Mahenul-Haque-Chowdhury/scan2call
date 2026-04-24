/** Length of generated tag tokens (12-char base62) */
export const TOKEN_LENGTH = 12;

/** Characters used for base62 token generation */
export const BASE62_CHARS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Number of random bytes needed to produce TOKEN_LENGTH base62 chars */
export const TOKEN_BYTES = 9;

/** Access token expiry in seconds (15 minutes) */
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;

/** Refresh token expiry in seconds (7 days) */
export const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

/** Refresh token cookie name */
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Default pagination page size */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum pagination page size */
export const MAX_PAGE_SIZE = 100;

/** API version prefix */
export const API_VERSION = 'v1';

/** Response header for request correlation ID */
export const CORRELATION_ID_HEADER = 'X-Request-Id';
