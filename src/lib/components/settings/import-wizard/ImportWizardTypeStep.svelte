<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import type { ImportEntityDefinition, ImportEntityId } from '$lib/imports/types';
  import { cn } from '$lib/utils';

  let {
    availableDefinitions,
    selectedEntityId,
    contextLoading,
    contextError,
    onSelect,
  }: {
    availableDefinitions: ImportEntityDefinition[];
    selectedEntityId: ImportEntityId | null;
    contextLoading: boolean;
    contextError: string | null;
    onSelect: (definition: ImportEntityDefinition) => void | Promise<void>;
  } = $props();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>¿Qué quieres importar?</Card.Title>
    <Card.Description>
      Elige el tipo de dato. La estructura permite agregar más importadores después sin reescribir
      el wizard.
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    {#if contextError}
      <Alert variant="destructive">
        <AlertTitle>No se pudo preparar el flujo</AlertTitle>
        <AlertDescription>{contextError}</AlertDescription>
      </Alert>
    {/if}

    {#if availableDefinitions.length === 0}
      <Alert>
        <AlertTitle>Sin opciones disponibles</AlertTitle>
        <AlertDescription>
          Tu cuenta no tiene permisos para importar clientes ni productos.
        </AlertDescription>
      </Alert>
    {:else}
      <div class="grid gap-4 md:grid-cols-2">
        {#each availableDefinitions as definition}
          <button
            type="button"
            class={cn(
              'rounded-2xl border p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5',
              selectedEntityId === definition.id ? 'border-primary bg-primary/5' : 'border-border',
            )}
            disabled={contextLoading}
            onclick={() => onSelect(definition)}
          >
            <div class="flex items-start gap-4">
              <div class="rounded-xl bg-primary/10 p-3 text-primary">
                <FileSpreadsheetIcon class="size-5" />
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <p class="font-semibold">{definition.label}</p>
                  <Badge variant="outline">{definition.permission}</Badge>
                </div>
                <p class="text-sm text-muted-foreground">{definition.description}</p>
              </div>
              <ChevronRightIcon class="ml-auto size-5 text-muted-foreground" />
            </div>
          </button>
        {/each}
      </div>
    {/if}

    {#if contextLoading}
      <div
        class="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground"
      >
        <LoaderCircleIcon class="size-4 animate-spin" />
        Cargando configuración del importador...
      </div>
    {/if}
  </Card.Content>
</Card.Root>
