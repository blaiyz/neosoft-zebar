<script lang="ts">
  import Group from "#lib/components/Group.svelte";
  import LeftGroup from "#lib/components/LeftGroup.svelte";
  import ProcessIcons from "#lib/components/ProcessIcons.svelte";
  import RightGroup from "#lib/components/RightGroup.svelte";
  import Workspaces from "#lib/components/Workspaces.svelte";
  import { initAutotiler } from "#lib/state/autotiler.svelte.ts";
  import { initBindingModes } from "#lib/state/binding_modes.svelte.ts";
  import { config, configStatus } from "#lib/state/config.svelte.ts";
  import {
    initLayout,
    trackColumn,
    trackContent
  } from "#lib/state/layout.svelte.ts";
  import {
    initMonitor,
    isOnPrimaryMonitor
  } from "#lib/state/monitor.svelte.ts";
  import { initProviders, providers } from "#lib/state/providers.svelte.ts";
  import { applyBackgroundEffect } from "#lib/window_effects.ts";
  import { onMount } from "svelte";

  let glazewm = $derived(providers.glazewm);
  let gradientDirection = $derived(
    config.bar.gradient === "bottom"
      ? "bg-linear-to-t/srgb"
      : "bg-linear-to-b/srgb"
  );

  initAutotiler();
  initBindingModes();
  initProviders();
  initLayout();

  $effect(() => {
    if (configStatus.loaded) {
      void applyBackgroundEffect(config.bar.backgroundEffect);
    }
  });

  onMount(() => {
    initMonitor();
  });
</script>

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
        <Group
          leftCurve={!config.bar.attachSides}
          class="h-full max-w-full"
          innerClass={[
            "flex h-full items-center px-4",
            isOnPrimaryMonitor() && "pl-zlby"
          ]}
        >
          <LeftGroup />
        </Group>
      </div>
      <div class="flex h-full items-center">
        <Group
          rightCurve={!config.taskbarIntegration.enabled}
          class={[
            "h-full",
            config.taskbarIntegration.enabled &&
              "translate-x-[-99%] justify-self-end [&&]:absolute"
          ]}
          innerClass={[
            "h-full",
            config.taskbarIntegration.enabled ? "pl-3" : "px-3"
          ]}
        >
          <div class="h-full w-max" {@attach trackContent("center")}>
            <Workspaces />
          </div>
        </Group>
        {#if config.taskbarIntegration.enabled}
          <Group leftCurve={false} class="px-2">
            <ProcessIcons />
          </Group>
        {/if}
      </div>
      <div
        class="flex h-full min-w-0 justify-end"
        {@attach trackColumn("right")}
      >
        <Group
          rightCurve={!config.bar.attachSides}
          class="h-full max-w-full"
          innerClass={[
            "flex h-full items-center justify-end pr-4 pl-2",
            isOnPrimaryMonitor() && "pr-zrby"
          ]}
        >
          <RightGroup />
        </Group>
      </div>
    </div>
  </div>
</div>
