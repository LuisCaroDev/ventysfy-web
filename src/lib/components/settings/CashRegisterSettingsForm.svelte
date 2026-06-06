<script lang="ts">
  import { untrack } from 'svelte';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { superForm } from 'sveltekit-superforms';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Switch } from '$lib/components/ui/switch';
  import { cashRegisterSettingsSchema } from '$lib/settings/schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { Infer } from 'sveltekit-superforms';

  let {
    form,
    submitError = null,
    submitting = false,
    onSubmit,
  }: {
    form: SuperValidated<Infer<typeof cashRegisterSettingsSchema>>;
    submitError?: string | null;
    submitting?: boolean;
    onSubmit: (data: Infer<typeof cashRegisterSettingsSchema>) => Promise<void>;
  } = $props();

  const cashRegisterForm = superForm(
    untrack(() => form),
    {
      validators: zod4Client(cashRegisterSettingsSchema),
      validationMethod: 'submit-only',
      taintedMessage: 'Hay cambios sin guardar. Si cierras, se perderán.',
    },
  );

  const { form: formData, errors } = cashRegisterForm;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const validation = await cashRegisterForm.validateForm({ update: true });

    if (!validation.valid) return;

    await onSubmit(validation.data);
  }
</script>

<form class="space-y-5" onsubmit={handleSubmit}>
  {#if submitError}
    <Alert variant="destructive">
      <AlertDescription>{submitError}</AlertDescription>
    </Alert>
  {/if}

  <div class="space-y-0">
    <div class="flex items-start justify-between gap-4 py-1">
      <div class="space-y-1">
        <Label for="enable-cash-count">Habilitar arqueo de caja</Label>
        <p class="text-sm leading-6 text-muted-foreground">
          Activa el conteo de efectivo al abrir y cerrar una caja.
        </p>
      </div>
      <Switch
        id="enable-cash-count"
        bind:checked={$formData.enableCashCount}
        disabled={submitting}
      />
    </div>

    <Separator class="my-4" />

    <div class="flex items-start justify-between gap-4 py-1">
      <div class="space-y-1">
        <Label for="validate-cash-count">Validar conteo antes de cerrar</Label>
        <p class="text-sm leading-6 text-muted-foreground">
          Requiere que el arqueo coincida antes de permitir el cierre.
        </p>
      </div>
      <Switch
        id="validate-cash-count"
        bind:checked={$formData.validateCashCount}
        disabled={submitting || !$formData.enableCashCount}
      />
    </div>
  </div>

  {#if $errors.validateCashCount}
    <p class="text-sm text-destructive">{$errors.validateCashCount}</p>
  {/if}

  <div class="flex items-center justify-end">
    <Button type="submit" disabled={submitting}>
      {#if submitting}
        Guardando...
      {:else}
        Guardar cambios
      {/if}
    </Button>
  </div>
</form>
