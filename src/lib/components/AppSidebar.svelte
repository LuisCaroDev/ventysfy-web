<script lang="ts">
  import { page } from '$app/state';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { appNavigation, matchesRoute, routes } from '$lib/config/routes';
  import { setMode, userPrefersMode } from 'mode-watcher';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import SunIcon from '@lucide/svelte/icons/sun';
  import UserRoundIcon from '@lucide/svelte/icons/user-round';
  import LaptopIcon from '@lucide/svelte/icons/laptop';

  type User = App.Locals['user'];

  let { user }: { user?: User } = $props();

  const currentPath = $derived(page.url.pathname);
  const sidebar = Sidebar.useSidebar();
  const userName = $derived.by(() => {
    const email = user?.email?.trim();
    if (!email) return 'Usuario';

    const baseName = email
      .split('@')[0]
      ?.replace(/[._-]+/g, ' ')
      .trim();
    if (!baseName) return email;

    return baseName.replace(/\b\w/g, (letter) => letter.toUpperCase());
  });
  const userInitials = $derived.by(() => {
    return userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });
</script>

<Sidebar.Root collapsible="offcanvas">
  <Sidebar.Header class="flex h-14 items-center border-b px-4 md:px-6">
    <div class="flex min-w-0 flex-col">
      <span class="text-sm font-semibold tracking-[0.18em] text-foreground uppercase">Ventysfy</span
      >
      <span class="text-xs text-muted-foreground">Web Console</span>
    </div>
  </Sidebar.Header>

  <Sidebar.Content class="py-3">
    <Sidebar.Group>
      <Sidebar.GroupLabel
        class="px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:px-6"
      >
        Navegación
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu class="grid gap-1 px-2 md:px-3">
          {#each appNavigation as item}
            {@const Icon = item.icon}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={matchesRoute(currentPath, item.href)}>
                {#snippet child({ props })}
                  <a
                    href={item.href}
                    class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    {...props}
                  >
                    <Icon class="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer class="border-t p-3">
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto min-h-12 rounded-xl"
          >
            {#snippet child({ props })}
              <DropdownMenu.Trigger {...props}>
                <div
                  class="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary"
                >
                  {#if userInitials}
                    <span class="text-xs font-semibold">{userInitials}</span>
                  {:else}
                    <UserRoundIcon class="size-4" />
                  {/if}
                </div>
                <div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{userName}</span>
                  <span class="truncate text-xs text-muted-foreground"
                    >{user?.email ?? 'Sin correo'}</span
                  >
                </div>
                <ChevronsUpDownIcon class="ml-auto size-4 text-muted-foreground" />
              </DropdownMenu.Trigger>
            {/snippet}
          </Sidebar.MenuButton>

          <DropdownMenu.Content
            class="min-w-56 rounded-lg"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenu.Label class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div
                  class="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary"
                >
                  {#if userInitials}
                    <span class="text-xs font-semibold">{userInitials}</span>
                  {:else}
                    <UserRoundIcon class="size-4" />
                  {/if}
                </div>
                <div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{userName}</span>
                  <span class="truncate text-xs text-muted-foreground"
                    >{user?.email ?? 'Sin correo'}</span
                  >
                </div>
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger class="cursor-pointer">
                <PaletteIcon class="mr-2 size-4" />
                <span>Tema</span>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.CheckboxItem
                  checked={userPrefersMode.current === 'light'}
                  onclick={() => setMode('light')}
                >
                  <SunIcon class="mr-2 size-4" />
                  Claro
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  checked={userPrefersMode.current === 'dark'}
                  onclick={() => setMode('dark')}
                >
                  <MoonIcon class="mr-2 size-4" />
                  Oscuro
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.Separator />
                <DropdownMenu.CheckboxItem
                  checked={userPrefersMode.current === 'system'}
                  onclick={() => setMode('system')}
                >
                  <LaptopIcon class="mr-2 size-4" />
                  Sistema
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator />

            <DropdownMenu.Item class="p-0">
              <form method="POST" action={`${routes.login}?/logout`} class="w-full">
                <button
                  type="submit"
                  class="flex w-full cursor-pointer items-center px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOutIcon class="mr-2 size-4 shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
