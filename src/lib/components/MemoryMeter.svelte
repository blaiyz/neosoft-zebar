<script lang="ts">
  import { providers } from "#lib/state/providers.svelte.ts";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Meter from "./Meter.svelte";

  let memory = $derived(providers.memory);
</script>

<Meter class="h-8 stroke-zb-memory" percent={Math.round(memory?.usage ?? 0)}>
  <MemoryStick />
</Meter>
