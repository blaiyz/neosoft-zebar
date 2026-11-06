<script lang="ts">
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { onDestroy, untrack } from "svelte";
  import type { MediaSession } from "zebar";
  import Collapsible from "./Collapsible.svelte";
  import MediaControls from "./MediaControls.svelte";

  /** How far a reading can be from where this has counted to, in seconds. */
  const SEEK_TOLERANCE = 2;
  /** How often the time moves on between readings, in milliseconds. */
  const TICK_TIME = 250;

  let media = $derived(providers.media);
  let mediaTimeout: ReturnType<typeof setTimeout> | undefined;
  let shownSession = $state<MediaSession | null>(null);
  // Stays after the session ends, to show while the section closes.
  let lastSession = $state.raw<MediaSession | null>(null);
  let active = $derived(media !== null && shownSession !== null);

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

  // The provider only reports each percent of a track, so the time counts up by
  // itself in between. A reading close to it is left alone, to keep it from stepping
  // back, and anything further off is a seek.
  let position = $state(0);
  let countedTitle: string | null = null;

  $effect(() => {
    if (!lastSession) return;
    const { title, isPlaying, endTime, position: reading } = lastSession;

    const isOff = Math.abs(reading - untrack(() => position)) > SEEK_TOLERANCE;
    if (!isPlaying || isOff || title !== countedTitle) position = reading;
    countedTitle = title;
    if (!isPlaying) return;

    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      position = Math.min(endTime, position + (now - last) / 1000);
      last = now;
    }, TICK_TIME);

    return () => {
      clearInterval(timer);
    };
  });

  let session = $derived(lastSession && { ...lastSession, position });

  onDestroy(() => clearTimeout(mediaTimeout));
</script>

<Collapsible when={active} anchor="end">
  {#if session}
    <MediaControls
      style={config.media.style}
      {session}
      skips={!toggleModes.clickThrough}
      part="media.title"
      onprevious={() => media?.previous()}
      ontoggle={() => media?.togglePlayPause()}
      onnext={() => media?.next()}
    />
  {/if}
</Collapsible>
