import { untrack } from "svelte";
import type { MediaSession } from "zebar";

/** How far a reading can be from where this has counted to, in seconds. */
const SEEK_TOLERANCE = 2;
/** How often the time moves on between readings, in milliseconds. */
const TICK_TIME = 250;

type Track = Pick<MediaSession, "title" | "isPlaying" | "endTime" | "position">;

/**
 * Where a track has got to. The provider only reports each percent of a track, so
 * this counts up by itself in between. A reading close to it is left alone, to keep
 * it from stepping back, and anything further off is a seek.
 *
 * Call while a component initializes.
 */
export function playhead(read: () => Track | null | undefined) {
  let position = $state(0);
  let countedTitle: string | null = null;

  $effect(() => {
    const track = read();
    if (!track) return;
    const { title, isPlaying, endTime, position: reading } = track;

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

  return {
    get position() {
      return position;
    }
  };
}
