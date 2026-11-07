import { currentWidget } from "zebar";
import type { RemoteState } from "./remote_state.svelte.ts";

/**
 * Keeps a widget to one window. The first to take `lock` holds it for as long as
 * it lives, says so in `running`, and calls `start`. Any other closes itself. The
 * browser lets go of a lock however the window ends, so a window that crashed
 * doesn't block the next one.
 *
 * Returns what removes its listener.
 */
export function holdSingleWindow(
  lock: string,
  running: RemoteState<boolean>,
  start?: () => void | Promise<void>
) {
  let holding = false;

  const onPageHide = () => {
    if (holding) running.value = false;
  };
  addEventListener("pagehide", onPageHide);

  void navigator.locks.request(lock, { ifAvailable: true }, async (held) => {
    if (!held) {
      await currentWidget().close();
      return;
    }

    holding = true;
    running.value = true;
    try {
      await start?.();
    } catch (error) {
      console.error("Error starting the window:", error);
    }
    // Held for as long as the window lives, whatever starting it did.
    await new Promise(() => {});
  });

  return () => {
    removeEventListener("pagehide", onPageHide);
  };
}
