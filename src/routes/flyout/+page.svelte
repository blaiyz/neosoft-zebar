<script lang="ts">
  import FlyoutPanel from "#lib/components/flyouts/FlyoutPanel.svelte";
  import { flyoutProviders, flyoutViews } from "#lib/flyouts.ts";
  import {
    config,
    configStatus,
    skipConfigFades
  } from "#lib/state/config.svelte.ts";
  import {
    closeFlyout,
    FLYOUT_WINDOW_LOCK,
    flyoutWindow,
    openFlyout,
    startFlyoutWindow,
    type FlyoutRequest
  } from "#lib/state/flyouts.svelte.ts";
  import { motion } from "#lib/state/motion.svelte.ts";
  import { initProviders } from "#lib/state/providers.svelte.ts";
  import { readRegion } from "#lib/state/region.svelte.ts";
  import { holdSingleWindow } from "#lib/state/single_window.ts";
  import { exitTime } from "#lib/theme.ts";
  import { invoke } from "@tauri-apps/api/core";
  import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
  import { onMount, tick } from "svelte";
  import { currentWidget } from "zebar";

  /**
   * The press that opens a flyout can take focus from the window after it's shown.
   * In milliseconds.
   */
  const BLUR_GRACE = 150;

  /** The most a frame gets to reach the screen, in milliseconds. */
  const PAINT_TIMEOUT = 100;

  /**
   * How long the window stays with nothing to show before it closes, when flyouts
   * aren't kept ready, in milliseconds.
   */
  const IDLE_TIME = 60_000;

  /** Long enough for every other window to hear that this one has stopped. */
  const HANDOVER_TIME = 100;

  let request = $state.raw<FlyoutRequest | null>(null);
  let closing = $state(false);
  let shownAt = 0;
  let sync = Promise.resolve();
  let skipExit = () => {};

  initProviders(flyoutProviders);
  skipConfigFades();

  /** Waits for what's on the page to reach the screen. */
  const painted = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, PAINT_TIMEOUT);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

  /** A window shows what it last painted, so it has to paint nothing before it hides. */
  const conceal = async () => {
    closing = false;
    request = null;
    await tick();
    await painted();
    await currentWidget().tauriWindow.hide();
  };

  /**
   * `show()` also gives the window focus, as a press on the bar has just made this app
   * the foreground one. Closing on blur depends on that, and a widget has no other way
   * of asking for it. It does nothing to a window that's showing, so one flyout replaces
   * another by way of hiding it. The panel comes last, for its animation to be seen from
   * the start.
   */
  const show = async (next: FlyoutRequest) => {
    if (request) await conceal();

    const { tauriWindow } = currentWidget();
    await tauriWindow.setPosition(new PhysicalPosition(next.x, next.y));
    await tauriWindow.setSize(new PhysicalSize(next.width, next.height));
    await tauriWindow.show();
    // Showing a window rewrites its style, which drops the tool window style that
    // Zebar gave it to keep it off the taskbar, and Windows gives it a button there.
    // This is Zebar's own command, which its client doesn't export.
    await invoke("set_skip_taskbar", { skip: true }).catch((error: unknown) => {
      console.error("Error keeping the flyout off the taskbar:", error);
    });
    shownAt = performance.now();
    request = next;
  };

  /** Lets the panel animate out first, unless another one is waiting to come in. */
  const hide = async () => {
    closing = true;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, exitTime(motion.duration));
      skipExit = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    await conceal();
  };

  /** The same flyout, moved to keep up with its opener. */
  const move = async (next: FlyoutRequest) => {
    const { tauriWindow } = currentWidget();
    await tauriWindow.setPosition(new PhysicalPosition(next.x, next.y));
    if (next.width !== request?.width || next.height !== request.height) {
      await tauriWindow.setSize(new PhysicalSize(next.width, next.height));
    }
    request = next;
  };

  /** Takes each change in turn, so that a quick close can't be overtaken by the open. */
  const followRequest = async (next: FlyoutRequest | null) => {
    if (next === request) return;
    if (next && next.id === request?.id) await move(next);
    else if (next?.id !== request?.id) await (next ? show(next) : hide());
  };

  /**
   * Whether this is the one flyout window. A second one does nothing with requests
   * while it waits to find out that it isn't, and then closes itself.
   */
  let holding = $state(false);

  let lock: ReturnType<typeof holdSingleWindow> | undefined;

  /**
   * Bars start a new window once they've heard that this one has stopped. One that
   * asked for a flyout just before then found this one running, so this starts the
   * next one for it.
   */
  const closeWindow = async () => {
    holding = false;
    lock?.release();
    await new Promise((resolve) => setTimeout(resolve, HANDOVER_TIME));
    if (openFlyout.value) await startFlyoutWindow();
    await currentWidget().close();
  };

  $effect(() => {
    if (!holding || request || openFlyout.value) return;
    if (!configStatus.loaded || config.performance.keepFlyoutsReady) return;

    const timer = setTimeout(() => {
      closeWindow().catch((error: unknown) => {
        console.error("Error closing the flyout window:", error);
      });
    }, IDLE_TIME);
    return () => {
      clearTimeout(timer);
    };
  });

  /** Only clears the request if it's still this one. A new one may be on its way. */
  const close = () => {
    if (holding && openFlyout.value?.id === request?.id) closeFlyout();
  };

  const onBlur = () => {
    if (performance.now() - shownAt > BLUR_GRACE) close();
  };

  $effect(() => {
    if (!holding || !openFlyout.known) return;

    const next = openFlyout.value;
    if (next) skipExit();
    sync = sync
      .then(() => followRequest(next))
      .catch((error: unknown) => {
        console.error("Error updating the flyout window:", error);
      });
  });

  onMount(() => {
    const widget = currentWidget();

    // Zebar creates the window showing. It's hidden before anything follows a
    // request, so that showing it for the first flyout activates it too.
    lock = holdSingleWindow(FLYOUT_WINDOW_LOCK, flyoutWindow, async () => {
      void readRegion();
      for (const { load } of Object.values(flyoutViews)) void load();
      await widget.tauriWindow.hide();
      holding = true;
    });

    const unlisten = widget.tauriWindow.listen("tauri://blur", onBlur);

    return () => {
      lock?.stop();
      void unlisten.then((stop) => {
        stop();
      });
    };
  });
</script>

{#if request}
  {#key request.id}
    <FlyoutPanel {request} {closing} onclose={close} />
  {/key}
{/if}
