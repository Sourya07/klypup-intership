import { z } from 'zod';

export const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'ANALYST']).default('ANALYST'),
});

export const joinByCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export const joinByTokenSchema = z.object({
  inviteToken: z.string().min(1, 'Invite token is required'),
});

export type InviteInput = z.infer<typeof inviteSchema>;
export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>;
export type JoinByTokenInput = z.infer<typeof joinByTokenSchema>;
