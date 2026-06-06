<script lang="ts">
  import { BarChart } from 'layerchart';
  import * as Chart from '$lib/components/ui/chart';
  import { formatCurrency } from '$lib/dashboard/format';
  import type { DashboardCurrency, MonthlyRevenuePoint } from '$lib/dashboard/types';

  let {
    data,
    currency,
  }: {
    data: MonthlyRevenuePoint[];
    currency: DashboardCurrency;
  } = $props();

  const chartConfig = {
    current: {
      label: 'Mes actual',
      color: 'var(--chart-1)',
    },
    history: {
      label: 'Histórico',
      color: 'var(--chart-2)',
    },
  } satisfies Chart.ChartConfig;
</script>

{#if data.length}
  <Chart.Container config={chartConfig} class="h-72 w-full aspect-auto">
    <BarChart
      {data}
      x="monthLabel"
      y="amount"
      c="tone"
      cRange={['var(--chart-1)', 'var(--chart-2)']}
      axis="x"
      grid
      rule={false}
    >
      {#snippet tooltip()}
        <Chart.Tooltip />
      {/snippet}
    </BarChart>
  </Chart.Container>
{:else}
  <div
    class="flex h-72 items-center justify-center rounded-md border border-dashed bg-muted/25 text-sm text-muted-foreground"
  >
    Sin datos de ingresos por mes
  </div>
{/if}
