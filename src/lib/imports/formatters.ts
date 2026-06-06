import { format, isValid, parse } from 'date-fns';
import { ImportFieldValidationError } from '$lib/imports/types';
import type {
  ImportEntityFieldDefinition,
  ImportFieldDefinition,
  ImportFieldFormatter,
  ImportPreviewFieldDefinition,
  ImportPreviewIssue,
} from '$lib/imports/types';

export function createFieldError(fieldKey: string, message: string) {
  return new ImportFieldValidationError(fieldKey, message);
}

export function getPreviewFieldKey<TContext>(field: ImportEntityFieldDefinition<TContext>) {
  return field.previewKey ?? field.key;
}

export function toImportFieldDefinition<TContext>(
  field: ImportEntityFieldDefinition<TContext>,
): ImportFieldDefinition {
  return {
    key: field.key,
    label: field.label,
    description: field.description,
    required: field.required,
    aliases: field.aliases,
  };
}

export function toPreviewFieldDefinition<TContext>(
  field: ImportEntityFieldDefinition<TContext>,
): ImportPreviewFieldDefinition {
  return {
    key: getPreviewFieldKey(field),
    label: field.previewLabel ?? field.label,
    description: field.previewDescription,
    required: field.required,
    input: field.input,
    options: field.options as ImportPreviewFieldDefinition['options'],
  };
}

export function getMappedValue(row: Record<string, string>, sourceColumn: string | undefined) {
  return sourceColumn ? (row[sourceColumn]?.trim() ?? '') : '';
}

export function parseFieldFromSheet<TContext>(
  field: ImportEntityFieldDefinition<TContext>,
  row: Record<string, string>,
  mapping: Record<string, string>,
  context: TContext,
) {
  const rawValue = getMappedValue(row, mapping[field.key]);
  const value = field.formatter.parse({
    value: rawValue,
    context,
    field,
    row,
  });

  return {
    rawValue,
    value,
  };
}

export function validateFieldValue<TContext>(
  field: ImportEntityFieldDefinition<TContext>,
  value: unknown,
  context: TContext,
  row: Record<string, string> | Record<string, unknown>,
) {
  field.formatter.validate?.({
    value,
    context,
    field,
    row,
  });
}

export function buildPreviewRowsFromEntityFields<TContext>(
  fields: ImportEntityFieldDefinition<TContext>[],
  rows: Array<Record<string, string>>,
  mapping: Record<string, string>,
  context: TContext,
) {
  return rows.map((row) => {
    const data: Record<string, unknown> = {};
    const issues: ImportPreviewIssue[] = [];

    for (const field of fields) {
      const { value } = parseFieldFromSheet(field, row, mapping, context);
      const previewKey = getPreviewFieldKey(field);
      data[previewKey] = value;

      try {
        validateFieldValue(field, value, context, row);
      } catch (error) {
        issues.push({
          fieldKey: error instanceof ImportFieldValidationError ? error.fieldKey : previewKey,
          message:
            error instanceof Error ? error.message : `El campo "${field.label}" no es válido.`,
        });
      }
    }

    return { data, issues };
  });
}

export function buildPayloadFromPreviewRowWithEntityFields<TContext>(
  fields: ImportEntityFieldDefinition<TContext>[],
  row: Record<string, unknown>,
  context: TContext,
) {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const previewKey = getPreviewFieldKey(field);
    const value = row[previewKey];

    validateFieldValue(field, value, context, row);

    payload[previewKey] = field.formatter.serialize({
      value,
      context,
      field,
      row,
    });
  }

  return payload;
}

export function parseDateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const formats = ['dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd'];
  for (const dateFormat of formats) {
    const parsed = parse(trimmed, dateFormat, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  const directDate = new Date(trimmed);
  if (isValid(directDate)) {
    return directDate;
  }

  return null;
}

export function toDateInputValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const parsed = parseDateValue(trimmed);
  if (!parsed) {
    return trimmed;
  }

  return format(parsed, 'yyyy-MM-dd');
}

type NumberFormatterOptions = {
  integer?: boolean;
  emptyValue?: number | string;
};

export function createTextFormatter<TContext>(): ImportFieldFormatter<TContext> {
  return {
    parse: ({ value }) => value.trim(),
    serialize: ({ value }) => String(value ?? '').trim(),
  };
}

export function createSelectFormatter<TContext>(): ImportFieldFormatter<TContext> {
  return createTextFormatter<TContext>();
}

export function createBooleanFormatter<TContext>(): ImportFieldFormatter<TContext> {
  return {
    parse: ({ value }) => value === 'true',
    serialize: ({ value }) => Boolean(value),
  };
}

export function createNumberFormatter<TContext>(
  options: NumberFormatterOptions = {},
): ImportFieldFormatter<TContext> {
  const { integer = false, emptyValue = 0 } = options;

  return {
    parse: ({ value }) => {
      const trimmed = value.trim();
      if (!trimmed) return emptyValue;

      const sanitized = trimmed.replace(/,/g, '');
      const parsed = Number(sanitized);

      if (Number.isNaN(parsed)) {
        return trimmed;
      }

      return integer ? Math.trunc(parsed) : parsed;
    },
    serialize: ({ value, field }) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return integer ? Math.trunc(value) : value;
      }

      const parsed = Number(
        String(value ?? '')
          .replace(/,/g, '')
          .trim(),
      );
      if (Number.isNaN(parsed)) {
        throw createFieldError(
          getPreviewFieldKey(field),
          `"${field.previewLabel ?? field.label}" debe ser un número válido.`,
        );
      }

      return integer ? Math.trunc(parsed) : parsed;
    },
    validate: ({ value, field }) => {
      if (typeof value === 'number' && Number.isFinite(value)) return;

      const normalized = String(value ?? '').trim();
      if (!normalized && !field.required) return;

      if (normalized === '' && field.required) {
        throw createFieldError(
          getPreviewFieldKey(field),
          `Falta un valor requerido para "${field.previewLabel ?? field.label}".`,
        );
      }

      const parsed = Number(normalized.replace(/,/g, ''));
      if (Number.isNaN(parsed)) {
        throw createFieldError(
          getPreviewFieldKey(field),
          `"${field.previewLabel ?? field.label}" debe ser un número válido.`,
        );
      }
    },
  };
}

type DateFormatterOptions<TContext> = {
  serialize?: (dateValue: string, context: TContext) => string;
};

export function createDateFormatter<TContext>(
  options: DateFormatterOptions<TContext> = {},
): ImportFieldFormatter<TContext> {
  return {
    parse: ({ value }) => toDateInputValue(value),
    serialize: ({ value, context }) => {
      const normalized = String(value ?? '').trim();
      if (!normalized) return '';

      const parsed = parseDateValue(normalized);
      if (!parsed) {
        return normalized;
      }

      if (options.serialize) {
        return options.serialize(format(parsed, 'yyyy-MM-dd'), context);
      }

      return format(parsed, 'yyyy-MM-dd');
    },
    validate: ({ value, field }) => {
      const normalized = String(value ?? '').trim();

      if (!normalized && !field.required) return;
      if (!normalized && field.required) {
        throw createFieldError(
          getPreviewFieldKey(field),
          `Falta un valor requerido para "${field.previewLabel ?? field.label}".`,
        );
      }

      if (!parseDateValue(normalized)) {
        throw createFieldError(
          getPreviewFieldKey(field),
          'La fecha de nacimiento no tiene un formato válido.',
        );
      }
    },
  };
}

export function createRequiredTextValidator<
  TContext,
>(): ImportFieldFormatter<TContext>['validate'] {
  return ({ value, field }) => {
    const normalized = String(value ?? '').trim();
    if (!normalized && field.required) {
      throw createFieldError(
        getPreviewFieldKey(field),
        `Falta un valor requerido para "${field.previewLabel ?? field.label}".`,
      );
    }
  };
}
