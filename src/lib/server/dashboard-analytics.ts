import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import type {
  DashboardApiResponse,
  DashboardCurrency,
  ServiceAnalyticsViewModel,
} from '$lib/dashboard/types';

type FetchLike = typeof fetch;

const FALLBACK_CURRENCY: DashboardCurrency = {
  code: 'USD',
  symbol: '$',
  supportsDecimals: true,
};

function getApiBaseUrl() {
  if (!env.BASE_URL) {
    throw error(500, 'BASE_URL is not configured');
  }

  return env.BASE_URL.replace(/\/$/, '');
}

function getAuthHeaders(accessToken?: string) {
  if (!accessToken) {
    throw error(401, 'Unauthorized');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function readApiResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    message?: string[];
    statusCode?: number;
  } | null;

  if (!response.ok) {
    const message = payload?.message?.[0] ?? 'No fue posible cargar la analítica.';
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

function capitalize(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function normalizeMonth(month: number) {
  return (((month - 1) % 12) + 12) % 12;
}

function getMonthLabel(month: number) {
  const date = new Date(Date.UTC(2026, normalizeMonth(month), 1));
  const label = new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(date).replace('.', '');
  return capitalize(label);
}

function getPeriodLabel(from: string) {
  const date = new Date(`${from}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Resumen del mes';
  }

  return capitalize(
    new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
    }).format(date),
  );
}

function resolveImageUrl(imageUrl: string | null, storageUrl?: string) {
  const value = imageUrl?.trim();

  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  if (!storageUrl) return value;

  const normalizedStorageUrl = storageUrl.endsWith('/') ? storageUrl.slice(0, -1) : storageUrl;
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${normalizedStorageUrl}${normalizedPath}`;
}

export async function fetchServiceAnalyticsResponse(fetch: FetchLike, accessToken?: string) {
  const response = await fetch(`${getApiBaseUrl()}/v1/report/dashboard`, {
    headers: getAuthHeaders(accessToken),
  });

  return readApiResponse<DashboardApiResponse>(response);
}

export function mapServiceAnalyticsDashboard(
  response: DashboardApiResponse,
  currency: DashboardCurrency = FALLBACK_CURRENCY,
  storageUrl?: string,
): ServiceAnalyticsViewModel {
  const attendancePresented = Number(response.attendanceRate.presented ?? 0);
  const attendanceTotalScheduled = Number(response.attendanceRate.totalScheduled ?? 0);
  const attendanceAbsent = Math.max(0, attendanceTotalScheduled - attendancePresented);

  const occupancyEnrolledStudents = Number(response.occupancyRate.enrolledStudents ?? 0);
  const occupancyMaxCapacity = Number(response.occupancyRate.maxCapacity ?? 0);
  const occupancyAvailable = Math.max(0, occupancyMaxCapacity - occupancyEnrolledStudents);

  const revenueCurrentMonth = Number(response.revenueCurrentMonth ?? 0);
  const revenuePreviousMonth = Number(response.revenuePreviousMonth ?? 0);
  const revenueVariationPercent =
    revenuePreviousMonth === 0
      ? null
      : ((revenueCurrentMonth - revenuePreviousMonth) / revenuePreviousMonth) * 100;

  const topServices = [...(response.topServicesByRevenue ?? [])]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const maxRevenue = topServices[0]?.revenue ?? 0;

  return {
    periodLabel: getPeriodLabel(response.period.from),
    currency,
    newEnrollmentsCount: Number(response.newEnrollments.count ?? 0),
    enrollmentSparkline: (response.newEnrollments.sparkline ?? []).map((value, index) => ({
      index,
      value: Number(value ?? 0),
    })),
    attendancePresented,
    attendanceTotalScheduled,
    attendanceRatePercent: Number(response.attendanceRate.ratePercent ?? 0),
    attendanceBars: [
      {
        label: 'Asistieron',
        tone: 'presented',
        value: attendancePresented,
      },
      {
        label: 'Ausencias',
        tone: 'absent',
        value: attendanceAbsent,
      },
    ],
    occupancyEnrolledStudents,
    occupancyMaxCapacity,
    occupancyRatePercent: Number(response.occupancyRate.ratePercent ?? 0),
    occupancySlices: [
      {
        label: 'Inscritos',
        tone: 'occupied',
        value: occupancyEnrolledStudents,
      },
      {
        label: 'Disponibles',
        tone: 'available',
        value: occupancyAvailable,
      },
    ],
    revenueCurrentMonth,
    revenuePreviousMonth,
    revenueVariationPercent,
    revenueIsGrowing: revenueCurrentMonth >= revenuePreviousMonth,
    revenueByMonth: (response.revenueByMonth ?? []).map(({ month, amount }, index, items) => ({
      month,
      monthLabel: getMonthLabel(month),
      tone: index === items.length - 1 ? 'current' : 'history',
      amount: Number(amount ?? 0),
    })),
    averageTicket: Number(response.averageTicket.value ?? 0),
    activeStudents: Number(response.averageTicket.activeStudents ?? 0),
    topServicesByRevenue: topServices.map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      imageUrl: resolveImageUrl(service.imageUrl, storageUrl),
      revenue: Number(service.revenue ?? 0),
      fraction: maxRevenue > 0 ? Number(service.revenue ?? 0) / maxRevenue : 0,
    })),
  };
}
