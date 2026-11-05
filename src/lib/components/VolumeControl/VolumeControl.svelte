<script lang="ts">
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config, configLoaded } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Volume from "@lucide/svelte/icons/volume";
  import Volume1 from "@lucide/svelte/icons/volume-1";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import { onMount } from "svelte";
  import RangeSlider from "svelte-range-slider-pips";
  import { fly } from "svelte/transition";
  import SmoothDiv from "../SmoothDiv.svelte";
  import "./VolumeControl.css";

  let audio = $derived(providers.audio);
  let device = $derived(audio?.defaultPlaybackDevice);
  let volume = $derived(device?.volume ?? 0);
  let muted = $derived(device?.isMuted ?? false);
  let sliderOpen = $state(false);
  let values = $derived([volume]);

  let VolumeIcon = $derived.by(() => {
    if (muted || volume === 0) return VolumeX;
    if (volume <= 33) return Volume;
    if (volume <= 66) return Volume1;
    return Volume2;
  });

  // The chevron only exists while click-through is off, so this applies during its outro.
  let leavingClass = $derived(toggleModes.clickThrough && "absolute");

  const onMouseWheel = (e: WheelEvent) => {
    if (!device) return;
    e.preventDefault();
    const increment = 5;
    let newVolume = volume + (e.deltaY < 0 ? increment : -increment);
    newVolume = Math.max(0, Math.min(100, newVolume));
    void audio?.setVolume(newVolume);
  };

  onMount(async () => {
    await configLoaded;
    if (config.extendVolumeSliderByDefault) {
      sliderOpen = true;
    }
  });
</script>

{#if device}
  <div class="mr-1 flex h-full items-stretch" onwheel={onMouseWheel}>
    <div class="flex h-full items-center overflow-hidden">
      <SmoothDiv class="flex justify-end" innerClass="flex justify-end">
        {#if sliderOpen}
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
        {/if}
      </SmoothDiv>
    </div>
    <SmoothDiv
      height={false}
      class="flex h-full justify-end"
      innerClass="flex justify-end"
    >
      {#if !toggleModes.clickThrough}
        <button
          class="relative flex h-full items-center justify-end text-lg transition hover:scale-125 hover:text-zb-accent"
          aria-label="Open volume slider"
          onclick={() => (sliderOpen = !sliderOpen)}
          transition:fly={{ y: 20, duration: config.transitionDuration }}
        >
          <ChevronLeft
            class={[
              leavingClass,
              sliderOpen && "rotate-180",
              "mx-1 transition"
            ]}
          />
        </button>
      {/if}
    </SmoothDiv>
    <SmoothDiv
      height={false}
      class="flex h-full justify-end"
      innerClass="flex justify-end"
    >
      {@const visible = !sliderOpen || !toggleModes.clickThrough}
      {#if visible}
        <button
          class="relative flex h-full items-center justify-end stroke-2 text-lg transition hover:scale-125 hover:text-zb-accent"
          aria-label="Mute"
          onclick={() => audio?.setMute(!muted)}
          transition:fly={{ y: 20, duration: config.transitionDuration }}
        >
          <!-- `absolute` has to be on the icon: during the outro it has no effect on a wrapper or the button. -->
          <VolumeIcon
            class={[
              !visible && "absolute",
              toggleModes.clickThrough ? "ml-2" : "ml-1",
              "mr-2"
            ]}
          />
        </button>
      {/if}
    </SmoothDiv>
  </div>
{/if}
