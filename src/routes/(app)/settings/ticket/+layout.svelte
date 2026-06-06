<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import ImageUpIcon from '@lucide/svelte/icons/image-up';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Item from '$lib/components/ui/item';
  import LogoUploadForm from '$lib/components/settings/LogoUploadForm.svelte';
  import SettingsDrawer from '$lib/components/settings/SettingsDrawer.svelte';
  import SettingsSectionShell from '$lib/components/settings/SettingsSectionShell.svelte';
  import { settingsRoutes } from '$lib/settings/routes';
  import { settingsKeys, settingsUserQueryOptions } from '$lib/settings/query';
  import { uploadCompanyLogo } from '$lib/settings/client';
  import { queryClient } from '$lib/query-client';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const storageUrl = $derived((page.data.storageUrl as string | null | undefined) ?? null);
  const pathname = $derived(page.url.pathname);
  const isLogoDrawerOpen = $derived(pathname === settingsRoutes.ticketLogo);
  const userQuery = createQuery(() => settingsUserQueryOptions(storageUrl));
  const logoMutation = createMutation(() => ({
    mutationFn: uploadCompanyLogo,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
      await goto(settingsRoutes.ticket, { replaceState: true, noScroll: true, keepFocus: true });
    },
  }));

  let logoValidationError = $state<string | null>(null);

  const logoConfigured = $derived(!!userQuery.data?.company.logoPath);

  function closeDrawer() {
    void goto(settingsRoutes.ticket, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  async function submitLogo(formData: FormData) {
    logoMutation.reset();
    logoValidationError = null;
    const file = formData.get('logo');

    if (!(file instanceof File)) {
      logoValidationError = 'Selecciona una imagen válida.';
      return;
    }

    if (!file.type.startsWith('image/')) {
      logoValidationError = 'El archivo debe ser una imagen.';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      logoValidationError = 'El logo debe pesar menos de 5 MB.';
      return;
    }

    await logoMutation.mutateAsync(file);
  }
</script>

<SettingsSectionShell
  eyebrow="Ticket"
  title="Comprobante y branding"
  description="Solo se muestran ajustes que hoy puedes cambiar desde web y que afectan al comprobante."
>
  {#if userQuery.isPending}
    <div class="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
      Cargando configuración del ticket...
    </div>
  {:else if userQuery.isError}
    <Alert variant="destructive">
      <AlertDescription>
        {getErrorMessage(userQuery.error, 'No fue posible cargar el ticket.')}
      </AlertDescription>
    </Alert>
  {:else if userQuery.data}
    <div class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Logo</Card.Title>
          <Card.Description>
            Cambia la imagen que se usa en el comprobante cuando la empresa tiene un logo cargado.
          </Card.Description>
          <Card.Action>
            <Button.Root href={settingsRoutes.ticketLogo} variant="outline" size="sm">
              Editar
            </Button.Root>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Estado</Item.Title>
                <Item.Description
                  >Indica si la empresa ya tiene un logo disponible para el ticket.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {logoConfigured ? 'Logo cargado' : 'Sin logo'}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Información del negocio</Card.Title>
          <Card.Description>
            Actualiza los datos comerciales de la empresa que también se reflejan en el comprobante.
          </Card.Description>
          <Card.Action>
            <Button.Root href={settingsRoutes.business} variant="outline" size="sm">
              Revisar
            </Button.Root>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <Building2Icon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>{userQuery.data.company.tradeName}</Item.Title>
                <Item.Description>
                  Nombre comercial y datos de contacto usados como base del comprobante.
                </Item.Description>
              </Item.Content>
            </Item.Root>
            <Item.Separator />
            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <ImageUpIcon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Qué puedes cambiar desde web</Item.Title>
                <Item.Description>
                  Logo de la empresa e información general del negocio que se guardan aquí.
                </Item.Description>
              </Item.Content>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}

  {#if isLogoDrawerOpen}
    <SettingsDrawer
      title="Actualizar logo del ticket"
      description="Sube un nuevo logo para el comprobante usando el endpoint actual de compañía."
      backHref={settingsRoutes.ticket}
      onClose={closeDrawer}
    >
      {#snippet children()}
        <LogoUploadForm
          currentLogoPath={userQuery.data?.company.logoPath}
          submitError={logoValidationError ??
            (logoMutation.isError
              ? getErrorMessage(logoMutation.error, 'No fue posible subir el logo.')
              : null)}
          submitting={logoMutation.isPending}
          onSubmit={submitLogo}
        />
      {/snippet}
    </SettingsDrawer>
  {/if}

  {@render children()}
</SettingsSectionShell>
