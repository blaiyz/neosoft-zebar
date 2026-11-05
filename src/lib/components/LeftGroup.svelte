<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
  import BatteryMeter from "./BatteryMeter.svelte";
  import HeartButton from "./HeartButton.svelte";
  import NetworkStatus from "./NetworkStatus.svelte";
  import PowerButton from "./PowerButton.svelte";
  import SystemMeters from "./SystemMeters.svelte";
</script>

<div class="flex flex-row items-center gap-3">
  {#if config.showShutdownButton}
    <PowerButton />
  {/if}
  {#if config.showHeartButton}
    <HeartButton />
  {/if}
  <SystemMeters />
  {#if config.showBatterySection}
    <BatteryMeter />
  {/if}
  {#if config.showNetworkSection && isOnPrimaryMonitor()}
    <NetworkStatus />
  {/if}
</div>
