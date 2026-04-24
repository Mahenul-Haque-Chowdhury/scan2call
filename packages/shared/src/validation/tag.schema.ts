import { z } from 'zod';

const tagTokenSchema = z.string().length(12).regex(/^[a-zA-Z0-9]+$/, 'Invalid tag token');

export const activateTagSchema = z.object({
  token: tagTokenSchema,
  label: z.string().max(200).optional(),
});

export const updateTagSchema = z.object({
  label: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional().nullable(),
  allowVoiceCall: z.boolean().optional(),
  allowSms: z.boolean().optional(),
  allowWhatsApp: z.boolean().optional(),
});

export const toggleLostModeSchema = z.object({
  isLostMode: z.boolean(),
  lostModeMessage: z.string().max(500).optional().nullable(),
});

export type ActivateTagInput = z.infer<typeof activateTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type ToggleLostModeInput = z.infer<typeof toggleLostModeSchema>;
