<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import * as Card from '$lib/components/ui/card';

  let {
    title,
    value,
    subtitle = null,
    badge = null,
    icon: Icon,
    children,
  }: {
    title: string;
    value: string;
    subtitle?: string | null;
    badge?: string | null;
    icon: Component<{ class?: string }>;
    children?: Snippet;
  } = $props();
</script>

<Card.Root class="border bg-card/95 shadow-sm">
  <Card.Content class="flex h-full flex-col gap-4 p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <p class="text-sm text-muted-foreground">{title}</p>
        <p class="text-2xl font-semibold tracking-tight">{value}</p>
        {#if subtitle}
          <p class="text-sm text-muted-foreground">{subtitle}</p>
        {/if}
      </div>

      <div class="flex flex-col items-end gap-2">
        <div class="rounded-md border bg-muted/40 p-2.5 text-primary">
          <Icon class="size-4" />
        </div>

        {#if badge}
          <span
            class="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {badge}
          </span>
        {/if}
      </div>
    </div>

    {#if children}
      <div class="min-h-12">{@render children()}</div>
    {/if}
  </Card.Content>
</Card.Root>
