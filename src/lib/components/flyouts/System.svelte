<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { history } from "#lib/state/history.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import {
    formatBytes,
    formatDuration,
    formatMeasure
  } from "#lib/utils/format.ts";
  import { batteryTone } from "#lib/utils/levels.ts";
  import Graph from "./Graph.svelte";
  import Row from "./Row.svelte";
  import Well from "./Well.svelte";

  let battery = $derived(providers.battery);
  let cpu = $derived(providers.cpu);
  let disks = $derived(providers.disk?.disks ?? []);
  let host = $derived(providers.host);
  let memory = $derived(providers.memory);

  // The workspace colors, for each disk to have its own.
  const diskTones = ["--ws-1", "--ws-2", "--ws-3", "--ws-4", "--ws-5"];

  const usedPercent = (available: number, total: number) =>
    total > 0 ? ((total - available) / total) * 100 : 0;

  let chargeTone = $derived(
    batteryTone(battery?.chargePercent ?? 100, config.battery)
  );
</script>

<Well title="Processor" tone="--cpu">
  <Graph
    max={100}
    series={[{ values: history.value.cpu, class: "text-zb-cpu" }]}
  />
  {#if cpu}
    <Row label="Usage">{Math.round(cpu.usage)}%</Row>
    <Row label="Frequency">{(cpu.frequency / 1000).toFixed(2)} GHz</Row>
    <Row label="Cores">
      {cpu.physicalCoreCount} cores, {cpu.logicalCoreCount} threads
    </Row>
  {/if}
</Well>

<Well title="Memory" tone="--memory">
  <Graph
    max={100}
    series={[{ values: history.value.memory, class: "text-zb-memory" }]}
  />
  {#if memory}
    <Row label="Used">
      {formatBytes(memory.usedMemory)} of {formatBytes(memory.totalMemory)}
    </Row>
    {#if memory.totalSwap > 0}
      <Row label="Swap">
        {formatBytes(memory.usedSwap)} of {formatBytes(memory.totalSwap)}
      </Row>
    {/if}
  {/if}
</Well>

{#if disks.length > 0}
  <Well title="Disks" tone="--ws-1">
    {#each disks as disk, index (disk.mountPoint)}
      {@const used = usedPercent(
        disk.availableSpace.bytes,
        disk.totalSpace.bytes
      )}
      <div class="flex flex-col gap-1">
        <Row label={disk.name || disk.mountPoint}>
          {formatMeasure(disk.availableSpace)} free of
          {formatMeasure(disk.totalSpace)}
        </Row>
        <div class="h-2 overflow-hidden rounded-full bg-zb-surface-3">
          <div
            class="disk h-full rounded-full"
            style:--tone="var({diskTones[index % diskTones.length]})"
            style:width="{used}%"
          ></div>
        </div>
      </div>
    {/each}
  </Well>
{/if}

{#if battery?.state && battery.state !== "unknown"}
  <Well title="Battery" tone={chargeTone}>
    <Row label="Charge">{Math.round(battery.chargePercent)}%</Row>
    {#if battery.timeTillEmpty !== null}
      <Row label="Time left">{formatDuration(battery.timeTillEmpty)}</Row>
    {/if}
    {#if battery.timeTillFull !== null}
      <Row label="Time till full">{formatDuration(battery.timeTillFull)}</Row>
    {/if}
    <Row label="Health">{Math.round(battery.healthPercent)}%</Row>
    <Row label="Cycles">{battery.cycleCount}</Row>
  </Well>
{/if}

{#if host}
  <Well title="This PC" tone="--accent">
    {#if host.hostname}<Row label="Name">{host.hostname}</Row>{/if}
    {#if host.friendlyOsVersion}
      <Row label="System">{host.friendlyOsVersion}</Row>
    {/if}
    <Row label="Uptime">{formatDuration(host.uptime)}</Row>
  </Well>
{/if}

<style>
  .disk {
    background: hsl(var(--tone));
    transition: width var(--time-melt) var(--spring-melt);
  }
</style>
