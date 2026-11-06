<script lang="ts">
  import FlyoutPanel from "#lib/components/flyouts/FlyoutPanel.svelte";
  import { flyoutProviders, flyoutViews } from "#lib/flyouts.ts";
  import { config, skipConfigFades } from "#lib/state/config.svelte.ts";
  import {
    closeFlyout,
    flyoutWindow,
    openFlyout,
    type FlyoutRequest
  } from "#lib/state/flyouts.svelte.ts";
  import { initProviders } from "#lib/state/providers.svelte.ts";
  import { readRegion } from "#lib/state/region.svelte.ts";
  import { exitTime } from "#lib/theme.ts";
  import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
  import { onMount, tick } from "svelte";
  import { currentWidget } from "zebar";

  /**
   * The press that opens a flyout can take focus from the window after it's shown.
   * In milliseconds.
   */
  const BLUR_GRACE = 150;

  /** Only one of these windows runs, however many ask for it. */
  const WINDOW_LOCK = "neosoft.flyout-window";

  /** The most a frame gets to reach the screen, in milliseconds. */
  const PAINT_TIMEOUT = 100;

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
    shownAt = performance.now();
    request = next;
  };

  /** Lets the panel animate out first, unless another one is waiting to come in. */
  const hide = async () => {
    closing = true;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(
        resolve,
        exitTime(config.bar.transitionDuration)
      );
      skipExit = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    await conceal();
  };

  /** Takes each change in turn, so that a quick close can't be overtaken by the open. */
  const followRequest = async (next: FlyoutRequest | null) => {
    if (next?.id === request?.id) return;
    await (next ? show(next) : hide());
  };

  /** Only clears the request if it's still this one. A new one may be on its way. */
  const close = () => {
    if (openFlyout.value?.id === request?.id) closeFlyout();
  };

  const onBlur = () => {
    if (performance.now() - shownAt > BLUR_GRACE) close();
  };

  $effect(() => {
    if (!openFlyout.known) return;

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
    let running = false;

    const onPageHide = () => {
      if (running) flyoutWindow.value = false;
    };
    addEventListener("pagehide", onPageHide);

    void navigator.locks.request(
      WINDOW_LOCK,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          await widget.close();
          return;
        }

        running = true;
        flyoutWindow.value = true;
        void readRegion();
        for (const { load } of Object.values(flyoutViews)) void load();
        if (!openFlyout.value) await widget.tauriWindow.hide();

        // Held for as long as the window lives.
        await new Promise(() => {});
      }
    );

    const unlisten = widget.tauriWindow.listen("tauri://blur", onBlur);

    return () => {
      removeEventListener("pagehide", onPageHide);
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
