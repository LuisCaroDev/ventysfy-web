import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { SignJWT, jwtVerify } from 'jose';
import { parseAccessTokenClaims } from '$lib/server/auth/access-token';

export interface SessionPayload {
  accessToken: string;
  email: string;
  storageUrl: string;
  permissions: string[];
  firestore: string;
  role: string;
  expiresAt: Date;
}

async function getKey() {
  const secretKey = env.SECRET_KEY;

  if (!secretKey) {
    throw new Error('SECRET_KEY is not configured in environment variables');
  }

  const encoded = new TextEncoder().encode(secretKey);
  return crypto.subtle.importKey('raw', encoded, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function encrypt(payload: SessionPayload) {
  const { expiresAt, ...sessionData } = payload;
  const expirationTime = Math.floor(expiresAt.getTime() / 1000);
  const key = await getKey();

  return new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(key);
}

export async function decrypt(session: string): Promise<SessionPayload | null> {
  if (!session || typeof session !== 'string' || !session.includes('.')) {
    return null;
  }

  try {
    const key = await getKey();
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });

    const exp = payload.exp;
    if (!exp) {
      return null;
    }

    return {
      accessToken: String(payload.accessToken ?? ''),
      email: String(payload.email ?? ''),
      storageUrl: String(payload.storageUrl ?? ''),
      permissions: Array.isArray(payload.permissions)
        ? payload.permissions.map((permission) => String(permission))
        : [],
      firestore: String(payload.firestore ?? ''),
      role: String(payload.role ?? ''),
      expiresAt: new Date(exp * 1000),
    };
  } catch {
    return null;
  }
}

export async function createSession(cookies: Cookies, data: Omit<SessionPayload, 'expiresAt'>) {
  const { expiresAt } = parseAccessTokenClaims(data.accessToken);
  const session = await encrypt({ ...data, expiresAt });

  cookies.set('session', session, {
    httpOnly: true,
    secure: !dev,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export function deleteSession(cookies: Cookies) {
  cookies.delete('session', { path: '/' });
}
