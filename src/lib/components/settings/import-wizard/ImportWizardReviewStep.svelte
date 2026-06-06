<script lang="ts">
  import ArrowDownAZIcon from '@lucide/svelte/icons/arrow-down-a-z';
  import ArrowUpAZIcon from '@lucide/svelte/icons/arrow-up-a-z';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Table from '$lib/components/ui/table';
  import type {
    ImportEntityDefinition,
    ImportPreflightSummary,
    ImportPreviewRow,
    ParsedSheet,
    ParsedWorkbook,
  } from '$lib/imports/types';
  import { cn } from '$lib/utils';

  let {
    selectedDefinition,
    workbook,
    selectedSheet,
    mapping,
    previewRows,
    selectedRowIds,
    allRowsSelected,
    someRowsSelected,
    duplicateColumnKey,
    duplicateRowIds,
    duplicateGroupCount,
    sortColumnKey,
    sortDirection,
    preflightError,
    preflightSummary,
    confirmError,
    successMessage,
    formatPreviewCell,
    onToggleSelectAll,
    onToggleRowSelection,
    onDeleteSelected,
    onSelectDuplicates,
    onDetectDuplicates,
    onSortRows,
    onEditRow,
  }: {
    selectedDefinition: ImportEntityDefinition;
    workbook: ParsedWorkbook | null;
    selectedSheet: ParsedSheet;
    mapping: Record<string, string>;
    previewRows: ImportPreviewRow[];
    selectedRowIds: string[];
    allRowsSelected: boolean;
    someRowsSelected: boolean;
    duplicateColumnKey: string | null;
    duplicateRowIds: string[];
    duplicateGroupCount: number;
    sortColumnKey: string | null;
    sortDirection: 'asc' | 'desc' | null;
    preflightError: string | null;
    preflightSummary: ImportPreflightSummary | null;
    confirmError: string | null;
    successMessage: string | null;
    formatPreviewCell: (value: unknown) => string;
    onToggleSelectAll: (checked: boolean) => void;
    onToggleRowSelection: (rowId: string, checked: boolean) => void;
    onDeleteSelected: () => void | Promise<void>;
    onSelectDuplicates: () => void;
    onDetectDuplicates: (fieldKey: string) => void;
    onSortRows: (fieldKey: string, direction: 'asc' | 'desc') => void;
    onEditRow: (rowId: string) => void;
  } = $props();

  const rowsWithIssues = $derived(previewRows.filter((row) => (row.issues?.length ?? 0) > 0));

  function getFieldIssue(row: ImportPreviewRow, fieldKey: string) {
    return row.issues?.find((issue) => issue.fieldKey === fieldKey) ?? null;
  }

  function getRowIssue(row: ImportPreviewRow) {
    return row.issues?.[0] ?? null;
  }
</script>

<div class="space-y-4">
  <Card.Root>
    <Card.Header>
      <Card.Title>Confirma y envía</Card.Title>
      <Card.Description>
        Primero el sistema valida el lote y luego decides si lo completas.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border p-4">
          <p class="text-sm text-muted-foreground">Tipo</p>
          <p class="font-medium">{selectedDefinition.label}</p>
        </div>
        <div class="rounded-xl border p-4 overflow-hidden">
          <p class="text-sm text-muted-foreground">Archivo</p>
          <p class="font-medium truncate">{workbook?.fileName}</p>
        </div>
        <div class="rounded-xl border p-4">
          <p class="text-sm text-muted-foreground">Hoja</p>
          <p class="font-medium">{selectedSheet.name}</p>
        </div>
        <div class="rounded-xl border p-4">
          <p class="text-sm text-muted-foreground">Filas detectadas</p>
          <p class="font-medium">{selectedSheet.rows.length}</p>
        </div>
      </div>

      <div class="space-y-3 rounded-2xl border p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-medium">Vista previa editable</p>
            <p class="text-sm text-muted-foreground">
              Revisa los registros transformados y edítalos antes de validar o completar la
              importación.
            </p>
          </div>
          <Badge variant="secondary">{previewRows.length} registros</Badge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          {#if duplicateColumnKey}
            <Badge variant="outline">
              {duplicateRowIds.length} fila{duplicateRowIds.length === 1 ? '' : 's'} duplicadas en
              {` `}
              {selectedDefinition.previewFields.find((field) => field.key === duplicateColumnKey)
                ?.label}
            </Badge>
            <Badge variant="outline">
              {duplicateGroupCount} grupo{duplicateGroupCount === 1 ? '' : 's'}
            </Badge>
            <Button.Root
              variant="ghost"
              size="sm"
              onclick={() => onDetectDuplicates(duplicateColumnKey)}
            >
              Ocultar resaltado
            </Button.Root>
          {/if}

          {#if selectedRowIds.length > 0}
            <Badge variant="secondary">
              {selectedRowIds.length} seleccionada{selectedRowIds.length === 1 ? '' : 's'}
            </Badge>
            <Button.Root variant="outline" size="sm" onclick={onDeleteSelected}>
              <Trash2Icon class="size-4" />
              Eliminar seleccionadas
            </Button.Root>
          {/if}

          {#if duplicateRowIds.length > 0}
            <Button.Root variant="outline" size="sm" onclick={onSelectDuplicates}>
              Seleccionar duplicados
            </Button.Root>
          {/if}

          {#if rowsWithIssues.length > 0}
            <Badge variant="destructive">
              {rowsWithIssues.length} fila{rowsWithIssues.length === 1 ? '' : 's'} con errores
            </Badge>
          {/if}
        </div>

        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="w-12">
                <Checkbox
                  checked={allRowsSelected}
                  indeterminate={someRowsSelected && !allRowsSelected}
                  aria-label="Seleccionar todas las filas"
                  onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
                />
              </Table.Head>
              <Table.Head>#</Table.Head>
              {#each selectedDefinition.previewFields as field}
                <Table.Head>
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex flex-col items-start gap-1">
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      {#if sortColumnKey === field.key && sortDirection}
                        <span class="text-xs text-muted-foreground">
                          {sortDirection === 'asc' ? 'Orden A-Z' : 'Orden Z-A'}
                        </span>
                      {/if}
                    </div>
                    {#if field.input === 'text'}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          <Button.Root
                            variant="ghost"
                            size="icon-xs"
                            class="shrink-0"
                            aria-label={`Acciones para ${field.label}`}
                          >
                            <EllipsisVerticalIcon class="size-3.5" />
                          </Button.Root>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end" class="w-48">
                          <DropdownMenu.Item onclick={() => onSortRows(field.key, 'asc')}>
                            <ArrowDownAZIcon class="size-4" />
                            Ordenar A-Z
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onclick={() => onSortRows(field.key, 'desc')}>
                            <ArrowUpAZIcon class="size-4" />
                            Ordenar Z-A
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item onclick={() => onDetectDuplicates(field.key)}>
                            {duplicateColumnKey === field.key
                              ? 'Ocultar resaltado'
                              : 'Detectar duplicados'}
                          </DropdownMenu.Item>
                          {#if duplicateColumnKey === field.key && duplicateRowIds.length > 0}
                            <DropdownMenu.Item onclick={onSelectDuplicates}>
                              Seleccionar duplicados
                            </DropdownMenu.Item>
                          {/if}
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    {/if}
                  </div>
                </Table.Head>
              {/each}
              <Table.Head
                class="sticky right-0 z-20 bg-card after:absolute after:top-0 after:left-0 after:h-full after:w-px after:bg-border"
              >
                Acciones
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each previewRows as row, index (row.id)}
              {@const rowSelected = selectedRowIds.includes(row.id)}
              {@const rowDuplicated = duplicateRowIds.includes(row.id)}
              {@const rowIssue = getRowIssue(row)}
              <Table.Row
                class={cn(rowDuplicated && 'bg-muted/30', row.issues?.length && 'bg-destructive/5')}
              >
                <Table.Cell>
                  <Checkbox
                    checked={rowSelected}
                    aria-label={`Seleccionar fila ${index + 1}`}
                    onCheckedChange={(checked) => onToggleRowSelection(row.id, Boolean(checked))}
                  />
                </Table.Cell>
                <Table.Cell>{index + 1}</Table.Cell>
                {#each selectedDefinition.previewFields as field}
                  {@const fieldIssue = getFieldIssue(row, field.key)}
                  <Table.Cell
                    class={cn(
                      'max-w-48 truncate font-normal',
                      rowDuplicated &&
                        duplicateColumnKey === field.key &&
                        'bg-accent text-foreground font-medium',
                      fieldIssue && 'bg-destructive/12 text-destructive font-medium',
                    )}
                    title={fieldIssue?.message}
                  >
                    {formatPreviewCell(row.data[field.key])}
                  </Table.Cell>
                {/each}
                <Table.Cell
                  class="sticky right-0 z-20 bg-card after:absolute after:top-0 after:left-0 after:h-full after:w-px after:bg-border"
                >
                  <div class="space-y-2">
                    <Button.Root variant="outline" size="sm" onclick={() => onEditRow(row.id)}>
                      <PencilIcon class="size-4" />
                      Editar
                    </Button.Root>
                    {#if rowIssue && !rowIssue.fieldKey}
                      <p class="max-w-44 text-xs text-destructive">{rowIssue.message}</p>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      {#if preflightError}
        <Alert variant="destructive">
          <AlertDescription>{preflightError}</AlertDescription>
        </Alert>
      {/if}

      {#if preflightSummary}
        <Alert>
          <AlertTitle>Validación completada</AlertTitle>
          <AlertDescription>
            Se detectaron {preflightSummary.totalRecords} registros con
            {` ${preflightSummary.invalidRows.length} `}
            filas inválidas.
          </AlertDescription>
        </Alert>

        {#if preflightSummary.details?.length}
          <div class="space-y-2 rounded-2xl border p-4">
            {#each preflightSummary.details as detail}
              <p class="text-sm text-muted-foreground">{detail}</p>
            {/each}
          </div>
        {/if}

        {#if preflightSummary.invalidRows.length > 0}
          <div
            class="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20"
          >
            <p class="font-medium">Filas inválidas detectadas en la validación</p>
            <div class="flex flex-wrap gap-2">
              {#each preflightSummary.invalidRows as row}
                <Badge variant="outline">Fila {row.item}: {row.msgList.join(', ')}</Badge>
              {/each}
            </div>
          </div>
        {/if}
      {/if}

      {#if confirmError}
        <Alert variant="destructive">
          <AlertDescription>{confirmError}</AlertDescription>
        </Alert>
      {/if}

      {#if successMessage}
        <Alert>
          <AlertTitle>Importación completada</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
