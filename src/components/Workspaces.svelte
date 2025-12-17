<script lang="ts">
  import type { Window, Workspace } from "glazewm";

  import { config } from "$lib/config.svelte";
  import iconMap from "$lib/icon_loader";
  import ignoredApps from "$lib/ignored_apps.json";
  import { providers } from "$lib/providers.svelte";
  import { getWindows } from "$lib/utils/glaze_wm_utils.svelte";
  import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";
  import MousePointer2Off from "@lucide/svelte/icons/mouse-pointer-2-off";
  import type { Icon as IconType } from "@tabler/icons-svelte";
  import Background from "@tabler/icons-svelte/icons/background";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import Button from "./Button.svelte";
  import SmoothDiv from "./SmoothDiv.svelte";
  import { toggleModes } from "$lib/binding_modes.svelte";

  const getProcessIcon = (child: Window): IconType => {
    const possibleAppNames = [
      child.title.toLowerCase(),
      child.processName.toLowerCase()
    ];

    if (
      ignoredApps.some((app) =>
        possibleAppNames.includes(app.name.toLowerCase())
      )
    ) {
      return Background;
    }

    let entry = iconMap.find((entry) =>
      entry.appNames
        .map((name) => name.toLowerCase())
        .some((name) => possibleAppNames.includes(name))
    );

    if (entry) {
      return entry.icon;
    }

    // Fallback
    return Background;
  };
  let glazewm = $derived(providers.glazewm);

  const workspaceEquals = (ws1: Workspace, ws2: Workspace) => {
    return ws1.id === ws2.id;
  };
</script>

{#if glazewm}
  <div class="flex items-center h-full">
    <SmoothDiv outerClass="flex justify-end" innerClass="flex items-center">
      {#each glazewm.currentWorkspaces as workspace (workspace.id)}
        {@const globalIndex = glazewm.allWorkspaces.findIndex((ws) =>
          workspaceEquals(ws, workspace)
        )}
        <div
          transition:fly={{ y: 20, duration: config.transitionDuration }}
          animate:flip={{ duration: config.transitionDuration }}
          class="mr-2"
        >
          <Button
            class="h-[2rem] box-border text-zb-ws-{globalIndex} {workspace.isDisplayed
              ? `border-zb-ws-${globalIndex} hover:border-blend-70 active:!border-blend-50`
              : ''} {toggleModes.clickThrough
              ? 'aspect-square'
              : 'min-w-14 px-2'}"
            callback={() =>
              glazewm!.runCommand(`focus --workspace ${workspace.name}`)}
          >
            {workspace.name}
          </Button>
        </div>
      {/each}
    </SmoothDiv>
    <button
      aria-label="tiling-direction"
      class="flex items-center justify-center mx-1 text-zb-tiling-direction"
      onclick={() => glazewm!.runCommand("toggle-tiling-direction")}
    >
      <ArrowRightLeft
        class="transition transform {glazewm?.tilingDirection === 'vertical'
          ? 'rotate-90'
          : 'rotate-0'}"
      />
    </button>
    <SmoothDiv outerClass="flex justify-end" innerClass="flex items-center">
      {#if toggleModes.clickThrough}
        <span
          transition:fly={{ y: 20, duration: config.transitionDuration }}
          class="relative flex flex-row-reverse"
        >
          <MousePointer2Off
            class="{toggleModes.clickThrough
              ? ''
              : 'absolute'} text-zb-click-through mx-1"
          />
        </span>
      {/if}
    </SmoothDiv>
    <SmoothDiv outerClass="flex justify-end" innerClass="flex items-center">
      {#each glazewm.bindingModes.filter((mode) => mode.name !== "ct") as bindingMode (bindingMode.name)}
        <button
          transition:fly={{ y: 20, duration: config.transitionDuration }}
          animate:flip={{ duration: config.transitionDuration }}
          class="mx-[0.5rem]"
          onclick={() => {
            glazewm!.runCommand(
              `wm-disable-binding-mode --name ${bindingMode.name}`
            );
          }}
        >
          {bindingMode.displayName ?? bindingMode.name}
        </button>
      {/each}
    </SmoothDiv>

    {#if glazewm.displayedWorkspace}
      <SmoothDiv
        outerClass="flex justify-end"
        innerClass="flex items-center h-full"
      >
        {#each getWindows(glazewm.displayedWorkspace) as child (child.id)}
          {@const icon = getProcessIcon(child as Window)}
          <span
            transition:fly|global={{
              y: 20,
              duration: config.transitionDuration
            }}
            animate:flip={{ duration: config.transitionDuration }}
            class="flex items-center text-xl ml-1 {child.hasFocus
              ? 'text-zb-focused-process'
              : 'text-zb-process'}"
          >
            <!-- svelte-ignore svelte_component_deprecated -->
            <!-- actually stupid, svelte doesn't render correctly when doing `{icon}` -->
            <svelte:component this={icon} />
          </span>
        {/each}
      </SmoothDiv>
    {/if}
  </div>
{/if}
