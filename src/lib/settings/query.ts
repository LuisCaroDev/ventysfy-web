import type { CompanyConfig, UserInfo } from '$lib/settings/types';
import { fetchCashRegisters, fetchCompanyConfig, fetchSettingsUser } from '$lib/settings/client';

export const settingsKeys = {
  all: ['settings'] as const,
  user: () => [...settingsKeys.all, 'user'] as const,
  companyConfig: () => [...settingsKeys.all, 'company-config'] as const,
  cashRegisters: () => [...settingsKeys.all, 'cash-registers'] as const,
  companyLogo: () => [...settingsKeys.all, 'company-logo'] as const,
};

export function settingsUserQueryOptions(storageUrl?: string | null) {
  return {
    queryKey: settingsKeys.user(),
    queryFn: () => fetchSettingsUser(storageUrl),
  };
}

export function companyConfigQueryOptions() {
  return {
    queryKey: settingsKeys.companyConfig(),
    queryFn: () => fetchCompanyConfig(),
  };
}

export function cashRegistersQueryOptions() {
  return {
    queryKey: settingsKeys.cashRegisters(),
    queryFn: () => fetchCashRegisters(true),
  };
}

export function deriveLogoFromUser(userInfo?: UserInfo | null) {
  return userInfo?.company.logoPath ?? '';
}

export function deriveSaleConfig(companyConfig?: CompanyConfig | null) {
  return companyConfig?.sale ?? null;
}
