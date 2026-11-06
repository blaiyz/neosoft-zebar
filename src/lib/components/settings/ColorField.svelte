<script lang="ts">
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { hexToHsl, hslToHex } from "#lib/utils/color.ts";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  let { name }: { name: string } = $props();

  let value = $state("");
  let overridden = $derived(name in config.theme.colors);
  let hex = $derived(hslToHex(value));

  const path = $derived(`theme.colors.${name}`);

  // The color comes from the stylesheets, which update after the settings do.
  $effect(() => {
    void JSON.stringify([config.theme.preset, config.theme.colors[name]]);

    const frame = requestAnimationFrame(() => {
      value = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${name}`)
        .trim();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  });

  const pick = (picked: string) => {
    const [, alpha] = value.split("/");
    const suffix = alpha === undefined ? "" : ` /${alpha}`;
    updateSetting(path, `${hexToHsl(picked)}${suffix}`);
  };
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
