export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  message: string[];
};

export type Phone = {
  code: string;
  cellphone: string;
  fullCellphone?: string;
};

export type CompanyType = {
  code: string;
  name: string;
};

export type Country = {
  code2: string;
  code3: string;
  value: string;
};

export type Currency = {
  code: string;
  symbol: string;
  supportsDecimals?: boolean;
};

export type TaxInfo = {
  value: number;
  active: boolean;
};

export type User = {
  firstName: string;
  lastName: string;
  email: string;
  cellphone: Phone;
};

export type Company = {
  tradeName: string;
  companyName: string;
  companyType: CompanyType;
  docNumber: string;
  docTypeCode: string;
  docTypeDescription: string;
  address: string;
  country: Country;
  currency: Currency;
  tax: TaxInfo | null;
  cellphone: Phone;
  logoPath: string;
  enableCashCount: boolean;
  validateCashCount: boolean;
};

export type UserInfo = {
  user: User;
  company: Company;
};

export type SaleConfig = {
  tip: {
    enabled: boolean;
    isComputeFromSubtotal: boolean;
    rate: number;
    maxRate: number;
  };
  discount: {
    enabled: boolean;
    enabledMaxRate: boolean;
    maxRate: number;
  };
  voucher: {
    enabledAddres: boolean;
    enabledPhone: boolean;
  };
};

export type CompanyConfig = {
  sale: SaleConfig;
  cashMovement: {
    categories: Array<{
      id: string;
      name: string;
      type: string;
      enabled: boolean;
    }>;
  };
  branches: Array<{
    id: string;
    name: string;
  }>;
  invoiceService: {
    enabled: boolean;
  };
};

export type CashRegister = {
  id: string;
  name: string;
  status: string;
  inUse: boolean | null;
};

export type SettingsPayload = {
  userInfo: UserInfo;
  companyConfig: CompanyConfig;
};
