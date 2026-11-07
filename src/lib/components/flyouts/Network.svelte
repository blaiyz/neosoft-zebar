<script lang="ts">
  import { history } from "#lib/state/history.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { formatBitRate, formatMeasure } from "#lib/utils/format.ts";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import type { NetworkInterface } from "zebar";
  import Graph from "./Graph.svelte";
  import Row from "./Row.svelte";
  import Well from "./Well.svelte";

  let network = $derived(providers.network);
  let main = $derived(network?.defaultInterface);
  let gateway = $derived(network?.defaultGateway);
  let traffic = $derived(network?.traffic);

  const interfaceName = ({ friendlyName, name }: NetworkInterface) =>
    friendlyName ?? name;

  let others = $derived(
    network?.interfaces.filter(
      (item) =>
        !item.isDefault &&
        item.type !== "loopback" &&
        item.ipv4Addresses.length > 0
    ) ?? []
  );
</script>

<!-- Runs out to the panel's edges, cancelling its padding. -->
<div class="-mx-5 -mt-5">
  <Graph
    class="h-28"
    compressed
    series={[
      { values: history.value.upload, class: "text-zb-memory" },
      { values: history.value.download, class: "text-zb-accent" }
    ]}
  />
</div>

{#if traffic}
  <div class="flex justify-between text-lg font-semibold tabular-nums">
    <span class="flex items-center gap-1 text-zb-accent">
      <ArrowDown />
      {formatMeasure(traffic.received)}/s
    </span>
    <span class="flex items-center gap-1 text-zb-memory">
      <ArrowUp />
      {formatMeasure(traffic.transmitted)}/s
    </span>
  </div>
{/if}

<Well title={main ? interfaceName(main) : "Not connected"} tone="--accent">
  {#if gateway?.ssid}
    <Row label="Network">
      {gateway.ssid}
      {#if gateway.signalStrength !== null}({gateway.signalStrength}%){/if}
    </Row>
  {/if}
  {#if main}
    {#each main.ipv4Addresses as address (address)}
      <Row label="IPv4">{address}</Row>
    {/each}
    {#each gateway?.ipv4Addresses ?? [] as address (address)}
      <Row label="Gateway">{address}</Row>
    {/each}
    {#if main.dnsServers.length > 0}
      <Row label="DNS">{main.dnsServers.join(", ")}</Row>
    {/if}
    {#if main.receiveSpeed !== null && main.transmitSpeed !== null}
      <Row label="Link speed">
        {formatBitRate(main.receiveSpeed)} / {formatBitRate(main.transmitSpeed)}
      </Row>
    {/if}
  {/if}
  {#if traffic}
    <Row label="Received">{formatMeasure(traffic.totalReceived)}</Row>
    <Row label="Sent">{formatMeasure(traffic.totalTransmitted)}</Row>
  {/if}
</Well>

{#if others.length > 0}
  <Well title="Other connections" tone="--memory">
    {#each others as item (item.name)}
      <Row label={interfaceName(item)}>{item.ipv4Addresses[0]}</Row>
    {/each}
  </Well>
{/if}
