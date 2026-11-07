<script lang="ts">
  import Group from "#lib/components/Group.svelte";
  import ProcessIcons from "#lib/components/ProcessIcons.svelte";
  import SectionRow from "#lib/components/SectionRow.svelte";
  import { initAutotiler } from "#lib/state/autotiler.svelte.ts";
  import { initBindingModes } from "#lib/state/binding_modes.svelte.ts";
  import { config, configStatus } from "#lib/state/config.svelte.ts";
  import { closeFlyout, initFlyoutWindow } from "#lib/state/flyouts.svelte.ts";
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
  import {
    barProviders,
    initProviders,
    providers
  } from "#lib/state/providers.svelte.ts";
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

  initAutotiler();
  initBindingModes();
  initProviders(barProviders);
  initLayout();
  initHistory();
  initFlyoutWindow();

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
          "absolute inset-0",
          gradientDirection,
          "from-zb-bg-focused to-transparent",
          !glazewm?.currentMonitor.hasFocus && "opacity-0"
        ]}
      ></div>
      <div
        class={[
          "absolute inset-0",
          gradientDirection,
          "from-zb-bg-unfocused to-transparent",
          glazewm?.currentMonitor.hasFocus && "opacity-0"
        ]}
      ></div>
    {:else if config.bar.gradient === "solid"}
      <div
        class={[
          "absolute inset-0",
          glazewm?.currentMonitor.hasFocus
            ? "bg-zb-bg-focused"
            : "bg-zb-bg-unfocused"
        ]}
      ></div>
    {/if}
    <div
      class="relative z-10 mx-zbx my-zby grid h-full w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-1 items-center"
    >
      <div
        class="flex h-full min-w-0 justify-start"
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
        class="flex h-full min-w-0 justify-end"
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
