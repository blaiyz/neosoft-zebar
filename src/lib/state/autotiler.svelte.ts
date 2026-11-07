import { untrack } from "svelte";
import { providers } from "#lib/state/providers.svelte.ts";
import { ContainerType, TilingDirection, type Window } from "glazewm";
import { config } from "#lib/state/config.svelte.ts";

// Each autotiler is only responsible for one monitor

const MIN_RATIO = 1.4; // Minimum aspect ratio for switching tiling direction

const currentMonitor = $derived(providers.glazewm?.currentMonitor || null);
const focusedWindow: Window | null = $derived.by(() => {
  const glazewm = providers.glazewm;
  const focusedContainer = glazewm?.focusedContainer;
  if (!focusedContainer) {
    return null;
  }
  if (!currentMonitor || glazewm?.focusedMonitor?.id !== currentMonitor.id) {
    return null;
  }
  if (focusedContainer.type === ContainerType.WINDOW) {
    return focusedContainer;
  }
  return null;
});
const focusedWindowId = $derived(focusedWindow?.id || null);

export function initAutotiler() {
  $effect(() => {
    // Trigger effect when focusedWindowId changes (MUST BE FIRST!!!)
    // Using ID to avoid unnecessary updates
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    focusedWindowId;
    if (!config.autoTiling) {
      // Auto-tiling is disabled
      return;
    }
    const monitor = untrack(() => currentMonitor);
    const window = untrack(() => focusedWindow);

    if (!monitor || !window) {
      return;
    }

    const height = window.height;
    const width = window.width;

    const aspectRatio = width / height;
    const glazewm = untrack(() => providers.glazewm);
    if (!glazewm) {
      return;
    }
    if (
      aspectRatio < MIN_RATIO &&
      glazewm.tilingDirection !== TilingDirection.VERTICAL
    ) {
      void glazewm.runCommand("set-tiling-direction vertical");
    } else if (
      aspectRatio >= MIN_RATIO &&
      glazewm.tilingDirection !== TilingDirection.HORIZONTAL
    ) {
      void glazewm.runCommand("set-tiling-direction horizontal");
    }
  });
}
