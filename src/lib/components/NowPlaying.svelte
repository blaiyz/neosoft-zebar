<script lang="ts">
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { secondsToHms } from "#lib/utils/format.ts";
  import { isOnPrimaryMonitor } from "#lib/utils/glaze_wm_utils.svelte.ts";
  import Pause from "@lucide/svelte/icons/pause";
  import Play from "@lucide/svelte/icons/play";
  import SkipBack from "@lucide/svelte/icons/skip-back";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import { onDestroy, untrack } from "svelte";
  import { fly } from "svelte/transition";
  import type { MediaSession } from "zebar";
  import Meter from "./Meter.svelte";
  import SmoothDiv from "./SmoothDiv.svelte";

  let media = $derived(providers.media);
  let mediaTimeout: ReturnType<typeof setTimeout> | undefined;
  let shownSession = $state<MediaSession | null>(null);

  // The buttons only exist while click-through is off, so this applies during their outro.
  let leavingClass = $derived(toggleModes.clickThrough && "absolute");

  $effect(() => {
    const session = media?.currentSession;
    const prevSession: MediaSession | null = untrack(() => shownSession);
    if (session) {
      clearTimeout(mediaTimeout);
      mediaTimeout = undefined;
      shownSession = session;
      return;
    }
    if (prevSession) {
      if (mediaTimeout) {
        return;
      }
      mediaTimeout = setTimeout(() => {
        mediaTimeout = undefined;
        shownSession = null;
      }, 2000);
    } else {
      shownSession = null;
    }
  });

  onDestroy(() => clearTimeout(mediaTimeout));
</script>

<SmoothDiv class="flex justify-end">
  {#if isOnPrimaryMonitor() && media && shownSession}
    <div
      transition:fly={{ y: 20, duration: config.transitionDuration }}
      class="relative flex items-stretch"
    >
      {#if !toggleModes.clickThrough}
        <button
          class="relative flex items-center justify-end transition hover:scale-125 hover:text-zb-accent"
          aria-label="Previous"
          onclick={() => media.previous()}
          transition:fly={{ y: 20, duration: config.transitionDuration }}
        >
          <SkipBack class={[leavingClass, "mx-2"]} />
        </button>
      {/if}
      <button
        class="group relative inline-flex items-center justify-center gap-x-2 overflow-hidden px-1 transition hover:text-zb-accent"
        aria-label="Toggle"
        onclick={() => media.togglePlayPause()}
      >
        <Meter
          animate={false}
          class="h-8 stroke-zb-accent"
          percent={Math.round(
            (shownSession.position / shownSession.endTime) * 100
          )}
        >
          {#if shownSession.isPlaying}
            <Pause class="transition group-hover:scale-125" />
          {:else}
            <Play class="transition group-hover:scale-125" />
          {/if}
        </Meter>
        <SmoothDiv
          innerClass="relative flex max-w-24 min-w-24 items-center justify-center sm:max-w-48 md:max-w-64 lg:max-w-xs xl:max-w-sm"
        >
          <span
            class="truncate transition group-hover:translate-y-full group-hover:opacity-0"
          >
            <p class="truncate">
              {shownSession.title}
            </p>
          </span>
          <span
            class={[
              "absolute inset-0 inline-flex -translate-y-full items-center justify-center",
              shownSession.title && "opacity-0",
              "transition-all group-hover:translate-y-0 group-hover:opacity-100"
            ]}
          >
            {secondsToHms(shownSession.position)}/{secondsToHms(
              shownSession.endTime
            )}
          </span>
        </SmoothDiv>
      </button>
      <SmoothDiv
        height={false}
        class="flex justify-end"
        innerClass="flex justify-end"
      >
        {#if !toggleModes.clickThrough}
          <button
            class="relative flex h-full items-center justify-end transition hover:scale-125 hover:text-zb-accent"
            aria-label="Next"
            onclick={() => media.next()}
            transition:fly={{ y: 20, duration: config.transitionDuration }}
          >
            <SkipForward class={[leavingClass, "mx-2"]} />
          </button>
        {/if}
      </SmoothDiv>
    </div>
  {/if}
</SmoothDiv>
