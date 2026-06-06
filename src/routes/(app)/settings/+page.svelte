<script lang="ts">
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import WalletIcon from '@lucide/svelte/icons/wallet';
  import BadgePercentIcon from '@lucide/svelte/icons/badge-percent';
  import TicketIcon from '@lucide/svelte/icons/ticket';
  import FileUpIcon from '@lucide/svelte/icons/file-up';
  import * as Item from '$lib/components/ui/item';
  import { settingsRoutes } from '$lib/settings/routes';

  const cards = [
    {
      href: settingsRoutes.business,
      title: 'Negocio',
      description: 'Datos comerciales visibles en ventas y ticket.',
      icon: Building2Icon,
    },
    {
      href: settingsRoutes.cashRegister,
      title: 'Caja',
      description: 'Arqueo, validación de conteo y comportamiento de cierre.',
      icon: WalletIcon,
    },
    {
      href: settingsRoutes.sales,
      title: 'Ventas',
      description: 'Propinas, descuentos y límites que se guardan para tus ventas.',
      icon: BadgePercentIcon,
    },
    {
      href: settingsRoutes.ticket,
      title: 'Ticket',
      description: 'Logo e información del negocio que aparece en el comprobante.',
      icon: TicketIcon,
    },
    {
      href: settingsRoutes.import,
      title: 'Importaciones',
      description: 'Clientes y productos con flujo guiado de archivo, mapeo y envío.',
      icon: FileUpIcon,
    },
  ] as const;
</script>

<section class="space-y-8">
  <div class="space-y-3">
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Settings</p>
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight">Configuración</h1>
      <p class="max-w-3xl text-sm leading-7 text-muted-foreground">
        Administra en web las configuraciones y flujos operativos disponibles para tu negocio. Las
        ediciones rápidas siguen usando drawers y los procesos extensos viven como páginas
        dedicadas.
      </p>
    </div>
  </div>

  <Item.Group class="gap-5">
    {#each cards as card}
      {@const Icon = card.icon}
      <Item.Root variant="muted">
        {#snippet child({ props })}
          <a href={card.href} {...props}>
            <Item.Media variant="icon">
              <Icon class="size-5" />
            </Item.Media>
            <Item.Content>
              <Item.Title>{card.title}</Item.Title>
              <Item.Description>{card.description}</Item.Description>
            </Item.Content>
            <Item.Actions class="ml-auto">
              <span class="sr-only">{card.title}</span>
              <ChevronRightIcon class="size-5 text-muted-foreground" />
            </Item.Actions>
          </a>
        {/snippet}
      </Item.Root>
    {/each}
  </Item.Group>
</section>
