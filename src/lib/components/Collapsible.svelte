<script lang="ts">
  import type { PartId } from "#lib/sections.ts";
  import { motion } from "#lib/state/motion.svelte.ts";
  import { layout, partTarget, trackPart } from "#lib/state/layout.svelte.ts";
  import type { Snippet } from "svelte";
  import { tick, untrack } from "svelte";
  import type { ClassValue } from "svelte/elements";

  /**
   * Content that can hide, because of `when` or because the bar ran out of room.
   *
   * The width animates through a grid track going between `0fr` and `1fr`, which
   * takes its size from the content on every frame. Unlike `AnimatedList`, which
   * sets a width and transitions to it, it can't lag behind content that's changing
   * width. Content collapsed for room stays rendered at its full width inside the
   * clipped track, so it can still be measured. Content hidden by `when` leaves the
   * page once it has closed, so that it stops working.
   */
  type Props = {
    /** The part of the bar this is, if the bar can collapse it. */
    part?: PartId | undefined;
    when?: boolean;
    /** The side that stays still while the width changes. */
    anchor?: "start" | "end";
    /** Whether it flies in and out. If not, the changing width reveals it. */
    fly?: boolean;
    /** Replaces the measured width, for content that's already being limited. */
    full?: () => number;
    floor?: () => number;
    class?: ClassValue;
    children: Snippet;
  };

  let {
    part,
    when = true,
    anchor = "start",
    fly = true,
    full,
    floor,
    class: className,
    children
  }: Props = $props();

  let track = $state<HTMLElement>();
  let content = $state<HTMLElement>();

  let rendered = $state(untrack(() => when));
  /** Whether `when` has been true for long enough to open from closed. */
  let entered = $state(untrack(() => when));
  let open = $derived(entered && (!part || partTarget(part) !== 0));

  $effect(() => {
    if (!when) {
      entered = false;
      const timer = setTimeout(
        () => {
          rendered = false;
        },
        untrack(() => motion.duration)
      );
      return () => {
        clearTimeout(timer);
      };
    }

    // Still there on its way out, or before anything animates, it opens at once.
    if (untrack(() => rendered || !layout.ready)) {
      rendered = true;
      entered = true;
      return;
    }

    rendered = true;
    // A transition starts from the style the content had once it was on the page,
    // which reading the layout settles without waiting for a frame that a hidden
    // window wouldn't get.
    let cancelled = false;
    void tick().then(() => {
      if (cancelled) return;
      track?.getBoundingClientRect();
      entered = true;
    });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (!part || !track || !content) return;
    const outer = track;
    const inner = content;

    return trackPart(
      part,
      {
        rendered: () => outer.getBoundingClientRect().width,
        full: () => {
          if (!untrack(() => when)) return 0;
          return full?.() ?? inner.getBoundingClientRect().width;
        },
        floor
      },
      [outer, inner]
    );
  });
</script>

<div
  bind:this={track}
  class={["track", anchor]}
  class:open
  class:fly
  class:animated={layout.ready}
  inert={!open}
>
  <div class="clip">
    <div bind:this={content} class={["content", className]}>
      {#if rendered}{@render children()}{/if}
    </div>
  </div>
</div>

<style>
  .track {
    display: grid;
    height: 100%;
    flex: none;
    grid-template-columns: 0fr;
  }

  .track.open {
    grid-template-columns: 1fr;
  }

  .track.animated {
    transition: grid-template-columns var(--transition-duration) var(--ease);
  }

  .clip {
    display: flex;
    height: 100%;
    min-width: 0;
    overflow-x: clip;
  }

  /* These go one level at a time, because one of these can be inside another. */
  .track.end > .clip {
    justify-content: flex-end;
  }

  /* Leaves room for what's inside to scale up on hover. */
  .track.open > .clip {
    overflow-clip-margin: 0.5rem;
  }

  .content {
    display: flex;
    width: max-content;
    height: 100%;
    flex: none;
    align-items: center;
  }

  .track.fly:not(.open) > .clip > .content {
    opacity: 0;
    transform: translateY(var(--fly-from));
  }

  /* Nothing hidden keeps animating. */
  .track:not(.open) > .clip > .content :global(*) {
    animation-play-state: paused;
  }

  .track.animated > .clip > .content {
    transition:
      opacity var(--transition-duration) var(--ease),
      transform var(--transition-duration) var(--ease);
  }
</style>
