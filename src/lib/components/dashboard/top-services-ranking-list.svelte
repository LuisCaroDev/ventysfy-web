<script lang="ts">
  import { formatCurrency } from '$lib/dashboard/format';
  import type { DashboardCurrency, TopServicePoint } from '$lib/dashboard/types';

  let {
    services,
    currency,
  }: {
    services: TopServicePoint[];
    currency: DashboardCurrency;
  } = $props();
</script>

{#if services.length}
  <div class="space-y-4">
    {#each services as service, index (service.serviceId)}
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/35"
          >
            {#if service.imageUrl}
              <img
                src={service.imageUrl}
                alt={service.serviceName}
                class="h-full w-full object-cover"
              />
            {:else}
              <span class="text-xs font-medium text-muted-foreground">#{index + 1}</span>
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-3">
              <p class="truncate font-medium">{service.serviceName}</p>
              <p class="text-sm font-medium text-foreground">
                {formatCurrency(service.revenue, currency)}
              </p>
            </div>

            <div class="mt-2 h-2 overflow-hidden rounded-full bg-muted/45">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-300"
                style={`width: ${Math.max(0, Math.min(100, service.fraction * 100))}%`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div
    class="flex h-40 items-center justify-center rounded-md border border-dashed bg-muted/25 text-sm text-muted-foreground"
  >
    Sin ranking disponible todavía
  </div>
{/if}
