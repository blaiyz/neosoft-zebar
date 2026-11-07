import { RemoteState } from "#lib/state/remote_state.svelte.ts";
import type { MediaOutput } from "zebar";

/**
 * A player picked by scrolling over the bar or from the Media flyout, which lasts
 * until Windows moves on to another, which `over` remembers. Shared, so that every
 * bar and the flyout agree on it.
 */
export const mediaChoice = new RemoteState<{
  sessionId: string;
  over: string | null;
} | null>("media.choice", null);

/** The player the bar shows. */
export function shownSession(media: MediaOutput | null) {
  const choice = mediaChoice.value;
  const currentId = media?.currentSession?.sessionId ?? null;
  const chosen =
    choice?.over === currentId
      ? media?.allSessions.find(
          ({ sessionId }) => sessionId === choice.sessionId
        )
      : undefined;
  return chosen ?? media?.currentSession ?? null;
}

/** Makes the bar show a player, until Windows moves on to another. */
export function chooseSession(media: MediaOutput | null, sessionId: string) {
  mediaChoice.value = {
    sessionId,
    over: media?.currentSession?.sessionId ?? null
  };
}
