import { untrack } from "svelte";
import type { MediaSession } from "zebar";

/** How far a reading can be from where this has counted to, in seconds. */
const SEEK_TOLERANCE = 2;
/** How late after each whole second the time moves on, in milliseconds. */
const TICK_MARGIN = 20;

/** How long until a position reaches its next whole second, in milliseconds. */
const untilNextSecond = (seconds: number) =>
  (1 - (seconds % 1)) * 1000 + TICK_MARGIN;

type Track = Pick<MediaSession, "title" | "isPlaying" | "endTime" | "position">;

/**
 * Where a track has got to. The provider only reports each percent of a track, so
 * this counts up by itself in between. A reading close to it is left alone, to keep
 * it from stepping back, and anything further off is a seek.
 *
 * Call while a component initializes.
 */
export function playhead(read: () => Track | null | undefined) {
  // Starts where the track is, so that nothing shown moves up to it from 0.
  let position = $state(untrack(() => read()?.position ?? 0));
  let countedTitle: string | null = null;

  $effect(() => {
    const track = read();
    if (!track) return;
    const { title, isPlaying, endTime, position: reading } = track;

    const isOff = Math.abs(reading - untrack(() => position)) > SEEK_TOLERANCE;
    if (!isPlaying || isOff || title !== countedTitle) position = reading;
    countedTitle = title;
    if (!isPlaying) return;

    // Once a second, as the shown time changes, which is all the bar shows.
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      position = Math.min(endTime, position + (now - last) / 1000);
      last = now;
      timer = setTimeout(tick, untilNextSecond(position));
    };
    let timer = setTimeout(tick, untilNextSecond(untrack(() => position)));

    // A reading arrives between ticks, so the time since the last one still counts.
    return () => {
      clearTimeout(timer);
      position = Math.min(
        endTime,
        position + (performance.now() - last) / 1000
      );
    };
  });

  return {
    get position() {
      return position;
    }
  };
}
