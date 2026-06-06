<script lang="ts">
  import { LineChart } from 'layerchart';
  import * as Chart from '$lib/components/ui/chart';
  import type { EnrollmentSparklinePoint } from '$lib/dashboard/types';

  let { data }: { data: EnrollmentSparklinePoint[] } = $props();

  const chartConfig = {
    value: {
      label: 'Matrículas',
      color: 'var(--chart-1)',
    },
  } satisfies Chart.ChartConfig;
</script>

{#if data.length}
  <Chart.Container config={chartConfig} class="h-14 w-full aspect-auto">
    <LineChart
      {data}
      x="index"
      y="value"
      series={[
        {
          key: 'value',
          color: 'var(--chart-1)',
        },
      ]}
      axis={false}
      grid={false}
      points={false}
    />
  </Chart.Container>
{:else}
  <div
    class="flex h-14 items-center justify-center rounded-md border border-dashed bg-muted/25 text-sm text-muted-foreground"
  >
    Sin datos recientes
  </div>
{/if}
