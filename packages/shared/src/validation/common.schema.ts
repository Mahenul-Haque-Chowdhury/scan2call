import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const emailSchema = z.string().email('Invalid email address').max(255);

export const phoneSchema = z
  .string()
  .regex(/^\+61[2-9]\d{8}$/, 'Must be a valid Australian phone number (+61XXXXXXXXX)');

export type PaginationInput = z.infer<typeof paginationSchema>;
