<script lang="ts">
  import type { AttachmentDirection } from "#lib/config_schema.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { melt } from "#lib/state/flyouts.svelte.ts";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children: Snippet;
    class?: ClassValue;
    innerClass?: ClassValue;
    leftCurve?: boolean;
    rightCurve?: boolean;
  };

  let {
    children,
    class: className,
    innerClass,
    leftCurve = true,
    rightCurve = true
  }: Props = $props();

  const curve = (
    left: boolean,
    right: boolean,
    direction: AttachmentDirection
  ) => {
    switch (direction) {
      case "bottom":
        if (left && right) return "rounded-t-base";
        if (left) return "rounded-tl-base";
        if (right) return "rounded-tr-base";
        return "";
      case "top":
        if (left && right) return "rounded-b-base";
        if (left) return "rounded-bl-base";
        if (right) return "rounded-br-base";
        return "";
      case "floating":
        if (left && right) return "rounded-base";
        if (left) return "rounded-l-base";
        if (right) return "rounded-r-base";
        return "";
    }
  };

  let direction = $derived(config.bar.direction);
  let rounding = $derived(curve(leftCurve, rightCurve, direction));

  let element = $state<HTMLElement>();
  let melted = $derived(element && melt.group === element ? melt : null);
</script>

<div
  bind:this={element}
  data-bar-group
  class={[
    "shape relative flex h-full items-center border-zb-border bg-zb-base",
    direction,
    rounding,
    melted && melted.left !== "flare" && "square-left",
    melted && melted.right !== "flare" && "square-right",
    className
  ]}
>
  {#if leftCurve && direction !== "floating"}
    <div
      class={[
        "absolute",
        direction === "bottom"
          ? "bottom-0 rounded-br-base"
          : "top-0 rounded-tr-base",
        "-left-[calc(var(--radius)*2)] h-radius w-[calc(var(--radius)*2)] bg-transparent shadow-inverted-l"
      ]}
    ></div>
  {/if}
  <div class={["z-10 overflow-hidden", rounding, "py-1", innerClass]}>
    {@render children()}
  </div>
  {#if rightCurve && direction !== "floating"}
    <div
      class={[
        "absolute",
        direction === "bottom"
          ? "bottom-0 rounded-bl-base"
          : "top-0 rounded-tl-base",
        "-right-[calc(var(--radius)*2)] h-radius w-[calc(var(--radius)*2)] bg-transparent shadow-inverted-r"
      ]}
    ></div>
  {/if}
  {#if direction !== "floating"}
    <span
      class={["fillet left", direction]}
      class:on={melted?.left === "overhang"}
    ></span>
    <span
      class={["fillet right", direction]}
      class:on={melted?.right === "overhang"}
    ></span>
  {/if}
</div>

<style>
  .shape {
    transition: border-radius var(--time-soft) var(--spring-soft);
  }

  .bottom.square-left {
    border-top-left-radius: 0;
  }

  .bottom.square-right {
    border-top-right-radius: 0;
  }

  .top.square-left {
    border-bottom-left-radius: 0;
  }

  .top.square-right {
    border-bottom-right-radius: 0;
  }

  /* Where a wider flyout's underside meets the side of this group. */
  .fillet {
    position: absolute;
    width: var(--radius);
    height: var(--radius);
    pointer-events: none;
    scale: 0;
    transition: scale var(--time-exit) var(--spring-out);
  }

  .fillet.on {
    scale: 1;
    transition: scale var(--time-soft) var(--spring-melt);
  }

  .fillet.left {
    right: 100%;
  }

  .fillet.right {
    left: 100%;
  }

  .fillet.bottom {
    top: 0;
  }

  .fillet.top {
    bottom: 0;
  }

  .fillet.left.bottom {
    transform-origin: 100% 0;
    background: radial-gradient(
      circle at 0 100%,
      transparent calc(var(--radius) - 0.5px),
      hsl(var(--bg)) var(--radius)
    );
  }

  .fillet.right.bottom {
    transform-origin: 0 0;
    background: radial-gradient(
      circle at 100% 100%,
      transparent calc(var(--radius) - 0.5px),
      hsl(var(--bg)) var(--radius)
    );
  }

  .fillet.left.top {
    transform-origin: 100% 100%;
    background: radial-gradient(
      circle at 0 0,
      transparent calc(var(--radius) - 0.5px),
      hsl(var(--bg)) var(--radius)
    );
  }

  .fillet.right.top {
    transform-origin: 0 100%;
    background: radial-gradient(
      circle at 100% 0,
      transparent calc(var(--radius) - 0.5px),
      hsl(var(--bg)) var(--radius)
    );
  }
</style>
