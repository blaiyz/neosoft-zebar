<script lang="ts">
  import { toLabel } from "#lib/config_form.ts";
  import { leftSections, rightSections, type BarPart } from "#lib/sections.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import BatteryMedium from "@lucide/svelte/icons/battery-medium";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Clock from "@lucide/svelte/icons/clock";
  import CloudSun from "@lucide/svelte/icons/cloud-sun";
  import Cpu from "@lucide/svelte/icons/cpu";
  import Heart from "@lucide/svelte/icons/heart";
  import Layers from "@lucide/svelte/icons/layers";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Music from "@lucide/svelte/icons/music";
  import Power from "@lucide/svelte/icons/power";
  import Settings from "@lucide/svelte/icons/settings";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import Wifi from "@lucide/svelte/icons/wifi";
  import type { Component } from "svelte";

  type Props = { selected: BarPart; onpick: (part: BarPart) => void };

  let { selected, onpick }: Props = $props();

  const icons: Record<BarPart, Component> = {
    settings: Settings,
    power: Power,
    heart: Heart,
    cpu: Cpu,
    memory: MemoryStick,
    battery: BatteryMedium,
    network: Wifi,
    workspaces: Layers,
    media: Music,
    tray: ChevronUp,
    volume: Volume2,
    weather: CloudSun,
    clock: Clock
  };

  let bar = $state<HTMLElement>();
  let beadX = $state(0);

  $effect(() => {
    const button = bar?.querySelector<HTMLElement>(`[data-part="${selected}"]`);
    if (button) beadX = button.offsetLeft;
  });

  const isOff = (part: BarPart) =>
    part !== "workspaces" && config.sections[part] === false;
</script>

{#snippet item(part: BarPart)}
  {@const Icon = icons[part]}
  <button
    class={["part", part === selected && "on", isOff(part) && "off"]}
    data-part={part}
    aria-label={toLabel(part)}
    aria-pressed={part === selected}
    title={toLabel(part)}
    onclick={() => {
      onpick(part);
    }}
  >
    <Icon />
  </button>
{/snippet}

<div
  class="wall flex h-22 flex-none flex-col justify-end overflow-hidden rounded-well px-6"
>
  <p class="mb-auto pt-2 text-sm text-zb-text/80">
    Click part of your bar to change it
  </p>
  <div
    bind:this={bar}
    class="bar relative flex h-10 items-center justify-between px-2"
  >
    <span class="bead" style:--bead-x="{beadX}px"></span>
    <div class="flex items-center">
      {#each leftSections as part (part)}{@render item(part)}{/each}
    </div>
    {@render item("workspaces")}
    <div class="flex items-center">
      {#each rightSections as part (part)}{@render item(part)}{/each}
    </div>
  </div>
</div>

<style>
  .wall {
    background: linear-gradient(
      100deg,
      color-mix(in srgb, hsl(var(--volume-start)) 34%, hsl(var(--bg))),
      color-mix(in srgb, hsl(var(--volume-end)) 34%, hsl(var(--bg)))
    );
  }

  .bar {
    border-radius: var(--well-radius) var(--well-radius) 0 0;
    background: hsl(var(--bg));
  }

  .bead {
    position: absolute;
    top: 0.25rem;
    left: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: color-mix(in srgb, hsl(var(--tone)) 30%, hsl(var(--bg)));
    translate: var(--bead-x) 0;
    transition: translate var(--time-soft) var(--spring-soft);
  }

  .part {
    position: relative;
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: none;
    place-items: center;
    border-radius: 50%;
    color: var(--dim);
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
