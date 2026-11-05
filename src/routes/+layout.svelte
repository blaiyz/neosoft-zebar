<script lang="ts">
  import { reloadOnRebuild } from "#lib/dev_reload.ts";
  import { config, loadConfig } from "#lib/state/config.svelte.ts";
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
