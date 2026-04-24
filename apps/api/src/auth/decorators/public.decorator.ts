import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public, bypassing the global JWT auth guard.
 * Use on endpoints that should be accessible without authentication
 * (e.g., register, login, forgot-password).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
