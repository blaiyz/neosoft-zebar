<script lang="ts">
  import { colorPicker } from "#lib/state/color_picker.svelte.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import type { Swatch } from "#lib/theme_palette.ts";
  import { hslToHex } from "#lib/utils/color.ts";
  import Pipette from "@lucide/svelte/icons/pipette";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  type Props = {
    /** The theme color it sets. */
    name: string;
    label: string;
    /** The same for every field, so that each color has one place in the row. */
    palette: Swatch[];
  };

  let { name, label, palette }: Props = $props();

  const path = $derived(`theme.colors.${name}`);
  let override = $derived(config.theme.colors[name]);
  const picker = colorPicker(() => name);

  /**
   * What a swatch saves: nothing for this color's own, so that it follows the
   * preset again, or a name that still has the preset's color. With every name for
   * the color changed, it's the color itself, since pointing at one could lead
   * back here and leave neither with a color.
   */
  const choiceFor = ({ value: color, sources }: Swatch) => {
    if (sources.includes(name)) return undefined;
    const free = sources.find((source) => !(source in config.theme.colors));
    return free ? `var(--${free})` : color;
  };

  const isPicked = (swatch: Swatch) =>
    override === undefined
      ? swatch.sources.includes(name)
      : override === swatch.value ||
        swatch.sources.some((source) => override === `var(--${source})`);

  let custom = $derived(
    override !== undefined && !palette.some((swatch) => isPicked(swatch))
  );
</script>

<div class="flex items-center gap-3">
  <span class="w-24 flex-none text-sm">{label}</span>
  <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
    {#each palette as swatch (swatch.value)}
      {@const on = isPicked(swatch)}
      <button
        class={["swatch", on && "on"]}
        style:--swatch="hsl({swatch.value})"
        aria-label="{label}: the theme's {swatch.sources[0]} color"
        aria-pressed={on}
        title={swatch.sources.join(", ")}
        onclick={() => updateSetting(path, choiceFor(swatch))}
      ></button>
    {/each}
    <label
      class={["swatch custom", custom && "on"]}
      style:--swatch="hsl({picker.value})"
      title="Any color"
    >
      <Pipette />
      <input
        class="sr-only"
        type="color"
        aria-label="{label}: any color"
        value={hslToHex(picker.value)}
        oninput={(event) => {
          picker.pick(event.currentTarget.value);
        }}
        onchange={picker.finish}
        onblur={picker.finish}
      />
    </label>
  </div>
  <button
    class={[
      "flex-none text-sm text-zb-dim transition hover:text-zb-accent",
      override === undefined && "invisible"
    ]}
    aria-label="Reset {label}"
    title="Back to the theme's own"
    onclick={() => updateSetting(path, undefined)}
  >
    <RotateCcw />
  </button>
</div>

<style>
  .swatch {
    position: relative;
    display: grid;
    width: 1.25rem;
    height: 1.25rem;
    flex: none;
    place-items: center;
    border-radius: 50%;
    background: var(--swatch);
    cursor: pointer;
    transition:
      scale var(--time-soft) var(--spring-soft),
      box-shadow var(--time-soft) var(--spring-soft);
  }

  .swatch:hover {
    scale: 1.15;
  }

  .swatch.on {
    box-shadow:
      0 0 0 2px hsl(var(--bg)),
      0 0 0 4px var(--swatch);
  }

  .custom {
    color: hsl(var(--bg));
    font-size: 0.75rem;
  }

  .custom:not(.on) {
    background: conic-gradient(
      from 90deg,
      hsl(0 80% 65%),
      hsl(60 80% 65%),
      hsl(120 80% 65%),
      hsl(180 80% 65%),
      hsl(240 80% 65%),
      hsl(300 80% 65%),
      hsl(360 80% 65%)
    );
  }

  .custom:focus-within {
    outline: 2px solid hsl(var(--accent));
    outline-offset: 2px;
  }
</style>
