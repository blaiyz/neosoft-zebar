<script lang="ts">
  import { getProcessIcon } from "#lib/icon_loader.ts";
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { getWindows } from "#lib/utils/glaze_wm_utils.ts";
  import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";
  import MousePointer2Off from "@lucide/svelte/icons/mouse-pointer-2-off";
  import { TilingDirection } from "glazewm";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import Button from "./Button.svelte";
  import SmoothDiv from "./SmoothDiv.svelte";

  let glazewm = $derived(providers.glazewm);

  // The icon only exists while click-through is on, so this applies during its outro.
  let leavingClass = $derived(!toggleModes.clickThrough && "absolute");

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
    <SmoothDiv class="flex justify-end" innerClass="flex items-center">
      {#each glazewm.currentWorkspaces as workspace (workspace.id)}
        {@const globalIndex = glazewm.allWorkspaces.findIndex(
          (ws) => ws.id === workspace.id
        )}
        <div
          transition:fly={{ y: 20, duration: config.transitionDuration }}
          animate:flip={{ duration: config.transitionDuration }}
          class="mr-2"
        >
          <Button
            class={[
              "box-border h-8",
              workspaceTextColors[globalIndex],
              workspace.isDisplayed && [
                workspaceBorderColors[globalIndex],
                "hover:border-current/70 active:border-current/50!"
              ],
              toggleModes.clickThrough || config.useThinnerWorkspaceButtons
                ? "aspect-square"
                : "min-w-14 px-2"
            ]}
            callback={() =>
              glazewm.runCommand(`focus --workspace ${workspace.name}`)}
          >
            {workspace.name}
          </Button>
        </div>
      {/each}
    </SmoothDiv>
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
    <SmoothDiv class="flex justify-end" innerClass="flex items-center">
      {#if toggleModes.clickThrough}
        <span
          transition:fly={{ y: 20, duration: config.transitionDuration }}
          class="relative flex flex-row-reverse"
        >
          <MousePointer2Off
            class={[leavingClass, "mx-1 text-zb-click-through"]}
          />
        </span>
      {/if}
    </SmoothDiv>
    <SmoothDiv class="flex justify-end" innerClass="flex items-center">
      {#each glazewm.bindingModes.filter((mode) => mode.name !== "ct") as bindingMode (bindingMode.name)}
        <button
          transition:fly={{ y: 20, duration: config.transitionDuration }}
          animate:flip={{ duration: config.transitionDuration }}
          class="mx-2"
          onclick={() => {
            void glazewm.runCommand(
              `wm-disable-binding-mode --name ${bindingMode.name}`
            );
          }}
        >
          {bindingMode.displayName ?? bindingMode.name}
        </button>
      {/each}
    </SmoothDiv>

    {#if glazewm.displayedWorkspace}
      <SmoothDiv class="flex justify-end" innerClass="flex h-full items-center">
        {#each getWindows(glazewm.displayedWorkspace) as child (child.id)}
          {@const Icon = getProcessIcon(child)}
          <span
            transition:fly|global={{
              y: 20,
              duration: config.transitionDuration
            }}
            animate:flip={{ duration: config.transitionDuration }}
            class={[
              "ml-1 flex items-center text-xl",
              child.hasFocus ? "text-zb-focused-process" : "text-zb-process"
            ]}
          >
            <Icon />
          </span>
        {/each}
      </SmoothDiv>
    {/if}
  </div>
{/if}
