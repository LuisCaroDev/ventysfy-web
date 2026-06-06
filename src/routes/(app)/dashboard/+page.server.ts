import type { PageServerLoad } from './$types';
import { fetchUserInfo } from '$lib/server/settings';
import {
  fetchServiceAnalyticsResponse,
  mapServiceAnalyticsDashboard,
} from '$lib/server/dashboard-analytics';
import type { DashboardCurrency } from '$lib/dashboard/types';

const FALLBACK_CURRENCY: DashboardCurrency = {
  code: 'USD',
  symbol: '$',
  supportsDecimals: true,
};

function getErrorMessage(reason: unknown) {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  return 'No fue posible cargar la analítica de servicios.';
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const storageUrl = locals.user?.storageUrl;

  const [userInfoResult, analyticsResult] = await Promise.allSettled([
    fetchUserInfo(fetch, locals.accessToken, storageUrl),
    fetchServiceAnalyticsResponse(fetch, locals.accessToken),
  ]);

  const currency =
    userInfoResult.status === 'fulfilled'
      ? userInfoResult.value.company.currency
      : FALLBACK_CURRENCY;

  return {
    analytics:
      analyticsResult.status === 'fulfilled'
        ? mapServiceAnalyticsDashboard(analyticsResult.value, currency, storageUrl)
        : null,
    analyticsError:
      analyticsResult.status === 'rejected' ? getErrorMessage(analyticsResult.reason) : null,
  };
};
