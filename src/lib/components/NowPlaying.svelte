<script lang="ts">
  import { getAppIcon } from "#lib/icon_loader.ts";
  import { toggleModes } from "#lib/state/binding_modes.svelte.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { chooseSession, shownSession } from "#lib/state/media.svelte.ts";
  import { playhead } from "#lib/state/playhead.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import type { MediaSession } from "zebar";
  import Collapsible from "./Collapsible.svelte";
  import MediaControls from "./MediaControls.svelte";

  /** How far to scroll for the next player, which is one notch of a mouse wheel. */
  const SCROLL_STEP = 100;

  let media = $derived(providers.media);
  let playing = $derived(shownSession(media));

  /** How long the section waits after the last session ends, in milliseconds. */
  const LINGER_TIME = 2000;

  let visible = $state(false);
  // Stays after the session ends, to show while the section closes.
  let lastSession = $state.raw<MediaSession | null>(null);
  let active = $derived(media !== null && visible);

  // A gap between two sessions, as when a player switches tracks, doesn't close it.
  $effect(() => {
    if (playing) {
      lastSession = playing;
      visible = true;
      return;
    }
    const timer = setTimeout(() => {
      visible = false;
    }, LINGER_TIME);
    return () => {
      clearTimeout(timer);
    };
  });

  // Stops counting once the section is going, so a session that ended while it
  // played doesn't keep a timer running.
  const head = playhead(() => (visible ? lastSession : null));
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
