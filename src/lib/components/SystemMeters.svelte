<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import Cpu from "@lucide/svelte/icons/cpu";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Meter from "./Meter.svelte";

  let cpu = $derived(providers.cpu);
  let memory = $derived(providers.memory);
</script>

{#if config.showCpuSection}
  <Meter class="h-8 stroke-zb-cpu" percent={Math.round(cpu?.usage ?? 0)}>
    <Cpu />
  </Meter>
{/if}
{#if config.showMemorySection}
  <Meter class="h-8 stroke-zb-memory" percent={Math.round(memory?.usage ?? 0)}>
    <MemoryStick />
  </Meter>
{/if}
