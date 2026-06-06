<script lang="ts">
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';

  let {
    currentLogoPath,
    submitError = null,
    submitting = false,
    onSubmit,
  }: {
    currentLogoPath?: string;
    submitError?: string | null;
    submitting?: boolean;
    onSubmit: (data: FormData) => Promise<void>;
  } = $props();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    await onSubmit(formData);
  }
</script>

<form enctype="multipart/form-data" class="space-y-5" onsubmit={handleSubmit}>
  {#if submitError}
    <Alert variant="destructive">
      <AlertDescription>{submitError}</AlertDescription>
    </Alert>
  {/if}

  <div class="space-y-3">
    <p class="text-sm font-medium">Logo actual</p>
    <div
      class="flex min-h-40 items-center justify-center rounded-[calc(var(--radius-lg)+6px)] border border-dashed border-border bg-muted/30 p-6"
    >
      {#if currentLogoPath}
        <img src={currentLogoPath} alt="Logo actual" class="max-h-28 w-auto object-contain" />
      {:else}
        <p class="text-sm text-muted-foreground">Aún no hay logo cargado.</p>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <label class="text-sm font-medium" for="logo">Nuevo logo</label>
    <input
      id="logo"
      name="logo"
      type="file"
      accept="image/*"
      required
      disabled={submitting}
      class="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
    />
    <p class="text-sm text-muted-foreground">Formato imagen, máximo 5 MB.</p>
  </div>

  <div class="flex items-center justify-end">
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Subiendo...' : 'Actualizar logo'}
    </Button>
  </div>
</form>
