<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import StoreIcon from '@lucide/svelte/icons/store';
  import WalletCardsIcon from '@lucide/svelte/icons/wallet-cards';
  import CashRegisterSettingsForm from '$lib/components/settings/CashRegisterSettingsForm.svelte';
  import CreateCashRegisterForm from '$lib/components/settings/CreateCashRegisterForm.svelte';
  import EditCashRegisterForm from '$lib/components/settings/EditCashRegisterForm.svelte';
  import SettingsDrawer from '$lib/components/settings/SettingsDrawer.svelte';
  import SettingsSectionShell from '$lib/components/settings/SettingsSectionShell.svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Item from '$lib/components/ui/item';
  import {
    cashRegisterSettingsSchema,
    createCashRegisterSchema,
    updateCashRegisterSchema,
  } from '$lib/settings/schema';
  import { getCashRegisterDetailRoute, settingsRoutes } from '$lib/settings/routes';
  import {
    createCashRegister,
    updateCashRegister,
    updateCashRegisterConfig,
  } from '$lib/settings/client';
  import {
    cashRegistersQueryOptions,
    settingsKeys,
    settingsUserQueryOptions,
  } from '$lib/settings/query';
  import { defaults } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const queryClient = useQueryClient();
  const storageUrl = $derived((page.data.storageUrl as string | null | undefined) ?? null);
  const pathname = $derived(page.url.pathname);
  const userQuery = createQuery(() => settingsUserQueryOptions(storageUrl));
  const cashRegistersQuery = createQuery(() => cashRegistersQueryOptions());

  const isConfigDrawerOpen = $derived(pathname === settingsRoutes.cashRegisterEdit);
  const isCreateDrawerOpen = $derived(pathname === settingsRoutes.cashRegisterCreate);
  const cashRegisterDetailId = $derived.by(() => {
    if (!pathname.startsWith(`${settingsRoutes.cashRegister}/`)) return null;
    if (
      pathname === settingsRoutes.cashRegisterEdit ||
      pathname === settingsRoutes.cashRegisterCreate
    ) {
      return null;
    }

    return decodeURIComponent(pathname.slice(`${settingsRoutes.cashRegister}/`.length));
  });

  const selectedCashRegister = $derived(
    cashRegisterDetailId
      ? (cashRegistersQuery.data?.find((item) => item.id === cashRegisterDetailId) ?? null)
      : null,
  );

  const configForm = $derived(
    userQuery.data
      ? defaults(
          {
            enableCashCount: userQuery.data.company.enableCashCount,
            validateCashCount: userQuery.data.company.validateCashCount,
          },
          zod4Client(cashRegisterSettingsSchema),
        )
      : null,
  );

  const createForm = $derived(defaults({ name: '' }, zod4Client(createCashRegisterSchema)));

  const editForm = $derived(
    selectedCashRegister
      ? defaults(
          {
            name: selectedCashRegister.name,
            status: (selectedCashRegister.status === 'disabled' ? 'disabled' : 'enabled') as
              | 'enabled'
              | 'disabled',
          },
          zod4Client(updateCashRegisterSchema),
        )
      : null,
  );

  const configMutation = createMutation(() => ({
    mutationFn: updateCashRegisterConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
      await goto(settingsRoutes.cashRegister, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
    },
  }));

  const createMutationState = createMutation(() => ({
    mutationFn: createCashRegister,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.cashRegisters() });
      await goto(settingsRoutes.cashRegister, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
    },
  }));

  const editMutation = createMutation(() => ({
    mutationFn: ({
      cashRegisterId,
      values,
    }: {
      cashRegisterId: string;
      values: { name: string; status: 'enabled' | 'disabled' };
    }) => updateCashRegister(cashRegisterId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.cashRegisters() });
      await goto(settingsRoutes.cashRegister, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
    },
  }));

  let isRefreshingCashRegisters = $state(false);

  function getStateLabel(value: boolean) {
    return value ? 'Activo' : 'Inactivo';
  }

  function getOperationalStatusLabel(status: string) {
    const normalizedStatus = status.trim().toLowerCase();
    return normalizedStatus === 'active' || normalizedStatus === 'enabled'
      ? 'Operativa'
      : 'Suspendida';
  }

  async function retryCashRegisters() {
    isRefreshingCashRegisters = true;

    try {
      await cashRegistersQuery.refetch();
    } finally {
      isRefreshingCashRegisters = false;
    }
  }

  function isPlainLeftClick(event: MouseEvent) {
    return (
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    );
  }

  function openDrawer(event: MouseEvent, url: string) {
    if (!isPlainLeftClick(event)) return;
    event.preventDefault();
    void goto(url, { noScroll: true, keepFocus: true });
  }

  function closeDrawer() {
    void goto(settingsRoutes.cashRegister, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }
</script>

<SettingsSectionShell
  eyebrow="Caja"
  title="Configuración de caja"
  description="Define cómo se comporta el arqueo de efectivo al abrir y cerrar sesiones."
>
  <div class="space-y-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Configuraciones</Card.Title>
        <Card.Description>
          Revisa qué reglas están activas y ajusta el flujo desde el drawer actual.
        </Card.Description>
        <Card.Action>
          <Button.Root
            href={settingsRoutes.cashRegisterEdit}
            variant="outline"
            size="sm"
            onclick={(event) => openDrawer(event, settingsRoutes.cashRegisterEdit)}
          >
            Editar
          </Button.Root>
        </Card.Action>
      </Card.Header>
      <Card.Content>
        {#if userQuery.isPending}
          <div class="text-sm text-muted-foreground">Cargando configuración de caja...</div>
        {:else if userQuery.isError}
          <Alert variant="destructive">
            <AlertDescription
              >{getErrorMessage(
                userQuery.error,
                'No fue posible cargar la configuración de caja.',
              )}</AlertDescription
            >
          </Alert>
        {:else if userQuery.data}
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Arqueo de caja</Item.Title>
                <Item.Description
                  >Controla si se solicita conteo en sesiones de caja.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {getStateLabel(userQuery.data.company.enableCashCount)}
              </Item.Actions>
            </Item.Root>

            <Item.Separator />

            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Arqueo al cierre</Item.Title>
                <Item.Description>Controla si el cierre exige confirmar el conteo.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {getStateLabel(userQuery.data.company.validateCashCount)}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Gestión de cajas</Card.Title>
        <Card.Description>
          Lista las cajas registradas y muestra su estado operativo actual.
        </Card.Description>
        <Card.Action>
          <Button.Root
            href={settingsRoutes.cashRegisterCreate}
            variant="outline"
            size="sm"
            onclick={(event) => openDrawer(event, settingsRoutes.cashRegisterCreate)}
          >
            <PlusIcon class="size-4" />
            Crear caja
          </Button.Root>
        </Card.Action>
      </Card.Header>
      <Card.Content>
        {#if cashRegistersQuery.isPending}
          <div class="text-sm text-muted-foreground">Cargando cajas...</div>
        {:else if cashRegistersQuery.isError}
          <div
            class="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border p-5"
          >
            <div class="flex items-start gap-3">
              <div class="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertCircleIcon class="size-5" />
              </div>
              <div class="space-y-1">
                <h3 class="text-sm font-medium">No fue posible cargar las cajas</h3>
                <p class="text-sm text-muted-foreground">
                  {getErrorMessage(
                    cashRegistersQuery.error,
                    'No fue posible cargar la gestión de cajas.',
                  )}
                </p>
              </div>
            </div>

            <Button.Root
              variant="outline"
              size="sm"
              onclick={retryCashRegisters}
              disabled={isRefreshingCashRegisters}
            >
              {#if isRefreshingCashRegisters}
                <LoaderCircleIcon class="size-4 animate-spin" />
                Recargando...
              {:else}
                <RefreshCwIcon class="size-4" />
                Reintentar
              {/if}
            </Button.Root>
          </div>
        {:else if !cashRegistersQuery.data || cashRegistersQuery.data.length === 0}
          <div
            class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-5"
          >
            <div class="rounded-full bg-muted p-2 text-muted-foreground">
              <StoreIcon class="size-5" />
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-medium">No hay cajas creadas todavía</h3>
              <p class="text-sm text-muted-foreground">
                Cuando existan cajas registradas, aparecerán aquí con su estado operativo.
              </p>
            </div>
          </div>
        {:else}
          <Item.Group>
            {#each cashRegistersQuery.data as cashRegister (cashRegister.id)}
              <Item.Root variant="muted">
                {#snippet child({ props })}
                  <a
                    href={getCashRegisterDetailRoute(cashRegister.id)}
                    onclick={(event) =>
                      openDrawer(event, getCashRegisterDetailRoute(cashRegister.id))}
                    {...props}
                  >
                    <Item.Media variant="icon">
                      <WalletCardsIcon class="size-5" />
                    </Item.Media>
                    <Item.Content>
                      <Item.Title>{cashRegister.name}</Item.Title>
                      <Item.Description>
                        {#if cashRegister.inUse === true}
                          Caja en uso actualmente.
                        {:else if cashRegister.inUse === false}
                          Caja disponible sin sesión activa.
                        {:else}
                          Estado de uso no informado.
                        {/if}
                      </Item.Description>
                    </Item.Content>
                    <Item.Actions class="ml-auto flex flex-col items-end gap-2 self-start">
                      <span class="text-sm text-muted-foreground">
                        {getOperationalStatusLabel(cashRegister.status)}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {#if cashRegister.inUse === true}
                          En uso
                        {:else if cashRegister.inUse === false}
                          Disponible
                        {:else}
                          <CircleHelpIcon class="mr-1 inline size-3" />
                          Sin dato
                        {/if}
                      </span>
                    </Item.Actions>
                    <ChevronRightIcon class="ml-3 size-4 shrink-0 text-muted-foreground" />
                  </a>
                {/snippet}
              </Item.Root>
            {/each}
          </Item.Group>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  {#if isConfigDrawerOpen}
    <SettingsDrawer
      title="Editar configuración de caja"
      description="Estos cambios se guardan en el mismo contrato de usuario/empresa que consume la app actual."
      backHref={settingsRoutes.cashRegister}
      onClose={closeDrawer}
    >
      {#snippet children()}
        {#if configForm}
          <CashRegisterSettingsForm
            form={configForm}
            submitError={configMutation.isError
              ? getErrorMessage(configMutation.error, 'No fue posible actualizar la caja.')
              : null}
            submitting={configMutation.isPending}
            onSubmit={async (values) => {
              configMutation.reset();
              await configMutation.mutateAsync(values);
            }}
          />
        {/if}
      {/snippet}
    </SettingsDrawer>
  {/if}

  {#if isCreateDrawerOpen}
    <SettingsDrawer
      title="Crear caja"
      description="Crea una nueva caja para que esté disponible dentro de la gestión del negocio."
      backHref={settingsRoutes.cashRegister}
      onClose={closeDrawer}
    >
      {#snippet children()}
        <CreateCashRegisterForm
          form={createForm}
          submitError={createMutationState.isError
            ? getErrorMessage(createMutationState.error, 'No fue posible crear la caja.')
            : null}
          submitting={createMutationState.isPending}
          onSubmit={async (values) => {
            createMutationState.reset();
            await createMutationState.mutateAsync(values);
          }}
        />
      {/snippet}
    </SettingsDrawer>
  {/if}

  {#if cashRegisterDetailId}
    <SettingsDrawer
      title="Editar caja"
      description="Actualiza el nombre de la caja y controla si queda habilitada para uso."
      backHref={settingsRoutes.cashRegister}
      onClose={closeDrawer}
    >
      {#snippet children()}
        {#if selectedCashRegister && editForm}
          <EditCashRegisterForm
            form={editForm}
            submitError={editMutation.isError
              ? getErrorMessage(editMutation.error, 'No fue posible actualizar la caja.')
              : null}
            submitting={editMutation.isPending}
            onSubmit={async (values) => {
              editMutation.reset();
              await editMutation.mutateAsync({
                cashRegisterId: selectedCashRegister.id,
                values,
              });
            }}
          />
        {:else if cashRegistersQuery.isPending}
          <div class="text-sm text-muted-foreground">Cargando caja...</div>
        {:else}
          <Alert variant="destructive">
            <AlertDescription>Caja no encontrada.</AlertDescription>
          </Alert>
        {/if}
      {/snippet}
    </SettingsDrawer>
  {/if}

  {@render children()}
</SettingsSectionShell>
