<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children?: Snippet;
    label?: string;
    callback?: () => void;
    /** The one button that a group of them is mainly there for. */
    main?: boolean;
    class?: ClassValue;
  };
  let {
    children,
    label,
    callback,
    main = false,
    class: className
  }: Props = $props();
</script>

<button
  class={["button", main && "main", className]}
  onclick={callback}
  aria-label={label}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style>
  .button {
    display: flex;
    height: 2.5rem;
    align-items: center;
    justify-content: center;
    padding-inline: 1.1rem;
    border-radius: var(--control-radius);
    background: var(--surface-2);
    font-size: 0.93rem;
    font-weight: 600;
    transition:
      background-color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .button:hover {
    background: var(--surface-3);
  }

  .button:active {
    scale: 0.95;
  }

  .button.main {
    background: hsl(var(--tone, var(--accent)));
    color: hsl(var(--bg));
  }

  .button.main:hover {
    background: color-mix(
      in srgb,
      hsl(var(--tone, var(--accent))) 86%,
      hsl(var(--text))
    );
  }
</style>
