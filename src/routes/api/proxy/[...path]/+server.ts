import { env } from '$env/dynamic/private';
import { error, type RequestHandler } from '@sveltejs/kit';

export const fallback: RequestHandler = async ({ request, params, url, locals }) => {
  if (!locals.accessToken) {
    throw error(401, 'Unauthorized');
  }

  if (!env.BASE_URL) {
    throw error(500, 'BASE_URL is not configured');
  }

  const path = params.path;
  const queryString = url.searchParams.toString();
  const targetUrl = `${env.BASE_URL}/${path}${queryString ? `?${queryString}` : ''}`;

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${locals.accessToken}`);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('content-length');
  headers.delete('accept-encoding');

  console.info('[proxy] request', {
    method: request.method,
    path,
    queryString,
    targetUrl,
  });

  try {
    const requestBody =
      request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    console.info('[proxy] response', {
      method: request.method,
      path,
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentEncoding: response.headers.get('content-encoding'),
    });

    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch (err) {
    console.error('Proxy error:', err);
    throw error(500, 'Internal Server Error while proxying request');
  }
};

export const GET = fallback;
export const POST = fallback;
export const PUT = fallback;
export const PATCH = fallback;
export const DELETE = fallback;
