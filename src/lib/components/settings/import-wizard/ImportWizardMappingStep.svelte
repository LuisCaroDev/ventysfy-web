<script lang="ts">
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import { Select } from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';
  import type { ImportEntityDefinition } from '$lib/imports/types';

  let {
    selectedDefinition,
    mapping,
    mappedCount,
    requiredFieldsMapped,
    mappingError,
    previewError,
    getAvailableColumns,
    onUpdateMapping,
    getFieldSample,
  }: {
    selectedDefinition: ImportEntityDefinition;
    mapping: Record<string, string>;
    mappedCount: number;
    requiredFieldsMapped: boolean;
    mappingError: string | null;
    previewError: string | null;
    getAvailableColumns: (fieldKey: string) => string[];
    onUpdateMapping: (fieldKey: string, sourceColumn: string) => void;
    getFieldSample: (sourceColumn: string | undefined) => string;
  } = $props();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Mapea las columnas</Card.Title>
    <Card.Description>
      Asocia cada campo soportado con una columna del archivo. Los campos requeridos bloquean el
      avance si no están mapeados.
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    {#if mappingError}
      <Alert variant="destructive">
        <AlertDescription>{mappingError}</AlertDescription>
      </Alert>
    {/if}

    <div class="flex flex-wrap items-center gap-3">
      <Badge variant="secondary">{mappedCount} campos mapeados</Badge>
      <Badge variant={requiredFieldsMapped ? 'default' : 'outline'}>
        {requiredFieldsMapped ? 'Requeridos completos' : 'Faltan requeridos'}
      </Badge>
    </div>

    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Campo</Table.Head>
          <Table.Head>Fuente</Table.Head>
          <Table.Head>Muestra</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each selectedDefinition.fields as field}
          <Table.Row
            class={field.required && !mapping[field.key]
              ? 'bg-amber-50/60 dark:bg-amber-950/10'
              : ''}
          >
            <Table.Cell>
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-medium">{field.label}</p>
                  {#if field.required}
                    <Badge variant="outline">Requerido</Badge>
                  {/if}
                </div>
                <p class="text-sm text-muted-foreground">{field.description}</p>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-56">
              <Select
                value={mapping[field.key] ?? ''}
                placeholder="Selecciona columna"
                onchange={(event: Event) =>
                  onUpdateMapping(field.key, (event.currentTarget as HTMLSelectElement).value)}
              >
                <option value="">No mapear</option>
                {#each getAvailableColumns(field.key) as header}
                  <option value={header}>{header}</option>
                {/each}
              </Select>
            </Table.Cell>
            <Table.Cell class="max-w-xs text-sm text-muted-foreground">
              {getFieldSample(mapping[field.key])}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>

    {#if previewError}
      <Alert variant="destructive">
        <AlertDescription>{previewError}</AlertDescription>
      </Alert>
    {/if}
  </Card.Content>
</Card.Root>
