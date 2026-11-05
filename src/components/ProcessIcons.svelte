<script lang="ts">
  import { config } from "#lib/config.svelte.ts";
  import type { TaskbarIntegration } from "#lib/config_schema.ts";
  import { providers } from "#lib/providers.svelte.ts";
  import {
    getWindows,
    isOnPrimaryMonitor
  } from "#lib/utils/glaze_wm_utils.svelte.ts";
  import type { Window } from "glazewm";
  import type { GlazeWmOutput } from "zebar";
  import SmoothDiv from "./SmoothDiv.svelte";
  import { SvelteSet } from "svelte/reactivity";

  let glazewm = $derived(providers.glazewm);

  const uniqueWindows = (windows: Window[]) => {
    const seen = new SvelteSet();
    return windows.filter((window) => {
      const key = window.processName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getIconCount = (
    glazewm: GlazeWmOutput,
    integrationConfig: TaskbarIntegration
  ) => {
    let windows: Window[] = [];
    let selection = isOnPrimaryMonitor()
      ? integrationConfig.primaryMonitorSelection
      : integrationConfig.secondaryMonitorSelection;
    switch (selection) {
      case "workspace":
        windows = getWindows(glazewm.displayedWorkspace);
        break;
      case "monitor":
        for (const workspace of glazewm.currentMonitor.children) {
          windows.push(...getWindows(workspace));
        }
        break;
      case "all":
        windows = glazewm.allWindows;
        break;
    }

    return uniqueWindows(windows).length;
  };
</script>

<SmoothDiv>
  {#if glazewm}
    <div
      class="flex items-center"
      style="width: calc({config.taskbarIntegration.extraIcons +
        getIconCount(
          glazewm,
          config.taskbarIntegration
        )} * var(--process-icon-width));"
    ></div>
  {/if}
</SmoothDiv>
