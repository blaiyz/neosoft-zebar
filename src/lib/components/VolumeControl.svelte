<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import MicOff from "@lucide/svelte/icons/mic-off";
  import Volume from "@lucide/svelte/icons/volume";
  import Volume1 from "@lucide/svelte/icons/volume-1";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import Reveal from "./Reveal.svelte";

  let audio = $derived(providers.audio);
  let device = $derived(audio?.defaultPlaybackDevice);
  let volume = $derived(device?.volume ?? 0);
  let muted = $derived(device?.isMuted ?? false);
  let microphone = $derived(audio?.defaultRecordingDevice);
  let micMuted = $derived(
    config.volume.micIndicator && microphone?.isMuted === true
  );

  let VolumeIcon = $derived.by(() => {
    if (muted || volume === 0) return VolumeX;
    if (volume <= 33) return Volume;
    if (volume <= 66) return Volume1;
    return Volume2;
  });

  const onMouseWheel = (e: WheelEvent) => {
    if (!device) return;
    e.preventDefault();
    const step = config.volume.scrollStep;
    const change = e.deltaY < 0 ? step : -step;
    void audio?.setVolume(Math.max(0, Math.min(100, volume + change)));
  };
</script>

<Reveal when={micMuted}>
  <button
    class="flex h-full items-center px-1 text-lg text-zb-volume-start transition hover:text-zb-accent"
    aria-label="Unmute the microphone"
    onclick={() => {
      if (microphone) {
        void audio?.setMute(false, { deviceId: microphone.deviceId });
      }
    }}
  >
    <MicOff />
  </button>
</Reveal>
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
