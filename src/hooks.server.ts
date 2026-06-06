import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { isPrivateAppRoute, routes } from '$lib/config/routes';
import { decrypt } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isLoginRoute = path === routes.login;
  const isProtectedRoute = path === '/' || isPrivateAppRoute(path);
  const isProxyRoute = path.startsWith('/api/proxy');

  const sessionToken = event.cookies.get('session');
  const session = sessionToken ? await decrypt(sessionToken) : null;
  const isAuthenticated = !!session?.accessToken;

  if (session) {
    event.locals.accessToken = session.accessToken;
    event.locals.session = session;
    event.locals.user = {
      email: session.email,
      storageUrl: session.storageUrl,
      permissions: session.permissions,
      firestore: session.firestore,
      role: session.role,
    };
  }

  if (isLoginRoute && isAuthenticated && event.request.method === 'GET') {
    throw redirect(302, routes.dashboard);
  }

  if (isProtectedRoute && !isAuthenticated) {
    throw redirect(302, routes.login);
  }

  if (isProxyRoute && !isAuthenticated) {
    return new Response('Unauthorized', { status: 401 });
  }

  return resolve(event);
};

export const handleError: HandleServerError = ({ error, event }) => {
  console.error('--- UNHANDLED SERVER ERROR ---');
  console.error('Path:', event.url.pathname);
  console.error(error);
  console.error('-----------------------------');

  return {
    message: error instanceof Error ? error.message : 'Internal Error',
  };
};
