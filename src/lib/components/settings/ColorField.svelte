<script lang="ts">
  import { colorPicker } from "#lib/state/color_picker.svelte.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { hslToHex } from "#lib/utils/color.ts";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  let { name }: { name: string } = $props();

  const picker = colorPicker(() => name);
  let overridden = $derived(name in config.theme.colors);
</script>

<div class="flex items-center gap-2">
  <input
    class="swatch size-7 flex-none cursor-pointer rounded-full border-none bg-transparent"
    type="color"
    aria-label={name}
    value={hslToHex(picker.value)}
    oninput={(event) => {
      picker.pick(event.currentTarget.value);
    }}
    onchange={picker.finish}
    onblur={picker.finish}
  />
  <span class="min-w-0 flex-1 truncate text-sm">{name}</span>
  {#if overridden}
    <button
      class="flex-none text-sm text-zb-dim hover:text-zb-accent"
      aria-label="Reset {name}"
      onclick={() => updateSetting(`theme.colors.${name}`, undefined)}
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
