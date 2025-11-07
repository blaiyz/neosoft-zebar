<script lang="ts">
  import { isOnPrimaryMonitor } from "$lib/utils/glaze_wm_utils.svelte";
  import Battery from "@lucide/svelte/icons/battery";
  import BatteryCharging from "@lucide/svelte/icons/battery-charging";
  import BatteryFull from "@lucide/svelte/icons/battery-full";
  import BatteryLow from "@lucide/svelte/icons/battery-low";
  import BatteryMedium from "@lucide/svelte/icons/battery-medium";
  import BatteryWarning from "@lucide/svelte/icons/battery-warning";
  import ChevronsDown from "@lucide/svelte/icons/chevrons-down";
  import ChevronsUp from "@lucide/svelte/icons/chevrons-up";
  import Cpu from "@lucide/svelte/icons/cpu";
  import EthernetPort from "@lucide/svelte/icons/ethernet-port";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Wifi from "@lucide/svelte/icons/wifi";
  import WifiHigh from "@lucide/svelte/icons/wifi-high";
  import WifiLow from "@lucide/svelte/icons/wifi-low";
  import WifiOff from "@lucide/svelte/icons/wifi-off";
  import WifiZero from "@lucide/svelte/icons/wifi-zero";
  import Button from "./Button.svelte";
  import Meter from "./Meter.svelte";

  import IconHeartFilled from "@tabler/icons-svelte/icons/heart-filled";
  // import Test from "./Test.svelte";
  import { config } from "$lib/config.svelte";
  import { providers } from "$lib/providers.svelte";

  let memory = $derived(providers.memory);
  let cpu = $derived(providers.cpu);
  let battery = $derived(providers.battery);
  let network = $derived(providers.network);

  // Format network values with adaptive decimal places
  function formatNetworkValue(value: number): string {
    let expanded = value.toFixed(4);
    if (value >= 1000) {
      return " " + expanded.slice(0, 4);
    } else {
      return expanded.slice(0, 5);
    }
  }
</script>

<div class="flex flex-row gap-3 items-center">
  {#if config.showHeartButton}
    <Button class="text-zb-icon"
      ><IconHeartFilled class="text-zb-icon" /></Button
    >
  {/if}
  {#if config.showMemorySection}
    <Meter
      class="stroke-zb-memory h-8"
      percent={Math.round(memory?.usage ?? 0)}
    >
      <MemoryStick />
    </Meter>
  {/if}
  {#if config.showCpuSection}
    <Meter class="stroke-zb-cpu h-8" percent={Math.round(cpu?.usage ?? 0)}>
      <Cpu />
    </Meter>
  {/if}
  {#if config.showBatterySection && battery?.state}
    <Meter
      class="stroke-zb-battery-good h-8"
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
  {#if config.showNetworkSection && isOnPrimaryMonitor()}
    <div class="flex flex-row pl-2 items-center gap-1">
      {#if network?.defaultInterface?.type === "ethernet"}
        <EthernetPort />
      {:else if network?.defaultInterface!.type === "wifi"}
        {#if network.defaultGateway!.signalStrength! >= 75}
          <Wifi />
        {:else if network.defaultGateway!.signalStrength! >= 50}
          <WifiHigh />
        {:else if network.defaultGateway!.signalStrength! >= 25}
          <WifiLow />
        {:else}
          <WifiZero />
        {/if}
        {network.defaultGateway?.ssid}
      {:else}
        <WifiOff />
      {/if}
    </div>
    {#if network?.traffic}
      <div class="flex flex-row items-center gap-2 font-mono">
        {#if network.traffic.received}
          <div class="flex flex-row items-center">
            <ChevronsDown />
            <div class="flex flex-row items-center gap-1">
              <span class="inline-block text-right align-middle min-w-12">
                {formatNetworkValue(network.traffic.received.iecValue)}
              </span>
              <span class="inline-block align-middle min-w-7">
                {network.traffic.received.iecUnit}
              </span>
            </div>
          </div>
        {/if}
        {#if network.traffic.transmitted}
          <div class="flex flex-row items-center">
            <ChevronsUp />
            <div class="flex flex-row items-center gap-1">
              <span class="inline-block text-right align-middle min-w-12">
                {formatNetworkValue(network.traffic.transmitted.iecValue)}
              </span>
              <span class="inline-block align-middle min-w-7">
                {network.traffic.transmitted.iecUnit}
              </span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
  <!-- <Test /> -->
  <!-- <div class="max-w-72 text-sm max-h-4">
    <div class="overflow-scroll">
      config: {JSON.stringify(config)}
    </div>
  </div> -->
</div>
