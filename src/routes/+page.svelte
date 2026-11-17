<script lang="ts">
  import Group from "#lib/components/Group.svelte";
  import ProcessIcons from "#lib/components/ProcessIcons.svelte";
  import SectionRow from "#lib/components/SectionRow.svelte";
  import { initAutotiler } from "#lib/state/autotiler.svelte.ts";
  import { initBindingModes } from "#lib/state/binding_modes.svelte.ts";
  import { config, configStatus } from "#lib/state/config.svelte.ts";
  import {
    closeFlyout,
    initFlyoutWindow,
    openFlyout
  } from "#lib/state/flyouts.svelte.ts";
  import { initHistory } from "#lib/state/history.svelte.ts";
  import {
    barArrangement,
    initLayout,
    trackColumn
  } from "#lib/state/layout.svelte.ts";
  import {
    initMonitor,
    isOnPrimaryMonitor
  } from "#lib/state/monitor.svelte.ts";
  import { trackActivity } from "#lib/state/motion.svelte.ts";
  import {
    barProviders,
    initProviders,
    providers
  } from "#lib/state/providers.svelte.ts";
  import { settingsWindow } from "#lib/state/settings_window.svelte.ts";
  import { applyBackgroundEffect } from "#lib/window_effects.ts";
  import { onMount } from "svelte";

  let glazewm = $derived(providers.glazewm);
  let arrangement = $derived(barArrangement());
  let taskbar = $derived(config.taskbarIntegration.enabled);

  // With taskbar integration, the middle group is in two around the taskbar's icons.
  let split = $derived(arrangement.middle.indexOf("taskbar"));
  let before = $derived(arrangement.middle.slice(0, split));
  let after = $derived(arrangement.middle.slice(split + 1));
  let middle = $derived(
    arrangement.middle.filter((item) => item !== "taskbar")
  );

  /** The warning about ignored settings goes at the start of the first group. */
  let warningIn = $derived(
    arrangement.left.length > 0
      ? "left"
      : middle.length > 0
        ? "middle"
        : "right"
  );
  let gradientDirection = $derived(
    config.bar.gradient === "bottom"
      ? "bg-linear-to-t/srgb"
      : "bg-linear-to-b/srgb"
  );
  // The background ends where the groups do, margins included, so that none of it
  // shows around them. Where their outer ends are rounded, it stays 1px inside them
  // with a curve that follows theirs, or its antialiased edge shows through theirs.
  const roundedEnds = {
    top: "top-zby right-[calc(var(--bar-margin-right)+1px)] bottom-[calc(var(--bar-margin-y)+1px)] left-[calc(var(--bar-margin-left)+1px)] rounded-b-[calc(var(--radius)-1px)]",
    bottom:
      "top-[calc(var(--bar-margin-y)+1px)] right-[calc(var(--bar-margin-right)+1px)] bottom-zby left-[calc(var(--bar-margin-left)+1px)] rounded-t-[calc(var(--radius)-1px)]",
    floating:
      "top-[calc(var(--bar-margin-y)+1px)] right-[calc(var(--bar-margin-right)+1px)] bottom-[calc(var(--bar-margin-y)+1px)] left-[calc(var(--bar-margin-left)+1px)] rounded-[calc(var(--radius)-1px)]"
  };
  let background = $derived([
    "absolute",
    config.bar.attachSides
      ? "top-zby right-zbr bottom-zby left-zbl"
      : roundedEnds[config.bar.direction]
  ]);
  let centered = $derived(config.bar.keepMiddleCentered);

  initAutotiler();
  initBindingModes();
  initProviders(barProviders);
  initLayout();
  initHistory();
  initFlyoutWindow();
  trackActivity({
    // A flyout and the settings are part of the bar, and change how it looks.
    busy: () => openFlyout.value !== null || settingsWindow.value,
    // What changes in GlazeWM when someone switches windows or workspaces, opens or
    // closes a window, or changes its mode.
    changes: () => {
      return JSON.stringify([
        glazewm?.focusedContainer?.id,
        glazewm?.displayedWorkspace?.id,
        glazewm?.focusedWorkspace?.id,
        glazewm?.allWindows?.length,
        glazewm?.tilingDirection,
        glazewm?.isPaused,
        glazewm?.bindingModes?.map(({ name }) => name)
      ]);
    }
  });

  $effect(() => {
    if (configStatus.loaded) {
      void applyBackgroundEffect(config.bar.backgroundEffect);
    }
  });

  onMount(() => {
    initMonitor();
  });
</script>

<!-- A flyout closes when it loses focus. This is for when that doesn't reach it. -->
<svelte:window onpointerdown={closeFlyout} />

<div class="flex h-full w-full items-center">
  <div
    class="relative flex h-bar w-full items-stretch font-zb text-zb-size font-base text-zb-text"
  >
    {#if config.bar.gradient !== "solid" && config.bar.gradient !== "disabled"}
      <div
        class={[
          background,
          gradientDirection,
          "from-zb-bg-focused to-transparent",
          !glazewm?.currentMonitor.hasFocus && "opacity-0"
        ]}
      ></div>
      <div
        class={[
          background,
          gradientDirection,
          "from-zb-bg-unfocused to-transparent",
          glazewm?.currentMonitor.hasFocus && "opacity-0"
        ]}
      ></div>
    {:else if config.bar.gradient === "solid"}
      <div
        class={[
          background,
          glazewm?.currentMonitor.hasFocus
            ? "bg-zb-bg-focused"
            : "bg-zb-bg-unfocused"
        ]}
      ></div>
    {/if}
    <!-- Padding the outer columns, the margins keep the middle group in the centre.
      Around the grid, they centre it between them. -->
    <div
      class={[
        "relative z-10 my-zby grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-1 items-center",
        !centered && "mr-zbr ml-zbl"
      ]}
    >
      <div
        class={["flex h-full min-w-0 justify-start", centered && "pl-zbl"]}
        {@attach trackColumn("left")}
      >
        {#if arrangement.left.length > 0}
          <Group
            leftCurve={!config.bar.attachSides}
            class="h-full max-w-full"
            innerClass={[
              "flex h-full items-center px-4",
              isOnPrimaryMonitor() && "pl-zlby"
            ]}
          >
            <SectionRow
              items={arrangement.left}
              content="left"
              warning={warningIn === "left"}
            />
          </Group>
        {/if}
      </div>
      <div class="relative flex h-full items-center">
        {#if taskbar}
          <!-- The taskbar's icons stay in the centre, and the rest float either side. -->
          {#if before.length > 0}
            <Group
              rightCurve={false}
              class="right-full h-full translate-x-[1%] [&&]:absolute"
              innerClass="h-full pl-3"
            >
              <SectionRow
                items={before}
                content="before"
                warning={warningIn === "middle"}
              />
            </Group>
          {/if}
          <Group
            leftCurve={before.length === 0}
            rightCurve={after.length === 0}
            class="px-2"
          >
            <ProcessIcons />
          </Group>
          {#if after.length > 0}
            <Group
              leftCurve={false}
              class="left-full h-full -translate-x-[1%] [&&]:absolute"
              innerClass="h-full pr-3"
            >
              <SectionRow
                items={after}
                content="after"
                warning={warningIn === "middle" && before.length === 0}
              />
            </Group>
          {/if}
        {:else if middle.length > 0}
          <Group class="h-full" innerClass="h-full px-3">
            <SectionRow
              items={middle}
              content="center"
              warning={warningIn === "middle"}
            />
          </Group>
        {/if}
      </div>
      <div
        class={["flex h-full min-w-0 justify-end", centered && "pr-zbr"]}
        {@attach trackColumn("right")}
      >
        {#if arrangement.right.length > 0}
          <Group
            rightCurve={!config.bar.attachSides}
            class="h-full max-w-full"
            innerClass={[
              "flex h-full items-center justify-end pr-4 pl-2",
              isOnPrimaryMonitor() && "pr-zrby"
            ]}
          >
            <SectionRow
              items={arrangement.right}
              content="right"
              warning={warningIn === "right"}
            />
          </Group>
        {/if}
      </div>
    </div>
  </div>
</div>
