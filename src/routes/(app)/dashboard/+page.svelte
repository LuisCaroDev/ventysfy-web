<script lang="ts">
  import ChartNoAxesCombinedIcon from '@lucide/svelte/icons/chart-no-axes-combined';
  import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import UsersRoundIcon from '@lucide/svelte/icons/users-round';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import AnalyticsKpiCard from '$lib/components/dashboard/analytics-kpi-card.svelte';
  import AnalyticsChartCard from '$lib/components/dashboard/analytics-chart-card.svelte';
  import EnrollmentSparkline from '$lib/components/dashboard/enrollment-sparkline.svelte';
  import AttendanceBarChart from '$lib/components/dashboard/attendance-bar-chart.svelte';
  import OccupancyDonutChart from '$lib/components/dashboard/occupancy-donut-chart.svelte';
  import RevenueBarChart from '$lib/components/dashboard/revenue-bar-chart.svelte';
  import TopServicesRankingList from '$lib/components/dashboard/top-services-ranking-list.svelte';
  import { formatCurrency, formatInteger, formatPercent } from '$lib/dashboard/format';
  import * as Card from '$lib/components/ui/card';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const analytics = $derived(data.analytics);
  const analyticsError = $derived(data.analyticsError);
</script>

<svelte:head>
  <title>Dashboard | Ventysfy Web</title>
</svelte:head>

<section
  class="min-h-full bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--primary)_16%,transparent),transparent_38%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--muted)_36%,var(--background)))]"
>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
    <div class="space-y-2">
      <div
        class="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground"
      >
        <ChartNoAxesCombinedIcon class="size-4" />
        Analítica de servicios
      </div>
      <div class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p class="max-w-3xl text-sm text-muted-foreground">
            Resumen operativo para seguir matrículas, asistencia, ocupación e ingresos con el mismo
            contrato que ya consume mobile.
          </p>
        </div>

        {#if analytics}
          <div
            class="rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
          >
            {analytics.periodLabel}
          </div>
        {/if}
      </div>
    </div>

    {#if analytics}
      <div class="grid gap-4 xl:grid-cols-3">
        <AnalyticsKpiCard
          title="Nuevas matrículas"
          value={formatInteger(analytics.newEnrollmentsCount)}
          subtitle="Evolución reciente del período"
          icon={UsersRoundIcon}
        >
          <EnrollmentSparkline data={analytics.enrollmentSparkline} />
        </AnalyticsKpiCard>

        <AnalyticsKpiCard
          title="Ticket promedio"
          value={formatCurrency(analytics.averageTicket, analytics.currency)}
          subtitle={`${formatInteger(analytics.activeStudents)} alumnos activos`}
          icon={ReceiptTextIcon}
        />

        <AnalyticsKpiCard
          title="Ingresos del mes"
          value={formatCurrency(analytics.revenueCurrentMonth, analytics.currency)}
          subtitle={`Mes anterior: ${formatCurrency(analytics.revenuePreviousMonth, analytics.currency)}`}
          badge={analytics.revenueVariationPercent === null
            ? 'Sin base comparativa'
            : `${analytics.revenueIsGrowing ? '+' : ''}${formatPercent(analytics.revenueVariationPercent)}`}
          icon={TrendingUpIcon}
        />
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsChartCard
          title="Tasa de asistencia"
          description="Comparación entre sesiones asistidas y ausencias registradas del período actual."
        >
          <AttendanceBarChart
            data={analytics.attendanceBars}
            ratePercent={analytics.attendanceRatePercent}
            presented={analytics.attendancePresented}
            absent={Math.max(0, analytics.attendanceTotalScheduled - analytics.attendancePresented)}
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Tasa de ocupación"
          description="Relación entre inscritos activos y capacidad máxima agregada de los turnos."
        >
          <OccupancyDonutChart
            data={analytics.occupancySlices}
            ratePercent={analytics.occupancyRatePercent}
            enrolledStudents={analytics.occupancyEnrolledStudents}
            maxCapacity={analytics.occupancyMaxCapacity}
          />
        </AnalyticsChartCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsChartCard
          title="Ingresos por mes"
          description="Serie con los datos de los últimos meses disponibles; el mes actual queda resaltado."
        >
          <RevenueBarChart data={analytics.revenueByMonth} currency={analytics.currency} />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Top servicios"
          description="Ranking por ingreso acumulado. Si este bloque aún no está disponible, la tarjeta se mantiene vacía."
        >
          <TopServicesRankingList
            services={analytics.topServicesByRevenue}
            currency={analytics.currency}
          />
        </AnalyticsChartCard>
      </div>
    {:else}
      <Card.Root class="rounded-lg border bg-card/95 shadow-sm">
        <Card.Content
          class="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center"
        >
          <div class="rounded-md border bg-muted/35 p-3 text-muted-foreground">
            <CircleAlertIcon class="size-5" />
          </div>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">No se pudo cargar la analítica</h2>
            <p class="max-w-xl text-sm text-muted-foreground">
              {analyticsError ?? 'No fue posible recuperar la información del dashboard.'}
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</section>
