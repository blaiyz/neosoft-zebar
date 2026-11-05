<script lang="ts">
  import type { TaskbarIntegration } from "#lib/config_schema.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import {
    getWindows,
    isOnPrimaryMonitor
  } from "#lib/utils/glaze_wm_utils.svelte.ts";
  import type { Window } from "glazewm";
  import type { GlazeWmOutput } from "zebar";
  import SmoothDiv from "./SmoothDiv.svelte";

  let glazewm = $derived(providers.glazewm);

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
        if (glazewm.displayedWorkspace) {
          windows = getWindows(glazewm.displayedWorkspace);
        }
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

    return new Set(windows.map((window) => window.processName)).size;
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
