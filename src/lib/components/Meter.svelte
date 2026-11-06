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
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = $derived(
    circumference * (1 - normalizedPercent / 100)
  );
</script>

<div class={["meter relative flex aspect-square items-center", className]}>
  <div
    class="dial relative flex aspect-square h-full items-center justify-center"
  >
    <svg
      class="h-full"
      viewBox="0 0 {size} {size}"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        class="stroke-zb-surface-3"
        stroke-width={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
      ></circle>
      <circle
        class="progress"
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
      class="number absolute inset-0 flex items-center justify-center tabular-nums"
    >
      {normalizedPercent}%
    </span>
  {/if}
</div>

<style>
  .progress {
    transition: stroke-dashoffset var(--time-melt) var(--spring-melt);
  }

  .dial,
  .number {
    transition:
      opacity var(--transition-duration) var(--spring-out),
      translate var(--time-soft) var(--spring-soft);
  }

  .number {
    opacity: 0;
    translate: 0 -100%;
  }

  .meter:hover .dial:has(+ .number) {
    opacity: 0;
    translate: 0 100%;
  }

  .meter:hover .number {
    opacity: 1;
    translate: 0;
  }
</style>
