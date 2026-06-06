import {
  buildPayloadFromPreviewRowWithEntityFields,
  buildPreviewRowsFromEntityFields,
  createFieldError,
  createNumberFormatter,
  createRequiredTextValidator,
  createSelectFormatter,
  createTextFormatter,
  getPreviewFieldKey,
  toImportFieldDefinition,
} from '$lib/imports/formatters';
import {
  confirmProductImport,
  fetchProductImportContext,
  generateProductImport,
} from '$lib/imports/client';
import type {
  ImportConfirmSummary,
  ImportEntityDefinition,
  ImportEntityFieldDefinition,
  ImportPreflightSummary,
  ProductBulkConfirmResponse,
  ProductBulkGenerateResponse,
  ProductImportContext,
} from '$lib/imports/types';

const productEntityFields: ImportEntityFieldDefinition<ProductImportContext>[] = [
  {
    key: 'barcode',
    label: 'Código de barras',
    description: 'Opcional. Se conserva tal cual.',
    required: false,
    input: 'text',
    formatter: createTextFormatter<ProductImportContext>(),
  },
  {
    key: 'category',
    previewKey: 'categoryName',
    label: 'Categoría',
    previewLabel: 'Categoría',
    description: 'Categoría principal del producto.',
    required: true,
    input: 'text',
    formatter: {
      ...createTextFormatter<ProductImportContext>(),
      validate: createRequiredTextValidator<ProductImportContext>(),
    },
  },
  {
    key: 'subcategory',
    label: 'Subcategoría',
    description: 'Opcional.',
    required: false,
    input: 'text',
    formatter: createTextFormatter<ProductImportContext>(),
  },
  {
    key: 'name',
    label: 'Nombre',
    description: 'Nombre del producto.',
    required: true,
    input: 'text',
    formatter: {
      ...createTextFormatter<ProductImportContext>(),
      validate: createRequiredTextValidator<ProductImportContext>(),
    },
  },
  {
    key: 'price',
    previewKey: 'basePrice',
    label: 'Precio de venta',
    previewLabel: 'Precio de venta',
    description: 'Número decimal.',
    required: true,
    aliases: ['precio'],
    input: 'number',
    formatter: createNumberFormatter<ProductImportContext>(),
  },
  {
    key: 'cost',
    label: 'Costo',
    description: 'Número decimal.',
    required: true,
    input: 'number',
    formatter: createNumberFormatter<ProductImportContext>(),
  },
  {
    key: 'stock',
    label: 'Stock',
    description: 'Número entero.',
    required: true,
    input: 'number',
    formatter: createNumberFormatter<ProductImportContext>({ integer: true }),
  },
  {
    key: 'minStock',
    label: 'Stock mínimo',
    description: 'Número entero.',
    required: true,
    aliases: ['stock minimo'],
    input: 'number',
    formatter: createNumberFormatter<ProductImportContext>({ integer: true }),
  },
  {
    key: 'maxStock',
    label: 'Stock máximo',
    description: 'Número entero.',
    required: true,
    aliases: ['stock maximo'],
    input: 'number',
    formatter: createNumberFormatter<ProductImportContext>({ integer: true }),
  },
  {
    key: 'presentation',
    previewKey: 'baseUnitName',
    label: 'Unidad de medida',
    previewLabel: 'Unidad de medida',
    description: 'Debe existir en las presentaciones configuradas.',
    required: true,
    aliases: ['presentacion', 'unidad'],
    input: 'select',
    options: (context) =>
      context.presentations.map((presentation) => ({
        label: presentation.name,
        value: presentation.name,
      })),
    formatter: {
      ...createSelectFormatter<ProductImportContext>(),
      validate: ({ value, context, field }) => {
        const normalized = String(value ?? '').trim();
        if (!normalized) {
          throw createFieldError(
            getPreviewFieldKey(field),
            `Falta un valor requerido para "${field.previewLabel ?? field.label}".`,
          );
        }

        const allowedPresentations = new Set(
          context.presentations
            .filter((presentation) => typeof presentation.name === 'string')
            .map((presentation) => presentation.name.trim()),
        );

        if (!allowedPresentations.has(normalized)) {
          throw createFieldError(
            getPreviewFieldKey(field),
            `"${normalized}" no existe en las unidades de medida configuradas.`,
          );
        }
      },
    },
  },
  {
    key: 'description',
    label: 'Descripción',
    description: 'Opcional.',
    required: false,
    input: 'text',
    formatter: createTextFormatter<ProductImportContext>(),
  },
];

const productPreviewFields = [
  { key: 'categoryName', label: 'Categoría', required: true, input: 'text' as const },
  { key: 'name', label: 'Nombre', required: true, input: 'text' as const },
  { key: 'basePrice', label: 'Precio de venta', required: true, input: 'number' as const },
  { key: 'cost', label: 'Costo', required: true, input: 'number' as const },
  { key: 'stock', label: 'Stock', required: true, input: 'number' as const },
  { key: 'minStock', label: 'Stock mínimo', required: true, input: 'number' as const },
  { key: 'maxStock', label: 'Stock máximo', required: true, input: 'number' as const },
  {
    key: 'baseUnitName',
    label: 'Unidad de medida',
    required: true,
    input: 'select' as const,
    options: (context: unknown) =>
      ((context as ProductImportContext)?.presentations ?? []).map((presentation) => ({
        label: presentation.name,
        value: presentation.name,
      })),
  },
  { key: 'barcode', label: 'Código de barras', input: 'text' as const },
  { key: 'description', label: 'Descripción', input: 'text' as const },
  { key: 'availableToSell', label: 'Disponible para venta', input: 'boolean' as const },
];

function buildProductPreviewRows(input: {
  rows: Array<Record<string, string>>;
  mapping: Record<string, string>;
  context: ProductImportContext;
}) {
  const rows = buildPreviewRowsFromEntityFields(
    productEntityFields,
    input.rows,
    input.mapping,
    input.context,
  );

  return rows.map((row) => ({
    ...row,
    data: {
      ...row.data,
      availableToSell: true,
    },
  }));
}

function buildProductPayloadFromPreviewRow(input: {
  row: Record<string, unknown>;
  context: ProductImportContext;
}) {
  const payload = buildPayloadFromPreviewRowWithEntityFields(
    productEntityFields,
    input.row,
    input.context,
  );

  return {
    taxIds: null,
    sku: '',
    color: '#f8ebb3',
    discountRate: 0,
    availableToSell: Boolean(input.row.availableToSell),
    ...payload,
  };
}

function summarizeProductGenerate(response: ProductBulkGenerateResponse): ImportPreflightSummary {
  const details =
    response.newCategories.length > 0
      ? [
          `Se crearán ${response.newCategories.length} categorías nuevas antes de completar la importación.`,
        ]
      : undefined;

  return {
    trackingCode: response.trackingCode,
    totalRecords: response.totalProducts,
    invalidRows: response.invalidRows,
    details,
  };
}

function summarizeProductConfirm(
  response: ProductBulkConfirmResponse,
  approve: boolean,
): ImportConfirmSummary {
  return {
    status: approve ? response.status : 'deny',
    totalProcessed: response.totalProducts,
  };
}

export const productImportDefinition: ImportEntityDefinition = {
  id: 'products',
  label: 'Productos',
  description: 'Importa catálogo y stock con validación de unidad de medida.',
  permission: 'product:create',
  entityFields: productEntityFields,
  fields: productEntityFields.map(toImportFieldDefinition),
  previewFields: productPreviewFields,
  loadContext: fetchProductImportContext,
  buildPreviewRows: ({ rows, mapping, context }) =>
    buildProductPreviewRows({
      rows,
      mapping,
      context: context as ProductImportContext,
    }),
  buildPayloadFromPreviewRow: ({ row, context }) =>
    buildProductPayloadFromPreviewRow({
      row,
      context: context as ProductImportContext,
    }),
  generate: (payload) => generateProductImport(payload),
  confirm: (trackingCode, approve) => confirmProductImport(trackingCode, approve),
  summarizeGenerate: (response) =>
    summarizeProductGenerate(response as ProductBulkGenerateResponse),
  summarizeConfirm: (response, approve) =>
    summarizeProductConfirm(response as ProductBulkConfirmResponse, approve),
  successMessage: (summary) => `Se importaron ${summary.totalProcessed} productos correctamente.`,
};
