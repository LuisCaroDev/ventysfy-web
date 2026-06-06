import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getFullPhone } from '$lib/settings/phone';
import type {
  CashRegister,
  CompanyConfig,
  Phone,
  SettingsPayload,
  UserInfo,
} from '$lib/settings/types';

type FetchLike = typeof fetch;

function getApiBaseUrl() {
  if (!env.BASE_URL) {
    throw error(500, 'BASE_URL is not configured');
  }

  return env.BASE_URL.replace(/\/$/, '');
}

function getAuthHeaders(accessToken?: string, extraHeaders?: HeadersInit) {
  if (!accessToken) {
    throw error(401, 'Unauthorized');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    ...extraHeaders,
  };
}

async function readApiResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    message?: string[];
    statusCode?: number;
  } | null;

  if (!response.ok) {
    const message = payload?.message?.[0] ?? 'No fue posible completar la operación.';
    const status =
      response.status >= 400 && response.status <= 599
        ? response.status
        : payload?.statusCode && payload.statusCode >= 400 && payload.statusCode <= 599
          ? payload.statusCode
          : 500;
    throw error(status, message);
  }

  return payload?.data as T;
}

function withAbsoluteLogoPath(userInfo: UserInfo, storageUrl?: string): UserInfo {
  const logoPath = userInfo.company.logoPath?.trim();

  if (!logoPath || /^https?:\/\//.test(logoPath) || !storageUrl) {
    return userInfo;
  }

  const normalizedStorageUrl = storageUrl.endsWith('/') ? storageUrl.slice(0, -1) : storageUrl;
  const normalizedLogoPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;

  return {
    ...userInfo,
    company: {
      ...userInfo.company,
      logoPath: `${normalizedStorageUrl}${normalizedLogoPath}`,
    },
  };
}

function normalizePhone(phone?: Phone | null): Phone {
  return {
    code: phone?.code ?? '',
    cellphone: phone?.cellphone ?? '',
    fullCellphone: getFullPhone(phone),
  };
}

function normalizeUserInfo(userInfo: UserInfo): UserInfo {
  return {
    ...userInfo,
    user: {
      ...userInfo.user,
      cellphone: normalizePhone(userInfo.user?.cellphone),
    },
    company: {
      ...userInfo.company,
      cellphone: normalizePhone(userInfo.user?.cellphone),
    },
  };
}

export async function fetchUserInfo(fetch: FetchLike, accessToken?: string, storageUrl?: string) {
  const response = await fetch(`${getApiBaseUrl()}/v1/user/`, {
    headers: getAuthHeaders(accessToken),
  });

  return withAbsoluteLogoPath(
    normalizeUserInfo(await readApiResponse<UserInfo>(response)),
    storageUrl,
  );
}

export async function fetchCompanyConfig(fetch: FetchLike, accessToken?: string) {
  const response = await fetch(`${getApiBaseUrl()}/v1/company/config`, {
    headers: getAuthHeaders(accessToken),
  });

  return readApiResponse<CompanyConfig>(response);
}

export async function fetchCashRegisters(
  fetch: FetchLike,
  accessToken?: string,
  withUseStatus: boolean = true,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/v1/cash-register/?withUseStatus=${withUseStatus ? 'true' : 'false'}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  return readApiResponse<CashRegister[]>(response);
}

export async function fetchSettingsPayload(
  fetch: FetchLike,
  accessToken?: string,
  storageUrl?: string,
): Promise<SettingsPayload> {
  const [userInfo, companyConfig] = await Promise.all([
    fetchUserInfo(fetch, accessToken, storageUrl),
    fetchCompanyConfig(fetch, accessToken),
  ]);

  return {
    userInfo,
    companyConfig,
  };
}

export async function apiJsonRequest<T>(
  fetch: FetchLike,
  accessToken: string | undefined,
  path: string,
  init: {
    method: 'PUT' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  },
) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: init.method,
    headers: getAuthHeaders(accessToken, {
      'Content-Type': 'application/json',
    }),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  return readApiResponse<T>(response);
}

export async function apiFormDataRequest<T>(
  fetch: FetchLike,
  accessToken: string | undefined,
  path: string,
  formData: FormData,
) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(accessToken),
    body: formData,
  });

  return readApiResponse<T>(response);
}

export async function createCashRegister(
  fetch: FetchLike,
  accessToken: string | undefined,
  body: { name: string },
) {
  return apiJsonRequest(fetch, accessToken, '/v1/cash-register/', {
    method: 'POST',
    body,
  });
}

export async function updateCashRegister(
  fetch: FetchLike,
  accessToken: string | undefined,
  cashRegisterId: string,
  body: { name: string; status: 'enabled' | 'disabled' },
) {
  return apiJsonRequest(fetch, accessToken, `/v1/cash-register/${cashRegisterId}`, {
    method: 'PUT',
    body,
  });
}
