<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { cn } from '$lib/utils';

  type Step = 1 | 2 | 3 | 4;

  let {
    currentStep,
    stepLabels,
  }: {
    currentStep: Step;
    stepLabels: Array<{ id: Step; title: string }>;
  } = $props();
</script>

<div class="grid gap-3 md:grid-cols-4">
  {#each stepLabels as step}
    {@const isDone = step.id < currentStep}
    {@const isActive = step.id === currentStep}
    <div
      class={cn(
        'rounded-2xl border p-4 transition-colors',
        isActive
          ? 'border-primary bg-primary/5'
          : isDone
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
            : 'border-border bg-card',
      )}
    >
      <div class="mb-3 flex items-center gap-3">
        <div
          class={cn(
            'flex size-8 items-center justify-center rounded-full border text-sm font-semibold',
            isActive
              ? 'border-primary bg-primary text-primary-foreground'
              : isDone
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-muted-foreground/30 text-muted-foreground',
          )}
        >
          {#if isDone}
            <CheckIcon class="size-4" />
          {:else}
            {step.id}
          {/if}
        </div>
        <p class="text-sm font-medium">{step.title}</p>
      </div>
    </div>
  {/each}
</div>
