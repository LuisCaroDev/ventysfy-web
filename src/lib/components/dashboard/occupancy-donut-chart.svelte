<script lang="ts">
  import { PieChart } from 'layerchart';
  import * as Chart from '$lib/components/ui/chart';
  import { formatInteger, formatPercent } from '$lib/dashboard/format';
  import type { OccupancySlice } from '$lib/dashboard/types';

  let {
    data,
    ratePercent,
    enrolledStudents,
    maxCapacity,
  }: {
    data: OccupancySlice[];
    ratePercent: number;
    enrolledStudents: number;
    maxCapacity: number;
  } = $props();
</script>

{#if data.length}
  <div class="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr] lg:items-center">
    <div class="relative mx-auto h-60 w-full max-w-60">
      <Chart.Container
        config={{
          occupied: { label: 'Inscritos', color: 'var(--chart-1)' },
          available: { label: 'Disponibles', color: 'var(--chart-2)' },
        }}
        class="h-60 w-full aspect-auto"
      >
        <PieChart
          {data}
          key="tone"
          label="label"
          value="value"
          c="tone"
          cRange={['var(--chart-1)', 'var(--chart-2)']}
          innerRadius={70}
          cornerRadius={4}
        />
      </Chart.Container>

      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-3xl font-semibold tracking-tight">{formatPercent(ratePercent, 0)}</span>
        <span class="text-sm text-muted-foreground">ocupación</span>
      </div>
    </div>

    <div class="space-y-3">
      <div class="rounded-md border bg-muted/25 px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-muted-foreground">Inscritos</span>
          <span class="font-medium">{formatInteger(enrolledStudents)}</span>
        </div>
      </div>
      <div class="rounded-md border bg-muted/25 px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-muted-foreground">Disponibles</span>
          <span class="font-medium"
            >{formatInteger(Math.max(0, maxCapacity - enrolledStudents))}</span
          >
        </div>
      </div>
      <div class="rounded-md border bg-muted/25 px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-muted-foreground">Capacidad máxima</span>
          <span class="font-medium">{formatInteger(maxCapacity)}</span>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div
    class="flex h-60 items-center justify-center rounded-md border border-dashed bg-muted/25 text-sm text-muted-foreground"
  >
    Sin datos de ocupación
  </div>
{/if}
