import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import SettingsIcon from '@lucide/svelte/icons/settings';

export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  settings: '/settings',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export type AppNavigationItem = {
  label: string;
  href: AppRoute;
  icon: typeof LayoutDashboardIcon;
};

export const appNavigation: AppNavigationItem[] = [
  {
    label: 'Dashboard',
    href: routes.dashboard,
    icon: LayoutDashboardIcon,
  },
  {
    label: 'Settings',
    href: routes.settings,
    icon: SettingsIcon,
  },
];

const privateRoutes = [routes.dashboard, routes.settings] as const;

export function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isPrivateAppRoute(pathname: string) {
  return privateRoutes.some((route) => matchesRoute(pathname, route));
}
