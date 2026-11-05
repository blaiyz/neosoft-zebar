<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children?: Snippet;
    label?: string;
    callback?: () => void;
    class?: ClassValue;
  };
  let { children, label, callback, class: className }: Props = $props();
</script>

<button
  class={[
    "flex items-center justify-center rounded-base border border-zb-border bg-current/30 p-1 shadow-button hover:border-current/40 active:border-current/70",
    className
  ]}
  onclick={callback}
  aria-label={label}
>
  {#if children}
    {@render children()}
  {:else}
    <span class="text-sm">{label}</span>
  {/if}
</button>
