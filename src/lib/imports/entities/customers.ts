import { format } from 'date-fns';
import {
  buildPayloadFromPreviewRowWithEntityFields,
  buildPreviewRowsFromEntityFields,
  createDateFormatter,
  createFieldError,
  createNumberFormatter,
  createRequiredTextValidator,
  createSelectFormatter,
  createTextFormatter,
  getPreviewFieldKey,
  toImportFieldDefinition,
  toPreviewFieldDefinition,
} from '$lib/imports/formatters';
import {
  confirmCustomerImport,
  fetchCustomerImportContext,
  generateCustomerImport,
} from '$lib/imports/client';
import { normalizeSourceKey } from '$lib/imports/spreadsheet';
import type {
  CustomerBulkConfirmResponse,
  CustomerBulkGenerateResponse,
  CustomerImportContext,
  ImportConfirmSummary,
  ImportEntityDefinition,
  ImportEntityFieldDefinition,
  ImportPreflightSummary,
} from '$lib/imports/types';

function normalizePhone(value: string, context?: CustomerImportContext) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const dialCodeDigits = context?.phoneCode?.dialCode.replace(/\D/g, '') ?? '';
  const normalized = trimmed.replace(/[^\d+]/g, '');
  const digits = normalized.replace(/\D/g, '');

  if (normalized.startsWith('+')) {
    return `+${digits}`;
  }

  if (dialCodeDigits && digits.startsWith(dialCodeDigits)) {
    return `+${digits}`;
  }

  return dialCodeDigits ? `+${dialCodeDigits}${digits}` : `+${digits}`;
}

const customerEntityFields: ImportEntityFieldDefinition<CustomerImportContext>[] = [
  {
    key: 'docType',
    previewKey: 'docTypeCode',
    label: 'Tipo de documento',
    previewLabel: 'Tipo de documento',
    description: 'Debe coincidir con un tipo de documento válido para el país actual.',
    required: true,
    input: 'select',
    options: (context) =>
      context.country.docs.map((doc) => ({
        label: doc.value,
        value: doc.value,
      })),
    formatter: {
      ...createSelectFormatter<CustomerImportContext>(),
      parse: ({ value, context }) => {
        const normalized = value.trim();
        if (!normalized) return '';

        const matchedDoc = context.country.docs.find(
          (doc) =>
            normalizeSourceKey(doc.value) === normalizeSourceKey(normalized) ||
            doc.code.trim().toLowerCase() === normalized.toLowerCase(),
        );

        return matchedDoc?.value ?? normalized;
      },
      serialize: ({ value, context, field }) => {
        const normalized = String(value ?? '').trim();
        const matchedDoc = context.country.docs.find(
          (doc) =>
            normalizeSourceKey(doc.value) === normalizeSourceKey(normalized) ||
            doc.code.trim().toLowerCase() === normalized.toLowerCase(),
        );

        if (!matchedDoc) {
          throw createFieldError(
            getPreviewFieldKey(field),
            'Debes seleccionar un tipo de documento válido para el cliente.',
          );
        }

        return matchedDoc.code;
      },
      validate: ({ value, context, field }) => {
        const normalized = String(value ?? '').trim();
        if (!normalized) {
          throw createFieldError(
            getPreviewFieldKey(field),
            `Falta un valor requerido para "${field.previewLabel ?? field.label}".`,
          );
        }

        const matchedDoc = context.country.docs.find(
          (doc) =>
            normalizeSourceKey(doc.value) === normalizeSourceKey(normalized) ||
            doc.code.trim().toLowerCase() === normalized.toLowerCase(),
        );
        if (!matchedDoc) {
          throw createFieldError(
            getPreviewFieldKey(field),
            'Debes seleccionar un tipo de documento válido para el cliente.',
          );
        }
      },
    },
  },
  {
    key: 'docNumber',
    label: 'Número de documento',
    description: 'Identificación fiscal o personal del cliente.',
    required: true,
    input: 'text',
    formatter: {
      ...createTextFormatter<CustomerImportContext>(),
      validate: createRequiredTextValidator<CustomerImportContext>(),
    },
  },
  {
    key: 'firstName',
    label: 'Nombres',
    description: 'Nombre del cliente.',
    required: true,
    input: 'text',
    formatter: {
      ...createTextFormatter<CustomerImportContext>(),
      validate: createRequiredTextValidator<CustomerImportContext>(),
    },
  },
  {
    key: 'lastName',
    label: 'Apellidos',
    description: 'Apellido del cliente.',
    required: true,
    input: 'text',
    formatter: {
      ...createTextFormatter<CustomerImportContext>(),
      validate: createRequiredTextValidator<CustomerImportContext>(),
    },
  },
  {
    key: 'address',
    label: 'Dirección',
    description: 'Dirección principal.',
    required: true,
    input: 'text',
    formatter: {
      ...createTextFormatter<CustomerImportContext>(),
      validate: createRequiredTextValidator<CustomerImportContext>(),
    },
  },
  {
    key: 'cellphone',
    label: 'Teléfono móvil',
    description: 'Se normaliza con prefijo internacional.',
    required: true,
    aliases: ['telefono', 'telefono movil', 'celular', 'movil'],
    input: 'text',
    formatter: {
      ...createTextFormatter<CustomerImportContext>(),
      parse: ({ value, context }) => normalizePhone(value, context),
      serialize: ({ value, context }) => normalizePhone(String(value ?? ''), context),
      validate: ({ value, context, field }) => {
        const normalized = normalizePhone(String(value ?? ''), context);
        const digits = normalized.replace(/\D/g, '');
        const dialCodeDigits = context.phoneCode?.dialCode.replace(/\D/g, '') ?? '';

        if (!normalized.startsWith('+') || digits.length === 0) {
          throw createFieldError(
            getPreviewFieldKey(field),
            'Debes ingresar un teléfono móvil válido.',
          );
        }

        if (dialCodeDigits && !digits.startsWith(dialCodeDigits)) {
          throw createFieldError(
            getPreviewFieldKey(field),
            `El teléfono debe iniciar con el código ${context.phoneCode?.dialCode}.`,
          );
        }

        if (dialCodeDigits && context.phoneCode?.phoneLength) {
          const localDigits = digits.slice(dialCodeDigits.length);
          if (localDigits.length !== context.phoneCode.phoneLength) {
            throw createFieldError(
              getPreviewFieldKey(field),
              `El teléfono debe tener ${context.phoneCode.phoneLength} dígitos sin contar ${context.phoneCode.dialCode}.`,
            );
          }
        }
      },
    },
  },
  {
    key: 'birthdate',
    label: 'Fecha de nacimiento',
    description: 'Acepta formatos tipo dd/MM/yyyy o fechas ISO.',
    required: true,
    input: 'date',
    formatter: createDateFormatter<CustomerImportContext>({
      serialize: (dateValue) => format(new Date(`${dateValue}T00:00:00`), 'dd/MM/yyyy'),
    }),
  },
  {
    key: 'email',
    label: 'Correo electrónico',
    description: 'Correo de contacto del cliente.',
    required: true,
    aliases: ['correo', 'email'],
    input: 'text',
    formatter: {
      ...createTextFormatter<CustomerImportContext>(),
      validate: createRequiredTextValidator<CustomerImportContext>(),
    },
  },
  {
    key: 'creditLimit',
    label: 'Límite de crédito',
    description: 'Opcional. Si no llega, se envía 0.',
    required: false,
    aliases: ['limite de credito', 'credito'],
    input: 'number',
    formatter: createNumberFormatter<CustomerImportContext>({ emptyValue: 0 }),
  },
];

function buildCustomerPreviewRows(input: {
  rows: Array<Record<string, string>>;
  mapping: Record<string, string>;
  context: CustomerImportContext;
}) {
  return buildPreviewRowsFromEntityFields(
    customerEntityFields,
    input.rows,
    input.mapping,
    input.context,
  );
}

function buildCustomerPayloadFromPreviewRow(input: {
  row: Record<string, unknown>;
  context: CustomerImportContext;
}) {
  const payload = buildPayloadFromPreviewRowWithEntityFields(
    customerEntityFields,
    input.row,
    input.context,
  );

  return {
    ...payload,
    countryCode3: input.context.country.code3,
  };
}

function summarizeCustomerGenerate(response: CustomerBulkGenerateResponse): ImportPreflightSummary {
  return {
    trackingCode: response.trackingCode,
    totalRecords: response.totalCustomers,
    invalidRows: response.invalidRows,
  };
}

function summarizeCustomerConfirm(
  response: CustomerBulkConfirmResponse,
  approve: boolean,
): ImportConfirmSummary {
  return {
    status: approve ? response.status : 'deny',
    totalProcessed: response.totalProcessedCustomers,
  };
}

export const customerImportDefinition: ImportEntityDefinition = {
  id: 'customers',
  label: 'Clientes',
  description: 'Importa clientes con validación de documentos y contacto.',
  permission: 'customer:create',
  entityFields: customerEntityFields,
  fields: customerEntityFields.map(toImportFieldDefinition),
  previewFields: customerEntityFields.map(toPreviewFieldDefinition),
  loadContext: fetchCustomerImportContext,
  buildPreviewRows: ({ rows, mapping, context }) =>
    buildCustomerPreviewRows({
      rows,
      mapping,
      context: context as CustomerImportContext,
    }),
  buildPayloadFromPreviewRow: ({ row, context }) =>
    buildCustomerPayloadFromPreviewRow({
      row,
      context: context as CustomerImportContext,
    }),
  generate: (payload) => generateCustomerImport(payload),
  confirm: (trackingCode, approve) => confirmCustomerImport(trackingCode, approve),
  summarizeGenerate: (response) =>
    summarizeCustomerGenerate(response as CustomerBulkGenerateResponse),
  summarizeConfirm: (response, approve) =>
    summarizeCustomerConfirm(response as CustomerBulkConfirmResponse, approve),
  successMessage: (summary) => `Se importaron ${summary.totalProcessed} clientes correctamente.`,
};
