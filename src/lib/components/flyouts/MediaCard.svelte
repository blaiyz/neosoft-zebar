<script lang="ts">
  import { getAppIcon } from "#lib/icon_loader.ts";
  import { playhead } from "#lib/state/playhead.svelte.ts";
  import { secondsToHms } from "#lib/utils/format.ts";
  import Pause from "@lucide/svelte/icons/pause";
  import Play from "@lucide/svelte/icons/play";
  import SkipBack from "@lucide/svelte/icons/skip-back";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import type { MediaOutput, MediaSession } from "zebar";
  import BeadButton from "../BeadButton.svelte";
  import BeadPill from "../BeadPill.svelte";
  import Well from "./Well.svelte";

  type Props = {
    session: MediaSession;
    media: MediaOutput;
    /** Whether the bar shows this one. */
    shown: boolean;
    onshow: () => void;
  };

  let { session, media, shown, onshow }: Props = $props();

  let AppIcon = $derived(getAppIcon(session.sessionId));
  let target = $derived({ sessionId: session.sessionId });
  const head = playhead(() => session);
  let progress = $derived(
    session.endTime > 0
      ? Math.min(100, (head.position / session.endTime) * 100)
      : 0
  );
</script>

<Well>
  <div class="flex items-center gap-3">
    <button
      class="grid size-10 flex-none place-items-center rounded-control bg-zb-surface-2 text-xl text-zb-accent transition hover:bg-zb-surface-3"
      aria-label="Show this in the bar"
      aria-pressed={shown}
      onclick={onshow}
    >
      <AppIcon />
    </button>
    <div class="flex min-w-0 flex-1 flex-col">
      <p class="truncate font-semibold">{session.title ?? "Unknown"}</p>
      {#if session.artist}
        <p class="truncate text-sm text-zb-dim">{session.artist}</p>
      {/if}
      {#if session.albumTitle}
        <p class="truncate text-sm text-zb-faint">{session.albumTitle}</p>
      {/if}
    </div>
  </div>
  {#if session.endTime > 0}
    <div class="flex flex-col gap-1">
      <div class="h-1 overflow-hidden rounded-full bg-zb-surface-3">
        <div
          class="bar h-full rounded-full bg-zb-accent"
          style:width="{progress}%"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-zb-dim tabular-nums">
        <span>{secondsToHms(head.position)}</span>
        <span>{secondsToHms(session.endTime)}</span>
      </div>
    </div>
  {/if}
  <div class="flex justify-center">
    <BeadPill>
      <BeadButton
        label="Previous"
        tone="--accent"
        onclick={() => media.previous(target)}
      >
        <SkipBack />
      </BeadButton>
      <BeadButton
        label={session.isPlaying ? "Pause" : "Play"}
        tone="--accent"
        onclick={() => media.togglePlayPause(target)}
      >
        {#if session.isPlaying}<Pause />{:else}<Play />{/if}
      </BeadButton>
      <BeadButton
        label="Next"
        tone="--accent"
        onclick={() => media.next(target)}
      >
        <SkipForward />
      </BeadButton>
    </BeadPill>
  </div>
</Well>

<style>
  /* Moves on with every tick, so it glides rather than springs. */
  .bar {
    transition: width 250ms linear;
  }
</style>
