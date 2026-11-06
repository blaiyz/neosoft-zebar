<script lang="ts">
  import { providers } from "#lib/state/providers.svelte.ts";
  import Mic from "@lucide/svelte/icons/mic";
  import MicOff from "@lucide/svelte/icons/mic-off";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import type { AudioDevice } from "zebar";
  import Slider from "../Slider.svelte";
  import Well from "./Well.svelte";

  let audio = $derived(providers.audio);

  const defaultFirst = (devices: AudioDevice[]) =>
    devices.toSorted(
      (a, b) =>
        Number(b.isDefaultPlayback || b.isDefaultRecording) -
        Number(a.isDefaultPlayback || a.isDefaultRecording)
    );
</script>

{#snippet device(
  { deviceId, name, volume, isMuted }: AudioDevice,
  input: boolean
)}
  {@const Icon = input ? (isMuted ? MicOff : Mic) : isMuted ? VolumeX : Volume2}
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2.5">
      <button
        class={["mute", isMuted && "off"]}
        aria-label={isMuted ? `Unmute ${name}` : `Mute ${name}`}
        aria-pressed={isMuted}
        onclick={() => audio?.setMute(!isMuted, { deviceId })}
      >
        {#key isMuted}
          <span class="icon"><Icon /></span>
        {/key}
      </button>
      <span class="min-w-0 flex-1 truncate" title={name}>{name}</span>
      <span
        class={[
          "flex-none text-sm tabular-nums transition-opacity",
          isMuted ? "text-zb-faint" : "text-zb-dim"
        ]}
      >
        {volume}%
      </span>
    </div>
    <Slider
      variant={input ? "swell" : "wave"}
      value={volume}
      muted={isMuted}
      label="Volume of {name}"
      onchange={(next: number) => audio?.setVolume(next, { deviceId })}
    />
  </div>
{/snippet}

{#if audio}
  <Well title="Output" tone="--volume-end">
    {#each defaultFirst(audio.playbackDevices) as item (item.deviceId)}
      {@render device(item, false)}
    {/each}
  </Well>
  {#if audio.recordingDevices.length > 0}
    <Well title="Input" tone="--volume-start">
      {#each defaultFirst(audio.recordingDevices) as item (item.deviceId)}
        {@render device(item, true)}
      {/each}
    </Well>
  {/if}
{/if}

<style>
  .mute {
    display: grid;
    flex: none;
    width: 2.2rem;
    height: 2.2rem;
    place-items: center;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 1.15rem;
    transition:
      background-color var(--transition-duration) var(--spring-out),
      color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .mute:hover {
    background: var(--surface-3);
  }

  .mute:active {
    scale: 0.88;
  }

  .mute.off {
    background: color-mix(in srgb, hsl(var(--icon)) 30%, hsl(var(--bg)));
    color: hsl(var(--icon));
  }

  .icon {
    display: grid;
    transition: scale var(--time-soft) var(--spring-pop);

    @starting-style {
      scale: 0.5;
    }
  }
</style>
