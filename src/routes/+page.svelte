<script lang="ts">
  import { onMount } from "svelte";
  import * as zebar from "zebar";

  import { Effect } from "@tauri-apps/api/window";

  import { initializeAutotiler } from "$lib/autotiler.svelte";
  import { config, configLoaded } from "$lib/config.svelte";
  import { initProviders, providers } from "$lib/providers.svelte";
  import { isOnPrimaryMonitor } from "$lib/utils/glaze_wm_utils.svelte";
  import Group from "../components/Group.svelte";
  import LeftGroup from "../components/LeftGroup.svelte";
  import ProcessIcons from "../components/ProcessIcons.svelte";
  import RightGroup from "../components/RightGroup.svelte";
  import Workspaces from "../components/Workspaces.svelte";

  let glazewm = $derived(providers.glazewm);
  initializeAutotiler();

  onMount(() => {
    initProviders();

    /*     
    Found a way to set window effects
    Requires adding the following line to packages/desktop/capabilities/widget.json under permissions (zebar source code):
        "core:window:allow-set-effects"
    Then rebuild and install zebar.
    
    It is then possible to set window effects like so:
    const window = zebar?.currentWidget()?.tauriWindow;
    window.setEffects({ effects: [Effect.Acrylic] });

    This is a temporary solution while waiting for https://github.com/glzr-io/zebar/pull/133 (one might say it's even better)
 */
    configLoaded
      .then((config) => {
        const effect = config.backgroundEffect;
        const window = zebar.currentWidget().tauriWindow;
        switch (effect) {
          case "acrylic":
            window.setEffects({ effects: [Effect.Acrylic] });
            console.log("Set window effect to acrylic");
            break;
          case "blur":
            window.setEffects({ effects: [Effect.Blur] });
            console.log("Set window effect to blur");
            break;
          case "mica":
            window.setEffects({ effects: [Effect.Mica] });
            console.log("Set window effect to mica");
            break;
          case "inherit":
            window.clearEffects();
            console.log("Set window effect to inherit");
            break;
        }
      })
      .catch((error) => {
        console.error("Error setting window effects:", error);
      });
  });
</script>

<div class="flex items-center h-full w-full">
  <div
    class="relative flex items-stretch h-bar w-full font-zb text-zb-text text-zb-size font-base bg-opacity-0"
  >
    {#if config.gradient !== "solid" && config.gradient !== "disabled"}
      <div
        class="absolute inset-0 {config.gradient === 'bottom'
          ? 'bg-gradient-to-t'
          : 'bg-gradient-to-b'} from-zb-bg-focused to-transparent {!glazewm
          ?.currentMonitor.hasFocus
          ? 'opacity-0'
          : ''}"
      ></div>
      <div
        class="absolute inset-0 {config.gradient === 'bottom'
          ? 'bg-gradient-to-t'
          : 'bg-gradient-to-b'} from-zb-bg-unfocused to-transparent {glazewm
          ?.currentMonitor.hasFocus
          ? 'opacity-0'
          : ''}"
      ></div>
    {:else if config.gradient === "solid"}
      <div
        class="absolute inset-0 {glazewm?.currentMonitor.hasFocus
          ? 'bg-zb-bg-focused'
          : 'bg-zb-bg-unfocused'}"
      ></div>
    {/if}
    <div
      class="relative z-10 my-zby mx-zbx h-full w-full grid grid-cols-[1fr_auto_1fr] grid-rows-1 items-center"
    >
      <Group
        leftCurve={!config.attachSides}
        outerClass="h-full justify-self-start"
        innerClass="h-full px-4 {isOnPrimaryMonitor() ? 'pl-zlby' : ''}"
      >
        <LeftGroup />
      </Group>
      <div
        class="h-full {config.taskbarIntegration.enabled
          ? 'grid grid-cols-[1fr_auto_1fr] grid-rows-1'
          : 'flex justify-center'} items-center"
      >
        <Group
          rightCurve={!config.taskbarIntegration.enabled}
          outerClass="h-full justify-self-end"
          innerClass="h-full {config.taskbarIntegration.enabled
            ? 'pl-3'
            : 'px-3'}"
        >
          <Workspaces />
        </Group>
        {#if config.taskbarIntegration.enabled}
          <Group leftCurve={false} outerClass="px-2">
            <ProcessIcons />
          </Group>
        {/if}
      </div>
      <Group
        rightCurve={!config.attachSides}
        outerClass="h-full justify-self-end"
        innerClass="h-full pl-2 pr-4 flex items-center {isOnPrimaryMonitor()
          ? 'pr-zrby'
          : ''}"
      >
        <RightGroup />
      </Group>
    </div>
  </div>
</div>
