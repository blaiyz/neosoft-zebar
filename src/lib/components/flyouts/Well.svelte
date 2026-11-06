<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    title?: string;
    /** The name of the theme color for its title, like `--cpu`. */
    tone?: string;
    children: Snippet;
  };

  let { title, tone, children }: Props = $props();
</script>

<section class="flex flex-col gap-1.5">
  {#if title}
    <h2
      class="px-1 text-sm font-semibold text-zb-dim"
      style:color={tone && `hsl(var(${tone}))`}
    >
      {title}
    </h2>
  {/if}
  <div class="flex flex-col gap-2 rounded-well bg-zb-surface-1 p-3">
    {@render children()}
  </div>
</section>
