<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { batteryTone } from "#lib/utils/levels.ts";
  import Battery from "@lucide/svelte/icons/battery";
  import BatteryCharging from "@lucide/svelte/icons/battery-charging";
  import BatteryFull from "@lucide/svelte/icons/battery-full";
  import BatteryLow from "@lucide/svelte/icons/battery-low";
  import BatteryMedium from "@lucide/svelte/icons/battery-medium";
  import BatteryWarning from "@lucide/svelte/icons/battery-warning";
  import Meter from "./Meter.svelte";

  let battery = $derived(providers.battery);
  let charge = $derived(Math.round(battery?.chargePercent ?? 100));

  // Written out in full for Tailwind to find.
  const toneClasses = {
    "--battery-good": "stroke-zb-battery-good text-zb-battery-good",
    "--battery-mid": "stroke-zb-battery-mid text-zb-battery-mid",
    "--battery-low": "stroke-zb-battery-low text-zb-battery-low"
  };
  let tone = $derived(
    battery?.state === "charging"
      ? "--battery-good"
      : batteryTone(charge, config.battery)
  );
</script>

{#if battery?.state}
  <button
    class="block"
    aria-label="System details"
    {@attach opensFlyout("system")}
  >
    <Meter class={["h-8", toneClasses[tone]]} percent={charge}>
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
  </button>
{/if}
