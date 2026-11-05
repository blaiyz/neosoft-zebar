<script lang="ts">
  import { config, loadConfig } from "#lib/config.svelte.ts";
  import { reloadOnRebuild } from "#lib/dev_reload.ts";
  import { onMount, type Snippet } from "svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    void loadConfig();
    if (import.meta.env.MODE === "dev") reloadOnRebuild();
  });
</script>

<div
  class="h-full"
  style="--transition-duration: {config.transitionDuration}ms;"
>
  {@render children()}
</div>
