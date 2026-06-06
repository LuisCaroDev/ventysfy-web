export const settingsRoutes = {
  root: '/settings',
  import: '/settings/import',
  business: '/settings/business',
  businessGeneralEdit: '/settings/business/general',
  businessContactEdit: '/settings/business/contact',
  cashRegister: '/settings/cash-register',
  cashRegisterEdit: '/settings/cash-register/edit',
  cashRegisterCreate: '/settings/cash-register/create',
  sales: '/settings/sales',
  salesTipEdit: '/settings/sales/tip',
  salesDiscountEdit: '/settings/sales/discount',
  ticket: '/settings/ticket',
  ticketLogo: '/settings/ticket/logo',
  ticketBusinessInfo: '/settings/ticket/business-info',
} as const;

export type SettingsRoute = (typeof settingsRoutes)[keyof typeof settingsRoutes];

export function getCashRegisterDetailRoute(cashRegisterId: string) {
  return `${settingsRoutes.cashRegister}/${cashRegisterId}`;
}
