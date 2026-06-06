<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Card from '$lib/components/ui/card';

  let {
    title,
    description = null,
    children,
  }: {
    title: string;
    description?: string | null;
    children?: Snippet;
  } = $props();
</script>

<Card.Root class="rounded-lg border bg-card/95 shadow-sm">
  <Card.Header class="space-y-1 pb-0">
    <Card.Title class="text-lg">{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content class="p-5 pt-4">
    {#if children}
      {@render children()}
    {/if}
  </Card.Content>
</Card.Root>
