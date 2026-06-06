<script lang="ts">
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Button from '$lib/components/ui/button';
  import type { ImportPreflightSummary } from '$lib/imports/types';

  type Step = 1 | 2 | 3 | 4;

  let {
    currentStep,
    successMessage,
    preflightSummary,
    preflightLoading,
    previewRowsCount,
    confirmLoading,
    onBack,
    onReset,
    onContinueToConfirmation,
    onRunPreflight,
    onDiscardPreflight,
    onConfirmImport,
  }: {
    currentStep: Step;
    successMessage: string | null;
    preflightSummary: ImportPreflightSummary | null;
    preflightLoading: boolean;
    previewRowsCount: number;
    confirmLoading: boolean;
    onBack: () => void | Promise<void>;
    onReset: () => void;
    onContinueToConfirmation: () => void;
    onRunPreflight: () => void | Promise<void>;
    onDiscardPreflight: () => void | Promise<void>;
    onConfirmImport: () => void | Promise<void>;
  } = $props();
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
  <div class="flex flex-wrap gap-3">
    {#if currentStep > 1 && !successMessage}
      <Button.Root variant="outline" onclick={onBack}>Atrás</Button.Root>
    {/if}

    {#if currentStep !== 1}
      <Button.Root variant="ghost" onclick={onReset}>Reiniciar flujo</Button.Root>
    {/if}
  </div>

  <div class="flex flex-wrap gap-3">
    {#if currentStep === 3}
      <Button.Root onclick={onContinueToConfirmation}>Continuar a confirmación</Button.Root>
    {/if}

    {#if currentStep === 4 && !preflightSummary && !successMessage}
      <Button.Root onclick={onRunPreflight} disabled={preflightLoading || previewRowsCount === 0}>
        {#if preflightLoading}
          <LoaderCircleIcon class="size-4 animate-spin" />
        {/if}
        Validar importación
      </Button.Root>
    {/if}

    {#if currentStep === 4 && preflightSummary && !successMessage}
      <Button.Root variant="outline" onclick={onDiscardPreflight} disabled={confirmLoading}>
        <XIcon class="size-4" />
        Cancelar lote
      </Button.Root>
      <Button.Root variant="outline" onclick={onRunPreflight} disabled={preflightLoading}>
        <RefreshCcwIcon class="size-4" />
        Revalidar
      </Button.Root>
      <Button.Root onclick={onConfirmImport} disabled={confirmLoading}>
        {#if confirmLoading}
          <LoaderCircleIcon class="size-4 animate-spin" />
        {/if}
        Continuar importación
      </Button.Root>
    {/if}
  </div>
</div>
