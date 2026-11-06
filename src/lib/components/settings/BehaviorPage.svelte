<script lang="ts">
  import { fieldsOf } from "#lib/config_form.ts";
  import SettingsGroup from "./SettingsGroup.svelte";
</script>

<SettingsGroup
  title="GlazeWM"
  fields={fieldsOf("", { only: ["autoTiling", "clickThroughByDefault"] })}
/>
<SettingsGroup
  title="Refresh intervals"
  fields={fieldsOf("providers.refreshIntervals")}
/>
<SettingsGroup title="Providers" fields={fieldsOf("providers")} />
