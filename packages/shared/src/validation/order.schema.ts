import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  postcode: z.string().regex(/^\d{4}$/, 'Must be a valid Australian postcode'),
  country: z.string().length(2).default('AU'),
});

export const createCheckoutSchema = z.object({
  items: z.array(createOrderItemSchema).min(1).max(20),
  shippingAddress: shippingAddressSchema,
  customerNotes: z.string().max(500).optional(),
});

export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
