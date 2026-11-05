<script lang="ts">
  import type { AttachmentDirection } from "#lib/config_schema.ts";
  import { config } from "#lib/state/config.svelte.ts";
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

  let rounding = $derived(curve(leftCurve, rightCurve, config.direction));
</script>

<div
  class={[
    "relative flex h-full items-center border-zb-border bg-zb-base",
    rounding,
    className
  ]}
>
  {#if leftCurve && config.direction !== "floating"}
    <div
      class={[
        "absolute",
        config.direction === "bottom"
          ? "bottom-0 rounded-br-base"
          : "top-0 rounded-tr-base",
        "-left-[calc(var(--radius)*2)] h-radius w-[calc(var(--radius)*2)] bg-transparent shadow-inverted-l"
      ]}
    ></div>
  {/if}
  <div class={["z-10 overflow-hidden", rounding, "py-1", innerClass]}>
    {@render children()}
  </div>
  {#if rightCurve && config.direction !== "floating"}
    <div
      class={[
        "absolute",
        config.direction === "bottom"
          ? "bottom-0 rounded-bl-base"
          : "top-0 rounded-tl-base",
        "-right-[calc(var(--radius)*2)] h-radius w-[calc(var(--radius)*2)] bg-transparent shadow-inverted-r"
      ]}
    ></div>
  {/if}
</div>
