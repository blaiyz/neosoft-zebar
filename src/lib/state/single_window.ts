import { currentWidget } from "zebar";
import type { RemoteState } from "./remote_state.svelte.ts";

/**
 * Whether a window holds `lock`. Unlike a `running` state, this can't be left saying
 * yes by a window that ended without saying it had stopped.
 */
export async function isLockHeld(lock: string) {
  const { held = [] } = await navigator.locks.query();
  return held.some(({ name }) => name === lock);
}

/**
 * Keeps a widget to one window. The first to take `lock` holds it for as long as
 * it lives, says so in `running`, and calls `start`. Any other closes itself. The
 * browser lets go of a lock however the window ends, so a window that crashed
 * doesn't block the next one.
 */
export function holdSingleWindow(
  lock: string,
  running: RemoteState<boolean>,
  start?: () => void | Promise<void>
) {
  let holding = false;
  let letGo = () => {};

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
    // Held for as long as the window lives, whatever starting it did, unless it
    // lets go first.
    await new Promise<void>((resolve) => {
      letGo = resolve;
    });
  });

  return {
    /** Removes its listener. */
    stop: () => {
      removeEventListener("pagehide", onPageHide);
    },
    /**
     * Says that the window has stopped, and lets go of the lock, for a window that's
     * about to close itself. A new one can then start without waiting for it to go.
     */
    release: () => {
      if (!holding) return;
      holding = false;
      running.value = false;
      letGo();
    }
  };
}
