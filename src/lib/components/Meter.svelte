<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    percent: number;
    class?: ClassValue;
    children?: Snippet;
    animate?: boolean;
  };
  let { percent, class: className, children, animate = true }: Props = $props();

  let normalizedPercent = $derived(
    Number.isNaN(percent) ? 0 : Math.max(0, Math.min(100, percent))
  );

  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = $derived(
    circumference * (1 - normalizedPercent / 100)
  );
</script>

<div class={["group relative", className]}>
  <div
    class={[
      "flex aspect-square h-full items-center justify-center",
      animate &&
        "transition-all group-hover:translate-y-full group-hover:opacity-0"
    ]}
  >
    <svg
      class="h-full transition-all"
      viewBox="0 0 {size} {size}"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Background circle -->
      <circle
        class="stroke-zb-border"
        stroke-width={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
      ></circle>
      <!-- Progress circle -->
      <circle
        class={["transition-all", className]}
        stroke-width={strokeWidth}
        stroke-linecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
        stroke-dasharray={circumference}
        stroke-dashoffset={strokeDashoffset}
        transform="rotate(-90 {size / 2} {size / 2})"
      ></circle>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>

  {#if animate}
    <span
      class="absolute inset-0 flex -translate-y-full items-center justify-center opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
    >
      {normalizedPercent}%
    </span>
  {/if}
</div>
