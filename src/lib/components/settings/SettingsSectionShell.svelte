<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    eyebrow,
    title,
    description,
    children,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    children: Snippet;
  } = $props();
</script>

<section class="space-y-6">
  <div class="space-y-3">
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
      <p class="max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  </div>

  <div class="space-y-4">
    {@render children()}
  </div>
</section>
