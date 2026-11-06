<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import Cpu from "@lucide/svelte/icons/cpu";
  import Meter from "./Meter.svelte";

  let cpu = $derived(providers.cpu);
</script>

<button
  class="block"
  aria-label="System details"
  {@attach opensFlyout("system")}
>
  <Meter
    class="h-8 stroke-zb-cpu text-zb-cpu"
    percent={Math.round(cpu?.usage ?? 0)}
  >
    <Cpu />
  </Meter>
</button>
