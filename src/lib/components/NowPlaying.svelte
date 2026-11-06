<script lang="ts">
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { secondsToHms } from "#lib/utils/format.ts";
  import Pause from "@lucide/svelte/icons/pause";
  import Play from "@lucide/svelte/icons/play";
  import SkipBack from "@lucide/svelte/icons/skip-back";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import { onDestroy, untrack } from "svelte";
  import type { MediaSession } from "zebar";
  import AnimatedList from "./AnimatedList.svelte";
  import Meter from "./Meter.svelte";
  import Reveal from "./Reveal.svelte";

  let media = $derived(providers.media);
  let mediaTimeout: ReturnType<typeof setTimeout> | undefined;
  let shownSession = $state<MediaSession | null>(null);

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

<AnimatedList
  items={isOnPrimaryMonitor() && media && shownSession ? [shownSession] : []}
  key={() => "session"}
  anchor="end"
>
  {#snippet item(session: MediaSession)}
    <div class="relative flex h-full items-stretch">
      <Reveal when={!toggleModes.clickThrough}>
        <button
          class="relative flex h-full items-center justify-end transition hover:scale-125 hover:text-zb-accent"
          aria-label="Previous"
          onclick={() => media?.previous()}
        >
          <SkipBack class="mx-2" />
        </button>
      </Reveal>
      <button
        class="group relative inline-flex items-center justify-center gap-x-2 overflow-hidden px-1 transition hover:text-zb-accent"
        aria-label="Toggle"
        onclick={() => media?.togglePlayPause()}
      >
        <Meter
          animate={false}
          class="h-8 stroke-zb-accent"
          percent={Math.round((session.position / session.endTime) * 100)}
        >
          {#if session.isPlaying}
            <Pause class="transition group-hover:scale-125" />
          {:else}
            <Play class="transition group-hover:scale-125" />
          {/if}
        </Meter>
        <Reveal>
          <div
            class="relative flex max-w-24 min-w-24 items-center justify-center sm:max-w-48 md:max-w-64 lg:max-w-xs xl:max-w-sm"
          >
            <span
              class="truncate transition group-hover:translate-y-full group-hover:opacity-0"
            >
              <p class="truncate">
                {session.title}
              </p>
            </span>
            <span
              class={[
                "absolute inset-0 inline-flex -translate-y-full items-center justify-center",
                session.title && "opacity-0",
                "transition-all group-hover:translate-y-0 group-hover:opacity-100"
              ]}
            >
              {secondsToHms(session.position)}/{secondsToHms(session.endTime)}
            </span>
          </div>
        </Reveal>
      </button>
      <Reveal when={!toggleModes.clickThrough} anchor="end">
        <button
          class="relative flex h-full items-center justify-end transition hover:scale-125 hover:text-zb-accent"
          aria-label="Next"
          onclick={() => media?.next()}
        >
          <SkipForward class="mx-2" />
        </button>
      </Reveal>
    </div>
  {/snippet}
</AnimatedList>
