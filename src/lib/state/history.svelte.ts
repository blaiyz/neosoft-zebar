import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
import { providers } from "#lib/state/providers.svelte.ts";
import { RemoteState } from "#lib/state/remote_state.svelte.ts";
import { untrack } from "svelte";

/** How many readings each series keeps. */
export const HISTORY_LENGTH = 60;

type History = {
  cpu: number[];
  memory: number[];
  /** Bytes per second. */
  download: number[];
  upload: number[];
};

/**
 * Recent readings, for the flyouts to draw. The flyout window starts later than the
 * bar and can be closed, so it couldn't collect its own.
 */
export const history = new RemoteState<History>("history", {
  cpu: [],
  memory: [],
  download: [],
  upload: []
});

type Reading = [series: keyof History, value: number];

/** Adds readings to the end of their series, in one write. */
function record(read: () => Reading[] | null) {
  $effect(() => {
    const readings = read();
    if (!readings || !isOnPrimaryMonitor()) return;

    untrack(() => {
      const next = { ...history.value };
      for (const [series, value] of readings) {
        next[series] = [...next[series], value].slice(-HISTORY_LENGTH);
      }
      history.value = next;
    });
  });
}

/**
 * Call while a component of the bar initializes. Only the bar on the primary monitor
 * records, because every bar sees the same numbers.
 */
export function initHistory() {
  record(() => {
    const usage = providers.cpu?.usage;
    return usage === undefined ? null : [["cpu", usage]];
  });
  record(() => {
    const usage = providers.memory?.usage;
    return usage === undefined ? null : [["memory", usage]];
  });
  // Both directions come from the same reading, so they're written together.
  record(() => {
    const traffic = providers.network?.traffic;
    return traffic
      ? [
          ["download", traffic.received.bytes],
          ["upload", traffic.transmitted.bytes]
        ]
      : null;
  });
}
