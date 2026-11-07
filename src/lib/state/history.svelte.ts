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

function record(series: keyof History, read: () => number | undefined) {
  $effect(() => {
    const value = read();
    if (value === undefined || !isOnPrimaryMonitor()) return;

    untrack(() => {
      const readings = [...history.value[series], value];
      history.value = {
        ...history.value,
        [series]: readings.slice(-HISTORY_LENGTH)
      };
    });
  });
}

/**
 * Call while a component of the bar initializes. Only the bar on the primary monitor
 * records, because every bar sees the same numbers.
 */
export function initHistory() {
  record("cpu", () => providers.cpu?.usage);
  record("memory", () => providers.memory?.usage);
  record("download", () => providers.network?.traffic?.received.bytes);
  record("upload", () => providers.network?.traffic?.transmitted.bytes);
}
