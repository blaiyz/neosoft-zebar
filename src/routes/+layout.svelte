<script lang="ts">
  import { reloadOnRebuild } from "#lib/dev_reload.ts";
  import {
    config,
    configStatus,
    loadConfig
  } from "#lib/state/config.svelte.ts";
  import { applyTheme, exitTime } from "#lib/theme.ts";
  import { onMount, type Snippet } from "svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();

  let duration = $derived(config.bar.transitionDuration);

  $effect(() => {
    if (configStatus.loaded)
      applyTheme(config.theme, config.taskbarIntegration);
  });

  // A view transition belongs to the root, above where the other times are set.
  $effect(() => {
    document.documentElement.style.setProperty(
      "--time-fade",
      `${duration * 1.9}ms`
    );
  });

  /**
   * Pressing Alt counts as using the keyboard, which draws the focus ring on whatever
   * was clicked last. A click from the keyboard has a `detail` of 0, and keeps focus.
   */
  const dropClickFocus = ({ detail }: MouseEvent) => {
    const focused = document.activeElement;
    if (
      detail > 0 &&
      focused instanceof HTMLElement &&
      focused.matches("button, a, [role='slider']")
    ) {
      focused.blur();
    }
  };

  onMount(() => {
    void loadConfig();
    if (import.meta.env.MODE === "dev") reloadOnRebuild();
  });
</script>

<svelte:window onclick={dropClickFocus} />

<div
  class="h-full"
  style:--transition-duration="{duration}ms"
  style:--time-soft="{duration * 1.25}ms"
  style:--time-melt="{duration * 1.9}ms"
  style:--time-exit="{exitTime(duration)}ms"
  style:--fly-from={config.bar.direction === "top" ? "-20px" : "20px"}
>
  {@render children()}
</div>
