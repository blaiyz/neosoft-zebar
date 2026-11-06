<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { formatNetworkValue } from "#lib/utils/format.ts";
  import ChevronsDown from "@lucide/svelte/icons/chevrons-down";
  import ChevronsUp from "@lucide/svelte/icons/chevrons-up";
  import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
  import EthernetPort from "@lucide/svelte/icons/ethernet-port";
  import GlobeOff from "@lucide/svelte/icons/globe-off";
  import Wifi from "@lucide/svelte/icons/wifi";
  import WifiHigh from "@lucide/svelte/icons/wifi-high";
  import WifiLow from "@lucide/svelte/icons/wifi-low";
  import WifiZero from "@lucide/svelte/icons/wifi-zero";

  let network = $derived(providers.network);
</script>

{#if config.sections.network !== "statistics"}
  <div class="flex flex-row items-center gap-1 pl-2">
    {#if network?.defaultInterface?.type === "ethernet"}
      <EthernetPort />
    {:else if network?.defaultInterface?.type === "wifi"}
      {@const signal = network.defaultGateway?.signalStrength ?? 0}
      {#if signal >= 75}
        <Wifi />
      {:else if signal >= 50}
        <WifiHigh />
      {:else if signal >= 25}
        <WifiLow />
      {:else}
        <WifiZero />
      {/if}
      {network.defaultGateway?.ssid}
    {:else if network?.defaultInterface?.type}
      <CircleQuestionMark />
    {:else}
      <GlobeOff />
    {/if}
  </div>
{/if}
{#if config.sections.network !== "interface" && network?.traffic}
  <div class="flex flex-row items-center gap-2 font-mono">
    {#if network.traffic.received}
      <div class="flex flex-row items-center">
        <ChevronsDown />
        <div class="flex flex-row items-center gap-1">
          <span class="inline-block min-w-12 text-right align-middle">
            {formatNetworkValue(network.traffic.received.iecValue)}
          </span>
          <span class="inline-block min-w-7 align-middle">
            {network.traffic.received.iecUnit}
          </span>
        </div>
      </div>
    {/if}
    {#if network.traffic.transmitted}
      <div class="flex flex-row items-center">
        <ChevronsUp />
        <div class="flex flex-row items-center gap-1">
          <span class="inline-block min-w-12 text-right align-middle">
            {formatNetworkValue(network.traffic.transmitted.iecValue)}
          </span>
          <span class="inline-block min-w-7 align-middle">
            {network.traffic.transmitted.iecUnit}
          </span>
        </div>
      </div>
    {/if}
  </div>
{/if}
