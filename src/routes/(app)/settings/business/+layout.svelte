<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import IdCardIcon from '@lucide/svelte/icons/id-card';
  import PhoneIcon from '@lucide/svelte/icons/phone';
  import StoreIcon from '@lucide/svelte/icons/store';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Item from '$lib/components/ui/item';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import BusinessContactSettingsForm from '$lib/components/settings/BusinessContactSettingsForm.svelte';
  import BusinessGeneralSettingsForm from '$lib/components/settings/BusinessGeneralSettingsForm.svelte';
  import SettingsDrawer from '$lib/components/settings/SettingsDrawer.svelte';
  import SettingsSectionShell from '$lib/components/settings/SettingsSectionShell.svelte';
  import { getFullPhone } from '$lib/settings/phone';
  import {
    businessContactSettingsSchema,
    businessGeneralSettingsSchema,
  } from '$lib/settings/schema';
  import { settingsRoutes } from '$lib/settings/routes';
  import { settingsKeys, settingsUserQueryOptions } from '$lib/settings/query';
  import { updateBusinessContact, updateBusinessGeneral } from '$lib/settings/client';
  import { defaults } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const queryClient = useQueryClient();
  const storageUrl = $derived((page.data.storageUrl as string | null | undefined) ?? null);
  const pathname = $derived(page.url.pathname);
  const isGeneralDrawerOpen = $derived(pathname === settingsRoutes.businessGeneralEdit);
  const isContactDrawerOpen = $derived(pathname === settingsRoutes.businessContactEdit);

  const userQuery = createQuery(() => settingsUserQueryOptions(storageUrl));

  const companyPhone = $derived(
    userQuery.data
      ? getFullPhone(userQuery.data.company.cellphone) || 'Sin celular'
      : 'Sin celular',
  );

  const generalForm = $derived(
    userQuery.data
      ? defaults(
          {
            tradeName: userQuery.data.company.tradeName,
          },
          zod4Client(businessGeneralSettingsSchema),
        )
      : null,
  );

  const contactForm = $derived(
    userQuery.data
      ? defaults(
          {
            cellphone: getFullPhone(userQuery.data.company.cellphone),
          },
          zod4Client(businessContactSettingsSchema),
        )
      : null,
  );

  const generalMutation = createMutation(() => ({
    mutationFn: updateBusinessGeneral,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
      await goto(settingsRoutes.business, { replaceState: true, noScroll: true, keepFocus: true });
    },
  }));

  const contactMutation = createMutation(() => ({
    mutationFn: updateBusinessContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
      await goto(settingsRoutes.business, { replaceState: true, noScroll: true, keepFocus: true });
    },
  }));

  function closeDrawer() {
    void goto(settingsRoutes.business, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function getMutationError(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }
</script>

<SettingsSectionShell
  eyebrow="Negocio"
  title="Información comercial"
  description="Gestiona los datos de negocio que hoy puedes actualizar desde Ventysfy Web."
>
  {#if userQuery.isPending}
    <div class="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
      Cargando información del negocio...
    </div>
  {:else if userQuery.isError}
    <Alert variant="destructive">
      <AlertDescription
        >{getMutationError(userQuery.error, 'No fue posible cargar el negocio.')}</AlertDescription
      >
    </Alert>
  {:else if userQuery.data}
    <div class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Información general</Card.Title>
          <Card.Description>
            Revisa cómo se identifica el negocio dentro de la cuenta y en superficies visibles.
          </Card.Description>
          <Card.Action>
            <Button.Root href={settingsRoutes.businessGeneralEdit} variant="outline" size="sm">
              Editar
            </Button.Root>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <StoreIcon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Nombre comercial</Item.Title>
                <Item.Description>Nombre principal visible en la operación diaria.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {userQuery.data.company.tradeName}
              </Item.Actions>
            </Item.Root>

            <Item.Separator />

            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <Building2Icon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Razón social</Item.Title>
                <Item.Description>Nombre legal registrado de la empresa.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {userQuery.data.company.companyName}
              </Item.Actions>
            </Item.Root>

            <Item.Separator />

            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <IdCardIcon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Documento</Item.Title>
                <Item.Description>Identificación fiscal asociada a la cuenta.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {userQuery.data.company.docTypeDescription}
                {userQuery.data.company.docNumber}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Contacto</Card.Title>
          <Card.Description>
            Datos de contacto visibles en la cuenta y reutilizados por otras secciones.
          </Card.Description>
          <Card.Action>
            <Button.Root href={settingsRoutes.businessContactEdit} variant="outline" size="sm">
              Editar
            </Button.Root>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <PhoneIcon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Celular</Item.Title>
                <Item.Description>Se guarda en formato internacional.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {companyPhone}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Datos fiscales y operativos</Card.Title>
          <Card.Description>
            Referencia visible del contrato actual de la empresa en esta cuenta.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <Building2Icon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Tipo de empresa</Item.Title>
                <Item.Description>Clasificación registrada para la compañía.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {userQuery.data.company.companyType.name}
              </Item.Actions>
            </Item.Root>

            <Item.Separator />

            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <GlobeIcon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>País</Item.Title>
                <Item.Description>Mercado principal configurado para la empresa.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {userQuery.data.company.country.value}
              </Item.Actions>
            </Item.Root>

            <Item.Separator />

            <Item.Root class="px-0">
              <Item.Media variant="icon">
                <StoreIcon class="size-5" />
              </Item.Media>
              <Item.Content>
                <Item.Title>Moneda</Item.Title>
                <Item.Description>Moneda operativa asociada a la cuenta.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {userQuery.data.company.currency.code}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}

  {#if isGeneralDrawerOpen}
    <SettingsDrawer
      title="Editar información general"
      description="Actualiza el nombre comercial que se usa en la operación y en la experiencia web."
      backHref={settingsRoutes.business}
      onClose={closeDrawer}
    >
      {#snippet children()}
        {#if generalForm}
          <BusinessGeneralSettingsForm
            form={generalForm}
            submitError={generalMutation.isError
              ? getMutationError(generalMutation.error, 'No fue posible actualizar el negocio.')
              : null}
            submitting={generalMutation.isPending}
            onSubmit={async (values) => {
              generalMutation.reset();
              await generalMutation.mutateAsync(values);
            }}
          />
        {/if}
      {/snippet}
    </SettingsDrawer>
  {/if}

  {#if isContactDrawerOpen}
    <SettingsDrawer
      title="Editar contacto"
      description="Actualiza el celular visible en negocio y en otras superficies conectadas."
      backHref={settingsRoutes.business}
      onClose={closeDrawer}
    >
      {#snippet children()}
        {#if contactForm}
          <BusinessContactSettingsForm
            form={contactForm}
            submitError={contactMutation.isError
              ? getMutationError(
                  contactMutation.error,
                  'No fue posible actualizar la información comercial.',
                )
              : null}
            submitting={contactMutation.isPending}
            onSubmit={async (values) => {
              contactMutation.reset();
              await contactMutation.mutateAsync(values);
            }}
          />
        {/if}
      {/snippet}
    </SettingsDrawer>
  {/if}

  {@render children()}
</SettingsSectionShell>
