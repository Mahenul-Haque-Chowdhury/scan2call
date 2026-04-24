export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CUSTOMER: 'CUSTOMER',
  FINDER: 'FINDER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
