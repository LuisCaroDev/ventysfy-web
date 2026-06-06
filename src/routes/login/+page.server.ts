import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { parseAccessTokenClaims } from '$lib/server/auth/access-token';
import { createSession, decrypt, deleteSession } from '$lib/server/session';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from './schema';

const MOBILE_APP_VERSION = '0.2.5';

type LoginApiData = {
  accessToken: string;
  storageUrl: string;
  permissions?: string[];
  firestore?: string;
};

type ApiResponse<T> = {
  data?: T;
  message?: string[];
  statusCode?: number;
};

const LOGIN_STATUS = {
  success: 200,
  unauthorized: 401,
} as const;
const WEB_ACCESS_DENIED_MESSAGE = 'Esta cuenta no tiene acceso a Ventysfy Web';

function getApiErrorMessage(payload: ApiResponse<unknown> | null, fallback: string) {
  if (payload?.message?.length) {
    return payload.message[0];
  }

  return fallback;
}

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod4(loginSchema));

  return {
    form,
  };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    if (!env.BASE_URL) {
      return fail(500, {
        form: await superValidate(zod4(loginSchema)),
        error: 'BASE_URL no está configurado en el entorno.',
      });
    }

    const requestClone = request.clone();
    const form = await superValidate(request, zod4(loginSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const rawFormData = await requestClone.formData();
    const offset = Number(rawFormData.get('offset')?.toString() ?? '0');
    const { email, password } = form.data;

    try {
      const response = await fetch(`${env.BASE_URL}/v2/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          v: MOBILE_APP_VERSION,
          offset: String(Number.isFinite(offset) ? offset : 0),
        },
        body: JSON.stringify({
          user: email,
          password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ApiResponse<LoginApiData> | null;

      const apiStatusCode = payload?.statusCode ?? response.status;

      if (
        response.status >= 500 ||
        apiStatusCode !== LOGIN_STATUS.success ||
        !payload?.data?.accessToken
      ) {
        return fail(apiStatusCode === LOGIN_STATUS.unauthorized ? 401 : 400, {
          form,
          error: getApiErrorMessage(payload, 'Credenciales no válidas.'),
        });
      }

      let tokenClaims;
      try {
        tokenClaims = parseAccessTokenClaims(payload.data.accessToken);
      } catch {
        return fail(403, {
          form,
          error: WEB_ACCESS_DENIED_MESSAGE,
        });
      }

      if (!tokenClaims.adminRole) {
        return fail(403, {
          form,
          error: WEB_ACCESS_DENIED_MESSAGE,
        });
      }

      await createSession(cookies, {
        accessToken: payload.data.accessToken,
        email,
        storageUrl: payload.data.storageUrl,
        permissions: payload.data.permissions ?? [],
        firestore: payload.data.firestore ?? '',
        role: tokenClaims.role,
      });
    } catch (error) {
      console.error('Login error:', error);
      return fail(500, {
        form,
        error: 'Ocurrió un error al iniciar sesión. Por favor verifica tu conexión.',
      });
    }

    throw redirect(303, '/');
  },

  logout: async ({ cookies }) => {
    const sessionToken = cookies.get('session');
    const session = sessionToken ? await decrypt(sessionToken) : null;

    if (session?.accessToken && env.BASE_URL) {
      try {
        await fetch(`${env.BASE_URL}/v1/auth/logout`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch (error) {
        console.error('Remote logout error:', error);
      }
    }

    deleteSession(cookies);
    throw redirect(303, '/login');
  },
};
