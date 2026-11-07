<script lang="ts">
  import { fieldsOf } from "#lib/config_form.ts";
  import Description from "./Description.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
</script>

<SettingsGroup
  title="GlazeWM"
  fields={fieldsOf("", { only: ["autoTiling", "clickThroughByDefault"] })}
/>
<SettingsGroup title="Performance" fields={fieldsOf("performance")}>
  <Description
    text="Longer refresh intervals, just below, save CPU and GPU too: every reading wakes the bar up and redraws part of it. CPU and network update every 2 seconds by default."
  />
</SettingsGroup>
<SettingsGroup
  title="Refresh intervals"
  fields={fieldsOf("providers.refreshIntervals")}
/>
<SettingsGroup title="Providers" fields={fieldsOf("providers")} />
