import { z } from 'zod';

export const webAdminRoleSchema = z.enum(['RO_01', 'RO_02']);

export type WebAdminRole = z.infer<typeof webAdminRoleSchema>;

export function isWebAdminRole(role: string): role is WebAdminRole {
  return webAdminRoleSchema.safeParse(role).success;
}
