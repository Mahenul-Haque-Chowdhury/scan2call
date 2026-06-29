import { z } from 'zod';
import { validatePostcode } from '../constants/postcode';

export const createOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export const shippingAddressSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).optional().nullable(),
    city: z.string().min(1).max(100),
    // State/province is required for AU (validated below); optional elsewhere since
    // many countries don't use states.
    state: z.string().max(50).optional().nullable(),
    // Postcode rules vary by country and some countries have none; validated below.
    postcode: z.string().max(20).optional().nullable(),
    country: z.string().length(2).default('AU'),
  })
  .superRefine((val, ctx) => {
    const result = validatePostcode(val.postcode, val.country);
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['postcode'],
        message: result.message ?? 'Invalid postcode',
      });
    }
    // Australia must include a state.
    if ((val.country ?? 'AU').toUpperCase() === 'AU' && !val.state?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['state'],
        message: 'State is required',
      });
    }
  });

export const createCheckoutSchema = z.object({
  items: z.array(createOrderItemSchema).min(1).max(20),
  shippingAddress: shippingAddressSchema,
  customerNotes: z.string().max(500).optional(),
});

export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
