<script lang="ts">
  import { providers } from "#lib/state/providers.svelte.ts";
  import Battery from "@lucide/svelte/icons/battery";
  import BatteryCharging from "@lucide/svelte/icons/battery-charging";
  import BatteryFull from "@lucide/svelte/icons/battery-full";
  import BatteryLow from "@lucide/svelte/icons/battery-low";
  import BatteryMedium from "@lucide/svelte/icons/battery-medium";
  import BatteryWarning from "@lucide/svelte/icons/battery-warning";
  import Meter from "./Meter.svelte";

  let battery = $derived(providers.battery);
</script>

{#if battery?.state}
  <Meter
    class="h-8 stroke-zb-battery-good"
    percent={Math.round(battery?.chargePercent ?? 100)}
  >
    {#if battery?.state === "charging"}
      <BatteryCharging />
    {:else if (battery?.chargePercent ?? 0) < 20}
      <BatteryWarning />
    {:else if (battery?.chargePercent ?? 0) < 50}
      <BatteryLow />
    {:else if (battery?.chargePercent ?? 0) < 80}
      <BatteryMedium />
    {:else if (battery?.chargePercent ?? 0) <= 100}
      <BatteryFull />
    {:else}
      <Battery />
    {/if}
  </Meter>
{/if}
