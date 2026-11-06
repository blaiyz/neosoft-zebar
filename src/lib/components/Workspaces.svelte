<script lang="ts">
  import { getProcessIcon } from "#lib/icon_loader.ts";
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { partTarget, remToPx, trackPart } from "#lib/state/layout.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { getWindows } from "#lib/utils/glaze_wm_utils.ts";
  import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";
  import MousePointer2Off from "@lucide/svelte/icons/mouse-pointer-2-off";
  import {
    workspaceGaps,
    workspaceWidth,
    type WorkspaceItem
  } from "#lib/workspace_styles.ts";
  import { untrack } from "svelte";
  import {
    TilingDirection,
    type BindingModeConfig,
    type Window,
    type Workspace
  } from "glazewm";
  import AnimatedList from "./AnimatedList.svelte";
  import Reveal from "./Reveal.svelte";
  import WorkspaceRow from "./WorkspaceRow.svelte";

  /** How many process icons fit when they have to, counting the `+N`. */
  const ICON_SLOTS = 4;
  /** The width of the `+N`, in rem. */
  const MORE_WIDTH = 1.75;

  let glazewm = $derived(providers.glazewm);

  let alwaysThin = $derived(
    toggleModes.clickThrough || config.workspaces.thinButtons === true
  );
  let thin = $derived(
    alwaysThin || partTarget("workspaces.thin") !== undefined
  );
  let style = $derived(config.workspaces.style);

  let items = $derived(
    (glazewm?.currentWorkspaces ?? []).map(
      ({ id, name, isDisplayed }: Workspace): WorkspaceItem => ({
        id,
        name,
        color:
          (glazewm?.allWorkspaces.findIndex((other) => other.id === id) ?? 0) +
          1,
        current: isDisplayed
      })
    )
  );

  let windows = $derived(
    glazewm?.displayedWorkspace ? getWindows(glazewm.displayedWorkspace) : []
  );
  let iconsCapped = $derived(
    partTarget("workspaces.icons") !== undefined && windows.length > ICON_SLOTS
  );
  let shownWindows = $derived(
    iconsCapped ? windows.slice(0, ICON_SLOTS - 1) : windows
  );

  let wideButtons = $state<HTMLElement>();
  let thinButtons = $state<HTMLElement>();
  let buttons = $state<HTMLElement>();
  let icons = $state<HTMLElement>();
  let oneIcon = $state<HTMLElement>();

  const widthOf = (element: HTMLElement) =>
    element.getBoundingClientRect().width;

  $effect(() => {
    if (!wideButtons || !thinButtons || !buttons) return;
    const [wide, thin, list] = [wideButtons, thinButtons, buttons];

    return trackPart(
      "workspaces.thin",
      {
        rendered: () => widthOf(list),
        full: () => widthOf(untrack(() => alwaysThin) ? thin : wide),
        floor: () => widthOf(thin)
      },
      [wide, thin, list]
    );
  });

  $effect(() => {
    if (!icons || !oneIcon) return;
    const [list, icon] = [icons, oneIcon];
    const iconCount = () => untrack(() => windows.length);

    return trackPart(
      "workspaces.icons",
      {
        rendered: () => widthOf(list),
        full: () => iconCount() * widthOf(icon),
        floor: () =>
          iconCount() > ICON_SLOTS
            ? (ICON_SLOTS - 1) * widthOf(icon) + remToPx(MORE_WIDTH)
            : iconCount() * widthOf(icon)
      },
      [list, icon]
    );
  });
</script>

{#snippet buttonSizes(thinned: boolean)}
  <div class="flex">
    {#each items as item (item.id)}
      <div
        class={[
          "border p-1",
          style === "string" && !item.current ? "w-6 overflow-hidden" : "w-max",
          workspaceGaps[style],
          workspaceWidth(style, thinned, item.current)
        ]}
      >
        {item.name}
      </div>
    {/each}
  </div>
{/snippet}

{#if glazewm}
  <div class="flex h-full items-center">
    <!-- The whole row of buttons in both forms, whichever one is showing, and an icon. -->
    <div class="invisible absolute" aria-hidden="true">
      <div class="w-max" bind:this={wideButtons}>
        {@render buttonSizes(false)}
      </div>
      <div class="w-max" bind:this={thinButtons}>
        {@render buttonSizes(true)}
      </div>
      {#if windows[0]}
        {@const Icon = getProcessIcon(windows[0])}
        <div class="w-max" bind:this={oneIcon}>
          <span class="ml-1 flex items-center text-xl"><Icon /></span>
        </div>
      {/if}
    </div>
    <WorkspaceRow
      bind:element={buttons}
      {items}
      {style}
      {thin}
      onpick={({ name }: WorkspaceItem) =>
        glazewm.runCommand(`focus --workspace ${name}`)}
    />
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

    <div class="flex h-full" bind:this={icons}>
      <AnimatedList items={shownWindows} key={(child: Window) => child.id}>
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
      <AnimatedList
        items={iconsCapped ? [windows.length - shownWindows.length] : []}
        key={() => "more"}
      >
        {#snippet item(hidden: number)}
          <span class="ml-1 w-6 text-center text-sm">+{hidden}</span>
        {/snippet}
      </AnimatedList>
    </div>
  </div>
{/if}
