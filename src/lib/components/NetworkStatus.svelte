<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { history } from "#lib/state/history.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { formatRate, widestRateUnit } from "#lib/utils/format.ts";
  import ChevronsDown from "@lucide/svelte/icons/chevrons-down";
  import ChevronsUp from "@lucide/svelte/icons/chevrons-up";
  import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
  import EthernetPort from "@lucide/svelte/icons/ethernet-port";
  import GlobeOff from "@lucide/svelte/icons/globe-off";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Signal from "@lucide/svelte/icons/signal";
  import Wifi from "@lucide/svelte/icons/wifi";
  import WifiHigh from "@lucide/svelte/icons/wifi-high";
  import WifiLow from "@lucide/svelte/icons/wifi-low";
  import WifiZero from "@lucide/svelte/icons/wifi-zero";
  import Collapsible from "./Collapsible.svelte";
  import Graph from "./flyouts/Graph.svelte";

  let network = $derived(providers.network);
  let shows = $derived(config.sections.network);

  let units = $derived(config.network.units);

  const toRate = (Icon: typeof ChevronsDown, bytes: number) => ({
    Icon,
    ...formatRate(bytes, units),
    idle: bytes < config.network.dimBelow * 1024
  });

  let rates = $derived(
    network?.traffic
      ? [
          toRate(ChevronsDown, network.traffic.received.bytes),
          toRate(ChevronsUp, network.traffic.transmitted.bytes)
        ]
      : []
  );
</script>

<!-- Separate parts, because a part inside another would count its width twice. -->
<button
  class="flex h-full flex-none items-center text-zb-network hover:text-zb-accent"
  aria-label="Network details"
  {@attach opensFlyout("network")}
>
  <Collapsible part="network" when={shows !== "statistics"} class="pl-5">
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
    {:else if network?.defaultInterface?.type === "tunnel"}
      <ShieldCheck />
    {:else if network?.defaultInterface?.type === "mobile_broadband"}
      <Signal />
    {:else if network?.defaultInterface?.type}
      <CircleQuestionMark />
    {:else}
      <GlobeOff />
    {/if}
  </Collapsible>
  {#if network?.defaultInterface?.type === "wifi" && network.defaultGateway?.ssid}
    <Collapsible part="network.ssid" when={shows !== "statistics"} class="pl-1">
      {network.defaultGateway.ssid}
    </Collapsible>
  {/if}
  {#if rates.length > 0}
    <Collapsible
      part="network.graph"
      when={config.network.graph !== false && shows !== "interface"}
      class="pl-3"
    >
      <Graph
        class="h-6 w-14 rounded-sm"
        compressed
        series={[
          { values: history.value.upload, class: "text-zb-memory" },
          { values: history.value.download, class: "text-zb-accent" }
        ]}
      />
    </Collapsible>
    <Collapsible
      part="network.rates"
      when={shows !== "interface"}
      class="gap-2 pl-3 tabular-nums"
    >
      {#each rates as { Icon, value, unit, idle }, index (index)}
        <div
          class={[
            "flex items-center gap-0.5 transition-opacity",
            idle && "opacity-50"
          ]}
        >
          <Icon />
          <!-- Each is as wide as its widest form, so the section keeps its width. -->
          <span class="grid justify-items-end">
            <span class="invisible [grid-area:1/1]" aria-hidden="true"
              >8.88</span
            >
            <span class="[grid-area:1/1]">{value}</span>
          </span>
          <span class="ml-0.5 grid text-sm">
            <span class="invisible [grid-area:1/1]" aria-hidden="true"
              >{widestRateUnit[units]}</span
            >
            <span class="[grid-area:1/1]">{unit}</span>
          </span>
        </div>
      {/each}
    </Collapsible>
  {/if}
</button>
