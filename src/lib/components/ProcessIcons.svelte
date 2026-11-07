<script lang="ts">
  import type { TaskbarIntegration } from "#lib/config_schema.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { getWindows } from "#lib/utils/glaze_wm_utils.ts";
  import type { Window } from "glazewm";
  import type { GlazeWmOutput } from "zebar";

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

<div
  class="transition-[width]"
  style="width: calc({glazewm
    ? config.taskbarIntegration.extraIcons +
      getIconCount(glazewm, config.taskbarIntegration)
    : 0} * var(--process-icon-width));"
></div>
