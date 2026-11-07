<script lang="ts">
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { hexToHsl, hslToHex } from "#lib/utils/color.ts";
  import { throttle } from "#lib/utils/throttle.ts";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import { onDestroy } from "svelte";

  let { name }: { name: string } = $props();

  /** How often a color being picked is saved, in milliseconds. */
  const SAVE_EVERY = 200;

  let value = $state("");
  /** While the picker is open, it shows the color, not what's been saved so far. */
  let picking = false;
  let overridden = $derived(name in config.theme.colors);
  let hex = $derived(hslToHex(value));

  const path = $derived(`theme.colors.${name}`);

  // The color comes from the stylesheets, which update after the settings do.
  $effect(() => {
    void JSON.stringify([config.theme.preset, config.theme.colors[name]]);

    const frame = requestAnimationFrame(() => {
      if (picking) return;
      value = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${name}`)
        .trim();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  });

  const save = throttle((color: string) => {
    updateSetting(path, color);
  }, SAVE_EVERY);

  const pick = (picked: string) => {
    const [, alpha] = value.split("/");
    const suffix = alpha === undefined ? "" : ` /${alpha}`;
    picking = true;
    value = `${hexToHsl(picked)}${suffix}`;
    save(value);
  };

  const finishPicking = () => {
    picking = false;
    save.flush();
  };

  onDestroy(save.flush);
</script>

<div class="flex items-center gap-2">
  <input
    class="swatch size-7 flex-none cursor-pointer rounded-full border-none bg-transparent"
    type="color"
    aria-label={name}
    value={hex}
    oninput={(event) => {
      pick(event.currentTarget.value);
    }}
    onchange={finishPicking}
    onblur={finishPicking}
  />
  <span class="min-w-0 flex-1 truncate text-sm">{name}</span>
  {#if overridden}
    <button
      class="flex-none text-sm text-zb-dim hover:text-zb-accent"
      aria-label="Reset {name}"
      onclick={() => updateSetting(path, undefined)}
    >
      <RotateCcw />
    </button>
  {/if}
</div>

<style>
  .swatch::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .swatch::-webkit-color-swatch {
    border: 0;
    border-radius: 50%;
  }
</style>
