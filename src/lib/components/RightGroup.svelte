<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
  import Clock from "./Clock.svelte";
  import NowPlaying from "./NowPlaying.svelte";
  import VolumeControl from "./VolumeControl/VolumeControl.svelte";
  import Weather from "./Weather.svelte";
</script>

<div class="flex h-full flex-row items-center">
  <NowPlaying />
  {#if isOnPrimaryMonitor()}
    <VolumeControl />
  {/if}
  {#if config.showWeatherSection}
    <Weather />
  {/if}
  {#if !isOnPrimaryMonitor() || !config.taskbarIntegration.enabled}
    <Clock />
  {/if}
</div>
