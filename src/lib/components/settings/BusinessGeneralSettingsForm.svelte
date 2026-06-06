<script lang="ts">
  import { untrack } from 'svelte';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { superForm } from 'sveltekit-superforms';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';
  import { businessGeneralSettingsSchema } from '$lib/settings/schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { Infer } from 'sveltekit-superforms';

  let {
    form,
    submitError = null,
    submitting = false,
    onSubmit,
  }: {
    form: SuperValidated<Infer<typeof businessGeneralSettingsSchema>>;
    submitError?: string | null;
    submitting?: boolean;
    onSubmit: (data: Infer<typeof businessGeneralSettingsSchema>) => Promise<void>;
  } = $props();

  const businessForm = superForm(
    untrack(() => form),
    {
      validators: zod4Client(businessGeneralSettingsSchema),
      validationMethod: 'submit-only',
      taintedMessage: 'Hay cambios sin guardar. Si cierras, se perderán.',
    },
  );

  const { form: formData } = businessForm;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const validation = await businessForm.validateForm({ update: true });

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

  <Form.Field form={businessForm} name="tradeName">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Nombre comercial</Form.Label>
        <Input
          {...props}
          bind:value={$formData.tradeName}
          disabled={submitting}
          autocomplete="organization"
        />
      {/snippet}
    </Form.Control>
    <Form.Description>Es el nombre visible en ventas, comprobantes y settings.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

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
