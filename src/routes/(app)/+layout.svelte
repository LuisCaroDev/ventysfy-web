<script lang="ts">
  import { page } from '$app/state';
  import AppSidebar from '$lib/components/AppSidebar.svelte';
  import { appNavigation, matchesRoute } from '$lib/config/routes';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sidebar from '$lib/components/ui/sidebar';

  let { data, children } = $props();

  const currentPath = $derived(page.url.pathname);
  const currentNavigationItem = $derived(
    appNavigation.find((item) => matchesRoute(currentPath, item.href)) ?? appNavigation[0],
  );
</script>

<Sidebar.Provider>
  <div class="flex min-h-screen w-full overflow-hidden">
    <AppSidebar user={data.user} />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur"
      >
        <div class="flex w-full items-center gap-2 px-4 md:px-6">
          <Sidebar.Trigger class="-ml-1 [&_svg]:size-4 [&_svg]:shrink-0" />
          <Separator orientation="vertical" class="mx-1 data-[orientation=vertical]:h-4" />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-foreground">{currentNavigationItem.label}</p>
            <p class="text-xs text-muted-foreground">Shell autenticado de Ventysfy Web</p>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto bg-muted/20">
        {@render children()}
      </main>
    </div>
  </div>
</Sidebar.Provider>
