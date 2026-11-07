import { config } from "#lib/state/config.svelte.ts";
import { flushSync } from "svelte";

/**
 * How long the bar stays animated after it was last used, as a multiple of the
 * transition duration. The longest animation takes 1.9 times as long, and a change
 * of width can make other sections give way after it.
 */
const LINGER = 3;

/** Whether the pointer is over this window. */
let hovered = $state(false);
/** Whether the pointer left this window a moment ago. */
let lingering = $state(false);
/** Only the bar tracks its use. Every other window is only open while it's in use. */
let tracked = $state(false);
let isBusy = () => false;
/**
 * How many changes there have been. A count, because a change can be undone, like
 * switching to a workspace and back, and that's two changes rather than none.
 */
let changeCount = () => 0;
/** The count once the bar had settled after its last change. */
let settled = $state(0);

/**
 * Counted here rather than noticed in an effect: other effects read the layout,
 * which applies the page's styles, and anything that changed would jump if the
 * animations weren't on yet by then.
 */
const inUse = () =>
  !tracked || hovered || lingering || isBusy() || changeCount() !== settled;

/** How this window animates, following `performance.animations`. */
export const motion = {
  /** The transition duration in effect, in milliseconds. */
  get duration() {
    return this.still ? 0 : config.bar.transitionDuration;
  },
  /** Whether nothing animates, including what would loop on its own. */
  get still() {
    const { animations } = config.performance;
    return animations === "none" || (animations === "interactive" && !inUse());
  },
  /** Whether the pointer is over this window. */
  get hovered() {
    return hovered;
  }
};

/**
 * Call while the bar initializes. It counts as in use while the pointer is over it
 * and while `busy` is true, and for a moment after either, or after `changes`
 * returns something new.
 */
export function trackActivity({
  busy,
  changes
}: {
  busy: () => boolean;
  changes: () => string;
}) {
  let count = 0;
  let last: string | undefined;
  // Becoming busy and ending it both count as changes.
  const counted = $derived.by(() => {
    const current = JSON.stringify([busy(), changes()]);
    if (current !== last) {
      last = current;
      count += 1;
    }
    return count;
  });

  isBusy = busy;
  changeCount = () => counted;
  tracked = true;

  const lingerTime = () => config.bar.transitionDuration * LINGER;

  // Reading the count here also keeps it counting while nothing else reads it.
  $effect(() => {
    const current = counted;
    const timer = setTimeout(() => {
      settled = current;
    }, lingerTime());
    return () => {
      clearTimeout(timer);
    };
  });

  $effect(() => {
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Applied at once, before anything the pointer does reaches the page.
    const enter = () => {
      clearTimeout(timer);
      hovered = true;
      flushSync();
    };
    const leave = () => {
      hovered = false;
      lingering = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        lingering = false;
      }, lingerTime());
    };
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);

    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      clearTimeout(timer);
    };
  });
}
