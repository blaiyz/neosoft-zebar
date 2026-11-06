<script lang="ts">
  import { HISTORY_LENGTH } from "#lib/state/history.svelte.ts";
  import type { ClassValue } from "svelte/elements";

  type Series = {
    values: number[];
    /** Colors the line and the area below it, through `text-*`. */
    class: ClassValue;
  };

  type Props = {
    series: Series[];
    /** The top of the scale. Without one, it follows the highest reading. */
    max?: number;
    /** Keeps small values visible beside a burst, for traffic. */
    compressed?: boolean;
    class?: ClassValue;
  };

  let {
    series,
    max,
    compressed = false,
    class: className = "h-16 rounded-control"
  }: Props = $props();

  const WIDTH = 100;
  const HEIGHT = 40;

  let top = $derived(max ?? Math.max(1, ...series.flatMap((s) => s.values)));

  const scale = (value: number) =>
    compressed ? Math.cbrt(value / top) : value / top;

  /** The newest reading is at the right, so a short series grows from there. */
  const toPoints = (values: number[]) => {
    const first = HISTORY_LENGTH - values.length;
    return values.map((value, index) => {
      const x = ((first + index) / (HISTORY_LENGTH - 1)) * WIDTH;
      const y = HEIGHT - Math.min(1, scale(value)) * HEIGHT;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
  };

  const toArea = (points: string[]) => {
    const [first] = points;
    const startX = first?.split(",")[0] ?? "0";
    return [`${startX},${HEIGHT}`, ...points, `${WIDTH},${HEIGHT}`].join(" ");
  };
</script>

<svg
  class={["block w-full", className]}
  viewBox="0 0 {WIDTH} {HEIGHT}"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  {#each series as { values, class: seriesClass }, index (index)}
    {#if values.length > 1}
      {@const points = toPoints(values)}
      <g class={seriesClass}>
        <polygon points={toArea(points)} fill="currentColor" opacity="0.2" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </g>
    {/if}
  {/each}
</svg>
