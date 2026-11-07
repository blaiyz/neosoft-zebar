<script lang="ts" generics="T extends string">
  import { updateSetting } from "#lib/state/config.svelte.ts";
  import Check from "@lucide/svelte/icons/check";
  import type { Snippet } from "svelte";

  type Props = {
    /** The setting it changes, by its dotted path. */
    path: string;
    label: string;
    value: T;
    options: { value: T; label: string; note: string }[];
    /** Draws an option, and whether the pointer is over it. */
    preview: Snippet<[T, boolean]>;
  };

  let { path, label, value, options, preview }: Props = $props();

  let hovered = $state<T | null>(null);

  const pick = (next: T) => {
    updateSetting(path, next);
  };

  const onKeyDown = (event: KeyboardEvent, next: T) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    pick(next);
  };
</script>

<div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label}>
  {#each options as option (option.value)}
    <!-- A preview holds real buttons, which rules out a button around it. -->
    <div
      class={["tile", option.value === value && "on"]}
      role="radio"
      aria-checked={option.value === value}
      tabindex="0"
      onclick={() => {
        pick(option.value);
      }}
      onkeydown={(event) => {
        onKeyDown(event, option.value);
      }}
      onpointerenter={() => (hovered = option.value)}
      onpointerleave={() => (hovered = null)}
    >
      <div class="scene">
        <div class="group-shape" inert>
          {@render preview(option.value, hovered === option.value)}
        </div>
      </div>
      <div class="flex items-center justify-between px-2.5 pt-2">
        <span class="font-semibold">{option.label}</span>
        <span class="check"><Check /></span>
      </div>
      <p class="px-2.5 pb-2 text-sm text-zb-dim">{option.note}</p>
    </div>
  {/each}
</div>

<style>
  .tile {
    overflow: hidden;
    border-radius: var(--control-radius);
    background: var(--surface-1);
    cursor: pointer;
    outline: 0.125rem solid transparent;
    outline-offset: -0.125rem;
    transition:
      background-color var(--transition-duration) var(--spring-out),
      outline-color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .tile:hover {
    background: var(--surface-2);
  }

  .tile:active {
    scale: 0.98;
  }

  .tile.on {
    outline-color: hsl(var(--tone));
  }

  .scene {
    display: flex;
    height: 4.6rem;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
    --fill: color-mix(in srgb, hsl(var(--volume-start)) 34%, hsl(var(--bg)));
    --fill-end: color-mix(in srgb, hsl(var(--volume-end)) 34%, hsl(var(--bg)));
    background: linear-gradient(100deg, var(--fill), var(--fill-end));
  }

  .group-shape {
    display: flex;
    max-width: 96%;
    height: 2.7rem;
    align-items: center;
    padding-inline: 0.7rem;
    border-radius: var(--radius) var(--radius) 0 0;
    background: hsl(var(--bg));
    pointer-events: none;
  }

  .check {
    display: grid;
    color: hsl(var(--tone));
    opacity: 0;
    scale: 0.5;
    transition:
      opacity var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-pop);
  }

  .on .check {
    opacity: 1;
    scale: 1;
  }
</style>
