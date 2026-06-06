import { getFullPhone } from '$lib/settings/phone';
import type { CashRegister, CompanyConfig, Phone, UserInfo } from '$lib/settings/types';

type ApiEnvelope<T> = {
  data?: T;
  message?: string[];
  statusCode?: number;
  success?: boolean;
};

export class SettingsApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = 'SettingsApiError';
    this.status = status;
    this.details = details;
  }
}

function getErrorMessage(payload: ApiEnvelope<unknown> | null, fallback: string) {
  return payload?.message?.[0]?.trim() || fallback;
}

async function readApiResponse<T>(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  console.info('[settings-client] response', {
    url: response.url,
    status: response.status,
    ok: response.ok,
    payload,
  });

  if (!response.ok) {
    throw new SettingsApiError(
      getErrorMessage(payload, fallbackMessage),
      response.status >= 400 && response.status <= 599 ? response.status : 500,
    );
  }

  if (payload == null || !('data' in payload) || payload.data === undefined) {
    throw new SettingsApiError(fallbackMessage, 500);
  }

  return payload?.data as T;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  fallbackMessage: string = 'No fue posible completar la operación.',
) {
  console.info('[settings-client] request', {
    path,
    method: init?.method ?? 'GET',
  });

  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  return readApiResponse<T>(response, fallbackMessage);
}

async function requestFormData<T>(path: string, formData: FormData, fallbackMessage: string) {
  const response = await fetch(`/api/proxy${path}`, {
    method: 'PUT',
    body: formData,
  });

  return readApiResponse<T>(response, fallbackMessage);
}

function withAbsoluteLogoPath(userInfo: UserInfo, storageUrl?: string | null): UserInfo {
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

function normalizeUserInfo(userInfo: UserInfo, storageUrl?: string | null): UserInfo {
  return withAbsoluteLogoPath(
    {
      ...userInfo,
      user: {
        ...userInfo.user,
        cellphone: normalizePhone(userInfo.user?.cellphone),
      },
      company: {
        ...userInfo.company,
        cellphone: normalizePhone(userInfo.user?.cellphone),
      },
    },
    storageUrl,
  );
}

function toRate(value: number) {
  return Number((value / 100).toFixed(4));
}

export async function fetchSettingsUser(storageUrl?: string | null) {
  const userInfo = await requestJson<UserInfo>(
    '/v1/user',
    undefined,
    'No fue posible cargar la cuenta.',
  );
  return normalizeUserInfo(userInfo, storageUrl);
}

export async function fetchCompanyConfig() {
  return requestJson<CompanyConfig>(
    '/v1/company/config',
    undefined,
    'No fue posible cargar la configuración de la empresa.',
  );
}

export async function fetchCashRegisters(withUseStatus = true) {
  return requestJson<CashRegister[]>(
    `/v1/cash-register/?withUseStatus=${withUseStatus ? 'true' : 'false'}`,
    undefined,
    'No fue posible cargar la gestión de cajas.',
  );
}

export async function updateBusinessGeneral(body: { tradeName: string }) {
  return requestJson<void>(
    '/v1/user',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    'No fue posible actualizar el negocio.',
  );
}

export async function updateBusinessContact(body: { cellphone: string }) {
  return requestJson<void>(
    '/v1/user',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    'No fue posible actualizar la información comercial.',
  );
}

export async function updateCashRegisterConfig(body: {
  enableCashCount: boolean;
  validateCashCount: boolean;
}) {
  return requestJson<void>(
    '/v1/user',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    'No fue posible actualizar la caja.',
  );
}

export async function createCashRegister(body: { name: string }) {
  return requestJson<CashRegister | undefined>(
    '/v1/cash-register/',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    'No fue posible crear la caja.',
  );
}

export async function updateCashRegister(
  cashRegisterId: string,
  body: { name: string; status: 'enabled' | 'disabled' },
) {
  return requestJson<CashRegister | undefined>(
    `/v1/cash-register/${cashRegisterId}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    'No fue posible actualizar la caja.',
  );
}

export async function updateSalesTip(body: {
  tipEnabled: boolean;
  tipRate: number;
  tipMaxRate: number;
}) {
  return requestJson<void>(
    '/v1/company/sale/config',
    {
      method: 'PUT',
      body: JSON.stringify({
        tip: {
          enabled: body.tipEnabled,
          rate: toRate(body.tipRate),
          maxRate: toRate(body.tipMaxRate),
        },
      }),
    },
    'No fue posible actualizar la propina.',
  );
}

export async function updateSalesDiscount(body: {
  discountEnabled: boolean;
  discountEnabledMaxRate: boolean;
  discountMaxRate: number;
}) {
  return requestJson<void>(
    '/v1/company/sale/config',
    {
      method: 'PUT',
      body: JSON.stringify({
        discount: {
          enabled: body.discountEnabled,
          enabledMaxRate: body.discountEnabledMaxRate,
          maxRate: toRate(body.discountMaxRate),
        },
      }),
    },
    'No fue posible actualizar los descuentos.',
  );
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.set('file', file, file.name);

  return requestFormData<void>('/v1/company/logo', formData, 'No fue posible subir el logo.');
}
