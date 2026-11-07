<script lang="ts">
  import { onMount, untrack, type Snippet } from "svelte";
  import Collapsible from "./Collapsible.svelte";

  type Props = {
    /** Whether it came after the rest, and so opens instead of being there. */
    late: boolean;
    children: Snippet;
  };

  let { late, children }: Props = $props();

  // Its width follows what's inside on every frame, for content that only finds
  // its own width once it's on the page, like a track title.
  let open = $state(untrack(() => !late));

  onMount(() => {
    open = true;
  });
</script>

<Collapsible when={open}>
  {@render children()}
</Collapsible>
