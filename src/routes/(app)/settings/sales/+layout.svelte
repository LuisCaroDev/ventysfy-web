<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Item from '$lib/components/ui/item';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import SalesDiscountSettingsForm from '$lib/components/settings/SalesDiscountSettingsForm.svelte';
  import SalesTipSettingsForm from '$lib/components/settings/SalesTipSettingsForm.svelte';
  import SettingsDrawer from '$lib/components/settings/SettingsDrawer.svelte';
  import SettingsSectionShell from '$lib/components/settings/SettingsSectionShell.svelte';
  import { salesDiscountSettingsSchema, salesTipSettingsSchema } from '$lib/settings/schema';
  import { settingsRoutes } from '$lib/settings/routes';
  import { companyConfigQueryOptions, settingsKeys } from '$lib/settings/query';
  import { updateSalesDiscount, updateSalesTip } from '$lib/settings/client';
  import { defaults } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const queryClient = useQueryClient();
  const pathname = $derived(page.url.pathname);
  const isTipDrawerOpen = $derived(pathname === settingsRoutes.salesTipEdit);
  const isDiscountDrawerOpen = $derived(pathname === settingsRoutes.salesDiscountEdit);
  const companyConfigQuery = createQuery(() => companyConfigQueryOptions());

  const sale = $derived(companyConfigQuery.data?.sale ?? null);

  const tipForm = $derived(
    sale
      ? defaults(
          {
            tipEnabled: sale.tip.enabled,
            tipRate: Number((sale.tip.rate * 100).toFixed(2)),
            tipMaxRate: Number((sale.tip.maxRate * 100).toFixed(2)),
          },
          zod4Client(salesTipSettingsSchema),
        )
      : null,
  );

  const discountForm = $derived(
    sale
      ? defaults(
          {
            discountEnabled: sale.discount.enabled,
            discountEnabledMaxRate: sale.discount.enabledMaxRate,
            discountMaxRate: Number((sale.discount.maxRate * 100).toFixed(2)),
          },
          zod4Client(salesDiscountSettingsSchema),
        )
      : null,
  );

  const tipMutation = createMutation(() => ({
    mutationFn: updateSalesTip,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.companyConfig() });
      await goto(settingsRoutes.sales, { replaceState: true, noScroll: true, keepFocus: true });
    },
  }));

  const discountMutation = createMutation(() => ({
    mutationFn: updateSalesDiscount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.companyConfig() });
      await goto(settingsRoutes.sales, { replaceState: true, noScroll: true, keepFocus: true });
    },
  }));

  function formatPercent(value: number) {
    return `${(value * 100).toFixed(2).replace(/\.00$/, '')}%`;
  }

  function getStateLabel(value: boolean) {
    return value ? 'Activo' : 'Inactivo';
  }

  function closeDrawer() {
    void goto(settingsRoutes.sales, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }
</script>

<SettingsSectionShell
  eyebrow="Ventas"
  title="Reglas de venta"
  description="Propinas y descuentos que se aplican en la configuración de ventas."
>
  {#if companyConfigQuery.isPending}
    <div class="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
      Cargando reglas de venta...
    </div>
  {:else if companyConfigQuery.isError}
    <Alert variant="destructive">
      <AlertDescription
        >{getErrorMessage(
          companyConfigQuery.error,
          'No fue posible cargar ventas.',
        )}</AlertDescription
      >
    </Alert>
  {:else if sale}
    <div class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Propina</Card.Title>
          <Card.Description>
            Revisa la sugerencia por defecto y el tope permitido para nuevas ventas.
          </Card.Description>
          <Card.Action>
            <Button.Root href={settingsRoutes.salesTipEdit} variant="outline" size="sm">
              Editar
            </Button.Root>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          <Item.Group class="gap-0">
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Estado</Item.Title>
                <Item.Description>Define si la propina sugerida está disponible.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {getStateLabel(sale.tip.enabled)}
              </Item.Actions>
            </Item.Root>
            <Item.Separator />
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Propina sugerida</Item.Title>
                <Item.Description
                  >Porcentaje sugerido por defecto en nuevas ventas.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {formatPercent(sale.tip.rate)}
              </Item.Actions>
            </Item.Root>
            <Item.Separator />
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Tope</Item.Title>
                <Item.Description>Porcentaje máximo permitido para la propina.</Item.Description>
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {formatPercent(sale.tip.maxRate)}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Descuentos</Card.Title>
          <Card.Description>
            Revisa si los descuentos manuales están habilitados y si existe un límite máximo.
          </Card.Description>
          <Card.Action>
            <Button.Root href={settingsRoutes.salesDiscountEdit} variant="outline" size="sm">
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
                  >Define si el flujo de venta permite descuentos manuales.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {getStateLabel(sale.discount.enabled)}
              </Item.Actions>
            </Item.Root>
            <Item.Separator />
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Límite máximo</Item.Title>
                <Item.Description>Controla si el descuento usa un tope porcentual.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {sale.discount.enabledMaxRate ? 'Activo' : 'Inactivo'}
              </Item.Actions>
            </Item.Root>
            <Item.Separator />
            <Item.Root class="px-0">
              <Item.Content>
                <Item.Title>Tope</Item.Title>
                <Item.Description
                  >Porcentaje máximo permitido para descuentos manuales.</Item.Description
                >
              </Item.Content>
              <Item.Actions class="ml-auto self-start text-sm text-muted-foreground">
                {sale.discount.enabledMaxRate ? formatPercent(sale.discount.maxRate) : 'Sin tope'}
              </Item.Actions>
            </Item.Root>
          </Item.Group>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}

  {#if isTipDrawerOpen}
    <SettingsDrawer
      title="Editar propina"
      description="Actualiza la disponibilidad, sugerencia y tope de propina."
      backHref={settingsRoutes.sales}
      onClose={closeDrawer}
    >
      {#snippet children()}
        {#if tipForm}
          <SalesTipSettingsForm
            form={tipForm}
            submitError={tipMutation.isError
              ? getErrorMessage(tipMutation.error, 'No fue posible actualizar la propina.')
              : null}
            submitting={tipMutation.isPending}
            onSubmit={async (values) => {
              tipMutation.reset();
              await tipMutation.mutateAsync(values);
            }}
          />
        {/if}
      {/snippet}
    </SettingsDrawer>
  {/if}

  {#if isDiscountDrawerOpen}
    <SettingsDrawer
      title="Editar descuentos"
      description="Actualiza la disponibilidad y los límites de descuento manual."
      backHref={settingsRoutes.sales}
      onClose={closeDrawer}
    >
      {#snippet children()}
        {#if discountForm}
          <SalesDiscountSettingsForm
            form={discountForm}
            submitError={discountMutation.isError
              ? getErrorMessage(discountMutation.error, 'No fue posible actualizar los descuentos.')
              : null}
            submitting={discountMutation.isPending}
            onSubmit={async (values) => {
              discountMutation.reset();
              await discountMutation.mutateAsync(values);
            }}
          />
        {/if}
      {/snippet}
    </SettingsDrawer>
  {/if}

  {@render children()}
</SettingsSectionShell>
