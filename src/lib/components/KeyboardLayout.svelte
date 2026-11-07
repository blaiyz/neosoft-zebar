<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";

  let layout = $derived(providers.keyboard?.layout ?? "");
  // A layout is named like a locale, such as `en-US`.
  let shown = $derived(
    config.keyboard.format === "language"
      ? (layout.split("-")[0] ?? "").toUpperCase()
      : layout
  );
</script>

{#if shown}
  <div
    class="flex h-full items-center px-2 text-sm font-semibold tracking-wide text-zb-keyboard"
    aria-label="Keyboard layout {layout}"
  >
    {shown}
  </div>
{/if}
