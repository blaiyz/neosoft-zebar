<script lang="ts">
  import Settings from "@lucide/svelte/icons/settings";
  import { startWidgetPreset } from "zebar";
  import BeadButton from "./BeadButton.svelte";
</script>

<BeadButton
  label="Settings"
  tone="--accent"
  onclick={() => {
    void startWidgetPreset("settings", "default");
  }}
>
  <Settings />
</BeadButton>
