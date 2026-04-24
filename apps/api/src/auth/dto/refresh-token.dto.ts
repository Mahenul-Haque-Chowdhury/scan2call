/**
 * Refresh token DTO.
 *
 * The refresh token is read from the HttpOnly cookie (`refresh_token`)
 * by the JwtRefreshStrategy, so no request body is required for this endpoint.
 * This file exists for completeness and can be extended if additional
 * metadata (e.g., device fingerprint) is sent alongside the cookie.
 */
export class RefreshTokenDto {
  // Intentionally empty: the refresh token is extracted from the cookie
}
