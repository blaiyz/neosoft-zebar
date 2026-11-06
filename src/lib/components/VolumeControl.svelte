<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import Volume from "@lucide/svelte/icons/volume";
  import Volume1 from "@lucide/svelte/icons/volume-1";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";

  const SCROLL_STEP = 5;

  let audio = $derived(providers.audio);
  let device = $derived(audio?.defaultPlaybackDevice);
  let volume = $derived(device?.volume ?? 0);
  let muted = $derived(device?.isMuted ?? false);

  let VolumeIcon = $derived.by(() => {
    if (muted || volume === 0) return VolumeX;
    if (volume <= 33) return Volume;
    if (volume <= 66) return Volume1;
    return Volume2;
  });

  const onMouseWheel = (e: WheelEvent) => {
    if (!device) return;
    e.preventDefault();
    const change = e.deltaY < 0 ? SCROLL_STEP : -SCROLL_STEP;
    void audio?.setVolume(Math.max(0, Math.min(100, volume + change)));
  };
</script>

{#if device}
  <button
    class="relative mr-1 flex h-full items-center stroke-2 text-lg transition hover:text-zb-accent"
    aria-label="Volume"
    onwheel={onMouseWheel}
    {@attach opensFlyout("audio")}
  >
    <VolumeIcon class="mr-2 ml-1" />
  </button>
{/if}
