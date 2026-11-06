<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Meter from "./Meter.svelte";

  let memory = $derived(providers.memory);
</script>

<button
  class="block"
  aria-label="System details"
  {@attach opensFlyout("system")}
>
  <Meter
    class="h-8 stroke-zb-memory text-zb-memory"
    percent={Math.round(memory?.usage ?? 0)}
  >
    <MemoryStick />
  </Meter>
</button>
