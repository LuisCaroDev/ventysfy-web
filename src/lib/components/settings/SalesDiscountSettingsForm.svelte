<script lang="ts">
  import { untrack } from 'svelte';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { superForm } from 'sveltekit-superforms';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Switch } from '$lib/components/ui/switch';
  import { salesDiscountSettingsSchema } from '$lib/settings/schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { Infer } from 'sveltekit-superforms';

  let {
    form,
    submitError = null,
    submitting = false,
    onSubmit,
  }: {
    form: SuperValidated<Infer<typeof salesDiscountSettingsSchema>>;
    submitError?: string | null;
    submitting?: boolean;
    onSubmit: (data: Infer<typeof salesDiscountSettingsSchema>) => Promise<void>;
  } = $props();

  const salesForm = superForm(
    untrack(() => form),
    {
      validators: zod4Client(salesDiscountSettingsSchema),
      validationMethod: 'submit-only',
      taintedMessage: 'Hay cambios sin guardar. Si cierras, se perderán.',
    },
  );

  const { form: formData } = salesForm;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const validation = await salesForm.validateForm({ update: true });

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
        <Label for="discount-enabled">Habilitar descuentos</Label>
        <p class="text-sm leading-6 text-muted-foreground">
          Permite descuentos manuales durante la venta.
        </p>
      </div>
      <Switch
        id="discount-enabled"
        bind:checked={$formData.discountEnabled}
        disabled={submitting}
      />
    </div>

    <Separator class="my-4" />

    <div class="flex items-start justify-between gap-4 py-1">
      <div class="space-y-1">
        <Label for="discount-max-rate-enabled">Limitar porcentaje máximo</Label>
        <p class="text-sm leading-6 text-muted-foreground">
          Restringe el descuento aplicado por porcentaje.
        </p>
      </div>
      <Switch
        id="discount-max-rate-enabled"
        bind:checked={$formData.discountEnabledMaxRate}
        disabled={submitting || !$formData.discountEnabled}
      />
    </div>

    <Separator class="my-4" />

    <Form.Field form={salesForm} name="discountMaxRate">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Tope de descuento (%)</Form.Label>
          <Input
            {...props}
            type="number"
            min="0"
            max="100"
            step="0.01"
            bind:value={$formData.discountMaxRate}
            disabled={submitting || !$formData.discountEnabled || !$formData.discountEnabledMaxRate}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </div>

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
