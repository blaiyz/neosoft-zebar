<script lang="ts">
  import { reloadOnRebuild } from "#lib/dev_reload.ts";
  import {
    config,
    configStatus,
    loadConfig
  } from "#lib/state/config.svelte.ts";
  import { applyTheme } from "#lib/theme.ts";
  import { onMount, type Snippet } from "svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();

  $effect(() => {
    if (configStatus.loaded)
      applyTheme(config.theme, config.taskbarIntegration);
  });

  onMount(() => {
    void loadConfig();
    if (import.meta.env.MODE === "dev") reloadOnRebuild();
  });
</script>

<div
  class="h-full"
  style="--transition-duration: {config.bar.transitionDuration}ms;"
>
  {@render children()}
</div>
