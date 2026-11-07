import { currentWidget, startWidgetPreset } from "zebar";
import { RemoteState } from "./remote_state.svelte.ts";

/** Whether the settings window is open, which only that window sets. */
export const settingsWindow = new RemoteState("settings.window", false);

/** Held by the settings window for as long as it lives, and by no other. */
const WINDOW_LOCK = "neosoft.settings.window";
const CLOSE = "close";

// Closing is asked for with a message, not through `settingsWindow`, so that an
// answer about an older window arriving late can't close one that just opened.
const requests =
  typeof window === "undefined"
    ? undefined
    : new BroadcastChannel("neosoft.settings.requests");

/**
 * Opens the settings window, or closes it when it's open. The lock decides which,
 * because the browser lets go of it however the window ends, while
 * `settingsWindow` could be left saying it's open.
 */
export async function toggleSettings() {
  const { held = [] } = await navigator.locks.query();
  if (held.some(({ name }) => name === WINDOW_LOCK)) {
    requests?.postMessage(CLOSE);
    return;
  }

  settingsWindow.value = false;
  await startWidgetPreset("settings", "default");
}

/** Closes the settings window, from inside it. */
export function closeSettings() {
  settingsWindow.value = false;
  void currentWidget().close();
}

/**
 * Call from the settings window once it has mounted. Only one can run, so a second
 * one closes itself, which also covers Zebar's tray menu opening another.
 */
export function runSettingsWindow() {
  let running = false;

  const onPageHide = () => {
    if (running) settingsWindow.value = false;
  };
  addEventListener("pagehide", onPageHide);

  if (requests) {
    requests.onmessage = ({ data }: MessageEvent<unknown>) => {
      if (running && data === CLOSE) closeSettings();
    };
  }

  void navigator.locks.request(
    WINDOW_LOCK,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        await currentWidget().close();
        return;
      }

      running = true;
      settingsWindow.value = true;
      // Held for as long as the window lives.
      await new Promise(() => {});
    }
  );

  return () => {
    removeEventListener("pagehide", onPageHide);
  };
}
