<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import AnimatedList from "./AnimatedList.svelte";

  /**
   * An `AnimatedList` of one item. Content that reads state which can disappear
   * needs `AnimatedList` itself, to keep rendering the last value while it leaves.
   */
  type Props = {
    when?: boolean;
    anchor?: "start" | "end";
    fly?: boolean;
    class?: ClassValue;
    children: Snippet;
  };

  let {
    when = true,
    anchor = "start",
    fly = true,
    class: className = "",
    children
  }: Props = $props();
</script>

<AnimatedList
  items={when ? [true] : []}
  key={() => "content"}
  {anchor}
  {fly}
  class={className}
>
  {#snippet item()}
    {@render children()}
  {/snippet}
</AnimatedList>
