<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import { cn, type WithElementRef } from '$lib/utils.js';

  type Variant = 'default' | 'secondary' | 'outline' | 'destructive';

  type Props = WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
    variant?: Variant;
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    class: className,
    variant = 'default',
    children,
    'data-slot': dataSlot = 'badge',
    ...restProps
  }: Props = $props();

  const variants: Record<Variant, string> = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline: 'text-foreground',
    destructive: 'border-transparent bg-destructive text-white hover:bg-destructive/90',
  };
</script>

<span
  bind:this={ref}
  data-slot={dataSlot}
  class={cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variants[variant],
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</span>
