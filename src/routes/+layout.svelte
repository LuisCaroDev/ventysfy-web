<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { queryClient } from '$lib/query-client';

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
