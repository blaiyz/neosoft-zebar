<script lang="ts">
  import { getProcessIcon } from "#lib/icon_loader.ts";
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { getWindows } from "#lib/utils/glaze_wm_utils.ts";
  import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";
  import MousePointer2Off from "@lucide/svelte/icons/mouse-pointer-2-off";
  import {
    TilingDirection,
    type BindingModeConfig,
    type Window,
    type Workspace
  } from "glazewm";
  import AnimatedList from "./AnimatedList.svelte";
  import Button from "./Button.svelte";
  import Reveal from "./Reveal.svelte";

  let glazewm = $derived(providers.glazewm);

  // Written out in full so that Tailwind finds and generates them.
  const workspaceTextColors = [
    "text-zb-ws-0",
    "text-zb-ws-1",
    "text-zb-ws-2",
    "text-zb-ws-3",
    "text-zb-ws-4"
  ];
  const workspaceBorderColors = [
    "border-zb-ws-0",
    "border-zb-ws-1",
    "border-zb-ws-2",
    "border-zb-ws-3",
    "border-zb-ws-4"
  ];
</script>

{#if glazewm}
  <div class="flex h-full items-center">
    <AnimatedList
      items={glazewm.currentWorkspaces}
      key={(workspace: Workspace) => workspace.id}
    >
      {#snippet item(workspace: Workspace)}
        {@const globalIndex = glazewm.allWorkspaces.findIndex(
          (ws) => ws.id === workspace.id
        )}
        {@const buttonWidth =
          toggleModes.clickThrough || config.workspaces.thinButtons === true
            ? "min-w-8"
            : "min-w-14 px-2"}
        <div class="relative mr-2 h-8">
          <!-- Takes the final width at once for the list to measure, so the list and the
               button below reach it together on the same curve. -->
          <div
            class={["invisible w-max border p-1", buttonWidth]}
            aria-hidden="true"
          >
            {workspace.name}
          </div>
          <Button
            class={[
              "absolute inset-y-0 left-0 w-max transition-[color,background-color,border-color,min-width,padding] ease-(--ease)",
              workspaceTextColors[globalIndex],
              workspace.isDisplayed && [
                workspaceBorderColors[globalIndex],
                "hover:border-current/70 active:border-current/50!"
              ],
              buttonWidth
            ]}
            callback={() =>
              glazewm.runCommand(`focus --workspace ${workspace.name}`)}
          >
            {workspace.name}
          </Button>
        </div>
      {/snippet}
    </AnimatedList>
    <button
      aria-label="tiling-direction"
      class="mx-1 flex items-center justify-center text-zb-tiling-direction"
      onclick={() => glazewm.runCommand("toggle-tiling-direction")}
    >
      <ArrowRightLeft
        class={[
          "transition",
          glazewm?.tilingDirection === TilingDirection.VERTICAL
            ? "rotate-90"
            : "rotate-0"
        ]}
      />
    </button>
    <Reveal when={toggleModes.clickThrough}>
      <MousePointer2Off class="mx-1 text-zb-click-through" />
    </Reveal>
    <AnimatedList
      items={glazewm.bindingModes.filter((mode) => mode.name !== "ct")}
      key={(mode: BindingModeConfig) => mode.name}
    >
      {#snippet item(bindingMode: BindingModeConfig)}
        <button
          class="mx-2"
          onclick={() => {
            void glazewm.runCommand(
              `wm-disable-binding-mode --name ${bindingMode.name}`
            );
          }}
        >
          {bindingMode.displayName ?? bindingMode.name}
        </button>
      {/snippet}
    </AnimatedList>

    {#if glazewm.displayedWorkspace}
      <AnimatedList
        items={getWindows(glazewm.displayedWorkspace)}
        key={(child: Window) => child.id}
      >
        {#snippet item(child: Window)}
          {@const Icon = getProcessIcon(child)}
          <span
            class={[
              "ml-1 flex items-center text-xl",
              child.hasFocus ? "text-zb-focused-process" : "text-zb-process"
            ]}
          >
            <Icon />
          </span>
        {/snippet}
      </AnimatedList>
    {/if}
  </div>
{/if}
