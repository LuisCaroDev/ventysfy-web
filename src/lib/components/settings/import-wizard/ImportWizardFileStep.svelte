<script lang="ts">
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import type { ParsedWorkbook } from '$lib/imports/types';
  import { cn } from '$lib/utils';

  let {
    fileError,
    dropActive,
    workbook,
    selectedSheetName,
    fileInputResetKey,
    onFiles,
    onDragOver,
    onDragLeave,
    onDrop,
    onSelectSheet,
    onChooseDifferentFile,
    onContinue,
  }: {
    fileError: string | null;
    dropActive: boolean;
    workbook: ParsedWorkbook | null;
    selectedSheetName: string;
    fileInputResetKey: number;
    onFiles: (files: FileList | null) => void | Promise<void>;
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void | Promise<void>;
    onSelectSheet: (name: string) => void;
    onChooseDifferentFile: () => void;
    onContinue: () => void;
  } = $props();

  let localFileInput = $state<HTMLInputElement | null>(null);
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Sube tu archivo</Card.Title>
    <Card.Description>
      Soporta CSV, XLSX y XLS. Si el archivo tiene varias hojas no vacías, podrás elegir cuál
      importar.
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-5">
    {#if fileError}
      <Alert variant="destructive">
        <AlertDescription>{fileError}</AlertDescription>
      </Alert>
    {/if}

    <button
      type="button"
      class={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition-colors',
        dropActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40',
      )}
      onclick={() => localFileInput?.click()}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
    >
      <div class="rounded-full bg-primary/10 p-3 text-primary">
        <UploadIcon class="size-5" />
      </div>
      <div class="space-y-1">
        <p class="font-medium">Arrastra el archivo aquí o haz click para buscar</p>
        <p class="text-sm text-muted-foreground">Formatos soportados: CSV, XLSX, XLS</p>
      </div>
    </button>

    {#key fileInputResetKey}
      <Input
        bind:ref={localFileInput}
        type="file"
        accept=".csv,.xlsx,.xls"
        class="hidden"
        onchange={(event) => onFiles((event.currentTarget as HTMLInputElement).files)}
      />
    {/key}

    {#if workbook}
      <div class="rounded-2xl border bg-card p-4">
        <div class="flex flex-wrap items-center gap-3">
          <p class="font-medium">{workbook.fileName}</p>
          <Badge variant="secondary">{workbook.extension.toUpperCase()}</Badge>
          <Badge variant="outline">
            {workbook.sheets.length} hoja{workbook.sheets.length === 1 ? '' : 's'}
          </Badge>
        </div>
      </div>
    {/if}

    {#if workbook && workbook.sheets.length > 1}
      <div class="space-y-3 rounded-2xl border bg-card p-5">
        <div class="space-y-1">
          <p class="font-medium">Selecciona la hoja a importar</p>
          <p class="text-sm text-muted-foreground">
            Solo se listan hojas con encabezados y al menos una fila de datos.
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          {#each workbook.sheets as sheet}
            <label
              class={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                selectedSheetName === sheet.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <input
                type="radio"
                name="sheet"
                class="mt-1"
                value={sheet.name}
                checked={selectedSheetName === sheet.name}
                onchange={() => onSelectSheet(sheet.name)}
              />
              <div class="space-y-1">
                <p class="font-medium">{sheet.name}</p>
                <p class="text-sm text-muted-foreground">
                  {sheet.rows.length} fila{sheet.rows.length === 1 ? '' : 's'} detectadas
                </p>
              </div>
            </label>
          {/each}
        </div>

        <div class="flex flex-wrap justify-end gap-3">
          <Button.Root variant="outline" onclick={onChooseDifferentFile}>
            Elegir otro archivo
          </Button.Root>
          <Button.Root onclick={onContinue} disabled={!selectedSheetName}>Continuar</Button.Root>
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
