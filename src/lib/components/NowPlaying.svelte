<script lang="ts">
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { layout, partTarget, remToPx } from "#lib/state/layout.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { secondsToHms } from "#lib/utils/format.ts";
  import Pause from "@lucide/svelte/icons/pause";
  import Play from "@lucide/svelte/icons/play";
  import SkipBack from "@lucide/svelte/icons/skip-back";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import { onDestroy, untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { MediaSession } from "zebar";
  import Collapsible from "./Collapsible.svelte";
  import Meter from "./Meter.svelte";
  import Reveal from "./Reveal.svelte";

  /** The range of the title's width and the space before it, in rem. */
  const TITLE_MIN = 6;
  const TITLE_MAX = 24;
  const TITLE_GAP = 0.5;

  let media = $derived(providers.media);
  let mediaTimeout: ReturnType<typeof setTimeout> | undefined;
  let shownSession = $state<MediaSession | null>(null);
  // Stays after the session ends, to show while the section closes.
  let lastSession = $state.raw<MediaSession | null>(null);
  let active = $derived(media !== null && shownSession !== null);

  // What the title would like to be, which an invisible copy of it reports.
  let titleWidth = $state(0);
  let titleLimit = $derived(partTarget("media.title"));

  const measureTitle: Attachment<HTMLElement> = (element) => {
    const observer = new ResizeObserver(() => {
      titleWidth = Math.min(
        Math.max(
          element.getBoundingClientRect().width + remToPx(TITLE_GAP),
          remToPx(TITLE_MIN)
        ),
        remToPx(TITLE_MAX)
      );
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  };

  $effect(() => {
    const session = media?.currentSession;
    const prevSession: MediaSession | null = untrack(() => shownSession);
    if (session) {
      clearTimeout(mediaTimeout);
      mediaTimeout = undefined;
      shownSession = session;
      lastSession = session;
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

<Collapsible when={active} anchor="end">
  {#if lastSession}
    {@const session = lastSession}
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
        class="group relative inline-flex items-center justify-center overflow-hidden px-1 transition hover:text-zb-accent"
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
        <Collapsible
          part="media.title"
          when={active}
          full={() => titleWidth}
          floor={() => remToPx(TITLE_MIN)}
        >
          <div
            class={[
              "relative flex items-center justify-center pl-2",
              layout.ready && "transition-[width] ease-(--ease)"
            ]}
            style:width="{titleLimit || titleWidth}px"
          >
            <span
              {@attach measureTitle}
              class="invisible absolute whitespace-nowrap"
              aria-hidden="true"
            >
              {session.title}
            </span>
            <span
              class="truncate transition group-hover:translate-y-full group-hover:opacity-0"
            >
              <p class="truncate">
                {session.title}
              </p>
            </span>
            <span
              class={[
                "absolute inset-y-0 right-0 left-2 inline-flex -translate-y-full items-center justify-center",
                session.title && "opacity-0",
                "transition-all group-hover:translate-y-0 group-hover:opacity-100"
              ]}
            >
              {secondsToHms(session.position)}/{secondsToHms(session.endTime)}
            </span>
          </div>
        </Collapsible>
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
  {/if}
</Collapsible>
