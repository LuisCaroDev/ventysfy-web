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
  import { salesTipSettingsSchema } from '$lib/settings/schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { Infer } from 'sveltekit-superforms';

  let {
    form,
    submitError = null,
    submitting = false,
    onSubmit,
  }: {
    form: SuperValidated<Infer<typeof salesTipSettingsSchema>>;
    submitError?: string | null;
    submitting?: boolean;
    onSubmit: (data: Infer<typeof salesTipSettingsSchema>) => Promise<void>;
  } = $props();

  const salesForm = superForm(
    untrack(() => form),
    {
      validators: zod4Client(salesTipSettingsSchema),
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
        <Label for="tip-enabled">Habilitar propina</Label>
        <p class="text-sm leading-6 text-muted-foreground">
          Activa la propina sugerida en nuevas ventas.
        </p>
      </div>
      <Switch id="tip-enabled" bind:checked={$formData.tipEnabled} disabled={submitting} />
    </div>

    <Separator class="my-4" />

    <div class="grid gap-4 sm:grid-cols-2">
      <Form.Field form={salesForm} name="tipRate">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Propina sugerida (%)</Form.Label>
            <Input
              {...props}
              type="number"
              min="0"
              max="100"
              step="0.01"
              bind:value={$formData.tipRate}
              disabled={submitting || !$formData.tipEnabled}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field form={salesForm} name="tipMaxRate">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Tope de propina (%)</Form.Label>
            <Input
              {...props}
              type="number"
              min="0"
              max="100"
              step="0.01"
              bind:value={$formData.tipMaxRate}
              disabled={submitting || !$formData.tipEnabled}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>
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
