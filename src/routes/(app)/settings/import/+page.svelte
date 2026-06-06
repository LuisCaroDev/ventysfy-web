<script lang="ts">
  import { page } from '$app/state';
  import SettingsSectionShell from '$lib/components/settings/SettingsSectionShell.svelte';
  import ImportWizardEditDrawer from '$lib/components/settings/import-wizard/ImportWizardEditDrawer.svelte';
  import ImportWizardFileStep from '$lib/components/settings/import-wizard/ImportWizardFileStep.svelte';
  import ImportWizardFooter from '$lib/components/settings/import-wizard/ImportWizardFooter.svelte';
  import ImportWizardMappingStep from '$lib/components/settings/import-wizard/ImportWizardMappingStep.svelte';
  import ImportWizardReviewStep from '$lib/components/settings/import-wizard/ImportWizardReviewStep.svelte';
  import ImportWizardSteps from '$lib/components/settings/import-wizard/ImportWizardSteps.svelte';
  import ImportWizardTypeStep from '$lib/components/settings/import-wizard/ImportWizardTypeStep.svelte';
  import { getImportEntityDefinitions } from '$lib/imports/entities';
  import { normalizeSourceKey, parseSpreadsheet } from '$lib/imports/spreadsheet';
  import { ImportFieldValidationError } from '$lib/imports/types';
  import { SettingsApiError } from '$lib/settings/client';
  import type {
    ImportEntityDefinition,
    ImportEntityId,
    ImportFieldDefinition,
    ImportPreflightSummary,
    ImportPreviewFieldDefinition,
    ImportPreviewRow,
    ParsedSheet,
    ParsedWorkbook,
  } from '$lib/imports/types';

  type User = App.Locals['user'];

  type Step = 1 | 2 | 3 | 4;

  const allDefinitions = getImportEntityDefinitions();
  const stepLabels: Array<{ id: Step; title: string }> = [
    { id: 1, title: 'Seleccionar tipo' },
    { id: 2, title: 'Subir archivo' },
    { id: 3, title: 'Mapear columnas' },
    { id: 4, title: 'Confirmar y enviar' },
  ];

  const user = $derived((page.data.user as User | undefined) ?? undefined);

  let currentStep = $state<Step>(1);
  let selectedEntityId = $state<ImportEntityId | null>(null);
  let contextData = $state<unknown>(null);
  let contextLoading = $state(false);
  let contextError = $state<string | null>(null);

  let workbook = $state<ParsedWorkbook | null>(null);
  let selectedSheetName = $state('');
  let selectedFile = $state<File | null>(null);
  let fileError = $state<string | null>(null);
  let dropActive = $state(false);
  let fileInputResetKey = $state(0);

  let mapping = $state<Record<string, string>>({});
  let mappingError = $state<string | null>(null);

  let preflightLoading = $state(false);
  let preflightError = $state<string | null>(null);
  let preflightSummary = $state<ImportPreflightSummary | null>(null);
  let confirmLoading = $state(false);
  let confirmError = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let previewRows = $state<ImportPreviewRow[]>([]);
  let previewError = $state<string | null>(null);
  let editingRowId = $state<string | null>(null);
  let editDraft = $state<Record<string, unknown>>({});
  let editError = $state<string | null>(null);
  let previewRowSequence = $state(0);
  let selectedRowIds = $state<string[]>([]);
  let duplicateColumnKey = $state<string | null>(null);
  let sortColumnKey = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc' | null>(null);

  const availableDefinitions = $derived(
    allDefinitions.filter((definition) => hasPermission(user?.permissions, definition.permission)),
  );
  const selectedDefinition = $derived(
    availableDefinitions.find((definition) => definition.id === selectedEntityId) ?? null,
  );
  const selectedSheet = $derived(
    workbook?.sheets.find((sheet) => sheet?.name === selectedSheetName) ?? null,
  );
  const mappedCount = $derived(
    selectedDefinition?.fields.filter((field) => mapping[field.key]).length ?? 0,
  );
  const requiredFieldsMapped = $derived(
    selectedDefinition
      ? selectedDefinition.fields
          .filter((field) => field.required)
          .every((field) => Boolean(mapping[field.key]))
      : false,
  );
  const editingRowIndex = $derived(
    editingRowId ? previewRows.findIndex((row) => row.id === editingRowId) : -1,
  );
  const editingRow = $derived(
    editingRowId ? (previewRows.find((row) => row.id === editingRowId) ?? null) : null,
  );
  const allRowsSelected = $derived(
    previewRows.length > 0 && selectedRowIds.length === previewRows.length,
  );
  const someRowsSelected = $derived(
    selectedRowIds.length > 0 && selectedRowIds.length < previewRows.length,
  );
  const duplicateState = $derived.by(() => getDuplicateState(previewRows, duplicateColumnKey));

  function hasPermission(permissions: string[] | undefined, permission: string) {
    return !!permissions?.includes('*') || !!permissions?.includes(permission);
  }

  function resetSubmissionState() {
    preflightLoading = false;
    preflightError = null;
    preflightSummary = null;
    confirmLoading = false;
    confirmError = null;
    successMessage = null;
    previewError = null;
  }

  function resetFileState() {
    clearFileInput();
    workbook = null;
    selectedSheetName = '';
    selectedFile = null;
    fileError = null;
    mapping = {};
    mappingError = null;
    previewRows = [];
    editingRowId = null;
    editDraft = {};
    editError = null;
    previewRowSequence = 0;
    selectedRowIds = [];
    duplicateColumnKey = null;
    sortColumnKey = null;
    sortDirection = null;
    resetSubmissionState();
  }

  function resetTypeState() {
    selectedEntityId = null;
    contextData = null;
    contextLoading = false;
    contextError = null;
    resetFileState();
    currentStep = 1;
  }

  async function handleEntitySelection(definition: ImportEntityDefinition) {
    resetFileState();
    selectedEntityId = definition.id;
    contextData = null;
    contextError = null;
    contextLoading = true;

    try {
      contextData = await definition.loadContext();
      currentStep = 2;
    } catch (error) {
      contextError = getErrorMessage(error, 'No fue posible preparar la importación.');
      currentStep = 1;
    } finally {
      contextLoading = false;
    }
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  function buildAutoMapping(fields: ImportFieldDefinition[], sheet: ParsedSheet) {
    const normalizedHeaders = sheet.headers.map((header) => ({
      header,
      normalized: normalizeSourceKey(header),
    }));

    const nextMapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    for (const field of fields) {
      const candidates = [field.label, ...(field.aliases ?? [])].map(normalizeSourceKey);
      const match = normalizedHeaders.find(
        ({ header, normalized }) => !usedHeaders.has(header) && candidates.includes(normalized),
      );

      if (match) {
        nextMapping[field.key] = match.header;
        usedHeaders.add(match.header);
      }
    }

    return nextMapping;
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const file = files.item(0);
    if (!(file instanceof File)) {
      fileError = 'No se pudo leer el archivo seleccionado.';
      console.error('[import-page] handleFiles:invalid-file', { files });
      return;
    }

    resetFileState();
    selectedFile = file;

    try {
      console.info('[import-page] handleFiles:start', {
        entityId: selectedDefinition?.id,
        file,
        fileName: file?.name,
      });

      const nextWorkbook = await parseSpreadsheet(file);
      console.info('[import-page] handleFiles:workbook', nextWorkbook);
      workbook = nextWorkbook;

      if (nextWorkbook.sheets.length === 1) {
        const firstSheet = nextWorkbook.sheets[0];
        console.info('[import-page] handleFiles:firstSheet', firstSheet);

        if (!firstSheet || typeof firstSheet.name !== 'string') {
          throw new Error('La primera hoja del archivo no tiene una estructura válida.');
        }

        selectedSheetName = firstSheet.name;
        if (selectedDefinition) {
          mapping = buildAutoMapping(selectedDefinition.fields, firstSheet);
        }
        currentStep = 3;
        return;
      }

      currentStep = 2;
    } catch (error) {
      console.error('[import-page] handleFiles:error', error);
      fileError = getErrorMessage(error, 'No fue posible leer el archivo.');
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dropActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dropActive = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    dropActive = false;
    await handleFiles(event.dataTransfer?.files ?? null);
  }

  function selectSheetAndContinue() {
    if (!selectedSheet || !selectedDefinition) {
      fileError = 'Selecciona una hoja para continuar.';
      return;
    }

    mapping = buildAutoMapping(selectedDefinition.fields, selectedSheet);
    currentStep = 3;
  }

  function updateMapping(fieldKey: string, sourceColumn: string) {
    mapping = {
      ...mapping,
      [fieldKey]: sourceColumn,
    };
    mappingError = null;
    resetSubmissionState();
  }

  function clearFileInput() {
    fileInputResetKey += 1;
  }

  function getFieldSample(sourceColumn: string | undefined) {
    if (!sourceColumn || !selectedSheet) return 'Sin muestra';
    const samples = selectedSheet.samples[sourceColumn] ?? [];
    return samples.length > 0 ? samples.join(' · ') : 'Sin datos';
  }

  function getAvailableColumns(fieldKey: string) {
    if (!selectedSheet) return [];

    const current = mapping[fieldKey];
    const used = new Set(
      Object.entries(mapping)
        .filter(([key, value]) => key !== fieldKey && value)
        .map(([, value]) => value),
    );

    return selectedSheet.headers.filter((header) => header === current || !used.has(header));
  }

  function goToConfirmationStep() {
    if (!selectedDefinition || !selectedSheet) return;
    if (!requiredFieldsMapped) {
      mappingError = 'Debes mapear todos los campos requeridos antes de continuar.';
      return;
    }

    try {
      previewRows = buildPreviewRows(
        selectedDefinition.buildPreviewRows({
          rows: selectedSheet.rows,
          mapping,
          context: contextData,
        }),
      );
      selectedRowIds = [];
      duplicateColumnKey = null;
      sortColumnKey = null;
      sortDirection = null;
      previewError = null;
      currentStep = 4;
    } catch (error) {
      previewError = getErrorMessage(error, 'No fue posible preparar la vista previa.');
      currentStep = 3;
    }
  }

  async function discardPreflightState() {
    if (!selectedDefinition || !preflightSummary) {
      resetSubmissionState();
      return;
    }

    const trackingCode = preflightSummary.trackingCode;

    try {
      await selectedDefinition.confirm(trackingCode, false);
    } catch {
      // Best effort cleanup. The next generate call can still continue.
    } finally {
      resetSubmissionState();
    }
  }

  async function goBack() {
    if (successMessage) return;

    if (currentStep === 4) {
      await discardPreflightState();
      currentStep = 3;
      return;
    }

    if (currentStep === 3) {
      currentStep = 2;
      return;
    }

    if (currentStep === 2) {
      resetTypeState();
    }
  }

  async function runPreflight() {
    if (!selectedDefinition || !selectedSheet || !contextData) return;

    preflightLoading = true;
    preflightError = null;
    confirmError = null;
    successMessage = null;

    try {
      if (preflightSummary) {
        await discardPreflightState();
      }

      console.info('[import-page] runPreflight:start', {
        entityId: selectedDefinition.id,
        selectedSheet: selectedSheet.name,
        rowsCount: selectedSheet.rows.length,
        mapping,
        contextData,
        previewRowsCount: previewRows.length,
      });

      const payload = previewRows.length > 0 ? buildPayloadFromPreviewRows() : [];

      console.info('[import-page] runPreflight:payload', {
        entityId: selectedDefinition.id,
        payloadCount: payload.length,
        firstPayloadItem: payload[0],
      });

      if (payload.length === 0) {
        throw new Error('La hoja seleccionada no contiene filas para importar.');
      }

      const response = await selectedDefinition.generate(payload);
      preflightSummary = selectedDefinition.summarizeGenerate(response);
    } catch (error) {
      if (
        error instanceof SettingsApiError &&
        error.details.length > 0 &&
        applyBackendValidationIssues(error.details)
      ) {
        preflightError =
          'El sistema detectó errores en algunos registros. Corrígelos en la vista previa e intenta nuevamente.';
      } else {
        preflightError = getErrorMessage(error, 'No fue posible validar la importación.');
      }
    } finally {
      preflightLoading = false;
    }
  }

  async function confirmImport(approve: boolean) {
    if (!selectedDefinition || !preflightSummary) return;

    confirmLoading = true;
    confirmError = null;
    const trackingCode = preflightSummary.trackingCode;

    try {
      const response = await selectedDefinition.confirm(trackingCode, approve);
      const summary = selectedDefinition.summarizeConfirm(response, approve);

      if (!approve) {
        resetSubmissionState();
        return;
      }

      successMessage = selectedDefinition.successMessage(summary);
    } catch (error) {
      confirmError = getErrorMessage(error, 'No fue posible completar la importación.');
    } finally {
      confirmLoading = false;
    }
  }

  function formatPreviewCell(value: unknown) {
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (value == null || value === '') {
      return '—';
    }

    return String(value);
  }

  function getPreviewFieldOptions(field: ImportPreviewFieldDefinition) {
    return field.options?.(contextData) ?? [];
  }

  function clonePreviewData(row: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (value instanceof Date) {
          return [key, value.toISOString()];
        }

        if (Array.isArray(value)) {
          return [key, [...value]];
        }

        if (value && typeof value === 'object') {
          return [key, JSON.parse(JSON.stringify(value))];
        }

        return [key, value];
      }),
    );
  }

  function buildPreviewRows(rows: Array<Record<string, unknown>>) {
    return rows.map((row) => ({
      id: `preview-row-${++previewRowSequence}`,
      data: clonePreviewData('data' in row ? (row as { data: Record<string, unknown> }).data : row),
      issues:
        'issues' in row &&
        Array.isArray(
          (row as { issues?: import('$lib/imports/types').ImportPreviewIssue[] }).issues,
        )
          ? [
              ...((row as { issues?: import('$lib/imports/types').ImportPreviewIssue[] }).issues ??
                []),
            ]
          : [],
    }));
  }

  function buildPayloadFromPreviewRows() {
    if (!selectedDefinition || !contextData) return [];

    const nextRows = previewRows.map((previewRow) => {
      try {
        const payload = selectedDefinition.buildPayloadFromPreviewRow({
          row: previewRow.data,
          context: contextData,
        });

        return {
          row: {
            ...previewRow,
            issues: [],
          },
          payload,
        };
      } catch (error) {
        return {
          row: {
            ...previewRow,
            issues: [
              {
                fieldKey: getFieldKeyFromError(error),
                message: getErrorMessage(error, 'La fila no es válida todavía.'),
              },
            ],
          },
          payload: null,
        };
      }
    });

    previewRows = nextRows.map(({ row }) => row);

    const invalidRows = nextRows.filter(({ payload }) => !payload);
    if (invalidRows.length > 0) {
      throw new Error(
        `Corrige ${invalidRows.length} fila${invalidRows.length === 1 ? '' : 's'} en la vista previa antes de validar la importación.`,
      );
    }

    return nextRows
      .map(({ payload }) => payload)
      .filter((payload): payload is Record<string, unknown> => payload !== null);
  }

  function getFieldKeyFromError(error: unknown) {
    return error instanceof ImportFieldValidationError ? error.fieldKey : '';
  }

  function getPreviewFieldKeyForBackendField(fieldKey: string) {
    const fieldMap: Partial<Record<ImportEntityId, Record<string, string>>> = {
      products: {
        price: 'basePrice',
        presentation: 'baseUnitName',
        category: 'categoryName',
      },
    };

    return fieldMap[selectedEntityId ?? 'customers']?.[fieldKey] ?? fieldKey;
  }

  function applyBackendValidationIssues(messages: string[]) {
    const issuesByRow = new Map<number, Array<{ fieldKey: string; message: string }>>();

    for (const message of messages) {
      const matched = message.match(/^[a-z]+\.(\d+)\.([^,]+),\s*(.+)$/i);
      if (!matched) continue;

      const rowIndex = Number(matched[1]);
      const fieldKey = getPreviewFieldKeyForBackendField(matched[2].trim());
      const currentIssues = issuesByRow.get(rowIndex) ?? [];

      currentIssues.push({
        fieldKey,
        message: matched[3].trim(),
      });

      issuesByRow.set(rowIndex, currentIssues);
    }

    if (issuesByRow.size === 0) {
      return false;
    }

    previewRows = previewRows.map((row, index) => ({
      ...row,
      issues: [...(issuesByRow.get(index) ?? [])],
    }));

    return true;
  }

  function normalizeDuplicateValue(value: unknown) {
    if (typeof value !== 'string') return '';

    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function getDuplicateState(rows: ImportPreviewRow[], fieldKey: string | null) {
    if (!fieldKey) {
      return {
        rowIds: [] as string[],
        groupCount: 0,
      };
    }

    const groups = new Map<string, string[]>();

    for (const row of rows) {
      const normalized = normalizeDuplicateValue(row.data[fieldKey]);
      if (!normalized) continue;

      const current = groups.get(normalized) ?? [];
      current.push(row.id);
      groups.set(normalized, current);
    }

    const duplicatedEntries = [...groups.values()].filter((ids) => ids.length > 1);

    return {
      rowIds: duplicatedEntries.flat(),
      groupCount: duplicatedEntries.length,
    };
  }

  function sortPreviewValue(value: unknown) {
    if (value == null) return '';
    if (typeof value === 'string') {
      return normalizeDuplicateValue(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return String(value);
  }

  function openEditDrawer(rowId: string) {
    const row = previewRows.find((previewRow) => previewRow.id === rowId);
    if (!row || !selectedDefinition) return;

    editDraft = clonePreviewData(row.data);
    editError = null;
    editingRowId = rowId;

    console.info('[import-page] openEditDrawer', {
      rowId,
      row,
      draft: editDraft,
    });
  }

  function closeEditDrawer() {
    editingRowId = null;
    editDraft = {};
    editError = null;
  }

  function updateDraftValue(field: ImportPreviewFieldDefinition, value: unknown) {
    let nextValue = value;

    if (field.input === 'number') {
      nextValue = value === '' ? 0 : Number(value);
    }

    editDraft = {
      ...editDraft,
      [field.key]: nextValue,
    };
  }

  function getDraftValue(fieldKey: string) {
    return editDraft[fieldKey];
  }

  function setDraftValue(fieldKey: string, value: unknown) {
    editDraft = {
      ...editDraft,
      [fieldKey]: value,
    };
  }

  function toggleSelectAll(checked: boolean) {
    selectedRowIds = checked ? previewRows.map((row) => row.id) : [];
  }

  function toggleRowSelection(rowId: string, checked: boolean) {
    selectedRowIds = checked
      ? [...new Set([...selectedRowIds, rowId])]
      : selectedRowIds.filter((id) => id !== rowId);
  }

  function detectDuplicates(fieldKey: string) {
    duplicateColumnKey = duplicateColumnKey === fieldKey ? null : fieldKey;
  }

  function sortRows(fieldKey: string, direction: 'asc' | 'desc') {
    const collator = new Intl.Collator('es', {
      numeric: true,
      sensitivity: 'base',
    });

    previewRows = [...previewRows].sort((left, right) => {
      const leftValue = sortPreviewValue(left.data[fieldKey]);
      const rightValue = sortPreviewValue(right.data[fieldKey]);
      const comparison = collator.compare(leftValue, rightValue);
      return direction === 'asc' ? comparison : comparison * -1;
    });

    sortColumnKey = fieldKey;
    sortDirection = direction;
  }

  function selectDuplicateRows() {
    selectedRowIds = [...duplicateState.rowIds];
  }

  async function deleteSelectedRows() {
    if (selectedRowIds.length === 0) return;

    if (preflightSummary) {
      await discardPreflightState();
    } else {
      resetSubmissionState();
    }

    if (editingRowId && selectedRowIds.includes(editingRowId)) {
      closeEditDrawer();
    }

    previewRows = previewRows.filter((row) => !selectedRowIds.includes(row.id));
    selectedRowIds = [];
  }

  async function saveEditedRow() {
    if (!editingRowId || !selectedDefinition) return;

    for (const field of selectedDefinition.previewFields) {
      const value = editDraft[field.key];
      if (field.required && (value == null || `${value}`.trim() === '')) {
        editError = `El campo "${field.label}" es requerido.`;
        return;
      }
    }

    if (preflightSummary) {
      await discardPreflightState();
    } else {
      resetSubmissionState();
    }

    previewRows = previewRows.map((row) => {
      if (row.id !== editingRowId) return row;

      try {
        selectedDefinition.buildPayloadFromPreviewRow({
          row: editDraft,
          context: contextData,
        });

        return {
          ...row,
          data: clonePreviewData(editDraft),
          issues: [],
        };
      } catch (error) {
        return {
          ...row,
          data: clonePreviewData(editDraft),
          issues: [
            {
              fieldKey: getFieldKeyFromError(error),
              message: getErrorMessage(error, 'La fila no es válida todavía.'),
            },
          ],
        };
      }
    });
    closeEditDrawer();
  }
</script>

<SettingsSectionShell
  eyebrow="Importaciones"
  title="Importar datos"
  description="Carga archivos CSV o Excel, mapea columnas contra los campos soportados y envía la importación usando los bulk APIs vigentes."
>
  <div class="space-y-6">
    <ImportWizardSteps {currentStep} {stepLabels} />

    {#if currentStep === 1}
      <ImportWizardTypeStep
        {availableDefinitions}
        {selectedEntityId}
        {contextLoading}
        {contextError}
        onSelect={handleEntitySelection}
      />
    {/if}

    {#if currentStep === 2}
      <ImportWizardFileStep
        {fileError}
        {dropActive}
        {workbook}
        {selectedSheetName}
        {fileInputResetKey}
        onFiles={handleFiles}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onSelectSheet={(name) => (selectedSheetName = name)}
        onChooseDifferentFile={resetFileState}
        onContinue={selectSheetAndContinue}
      />
    {/if}

    {#if currentStep === 3 && selectedDefinition && selectedSheet}
      <ImportWizardMappingStep
        {selectedDefinition}
        {mapping}
        {mappedCount}
        {requiredFieldsMapped}
        {mappingError}
        {previewError}
        {getAvailableColumns}
        onUpdateMapping={updateMapping}
        {getFieldSample}
      />
    {/if}

    {#if currentStep === 4 && selectedDefinition && selectedSheet}
      <ImportWizardReviewStep
        {selectedDefinition}
        {workbook}
        {selectedSheet}
        {mapping}
        {previewRows}
        {selectedRowIds}
        {allRowsSelected}
        {someRowsSelected}
        {duplicateColumnKey}
        duplicateRowIds={duplicateState.rowIds}
        duplicateGroupCount={duplicateState.groupCount}
        {sortColumnKey}
        {sortDirection}
        {preflightError}
        {preflightSummary}
        {confirmError}
        {successMessage}
        {formatPreviewCell}
        onToggleSelectAll={toggleSelectAll}
        onToggleRowSelection={toggleRowSelection}
        onDeleteSelected={deleteSelectedRows}
        onSelectDuplicates={selectDuplicateRows}
        onDetectDuplicates={detectDuplicates}
        onSortRows={sortRows}
        onEditRow={openEditDrawer}
      />
    {/if}

    <ImportWizardFooter
      {currentStep}
      {successMessage}
      {preflightSummary}
      {preflightLoading}
      previewRowsCount={previewRows.length}
      {confirmLoading}
      onBack={goBack}
      onReset={resetTypeState}
      onContinueToConfirmation={goToConfirmationStep}
      onRunPreflight={runPreflight}
      onDiscardPreflight={discardPreflightState}
      onConfirmImport={() => confirmImport(true)}
    />
  </div>
</SettingsSectionShell>

{#if editingRow && editingRowIndex >= 0 && selectedDefinition && Object.keys(editDraft).length > 0}
  <ImportWizardEditDrawer
    {selectedDefinition}
    {editingRowIndex}
    editingRowNumber={editingRowIndex + 1}
    {editDraft}
    {editError}
    {getDraftValue}
    {getPreviewFieldOptions}
    onSetDraftValue={setDraftValue}
    onUpdateDraftValue={updateDraftValue}
    onClose={closeEditDrawer}
    onSave={saveEditedRow}
  />
{/if}
