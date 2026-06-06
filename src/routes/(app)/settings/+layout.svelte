<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-full bg-gradient-to-b from-background via-background to-muted/30">
  <div class="mx-auto max-w-6xl px-6 py-8">
    {@render children()}
  </div>
</div>
