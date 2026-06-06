import { z } from 'zod';
import { isWebAdminRole, type WebAdminRole } from './web-roles';

const accessTokenClaimsSchema = z.object({
  exp: z.number().int().positive(),
  r: z.string().trim().min(1),
});

type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;

export type NormalizedAccessTokenClaims = {
  expiresAt: Date;
  role: string;
  adminRole: WebAdminRole | null;
};

function decodeAccessTokenPayload(accessToken: string) {
  const tokenPayload = accessToken.split('.')[1];

  if (!tokenPayload) {
    throw new Error('Access token does not contain a valid payload');
  }

  const base64 = tokenPayload.replace(/-/g, '+').replace(/_/g, '/');
  const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const payloadJson = atob(normalized);

  return JSON.parse(payloadJson) as unknown;
}

export function parseAccessTokenClaims(accessToken: string): NormalizedAccessTokenClaims {
  const parsedClaims = accessTokenClaimsSchema.safeParse(decodeAccessTokenPayload(accessToken));

  if (!parsedClaims.success) {
    throw new Error('Access token does not contain the required claims');
  }

  return normalizeAccessTokenClaims(parsedClaims.data);
}

function normalizeAccessTokenClaims(claims: AccessTokenClaims): NormalizedAccessTokenClaims {
  return {
    expiresAt: new Date(claims.exp * 1000),
    role: claims.r,
    adminRole: isWebAdminRole(claims.r) ? claims.r : null,
  };
}
