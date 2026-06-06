import type { DashboardCurrency } from '$lib/dashboard/types';

const LOCALE = 'es-PE';

export function formatInteger(value: number) {
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, digits: number = 1) {
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

export function formatCurrency(value: number, currency: DashboardCurrency) {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.supportsDecimals === false ? 0 : 2,
      maximumFractionDigits: currency.supportsDecimals === false ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency.symbol}${value.toFixed(currency.supportsDecimals === false ? 0 : 2)}`;
  }
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
