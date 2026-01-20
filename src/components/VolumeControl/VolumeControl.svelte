<script lang="ts">
  import { toggleModes } from "$lib/binding_modes.svelte";
  import { config, configLoaded } from "$lib/config.svelte";
  import { providers } from "$lib/providers.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Volume from "@lucide/svelte/icons/volume";
  import Volume1 from "@lucide/svelte/icons/volume-1";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeOff from "@lucide/svelte/icons/volume-off";
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

  const onMouseWheel = (e: WheelEvent) => {
    if (!device) return;
    e.preventDefault();
    const increment = 5;
    let newVolume = volume + (e.deltaY < 0 ? increment : -increment);
    newVolume = Math.max(0, Math.min(100, newVolume));
    audio?.setVolume(newVolume);
  };

  onMount(async () => {
    await configLoaded;
    if (config.extendVolumeSliderByDefault) {
      sliderOpen = true;
    }
  });
</script>

{#if device}
  <div class="flex items-stretch h-full mr-1" onwheel={onMouseWheel}>
    <div class="h-full overflow-hidden flex items-center">
      <SmoothDiv outerClass="flex justify-end" innerClass="flex justify-end">
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
            on:change={(e) => audio?.setVolume(e.detail.value)}
          />
        {/if}
      </SmoothDiv>
    </div>
    <SmoothDiv
      height={false}
      outerClass="h-full flex justify-end"
      innerClass="flex justify-end"
    >
      {#if !toggleModes.clickThrough}
        <button
          class="h-full flex items-center justify-end transition text-lg hover:text-zb-accent hover:scale-125 relative"
          aria-label="Open volume slider"
          onclick={() => (sliderOpen = !sliderOpen)}
          transition:fly={{ y: 20, duration: config.transitionDuration }}
        >
          <ChevronLeft
            class="{toggleModes.clickThrough ? 'absolute' : ''} {sliderOpen
              ? 'rotate-180'
              : ''} transition mx-1"
          />
        </button>
      {/if}
    </SmoothDiv>
    <SmoothDiv
      height={false}
      outerClass="h-full flex justify-end"
      innerClass="flex justify-end"
    >
      {@const visible = !sliderOpen || !toggleModes.clickThrough}
      {#if visible}
        <button
          class="h-full flex items-center justify-end transition text-lg stroke-2 hover:text-zb-accent hover:scale-125 relative"
          aria-label="Mute"
          onclick={() => audio?.setMute(!muted)}
          transition:fly={{ y: 20, duration: config.transitionDuration }}
        >
          <!--
            One might ask: Why does this guy repeat the same class logic for each icon?
            For some reason, the conditional for 'absolute' doesn't work when I put it in a wrapper div, nor when I put 
            it in the parent button. Might have something to do with svelte transitions? And why does it work just fine
            with the icon components? Go figure. I've spent way too long on this.
          -->
          {#if device}
            {#if muted || volume === 0}
              <VolumeX
                class="{!visible ? 'absolute' : ''} {toggleModes.clickThrough
                  ? 'ml-2'
                  : 'ml-1'} mr-2"
              />
            {:else if volume <= 33}
              <Volume
                class="{!visible ? 'absolute' : ''} {toggleModes.clickThrough
                  ? 'ml-2'
                  : 'ml-1'} mr-2"
              />
            {:else if volume > 33 && volume <= 66}
              <Volume1
                class="{!visible ? 'absolute' : ''} {toggleModes.clickThrough
                  ? 'ml-2'
                  : 'ml-1'} mr-2"
              />
            {:else}
              <Volume2
                class="{!visible ? 'absolute' : ''} {toggleModes.clickThrough
                  ? 'ml-2'
                  : 'ml-1'} mr-2"
              />
            {/if}
          {:else}
            <VolumeOff
              class="{!visible ? 'absolute' : ''} {toggleModes.clickThrough
                ? 'ml-2'
                : 'ml-1'} mr-2"
            />
          {/if}
        </button>
      {/if}
    </SmoothDiv>
  </div>
{/if}
