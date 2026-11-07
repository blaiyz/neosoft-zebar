<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Meter from "./Meter.svelte";

  let memory = $derived(providers.memory);
  let usage = $derived(Math.round(memory?.usage ?? 0));
</script>

<button
  class="block"
  aria-label="System details"
  {@attach opensFlyout("system")}
>
  <Meter
    class={[
      "h-8",
      usage >= config.memory.highUsage
        ? "stroke-zb-memory-high-usage text-zb-memory-high-usage"
        : "stroke-zb-memory text-zb-memory"
    ]}
    percent={usage}
  >
    <MemoryStick />
  </Meter>
</button>
