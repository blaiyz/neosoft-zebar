<script lang="ts" generics="T">
  import { config } from "#lib/state/config.svelte.ts";
  import type { Snippet } from "svelte";
  import { onDestroy, untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ClassValue } from "svelte/elements";

  /**
   * A row that animates items entering, leaving and moving, and its own width.
   *
   * Items are positioned from measured widths instead of by the normal flow, and
   * CSS transitions move them. A transition continues from wherever the element
   * currently is, so a change that arrives halfway through another one can't make
   * anything jump. Leaving items stay rendered with their last value, and take up
   * no space while they go. An item that returns before that finishes turns around.
   */
  type Props = {
    items: T[];
    key: (item: T) => string | number;
    item: Snippet<[T]>;
    /** The side that stays still while the row changes width. */
    anchor?: "start" | "end";
    /** Whether items fly in and out. If not, the changing width reveals them. */
    fly?: boolean;
    class?: ClassValue;
  };

  let {
    items,
    key,
    item,
    anchor = "start",
    fly = true,
    class: className
  }: Props = $props();

  class Entry {
    id: string | number;
    value: T;
    offset = $state(0);
    leaving = $state(false);
    placed = $state(false);
    width = 0;
    removal: ReturnType<typeof setTimeout> | undefined;

    constructor(id: string | number, value: T) {
      this.id = id;
      this.value = $state.raw(value);
    }
  }

  // Entries are only ever appended, so that the order on screen can change without
  // moving a DOM node, which would cancel its running transitions.
  let entries = $state.raw<Entry[]>([]);

  let width = $state(0);
  let settled = $state(false);

  const findEntry = (id: string | number) =>
    entries.find((entry) => entry.id === id);

  const place = () => {
    const shown = items.flatMap((value) => findEntry(key(value)) ?? []);
    if (anchor === "end") shown.reverse();

    let offset = 0;
    for (const entry of shown) {
      entry.offset = offset;
      offset += entry.width;
    }
    width = offset;
  };

  const leave = (entry: Entry) => {
    entry.leaving = true;
    entry.removal = setTimeout(() => {
      entries = entries.filter((other) => other !== entry);
    }, config.transitionDuration);
  };

  const reconcile = (next: T[]) => {
    const nextIds = new Set(next.map(key));
    for (const entry of entries) {
      if (!entry.leaving && !nextIds.has(entry.id)) leave(entry);
    }

    for (const value of next) {
      const id = key(value);
      const entry = findEntry(id);
      if (entry) {
        clearTimeout(entry.removal);
        entry.leaving = false;
        entry.value = value;
      } else {
        entries = [...entries, new Entry(id, value)];
      }
    }

    place();
  };

  // Also runs here, not only in the effect, so that the prerendered HTML has the items.
  reconcile(untrack(() => items));

  $effect.pre(() => {
    const next = items;
    untrack(() => {
      reconcile(next);
    });
  });

  /**
   * Things start animating after the first paint, so that they appear in place at
   * first. A transition needs a paint at the old value before it can start.
   */
  const afterFirstPaint = (callback: () => void) => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(callback);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  };

  const measure =
    (entry: Entry): Attachment<HTMLElement> =>
    (element) => {
      const update = (value: number) => {
        entry.width = value;
        place();
      };

      update(element.getBoundingClientRect().width);

      const observer = new ResizeObserver(([resized]) => {
        const size = resized?.borderBoxSize[0];
        if (size) update(size.inlineSize);
      });
      observer.observe(element);

      const cancelFrames = afterFirstPaint(() => {
        entry.placed = true;
      });

      return () => {
        cancelFrames();
        observer.disconnect();
      };
    };

  // Set here and not from a measured item, because a list can start out empty and
  // its first item has to animate the width as well.
  $effect(() =>
    afterFirstPaint(() => {
      settled = true;
    })
  );

  onDestroy(() => {
    for (const entry of entries) clearTimeout(entry.removal);
  });
</script>

<div class={["list", className]} class:settled style:width="{width}px">
  {#each entries as entry (entry.id)}
    <div
      class={["slot", anchor]}
      class:placed={entry.placed}
      style:translate="{anchor === 'end' ? -entry.offset : entry.offset}px 0"
    >
      <div
        class="face"
        class:fly
        class:leaving={entry.leaving}
        {@attach measure(entry)}
      >
        {@render item(entry.value)}
      </div>
    </div>
  {/each}
</div>

<style>
  .list {
    --list-ease: cubic-bezier(0.33, 1, 0.68, 1);

    position: relative;
    height: 100%;
    flex: none;
  }

  .list.settled {
    transition: width var(--transition-duration) var(--list-ease);
  }

  .slot {
    position: absolute;
    inset-block: 0;
    width: max-content;
    pointer-events: none;
  }

  .slot.start {
    left: 0;
  }

  .slot.end {
    right: 0;
  }

  .slot.placed {
    transition: translate var(--transition-duration) var(--list-ease);
  }

  .face {
    display: flex;
    height: 100%;
    align-items: center;
    pointer-events: auto;
  }

  .face.fly {
    transition:
      opacity var(--transition-duration) var(--list-ease),
      transform var(--transition-duration) var(--list-ease);

    @starting-style {
      opacity: 0;
      transform: translateY(20px);
    }
  }

  .face.fly.leaving {
    opacity: 0;
    transform: translateY(20px);
  }

  .face.leaving {
    pointer-events: none;
  }
</style>
