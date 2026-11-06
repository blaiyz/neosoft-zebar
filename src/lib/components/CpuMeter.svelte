<script lang="ts">
  import { providers } from "#lib/state/providers.svelte.ts";
  import Cpu from "@lucide/svelte/icons/cpu";
  import Meter from "./Meter.svelte";

  let cpu = $derived(providers.cpu);
</script>

<Meter class="h-8 stroke-zb-cpu" percent={Math.round(cpu?.usage ?? 0)}>
  <Cpu />
</Meter>
