<script lang="ts">
  // This component is used to create a smooth size transition
  // when the content changes size or added/deleted. (otherwise, the size change is abrupt)
  import { config } from "#lib/state/config.svelte.ts";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import { Spring } from "svelte/motion";

  type Props = {
    class?: ClassValue;
    innerClass?: ClassValue;
    width?: boolean;
    height?: boolean;
    children: Snippet;
  };

  let {
    class: className,
    innerClass,
    width = true,
    height = true,
    children
  }: Props = $props();
  const widthSpring = new Spring(0);
  const heightSpring = new Spring(0);

  const setWidth = (value: number | null | undefined) => {
    if (width && value != null) widthSpring.target = value;
  };
  const setHeight = (value: number | null | undefined) => {
    if (height && value != null) heightSpring.target = value;
  };

  $effect(() => {
    const duration = config.transitionDuration;
    const stiffness = 50 / duration;
    const damp = 2 * Math.sqrt(stiffness);
    widthSpring.stiffness = stiffness;
    widthSpring.damping = damp;
    heightSpring.stiffness = stiffness;
    heightSpring.damping = damp;
  });
</script>

<div
  class={["relative", className]}
  style="{width ? `width: ${widthSpring.current}px;` : ''} {height
    ? `height: ${heightSpring.current}px;`
    : ''}"
>
  <div
    class={[
      width ? "w-fit" : "w-full",
      height ? "h-fit" : "h-full",
      innerClass
    ]}
    bind:clientWidth={null, setWidth}
    bind:clientHeight={null, setHeight}
  >
    {@render children()}
  </div>
</div>
