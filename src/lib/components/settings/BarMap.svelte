<script lang="ts">
  import { toLabel } from "#lib/config_form.ts";
  import {
    arrange,
    barGroups,
    isOneOf,
    itemOf,
    pillSections,
    type Arrangement,
    type BarItem,
    type BarPart
  } from "#lib/sections.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import {
    nearestArrangement,
    placeItems,
    type MapSizes
  } from "#lib/utils/bar_map.ts";
  import BatteryMedium from "@lucide/svelte/icons/battery-medium";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Clock from "@lucide/svelte/icons/clock";
  import CloudSun from "@lucide/svelte/icons/cloud-sun";
  import Cpu from "@lucide/svelte/icons/cpu";
  import HardDrive from "@lucide/svelte/icons/hard-drive";
  import Heart from "@lucide/svelte/icons/heart";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import Layers from "@lucide/svelte/icons/layers";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Music from "@lucide/svelte/icons/music";
  import PanelBottom from "@lucide/svelte/icons/panel-bottom";
  import Power from "@lucide/svelte/icons/power";
  import Settings from "@lucide/svelte/icons/settings";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import Wifi from "@lucide/svelte/icons/wifi";
  import type { Component } from "svelte";
  import { on } from "svelte/events";

  type Props = { selected: BarPart; onpick: (part: BarPart) => void };

  let { selected, onpick }: Props = $props();

  /** How far a press has to move, in pixels, before it drags. */
  const DRAG_START = 4;

  const icons: Record<BarPart, Component> = {
    settings: Settings,
    power: Power,
    heart: Heart,
    cpu: Cpu,
    memory: MemoryStick,
    disk: HardDrive,
    battery: BatteryMedium,
    network: Wifi,
    workspaces: Layers,
    taskbar: PanelBottom,
    media: Music,
    tray: ChevronUp,
    keyboard: Keyboard,
    volume: Volume2,
    weather: CloudSun,
    clock: Clock
  };

  let row = $state<HTMLElement>();
  let width = $state(0);
  let rem = $state(16);

  let stored = $derived(arrange(config.arrangement));
  let taskbar = $derived(config.taskbarIntegration.enabled);

  type Drag = {
    item: BarItem;
    /** The arrangement as it would be if the item were dropped now. */
    arrangement: Arrangement;
    /** The item's left edge, following the pointer. */
    left: number;
    /** The order of the items in the page, which doesn't change during a drag. */
    order: BarItem[];
  };
  let drag = $state.raw<Drag | null>(null);
  let justDragged = false;

  let sizes = $derived<MapSizes>({
    item: 2 * rem,
    pad: 0.375 * rem,
    gap: 1 * rem,
    edge: 0.75 * rem
  });
  const place = (arrangement: Arrangement) =>
    placeItems(arrangement, width, sizes, taskbar);

  let shown = $derived(drag?.arrangement ?? stored);
  let layout = $derived(place(shown));
  let order = $derived(drag?.order ?? barGroups.flatMap((g) => stored[g]));

  const placed = (item: BarItem) =>
    layout.items.find((other) => other.item === item);

  /** The left edge of an item, which is the pointer's while it's dragged. */
  const leftOf = (item: BarItem) =>
    drag?.item === item ? drag.left : (placed(item)?.left ?? 0);

  let bead = $derived.by(() => {
    const item = itemOf(selected);
    const offset = isOneOf(pillSections, selected)
      ? pillSections.indexOf(selected)
      : 0;
    return leftOf(item) + offset * layout.item;
  });

  // Nothing animates until the map has its width, so that it doesn't fly in.
  let ready = $state(false);
  $effect(() => {
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (width === 0) return;
    const frame = requestAnimationFrame(() => {
      ready = true;
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  });

  const isOff = (part: BarPart) => {
    if (part === "workspaces") return false;
    if (part === "taskbar") return !taskbar;
    return config.sections[part] === false;
  };

  const save = (arrangement: Arrangement) => {
    if (JSON.stringify(arrangement) === JSON.stringify(stored)) return;
    updateSetting("arrangement", arrangement);
  };

  const startDrag = (event: PointerEvent, item: BarItem) => {
    if (event.button !== 0 || item === "taskbar" || !row) return;

    const rowLeft = row.getBoundingClientRect().left;
    const startX = event.clientX;
    const grab = startX - rowLeft - leftOf(item);
    const itemWidth = placed(item)?.width ?? 0;
    const startOrder = order;

    const move = (moved: PointerEvent) => {
      if (!drag && Math.abs(moved.clientX - startX) < DRAG_START) return;

      const left = Math.min(
        Math.max(moved.clientX - rowLeft - grab, 0),
        width - itemWidth
      );
      const from = drag?.arrangement ?? stored;
      drag = {
        item,
        left,
        order: startOrder,
        arrangement: nearestArrangement(from, item, left + itemWidth / 2, place)
      };
    };

    const end = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
      removeEventListener("pointercancel", end);
      if (!drag) return;

      justDragged = true;
      setTimeout(() => {
        justDragged = false;
      });
      save(drag.arrangement);
      drag = null;
    };

    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
  };
</script>

{#snippet button(part: BarPart)}
  {@const Icon = icons[part]}
  <button
    class={["part", part === selected && "on", isOff(part) && "off"]}
    style:width="{layout.item}px"
    data-part={part}
    aria-label={toLabel(part)}
    aria-pressed={part === selected}
    title={part === "taskbar"
      ? "Taskbar integration"
      : `${toLabel(part)}. Drag to move it.`}
    onclick={() => {
      if (!justDragged) onpick(part);
    }}
  >
    <Icon />
  </button>
{/snippet}

<div
  class="wall flex h-22 flex-none flex-col justify-end overflow-hidden rounded-well"
>
  <p class="mb-auto px-6 pt-2 text-sm text-zb-text/80">
    Click part of your bar to change it, or drag it to another place
  </p>
  <div
    bind:this={row}
    bind:clientWidth={width}
    class={["row relative h-10", ready && "ready"]}
  >
    {#each barGroups as group (group)}
      {@const shape = layout.groups[group]}
      <span
        class={["group", shape.empty && "empty"]}
        style:translate="{shape.left}px 0"
        style:width="{shape.width}px"
      ></span>
    {/each}
    <span
      class={["bead", drag?.item === itemOf(selected) && "held"]}
      style:translate="{bead}px 0"
      style:width="{layout.item}px"
    ></span>
    {#each order as item (item)}
      <div
        class={["item", drag?.item === item && "held"]}
        style:translate="{leftOf(item)}px 0"
        {@attach (element) =>
          on(element, "pointerdown", (event) => {
            startDrag(event, item);
          })}
      >
        {#if item === "buttons"}
          <span class="pill">
            {#each pillSections as id (id)}{@render button(id)}{/each}
          </span>
        {:else}
          {@render button(item)}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .wall {
    --fill: color-mix(in srgb, hsl(var(--volume-start)) 34%, hsl(var(--bg)));
    --fill-end: color-mix(in srgb, hsl(var(--volume-end)) 34%, hsl(var(--bg)));
    background: linear-gradient(100deg, var(--fill), var(--fill-end));
  }

  .row {
    touch-action: none;
  }

  /* Each group of the bar, which is what the items are dragged between. */
  .group {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: var(--well-radius) var(--well-radius) 0 0;
    background: hsl(var(--bg));
  }

  .group.empty {
    border: 2px dashed color-mix(in srgb, hsl(var(--text)) 30%, transparent);
    border-bottom: 0;
    background: color-mix(in srgb, hsl(var(--bg)) 40%, transparent);
  }

  .bead {
    position: absolute;
    top: 0.25rem;
    left: 0;
    height: 2rem;
    border-radius: 999px;
    background: color-mix(in srgb, hsl(var(--tone)) 30%, hsl(var(--bg)));
  }

  .item {
    position: absolute;
    top: 0.25rem;
    left: 0;
    display: flex;
    height: 2rem;
    cursor: grab;
  }

  .ready .group,
  .ready .bead,
  .ready .item {
    transition:
      translate var(--time-soft) var(--spring-soft),
      width var(--time-soft) var(--spring-soft);
  }

  .ready .held {
    z-index: 1;
    cursor: grabbing;
    transition: width var(--time-soft) var(--spring-soft);
  }

  .item.held {
    border-radius: 999px;
    background: hsl(var(--bg));
    filter: drop-shadow(0 0.25rem 0.5rem hsl(var(--shadow) / 0.35));
  }

  .pill {
    display: flex;
    border-radius: 999px;
    background: color-mix(in srgb, hsl(var(--text)) 8%, transparent);
  }

  .part {
    position: relative;
    display: grid;
    height: 2rem;
    flex: none;
    place-items: center;
    border-radius: 50%;
    color: var(--dim);
    cursor: inherit;
    transition:
      color var(--transition-duration) var(--spring-out),
      opacity var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .part:hover {
    color: hsl(var(--text));
  }

  .part:active {
    scale: 0.9;
  }

  .part.off {
    opacity: 0.45;
  }

  .part.on {
    color: hsl(var(--tone));
    opacity: 1;
  }
</style>
