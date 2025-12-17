<script lang="ts">
  import { config } from "$lib/config.svelte";
  // This component is used to create a smooth size transition
  // when the content changes size or added/deleted. (otherwise, the size change is abrupt)
  import type { Snippet } from "svelte";
  import { Spring } from "svelte/motion";

  type Props = {
    innerClass?: string;
    outerClass?: string;
    width?: boolean;
    height?: boolean;
    children: Snippet;
  };

  let {
    innerClass,
    outerClass,
    width = true,
    height = true,
    children
  }: Props = $props();
  const widthSpring = new Spring(0);
  const heightSpring = new Spring(0);

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
  class="relative {outerClass}"
  style="{width ? `width: ${widthSpring.current}px;` : ''} {height
    ? `height: ${heightSpring.current}px;`
    : ''}"
>
  {#if width && height}
    <div
      class="w-fit h-fit {innerClass}"
      bind:clientWidth={widthSpring.target}
      bind:clientHeight={heightSpring.target}
    >
      {@render children()}
    </div>
  {:else if width}
    <div class="w-fit h-full {innerClass}" bind:clientWidth={widthSpring.target}>
      {@render children()}
    </div>
  {:else if height}
    <div class="h-fit w-full {innerClass}" bind:clientHeight={heightSpring.target}>
      {@render children()}
    </div>
  {/if}
  <!-- At least one dimension should be true, otherwise no point using this component instead of div -->
</div>
