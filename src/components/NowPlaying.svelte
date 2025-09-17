<script lang="ts">
  import { config } from "$lib/config.svelte";
  import { providers } from "$lib/providers.svelte";
  import { isOnPrimaryMonitor } from "$lib/utils/glaze_wm_utils.svelte";
  import Pause from "@lucide/svelte/icons/pause";
  import Play from "@lucide/svelte/icons/play";
  import SkipBack from "@lucide/svelte/icons/skip-back";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import { fly } from "svelte/transition";
  import Meter from "./Meter.svelte";
  import SmoothDiv from "./SmoothDiv.svelte";
  import type { MediaSession } from "zebar";
  import { untrack } from "svelte";

  let media = $derived(providers.media);
  let mediaTimeout: number | null = null;
  let shownSession = $state<MediaSession | null>(null);

  $effect(() => {
    const session = media?.currentSession;
    const prevSession: MediaSession | null = untrack(() => shownSession);
    if (session) {
      if (mediaTimeout) {
        clearTimeout(mediaTimeout);
        mediaTimeout = null;
      }
      shownSession = session;
      return;
    }
    if (prevSession) {
      if (mediaTimeout) {
        return;
      }
      mediaTimeout = setTimeout(() => {
        shownSession = null;
      }, 2000);
    } else {
      shownSession = null;
    }
  });

  const secondsToHms = (d: number) => {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    return `${h > 0 ? h + ":" : ""}${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };
</script>

<SmoothDiv outerClass="flex justify-end">
  {#if isOnPrimaryMonitor() && media && shownSession}
    <div
      transition:fly={{ y: 20, duration: config.transitionDuration }}
      class="flex items-stretch"
    >
      <button
        class="transition px-2 hover:text-zb-accent hover:scale-125"
        aria-label="Previous"
        onclick={() => media.previous()}
      >
        <SkipBack />
      </button>
      <button
        class="relative px-1 gap-x-2 overflow-hidden inline-flex items-center justify-center group transition hover:text-zb-accent"
        aria-label="Toggle"
        onclick={() => media.togglePlayPause()}
      >
        <Meter
          animate={false}
          class="stroke-zb-accent h-8"
          percent={Math.round(
            (shownSession.position / shownSession.endTime) * 100
          )}
        >
          {#if shownSession.isPlaying}
            <Pause class="transition transform group-hover:scale-125" />
          {:else}
            <Play class="transition transform group-hover:scale-125" />
          {/if}
        </Meter>
        <SmoothDiv
          innerClass="relative flex items-center justify-center min-w-24 max-w-24 sm:max-w-48 md:max-w-64 lg:max-w-xs xl:max-w-sm"
        >
          <span
            class="transition truncate group-hover:translate-y-full group-hover:opacity-0"
          >
            <p class="truncate">
              {shownSession.title}
            </p>
          </span>
          <span
            class="absolute inset-0 inline-flex items-center justify-center transform -translate-y-full {shownSession.title
              ? 'opacity-0'
              : ''} transition-all group-hover:translate-y-0 group-hover:opacity-100"
          >
            {secondsToHms(shownSession.position)}/{secondsToHms(
              shownSession.endTime
            )}
          </span>
        </SmoothDiv>
      </button>
      <button
        class="transition px-2 hover:text-zb-accent hover:scale-125"
        aria-label="Next"
        onclick={() => media.next()}
      >
        <SkipForward />
      </button>
    </div>
  {/if}
</SmoothDiv>
