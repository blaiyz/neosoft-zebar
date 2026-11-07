<script lang="ts">
  import {
    settingsWindow,
    toggleSettings
  } from "#lib/state/settings_window.svelte.ts";
  import Settings from "@lucide/svelte/icons/settings";
  import BeadButton from "./BeadButton.svelte";

  // The settings window has no button on the taskbar, so this one shows it's open.
  let open = $derived(settingsWindow.value);
</script>

<BeadButton
  label="Settings"
  tone="--accent"
  class={["settings-toggle", open && "open"]}
  aria-pressed={open}
  onclick={() => {
    void toggleSettings();
  }}
>
  <Settings />
</BeadButton>

<style>
  :global(.settings-toggle svg) {
    transition: rotate var(--time-soft) var(--spring-soft);
  }

  :global(.settings-toggle.open) {
    background: color-mix(in srgb, hsl(var(--accent)) 22%, transparent);
  }

  :global(.settings-toggle.open svg) {
    rotate: 90deg;
  }
</style>
