<script lang="ts">
  import { browser } from '$app/environment';
  import Logo from '$lib/components/ui/Logo.svelte';
  import { untrack } from 'svelte';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { superForm } from 'sveltekit-superforms';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';
  import { loginSchema } from './schema';

  let props = $props();
  const initialForm = untrack(() => props.data.form);
  const actionError = $derived((props.form as { error?: string } | undefined)?.error);

  let offset = $state('0');
  let formActionError = $state<string | undefined>(undefined);

  const loginForm = superForm(initialForm, {
    validators: zod4Client(loginSchema),
    onResult: ({ result }) => {
      if (result.type === 'failure') {
        formActionError =
          (result.data as { error?: string } | undefined)?.error ?? 'Error de autenticación.';
      } else if (result.type === 'error') {
        formActionError = result.error?.message ?? 'Error interno del servidor.';
      } else {
        formActionError = undefined;
      }
    },
  });

  const { form: formData, enhance, submitting } = loginForm;

  $effect(() => {
    formActionError = actionError;
  });

  $effect(() => {
    if (!browser) return;
    offset = String(-new Date().getTimezoneOffset() / 60);
  });
</script>

<svelte:head>
  <title>Iniciar sesión | Ventysfy Web</title>
</svelte:head>

<div
  class="min-h-screen bg-[radial-gradient(circle_at_top,_var(--muted)_0%,_transparent_42%),linear-gradient(to_bottom,_var(--background),_color-mix(in_oklch,_var(--muted)_20%,_transparent))]"
>
  <div class="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-12">
    <div class="w-full px-2">
      <div class="mb-8 flex flex-col items-center gap-4 text-center">
        <div class="flex h-14 items-center justify-center">
          <Logo class="h-8 w-auto" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p class="text-sm text-muted-foreground">
            Ingresa tu correo electrónico y contraseña para continuar.
          </p>
        </div>
      </div>

      {#if formActionError}
        <Alert variant="destructive" class="mb-6">
          <AlertDescription>{formActionError}</AlertDescription>
        </Alert>
      {/if}

      <form method="POST" action="?/login" use:enhance class="space-y-2">
        <input type="hidden" name="offset" value={offset} />

        <Form.Field form={loginForm} name="email">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Correo electrónico</Form.Label>
              <Input
                {...props}
                type="email"
                placeholder="correo@ventysfy.com"
                autocomplete="email"
                bind:value={$formData.email}
                disabled={$submitting}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field form={loginForm} name="password">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Contraseña</Form.Label>
              <Input
                {...props}
                type="password"
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
                bind:value={$formData.password}
                disabled={$submitting}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Button type="submit" class="mt-2 w-full" disabled={$submitting}>
          {#if $submitting}
            Iniciando sesión...
          {:else}
            Ingresar
          {/if}
        </Button>
      </form>
    </div>
  </div>
</div>
