<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { cn, type WithElementRef } from '$lib/utils.js';

  type Props = WithElementRef<HTMLSelectAttributes> & {
    placeholder?: string;
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    value = $bindable(''),
    class: className,
    placeholder,
    'data-slot': dataSlot = 'select',
    children,
    ...restProps
  }: Props = $props();
</script>

<div class="relative">
  <select
    bind:this={ref}
    bind:value
    data-slot={dataSlot}
    class={cn(
      'border-input bg-background ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex h-10 w-full appearance-none rounded-md border px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
      !value && placeholder ? 'text-muted-foreground' : '',
      className,
    )}
    {...restProps}
  >
    {#if placeholder}
      <option value="" disabled hidden>{placeholder}</option>
    {/if}
    {@render children?.()}
  </select>
  <ChevronDownIcon
    class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
  />
</div>
