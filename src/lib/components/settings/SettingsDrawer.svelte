<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as Sheet from '$lib/components/ui/sheet';
  import type { Snippet } from 'svelte';

  let {
    title,
    description,
    backHref,
    onClose,
    footer,
    children,
  }: {
    title: string;
    description: string;
    backHref: string;
    onClose?: () => void;
    footer?: Snippet;
    children: Snippet;
  } = $props();

  let open = $state(true);
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $effect(() => {
    if (!mounted || open) return;
    if (onClose) {
      onClose();
      return;
    }
    void goto(backHref);
  });
</script>

<Sheet.Root bind:open>
  <Sheet.Content
    side="right"
    class="w-full gap-0 border-l bg-background p-0 sm:max-w-xl"
    showCloseButton={false}
  >
    <div class="flex h-full flex-col">
      <Sheet.Header class="border-b px-6 py-5 text-left">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1.5">
            <Sheet.Title class="text-xl font-semibold tracking-tight">{title}</Sheet.Title>
            <Sheet.Description class="text-sm leading-6 text-muted-foreground">
              {description}
            </Sheet.Description>
          </div>

          <Sheet.Close
            class="inline-flex size-9 aspect-square items-center justify-center rounded-sm border border-border bg-background text-xl leading-none text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            ×
          </Sheet.Close>
        </div>
      </Sheet.Header>

      <div class="flex-1 overflow-y-auto px-6 py-6">
        {@render children()}
      </div>

      {#if footer}
        <div class="border-t px-6 py-4">
          {@render footer()}
        </div>
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
