import { fetchSettingsUser, SettingsApiError } from '$lib/settings/client';
import type {
  CustomerBulkConfirmResponse,
  CustomerBulkGenerateResponse,
  CustomerImportCountry,
  CustomerImportPhoneCode,
  ProductBulkConfirmResponse,
  ProductBulkGenerateResponse,
  ProductPresentation,
} from '$lib/imports/types';

type ApiEnvelope<T> = {
  data?: T;
  message?: string[];
  statusCode?: number;
  success?: boolean;
};

function getErrorMessage(payload: ApiEnvelope<unknown> | null, fallback: string) {
  return payload?.message?.[0]?.trim() || fallback;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  fallbackMessage: string = 'No fue posible completar la operación.',
) {
  console.info('[imports-client] request', {
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

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  console.info('[imports-client] response', {
    url: response.url,
    status: response.status,
    ok: response.ok,
    payload,
  });

  if (!response.ok) {
    throw new SettingsApiError(
      getErrorMessage(payload, fallbackMessage),
      response.status || 500,
      payload?.message ?? [],
    );
  }

  if (payload?.statusCode && payload.statusCode >= 400) {
    throw new SettingsApiError(
      getErrorMessage(payload, fallbackMessage),
      payload.statusCode,
      payload.message ?? [],
    );
  }

  if (payload?.success === false) {
    throw new SettingsApiError(
      getErrorMessage(payload, fallbackMessage),
      500,
      payload.message ?? [],
    );
  }

  if (payload == null || !('data' in payload) || payload.data == null) {
    throw new SettingsApiError(fallbackMessage, 500);
  }

  return payload?.data as T;
}

export async function fetchCustomerImportContext() {
  const [user, publicConfig] = await Promise.all([
    fetchSettingsUser(),
    fetchCustomerPublicConfig(),
  ]);

  const countries = publicConfig.countries ?? [];
  const country = countries.find((item) => item.code3 === user.company.country.code3);
  if (!country) {
    throw new Error('No se encontró la configuración de documentos para el país de la empresa.');
  }

  const phoneCode =
    publicConfig.phoneCode?.find((item) => item.isoCode === user.company.country.code2) ?? null;

  return { country, phoneCode };
}

async function fetchCustomerPublicConfig() {
  try {
    return await requestJson<{
      countries?: CustomerImportCountry[];
      phoneCode?: CustomerImportPhoneCode[];
    }>(
      '/v1/general/config/public',
      undefined,
      'No fue posible cargar la configuración pública para importar clientes.',
    );
  } catch (error) {
    console.warn(
      '[imports-client] public config endpoint failed, falling back to countries',
      error,
    );

    const countries = await requestJson<CustomerImportCountry[]>(
      '/v1/general/countries',
      undefined,
      'No fue posible cargar los países para importar clientes.',
    );

    return {
      countries,
      phoneCode: [],
    };
  }
}

export async function fetchProductImportContext() {
  const config = await requestJson<{ unitTypes: ProductPresentation[] }>(
    '/v3/product/config',
    undefined,
    'No fue posible cargar la configuración de productos.',
  );

  const presentations = (config.unitTypes ?? []).filter(
    (item): item is ProductPresentation =>
      !!item && typeof item.name === 'string' && item.name.trim().length > 0,
  );

  console.info('[imports-client] normalized product presentations', {
    rawCount: config.unitTypes?.length ?? 0,
    normalizedCount: presentations.length,
    invalidItems: (config.unitTypes ?? []).filter(
      (item) => !item || typeof item.name !== 'string' || item.name.trim().length === 0,
    ),
  });

  return {
    presentations,
  };
}

export function generateCustomerImport(customers: unknown[]) {
  return requestJson<CustomerBulkGenerateResponse>(
    '/v1/customer/bulk/generate',
    {
      method: 'POST',
      body: JSON.stringify({ customers }),
    },
    'No fue posible validar la importación de clientes.',
  );
}

export function confirmCustomerImport(trackingCode: string, approve: boolean) {
  return requestJson<CustomerBulkConfirmResponse>(
    `/v1/customer/bulk/${trackingCode}/${approve ? 'approve' : 'deny'}`,
    {
      method: 'PUT',
    },
    approve
      ? 'No fue posible completar la importación de clientes.'
      : 'No fue posible cancelar la importación de clientes.',
  );
}

export function generateProductImport(products: unknown[]) {
  return requestJson<ProductBulkGenerateResponse>(
    '/v3/product/bulk/generate',
    {
      method: 'POST',
      body: JSON.stringify({ products }),
    },
    'No fue posible validar la importación de productos.',
  );
}

export function confirmProductImport(trackingCode: string, approve: boolean) {
  return requestJson<ProductBulkConfirmResponse>(
    `/v3/product/bulk/${trackingCode}?approve=${approve ? 'true' : 'false'}`,
    {
      method: 'PUT',
    },
    approve
      ? 'No fue posible completar la importación de productos.'
      : 'No fue posible cancelar la importación de productos.',
  );
}
