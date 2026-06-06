<script lang="ts">
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import * as Button from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select } from '$lib/components/ui/select';
  import SettingsDrawer from '$lib/components/settings/SettingsDrawer.svelte';
  import ImportWizardDateField from '$lib/components/settings/import-wizard/ImportWizardDateField.svelte';
  import type { ImportEntityDefinition, ImportPreviewFieldDefinition } from '$lib/imports/types';

  let {
    selectedDefinition,
    editingRowIndex,
    editingRowNumber,
    editDraft,
    editError,
    getDraftValue,
    getPreviewFieldOptions,
    onSetDraftValue,
    onUpdateDraftValue,
    onClose,
    onSave,
  }: {
    selectedDefinition: ImportEntityDefinition;
    editingRowIndex: number;
    editingRowNumber: number;
    editDraft: Record<string, unknown>;
    editError: string | null;
    getDraftValue: (fieldKey: string) => unknown;
    getPreviewFieldOptions: (field: ImportPreviewFieldDefinition) => Array<{
      label: string;
      value: string;
    }>;
    onSetDraftValue: (fieldKey: string, value: unknown) => void;
    onUpdateDraftValue: (field: ImportPreviewFieldDefinition, value: unknown) => void;
    onClose: () => void;
    onSave: () => void;
  } = $props();
</script>

{#key `${selectedDefinition.id}-${editingRowIndex}`}
  <SettingsDrawer
    title={`Editar registro ${editingRowNumber}`}
    description="Actualiza los valores de la vista previa antes de validar o completar la importación."
    backHref={selectedDefinition.id}
    {onClose}
  >
    {#snippet children()}
      <div class="space-y-5">
        {#if editError}
          <Alert variant="destructive">
            <AlertDescription>{editError}</AlertDescription>
          </Alert>
        {/if}

        {#each selectedDefinition.previewFields as field}
          <div class="space-y-2">
            <Label for={`preview-${field.key}`}>
              {field.label}{field.required ? ' *' : ''}
            </Label>

            {#if field.input === 'select'}
              <Select
                value={String(getDraftValue(field.key) ?? '')}
                onchange={(event: Event) =>
                  onSetDraftValue(field.key, (event.currentTarget as HTMLSelectElement).value)}
              >
                {#each getPreviewFieldOptions(field) as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </Select>
            {:else if field.input === 'boolean'}
              <label class="flex items-center gap-3 rounded-xl border p-3">
                <Checkbox
                  checked={Boolean(getDraftValue(field.key))}
                  onCheckedChange={(checked) => onSetDraftValue(field.key, Boolean(checked))}
                />
                <span class="text-sm">{field.label}{field.required ? ' *' : ''}</span>
              </label>
            {:else if field.input === 'date'}
              <ImportWizardDateField
                id={`preview-${field.key}`}
                value={String(getDraftValue(field.key) ?? '')}
                onChange={(value) => onSetDraftValue(field.key, value)}
              />
            {:else}
              <Input
                id={`preview-${field.key}`}
                type={field.input === 'number' ? 'number' : 'text'}
                value={String(getDraftValue(field.key) ?? '')}
                oninput={(event) =>
                  onUpdateDraftValue(field, (event.currentTarget as HTMLInputElement).value)}
              />
            {/if}

            {#if field.description}
              <p class="text-sm text-muted-foreground">{field.description}</p>
            {/if}
          </div>
        {/each}

        <div class="flex justify-end gap-3">
          <Button.Root variant="outline" onclick={onClose}>Cancelar</Button.Root>
          <Button.Root onclick={onSave}>Guardar cambios</Button.Root>
        </div>
      </div>
    {/snippet}
  </SettingsDrawer>
{/key}
