<script lang="ts">
  import type { WorkspaceStyle } from "#lib/config_schema.ts";
  import {
    workspaceGaps,
    workspaceWidth,
    type WorkspaceItem
  } from "#lib/workspace_styles.ts";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import AnimatedList from "./AnimatedList.svelte";

  type Props = {
    items: WorkspaceItem[];
    style: WorkspaceStyle;
    thin?: boolean;
    onpick?: (item: WorkspaceItem) => void;
    element?: HTMLElement | undefined;
  };

  let {
    items,
    style,
    thin = false,
    onpick,
    element = $bindable()
  }: Props = $props();

  type Marker = {
    x: number;
    width: number;
    total: number;
    color: number;
    /** The way it last moved, which decides which of its ends leads. */
    direction: "left" | "right";
  };

  let marker = $state.raw<Marker | null>(null);
  let hasMarker = $derived(style === "keys" || style === "track");

  /**
   * Adds up the widths instead of reading where the button is, because a list moves
   * its items with transitions, and this needs where they're going. The sizing copy
   * in each button already has its final width.
   */
  const placeMarker = (list: HTMLElement) => {
    let x = 0;
    let found: Pick<Marker, "x" | "width" | "color"> | null = null;

    for (const item of items) {
      const button = list.querySelector<HTMLElement>(
        `[data-workspace="${CSS.escape(item.id)}"]`
      );
      const width = button?.offsetWidth ?? 0;
      if (item.current) found = { x, width, color: item.color };
      x += width;
      if (button) x += parseFloat(getComputedStyle(button).marginRight);
    }

    const last = untrack(() => marker);
    marker = found && {
      ...found,
      total: x,
      direction: last && found.x < last.x ? "left" : "right"
    };
  };

  const followCurrent: Attachment<HTMLElement> = (list) => {
    const observer = new ResizeObserver(() => {
      placeMarker(list);
    });
    observer.observe(list);

    $effect(() => {
      placeMarker(list);
    });

    return () => {
      observer.disconnect();
    };
  };
</script>

<div
  bind:this={element}
  class={["row relative h-full", style]}
  {@attach followCurrent}
>
  {#if hasMarker && marker}
    <span class="frame" style:width="{marker.total}px">
      <span
        class={["marker", marker.direction]}
        style:--c="hsl(var(--ws-{marker.color}))"
        style:left="{marker.x}px"
        style:right="{marker.total - marker.x - marker.width}px"
      ></span>
    </span>
  {/if}
  <AnimatedList {items} key={(item: WorkspaceItem) => item.id}>
    {#snippet item(item: WorkspaceItem)}
      {@const width = workspaceWidth(style, thin, item.current)}
      <div
        class={["relative h-8", workspaceGaps[style]]}
        data-workspace={item.id}
      >
        <!-- Takes the final width at once for the list to measure, so the list and the
           button below reach it together on the same curve. -->
        <div
          class={[
            "invisible border p-1",
            style === "string" && !item.current
              ? "w-6 overflow-hidden"
              : "w-max",
            width
          ]}
          aria-hidden="true"
        >
          {item.label}
        </div>
        <button
          class={[
            "workspace absolute left-0 flex w-max items-center justify-center border border-transparent p-1",
            item.current && "current font-semibold",
            item.empty && "empty",
            width
          ]}
          style:--c="hsl(var(--ws-{item.color}))"
          aria-current={item.current}
          onclick={() => onpick?.(item)}
        >
          {#if style === "string"}<i></i>{/if}
          <span>{item.label}</span>
        </button>
      </div>
    {/snippet}
  </AnimatedList>
</div>

<style>
  .frame {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }

  .marker {
    position: absolute;
    top: 50%;
    color: var(--c);
  }

  /* The end it's moving towards gets there first, which stretches it on the way. */
  .marker.right {
    transition:
      left calc(var(--time-soft) * 1.4) var(--spring-soft),
      right calc(var(--time-soft) * 0.75) var(--spring-soft),
      color var(--transition-duration) var(--spring-out);
  }

  .marker.left {
    transition:
      left calc(var(--time-soft) * 0.75) var(--spring-soft),
      right calc(var(--time-soft) * 1.4) var(--spring-soft),
      color var(--transition-duration) var(--spring-out);
  }

  .workspace {
    top: 50%;
    height: 1.7rem;
    border-radius: 999px;
    color: var(--c);
    translate: 0 -50%;
    transition:
      color var(--transition-duration) var(--ease),
      background-color var(--transition-duration) var(--ease),
      min-width var(--transition-duration) var(--ease),
      padding var(--transition-duration) var(--ease),
      opacity var(--transition-duration) var(--ease),
      scale var(--time-soft) var(--spring-soft);
  }

  /* A kept-alive workspace with nothing on it. */
  .workspace.empty:not(.current, :hover) {
    opacity: 0.55;
  }

  .workspace:active {
    scale: 0.92;
  }

  .row {
    margin-right: 0.35rem;
  }

  /* Keys: tinted buttons, and a ring that goes to the current one. */
  .keys .workspace {
    border-radius: var(--control-radius);
    background: color-mix(in srgb, currentColor 24%, hsl(var(--bg)));
    box-shadow: inset 0 -0.12rem 0
      color-mix(in srgb, currentColor 34%, hsl(var(--bg)));
  }

  .keys .workspace:hover {
    background: color-mix(in srgb, currentColor 34%, hsl(var(--bg)));
  }

  .keys .marker {
    height: 2.15rem;
    margin-top: -1.075rem;
    margin-inline: -0.22rem;
    border: 0.125rem solid currentColor;
    border-radius: calc(var(--control-radius) + 0.2rem);
  }

  /* Track: one groove for all of them, and a bead that stretches across it. */
  .row.track {
    margin-inline: 0.15rem 0.75rem;
  }

  .row.track::before {
    content: "";
    position: absolute;
    top: 50%;
    right: -0.15rem;
    left: -0.15rem;
    height: 2rem;
    margin-top: -1rem;
    border-radius: 999px;
    background: var(--surface-2);
  }

  .track .marker {
    height: 1.7rem;
    margin-top: -0.85rem;
    border-radius: 999px;
    background: currentColor;
  }

  .track .workspace.current {
    color: hsl(var(--bg));
  }

  .track .workspace:not(.current):hover {
    background: color-mix(in srgb, currentColor 16%, transparent);
  }

  /* String: a dot for each workspace that isn't current, with its name on hover. */
  .string i {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    background: var(--c);
    translate: -50% -50%;
    transition:
      opacity var(--transition-duration) var(--spring-out),
      width var(--time-soft) var(--spring-soft),
      height var(--time-soft) var(--spring-soft);
  }

  .string span {
    position: absolute;
    opacity: 0;
    transition: opacity var(--transition-duration) var(--spring-out);
  }

  .row.string {
    margin-right: 0.6rem;
  }

  .string .workspace:hover:not(.current) i {
    opacity: 0;
  }

  .string .workspace:hover span {
    opacity: 1;
  }

  .string .current i {
    width: 100%;
    height: 1.7rem;
  }

  .string .current span {
    position: relative;
    color: hsl(var(--bg));
    opacity: 1;
  }

  /* Solid: a tinted bead each, and the current one filled with its color. */
  .solid .workspace {
    background: color-mix(in srgb, currentColor 20%, hsl(var(--bg)));
  }

  .solid .workspace:hover {
    background: color-mix(in srgb, currentColor 32%, hsl(var(--bg)));
  }

  .solid .workspace.current {
    background: var(--c);
    color: hsl(var(--bg));
    animation: land var(--time-soft) var(--spring-pop);
  }

  @keyframes land {
    from {
      scale: 0.84;
    }
  }
</style>
