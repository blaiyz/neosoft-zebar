<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import Cpu from "@lucide/svelte/icons/cpu";
  import Meter from "./Meter.svelte";

  let cpu = $derived(providers.cpu);
  let usage = $derived(Math.round(cpu?.usage ?? 0));
</script>

<button
  class="block"
  aria-label="System details"
  {@attach opensFlyout("system")}
>
  <Meter
    class={[
      "h-8",
      usage >= config.cpu.highUsage
        ? "stroke-zb-cpu-high-usage text-zb-cpu-high-usage"
        : "stroke-zb-cpu text-zb-cpu"
    ]}
    percent={usage}
  >
    <Cpu />
  </Meter>
</button>
