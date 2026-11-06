<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "class"> & {
    label: string;
    /** The name of the theme color it uses, like `--icon`. */
    tone: string;
    class?: ClassValue;
    children: Snippet;
  };

  let { label, tone, class: className, children, ...rest }: Props = $props();
</script>

<button
  {...rest}
  class={[
    "relative flex size-[1.7rem] items-center justify-center rounded-full text-[hsl(var(--tone))]",
    className
  ]}
  style:--tone="var({tone})"
  aria-label={label}
>
  {@render children()}
</button>
