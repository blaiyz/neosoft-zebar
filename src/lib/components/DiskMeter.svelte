<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import HardDrive from "@lucide/svelte/icons/hard-drive";
  import Meter from "./Meter.svelte";

  /** `c:`, `C:\` and `C:/` all name the same drive. */
  const normalize = (mountPoint: string) =>
    mountPoint.toLowerCase().replace(/[\\/]+$/, "");

  let disks = $derived(providers.disk?.disks ?? []);
  let disk = $derived(
    disks.find(
      ({ mountPoint }) =>
        normalize(mountPoint) === normalize(config.disk.mountPoint)
    ) ?? disks[0]
  );
  let usage = $derived.by(() => {
    if (!disk) return 0;
    const total = disk.totalSpace.bytes;
    const used = total - disk.availableSpace.bytes;
    return total > 0 ? Math.round((used / total) * 100) : 0;
  });
</script>

{#if disk}
  <button
    class="block"
    aria-label="System details"
    {@attach opensFlyout("system")}
  >
    <Meter
      class={[
        "h-8",
        usage >= config.disk.highUsage
          ? "stroke-zb-disk-high-usage text-zb-disk-high-usage"
          : "stroke-zb-disk text-zb-disk"
      ]}
      percent={usage}
    >
      <HardDrive />
    </Meter>
  </button>
{/if}
