<script lang="ts">
  import { flyoutViews } from "#lib/flyouts.ts";
  import type { FlyoutRequest } from "#lib/state/flyouts.svelte.ts";
  import { untrack } from "svelte";

  type Props = {
    request: FlyoutRequest;
    /** On its way out, for as long as that takes. */
    closing: boolean;
    onclose: () => void;
  };

  let { request, closing, onclose }: Props = $props();

  // Each request gets a panel of its own, so that nothing carries over from the last.
  const { view, opensUp, left, right } = untrack(() => request);

  let panel = $state<HTMLElement>();

  /** Part of the window is see-through, so that the panel can be any height. */
  const onPointerDown = ({ target }: PointerEvent) => {
    if (target instanceof Node && !panel?.contains(target)) onclose();
  };

  const onKeyDown = ({ key }: KeyboardEvent) => {
    if (key === "Escape") onclose();
  };
</script>

<svelte:window onpointerdown={onPointerDown} onkeydown={onKeyDown} />

<div
  class={["stage", opensUp ? "up" : "down", left ? "melted" : "floating"]}
  class:closing
  class:flare-left={left === "flare"}
  class:flare-right={right === "flare"}
>
  {#if left === "flare"}<span class="flare left"></span>{/if}
  {#if right === "flare"}<span class="flare right"></span>{/if}
  <div
    bind:this={panel}
    class={[
      "panel",
      left === "overhang" && "round-left",
      right === "overhang" && "round-right"
    ]}
  >
    <div class="scroller font-zb text-zb-size font-base text-zb-text">
      {#await flyoutViews[view].load() then { default: View }}
        <div class="view flex flex-col gap-3">
          <View />
        </div>
      {/await}
    </div>
  </div>
</div>

<style>
  .stage {
    position: relative;
    display: flex;
    height: 100%;
    overflow: hidden;
  }

  .stage.up {
    align-items: flex-end;
  }

  .stage.down {
    align-items: flex-start;
  }

  .stage.floating {
    padding: 0.5rem;
  }

  .stage.flare-left {
    padding-left: var(--radius);
  }

  .stage.flare-right {
    padding-right: var(--radius);
  }

  .panel {
    position: relative;
    display: flex;
    width: 100%;
    max-height: 100%;
    min-height: 0;
    background: hsl(var(--bg));
    transition: translate var(--time-melt) var(--spring-melt);
  }

  .up .panel {
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .down .panel {
    border-radius: 0 0 var(--radius) var(--radius);
  }

  .up .panel.round-left {
    border-bottom-left-radius: var(--radius);
  }

  .up .panel.round-right {
    border-bottom-right-radius: var(--radius);
  }

  .down .panel.round-left {
    border-top-left-radius: var(--radius);
  }

  .down .panel.round-right {
    border-top-right-radius: var(--radius);
  }

  .floating .panel {
    border-radius: var(--radius);
    box-shadow: 0 0.4rem 1rem -0.4rem hsl(var(--shadow));
    transition:
      translate var(--time-soft) var(--spring-melt),
      scale var(--time-soft) var(--spring-melt),
      opacity var(--transition-duration) var(--spring-out);
  }

  .scroller {
    min-width: 0;
    flex: 1;
    overflow: hidden auto;
    padding: 1.25rem;
    border-radius: inherit;
  }

  /* A scrollbar isn't clipped to rounded corners, so it stops short of them. */
  .scroller::-webkit-scrollbar-track {
    margin-block: var(--radius);
  }

  .up.closing .panel {
    translate: 0 100%;
  }

  .down.closing .panel {
    translate: 0 -100%;
  }

  .closing .panel {
    transition: translate var(--time-exit) var(--spring-out);
  }

  .floating.closing .panel {
    opacity: 0;
    scale: 0.94;
    translate: 0;
    transition:
      opacity var(--time-exit) var(--spring-out),
      scale var(--time-exit) var(--spring-out);
  }

  @starting-style {
    .up .panel {
      translate: 0 100%;
    }

    .down .panel {
      translate: 0 -100%;
    }

    .floating .panel {
      opacity: 0;
      scale: 0.94;
      translate: 0;
    }

    .up.floating .panel {
      translate: 0 0.7rem;
    }

    .down.floating .panel {
      translate: 0 -0.7rem;
    }
  }

  .flare {
    --fill: hsl(var(--bg));
    position: absolute;
    width: var(--radius);
    height: var(--radius);
    scale: 1;
    transition: scale var(--time-soft) var(--spring-melt);
  }

  .closing .flare {
    scale: 0;
    transition: scale var(--time-exit) var(--spring-out);
  }

  @starting-style {
    .flare {
      scale: 0;
    }
  }

  .up .flare {
    bottom: 0;
  }

  .down .flare {
    top: 0;
  }

  .flare.left {
    left: 0;
  }

  .flare.right {
    right: 0;
  }

  .up .flare.left {
    transform-origin: 100% 100%;
    background: radial-gradient(
      circle at 0 0,
      transparent calc(var(--radius) - 0.5px),
      var(--fill) var(--radius)
    );
  }

  .up .flare.right {
    transform-origin: 0 100%;
    background: radial-gradient(
      circle at 100% 0,
      transparent calc(var(--radius) - 0.5px),
      var(--fill) var(--radius)
    );
  }

  .down .flare.left {
    transform-origin: 100% 0;
    background: radial-gradient(
      circle at 0 100%,
      transparent calc(var(--radius) - 0.5px),
      var(--fill) var(--radius)
    );
  }

  .down .flare.right {
    transform-origin: 0 0;
    background: radial-gradient(
      circle at 100% 100%,
      transparent calc(var(--radius) - 0.5px),
      var(--fill) var(--radius)
    );
  }

  /* Each row comes in a moment after the one before it. */
  .view > :global(*) {
    animation: arrive var(--time-soft) var(--spring-soft) backwards;
    animation-delay: calc(var(--time-soft) * 0.08 * var(--row, 8));
  }

  .view > :global(:nth-child(1)) {
    --row: 1;
  }

  .view > :global(:nth-child(2)) {
    --row: 2;
  }

  .view > :global(:nth-child(3)) {
    --row: 3;
  }

  .view > :global(:nth-child(4)) {
    --row: 4;
  }

  .view > :global(:nth-child(5)) {
    --row: 5;
  }

  .view > :global(:nth-child(6)) {
    --row: 6;
  }

  .view > :global(:nth-child(7)) {
    --row: 7;
  }

  @keyframes arrive {
    from {
      opacity: 0;
      translate: 0 0.6rem;
    }
  }
</style>
