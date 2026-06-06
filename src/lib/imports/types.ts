export type ImportEntityId = 'customers' | 'products';

export type ImportFieldDefinition = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  aliases?: string[];
};

export type ParsedSheet = {
  name: string;
  headers: string[];
  rows: Array<Record<string, string>>;
  samples: Record<string, string[]>;
};

export type ParsedWorkbook = {
  fileName: string;
  extension: 'csv' | 'xlsx' | 'xls';
  sheets: ParsedSheet[];
};

export type ImportInvalidRow = {
  item: number;
  msgList: string[];
};

export type ImportPreflightSummary = {
  trackingCode: string;
  totalRecords: number;
  invalidRows: ImportInvalidRow[];
  details?: string[];
};

export type ImportConfirmSummary = {
  status: 'approve' | 'deny';
  totalProcessed: number;
};

export type ImportPreviewFieldOption = {
  label: string;
  value: string;
};

export type ImportPreviewIssue = {
  fieldKey: string;
  message: string;
};

export type ImportPreviewFieldDefinition = {
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  input: 'text' | 'number' | 'select' | 'boolean' | 'date';
  options?: (context: unknown) => ImportPreviewFieldOption[];
};

export type ImportFieldFormatterParseInput<TContext = unknown> = {
  value: string;
  context: TContext;
  field: ImportEntityFieldDefinition<TContext>;
  row: Record<string, string>;
};

export type ImportFieldFormatterSerializeInput<TContext = unknown> = {
  value: unknown;
  context: TContext;
  field: ImportEntityFieldDefinition<TContext>;
  row: Record<string, unknown>;
};

export type ImportFieldFormatterValidateInput<TContext = unknown> = {
  value: unknown;
  context: TContext;
  field: ImportEntityFieldDefinition<TContext>;
  row: Record<string, string> | Record<string, unknown>;
};

export type ImportFieldFormatter<TContext = unknown> = {
  parse: (input: ImportFieldFormatterParseInput<TContext>) => unknown;
  serialize: (input: ImportFieldFormatterSerializeInput<TContext>) => unknown;
  validate?: (input: ImportFieldFormatterValidateInput<TContext>) => void;
};

export type ImportEntityFieldDefinition<TContext = unknown> = {
  key: string;
  previewKey?: string;
  label: string;
  description: string;
  required: boolean;
  aliases?: string[];
  input: ImportPreviewFieldDefinition['input'];
  previewLabel?: string;
  previewDescription?: string;
  options?: (context: TContext) => ImportPreviewFieldOption[];
  formatter: ImportFieldFormatter<TContext>;
};

export type ImportPreviewRow = {
  id: string;
  data: Record<string, unknown>;
  issues?: ImportPreviewIssue[];
};

export type ImportEntityDefinition = {
  id: ImportEntityId;
  label: string;
  description: string;
  permission: string;
  fields: ImportFieldDefinition[];
  previewFields: ImportPreviewFieldDefinition[];
  entityFields?: ImportEntityFieldDefinition<any>[];
  loadContext: () => Promise<unknown>;
  buildPreviewRows: (input: {
    rows: Array<Record<string, string>>;
    mapping: Record<string, string>;
    context: unknown;
  }) => Array<{ data: Record<string, unknown>; issues?: ImportPreviewIssue[] }>;
  buildPayloadFromPreviewRow: (input: {
    row: Record<string, unknown>;
    context: unknown;
  }) => Record<string, unknown>;
  generate: (payload: Array<Record<string, unknown>>) => Promise<unknown>;
  confirm: (trackingCode: string, approve: boolean) => Promise<unknown>;
  summarizeGenerate: (response: unknown) => ImportPreflightSummary;
  summarizeConfirm: (response: unknown, approve: boolean) => ImportConfirmSummary;
  successMessage: (summary: ImportConfirmSummary) => string;
};

export type CustomerImportDoc = {
  code: string;
  value: string;
  metadata?: {
    description?: string;
    minLength?: number;
    maxLength?: number;
    isAlphanumeric?: boolean;
    targetDocType?: string | null;
  };
};

export type CustomerImportCountry = {
  code2: string;
  code3: string;
  value: string;
  docs: CustomerImportDoc[];
};

export type CustomerImportContext = {
  country: CustomerImportCountry;
  phoneCode: CustomerImportPhoneCode | null;
};

export type CustomerImportPhoneCode = {
  dialCode: string;
  isoCode: string;
  phoneLength: number;
};

export class ImportFieldValidationError extends Error {
  fieldKey: string;

  constructor(fieldKey: string, message: string) {
    super(message);
    this.name = 'ImportFieldValidationError';
    this.fieldKey = fieldKey;
  }
}

export type ProductPresentation = {
  id: string;
  name: string;
};

export type ProductImportContext = {
  presentations: ProductPresentation[];
};

export type CustomerBulkGenerateResponse = {
  trackingCode: string;
  totalCustomers: number;
  invalidRows: ImportInvalidRow[];
};

export type CustomerBulkConfirmResponse = {
  totalProcessedCustomers: number;
  status: 'approve' | 'deny';
};

export type ProductBulkGenerateResponse = {
  trackingCode: string;
  existingCategories: Array<Record<string, unknown>>;
  newCategories: Array<Record<string, unknown>>;
  totalCategories: number;
  invalidRows: ImportInvalidRow[];
  totalProducts: number;
};

export type ProductBulkConfirmResponse = {
  totalProducts: number;
  status: 'approve' | 'deny';
};
