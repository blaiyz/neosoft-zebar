<script lang="ts">
  import { config, loadConfig } from "$lib/config.svelte";
  import { onMount } from "svelte";
  import "../app.css";

  let { children } = $props();

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
