<script lang="ts">
  import { providers } from "$lib/providers.svelte";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import Volume from "@lucide/svelte/icons/volume";
  import Volume1 from "@lucide/svelte/icons/volume-1";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeOff from "@lucide/svelte/icons/volume-off";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import RangeSlider from "svelte-range-slider-pips";
  import SmoothDiv from "../SmoothDiv.svelte";
  import "./VolumeControl.css";

  let audio = $derived(providers.audio);
  let device = $derived(audio?.defaultPlaybackDevice);
  let volume = $derived(device?.volume ?? 0);
  let muted = $derived(device?.isMuted ?? false);
  let sliderOpen = $state(false);
  let values = $derived([volume]);

  const onMouseWheel = (e: WheelEvent) => {
    if (!device) return;
    e.preventDefault();
    const increment = 5;
    let newVolume = volume + (e.deltaY < 0 ? increment : -increment);
    newVolume = Math.max(0, Math.min(100, newVolume));
    audio?.setVolume(newVolume);
  };
</script>

{#if device}
  <div class="flex items-stretch h-full mr-1" onwheel={onMouseWheel}>
    <div class="h-full overflow-hidden flex items-center">
      <SmoothDiv outerClass="flex justify-end">
        {#if sliderOpen}
          <RangeSlider
            id="VolumeSlider"
            class="w-24 mr-2"
            float
            min={0}
            max={100}
            range="min"
            step={1}
            pips
            pipstep={10}
            bind:values
            on:change={(e) => audio?.setVolume(e.detail.value)}
          />
        {/if}
      </SmoothDiv>
    </div>
    <button
      class="transition px-1 text-lg hover:text-zb-accent hover:scale-125 {sliderOpen
        ? 'rotate-180'
        : ''}"
      aria-label="Open volume slider"
      onclick={() => (sliderOpen = !sliderOpen)}><ChevronLeft /></button
    >
    <button
      class="transition px-1 mr-1 text-lg stroke-2 hover:text-zb-accent hover:scale-125"
      aria-label="Mute"
      onclick={() => audio?.setMute(!muted)}
    >
      {#if device}
        {#if muted || volume === 0}
          <VolumeX />
        {:else if volume <= 33}
          <Volume />
        {:else if volume > 33 && volume <= 66}
          <Volume1 />
        {:else}
          <Volume2 />
        {/if}
      {:else}
        <VolumeOff />
      {/if}
    </button>
  </div>
{/if}
