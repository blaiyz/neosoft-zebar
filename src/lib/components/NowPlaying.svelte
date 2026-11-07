<script lang="ts">
  import { getAppIcon } from "#lib/icon_loader.ts";
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { chooseSession, shownSession } from "#lib/state/media.svelte.ts";
  import { playhead } from "#lib/state/playhead.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { onDestroy, untrack } from "svelte";
  import type { MediaSession } from "zebar";
  import Collapsible from "./Collapsible.svelte";
  import MediaControls from "./MediaControls.svelte";

  /** How far to scroll for the next player, which is one notch of a mouse wheel. */
  const SCROLL_STEP = 100;

  let media = $derived(providers.media);
  let playing = $derived(shownSession(media));

  let mediaTimeout: ReturnType<typeof setTimeout> | undefined;
  let visibleSession = $state<MediaSession | null>(null);
  // Stays after the session ends, to show while the section closes.
  let lastSession = $state.raw<MediaSession | null>(null);
  let active = $derived(media !== null && visibleSession !== null);

  $effect(() => {
    const session = playing;
    const prevSession: MediaSession | null = untrack(() => visibleSession);
    if (session) {
      clearTimeout(mediaTimeout);
      mediaTimeout = undefined;
      visibleSession = session;
      lastSession = session;
      return;
    }
    if (prevSession) {
      if (mediaTimeout) {
        return;
      }
      mediaTimeout = setTimeout(() => {
        mediaTimeout = undefined;
        visibleSession = null;
      }, 2000);
    } else {
      visibleSession = null;
    }
  });

  const head = playhead(() => lastSession);
  let session = $derived(
    lastSession && { ...lastSession, position: head.position }
  );
  let target = $derived(
    lastSession ? { sessionId: lastSession.sessionId } : undefined
  );

  let scrolled = 0;

  /** Goes round the players, when there's more than one. */
  const onWheel = (event: WheelEvent) => {
    const sessions = media?.allSessions ?? [];
    if (!config.media.scrollSessions || sessions.length < 2) return;
    event.preventDefault();

    scrolled += event.deltaY;
    if (Math.abs(scrolled) < SCROLL_STEP) return;
    const step = Math.sign(scrolled);
    scrolled = 0;

    const index = sessions.findIndex(
      ({ sessionId }) => sessionId === lastSession?.sessionId
    );
    const next = sessions.at((index + step) % sessions.length);
    if (next) chooseSession(media, next.sessionId);
  };

  onDestroy(() => clearTimeout(mediaTimeout));
</script>

<Collapsible when={active} anchor="end">
  {#if session}
    <div class="flex h-full items-center" onwheel={onWheel}>
      <MediaControls
        style={config.media.style}
        {session}
        skips={!toggleModes.clickThrough}
        part="media.title"
        icon={config.media.appIcon ? getAppIcon(session.sessionId) : undefined}
        opens={config.media.titleOpensFlyout ? opensFlyout("media") : undefined}
        onprevious={() => media?.previous(target)}
        ontoggle={() => media?.togglePlayPause(target)}
        onnext={() => media?.next(target)}
      />
    </div>
  {/if}
</Collapsible>
