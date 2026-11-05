<script lang="ts">
  import { config, loadConfig } from "#lib/config.svelte.ts";
  import { onMount, type Snippet } from "svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    loadConfig();
  });
</script>

<div
  class="h-full"
  style="--transition-duration: {config.transitionDuration}ms;"
>
  {@render children()}
</div>
