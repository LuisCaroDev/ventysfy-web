<script lang="ts">
  import { BarChart } from 'layerchart';
  import * as Chart from '$lib/components/ui/chart';
  import { formatInteger, formatPercent } from '$lib/dashboard/format';
  import type { AttendanceBarPoint } from '$lib/dashboard/types';

  let {
    data,
    ratePercent,
    presented,
    absent,
  }: {
    data: AttendanceBarPoint[];
    ratePercent: number;
    presented: number;
    absent: number;
  } = $props();

  const chartConfig = {
    presented: {
      label: 'Asistieron',
      color: 'var(--chart-1)',
    },
    absent: {
      label: 'Ausencias',
      color: 'var(--chart-3)',
    },
  } satisfies Chart.ChartConfig;
</script>

{#if data.length}
  <div class="space-y-4">
    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-semibold tracking-tight">{formatPercent(ratePercent)}</span>
      <span class="text-sm text-muted-foreground">del total programado</span>
    </div>

    <Chart.Container config={chartConfig} class="h-64 w-full aspect-auto">
      <BarChart
        {data}
        x="label"
        y="value"
        c="tone"
        cRange={['var(--chart-1)', 'var(--chart-3)']}
        axis="x"
        grid
        rule={false}
      >
        {#snippet tooltip()}
          <Chart.Tooltip />
        {/snippet}
      </BarChart>
    </Chart.Container>

    <div class="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
      <div class="rounded-md border bg-muted/25 px-3 py-2">
        Asistieron: <span class="font-medium text-foreground">{formatInteger(presented)}</span>
      </div>
      <div class="rounded-md border bg-muted/25 px-3 py-2">
        Ausencias: <span class="font-medium text-foreground">{formatInteger(absent)}</span>
      </div>
    </div>
  </div>
{:else}
  <div
    class="flex h-64 items-center justify-center rounded-md border border-dashed bg-muted/25 text-sm text-muted-foreground"
  >
    Sin datos de asistencia
  </div>
{/if}
