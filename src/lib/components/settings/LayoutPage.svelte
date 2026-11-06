<script lang="ts">
  import { fieldsOf } from "#lib/config_form.ts";
  import Description from "./Description.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
</script>

<SettingsGroup title="Bar" fields={fieldsOf("bar")}>
  <Description
    text="Zebar reads the bar's height and the edge it docks to from `zpack.json` when it creates the window, so those two can't change from here."
  />
</SettingsGroup>

<SettingsGroup
  title="Taskbar integration"
  fields={fieldsOf("taskbarIntegration")}
/>
