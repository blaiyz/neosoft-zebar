<script lang="ts">
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { partTarget, preferPart } from "#lib/state/layout.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Volume from "@lucide/svelte/icons/volume";
  import Volume1 from "@lucide/svelte/icons/volume-1";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import RangeSlider from "svelte-range-slider-pips";
  import Collapsible from "../Collapsible.svelte";
  import Reveal from "../Reveal.svelte";
  import "./VolumeControl.css";

  let audio = $derived(providers.audio);
  let device = $derived(audio?.defaultPlaybackDevice);
  let volume = $derived(device?.volume ?? 0);
  let muted = $derived(device?.isMuted ?? false);
  let sliderOpen = $derived(config.volume.sliderOpen);
  let sliderShown = $derived(sliderOpen && partTarget("volume.slider") !== 0);
  let values = $derived([volume]);

  $effect(() => {
    preferPart("volume.slider", sliderOpen);
  });

  let VolumeIcon = $derived.by(() => {
    if (muted || volume === 0) return VolumeX;
    if (volume <= 33) return Volume;
    if (volume <= 66) return Volume1;
    return Volume2;
  });

  const onMouseWheel = (e: WheelEvent) => {
    if (!device) return;
    e.preventDefault();
    const increment = 5;
    let newVolume = volume + (e.deltaY < 0 ? increment : -increment);
    newVolume = Math.max(0, Math.min(100, newVolume));
    void audio?.setVolume(newVolume);
  };
</script>

{#if device}
  <div class="mr-1 flex h-full items-stretch" onwheel={onMouseWheel}>
    <Collapsible
      part="volume.slider"
      when={sliderOpen}
      anchor="end"
      fly={false}
    >
      {#if toggleModes.clickThrough}
        <div class="w-2"></div>
      {/if}
      <RangeSlider
        id="VolumeSlider"
        class="w-24"
        float
        min={0}
        max={100}
        range="min"
        step={1}
        pips
        pipstep={10}
        bind:values
        on:change={(e: CustomEvent<{ value: number }>) =>
          audio?.setVolume(e.detail.value)}
      />
    </Collapsible>
    <Collapsible part="volume.chevron">
      <Reveal when={!toggleModes.clickThrough} anchor="end">
        <button
          class="relative flex h-full items-center justify-end text-lg transition hover:scale-125 hover:text-zb-accent"
          aria-label="Open volume slider"
          onclick={() => (sliderOpen = !sliderShown)}
        >
          <ChevronLeft
            class={[sliderShown && "rotate-180", "mx-1 transition"]}
          />
        </button>
      </Reveal>
    </Collapsible>
    <Reveal when={!sliderShown || !toggleModes.clickThrough} anchor="end">
      <button
        class="relative flex h-full items-center justify-end stroke-2 text-lg transition hover:scale-125 hover:text-zb-accent"
        aria-label="Mute"
        onclick={() => audio?.setMute(!muted)}
      >
        <VolumeIcon
          class={[toggleModes.clickThrough ? "ml-2" : "ml-1", "mr-2"]}
        />
      </button>
    </Reveal>
  </div>
{/if}
