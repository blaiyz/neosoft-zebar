<script lang="ts">
  import type { MediaStyle } from "#lib/config_schema.ts";
  import type { PartId } from "#lib/sections.ts";
  import { layout, partTarget, remToPx } from "#lib/state/layout.svelte.ts";
  import { secondsToHms } from "#lib/utils/format.ts";
  import Pause from "@lucide/svelte/icons/pause";
  import Play from "@lucide/svelte/icons/play";
  import SkipBack from "@lucide/svelte/icons/skip-back";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import type { Attachment } from "svelte/attachments";
  import type { MediaSession } from "zebar";
  import BeadButton from "./BeadButton.svelte";
  import BeadPill from "./BeadPill.svelte";
  import Collapsible from "./Collapsible.svelte";
  import Meter from "./Meter.svelte";
  import Reveal from "./Reveal.svelte";

  type Props = {
    style: MediaStyle;
    session: Pick<MediaSession, "title" | "position" | "endTime" | "isPlaying">;
    /** Whether the buttons for the other tracks show. */
    skips?: boolean;
    /** The part of the bar the title is, for it to give way when room runs out. */
    part?: PartId;
    /** Shows what a pointer over it would, for a preview that can't be pointed at. */
    peek?: boolean;
    onprevious?: () => void;
    ontoggle?: () => void;
    onnext?: () => void;
  };

  let {
    style,
    session,
    skips = true,
    part,
    peek = false,
    onprevious,
    ontoggle,
    onnext
  }: Props = $props();

  /** The range of the title's width and the space around it, in rem. */
  const TITLE_MIN = 6;
  const TITLE_MAX = 24;
  const TITLE_PADDING = 1;
  /** How wide the two buttons that come out when `tucked` are together, in rem. */
  const TUCKED_WIDTH = 3.5;
  const BARS = 5;

  // What the text would like to be, which invisible copies of it report. It's the
  // title or the time, whichever is wider, as the two swap places on hover.
  let textWidth = $state(0);
  let timeWidth = $state(0);
  let rem = $state(16);
  let titleLimit = $derived(part ? partTarget(part) : undefined);
  let hovered = $state(false);

  let progress = $derived(
    Math.round((session.position / session.endTime) * 100) || 0
  );

  // Room for them is kept beside the title, which keeps the bar from changing width
  // on every pass of the pointer.
  let tuckedRoom = $derived(style === "tucked" ? TUCKED_WIDTH * rem : 0);
  let narrowest = $derived(
    Math.max(TITLE_MIN * rem, timeWidth + TITLE_PADDING * rem) + tuckedRoom
  );
  let widest = $derived(
    Math.max(
      narrowest,
      Math.min(textWidth + TITLE_PADDING * rem, TITLE_MAX * rem) + tuckedRoom
    )
  );
  let width = $derived(titleLimit || widest);

  // With no title showing, there's no room to take.
  let untucked = $derived(
    style === "tucked" && (hovered || peek) && skips && width > 0
  );

  const reportWidth =
    (report: (width: number) => void): Attachment<HTMLElement> =>
    (element) => {
      const observer = new ResizeObserver(() => {
        rem = remToPx(1);
        report(element.getBoundingClientRect().width);
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
      };
    };
</script>

{#snippet playIcon()}
  {#if session.isPlaying}<Pause />{:else}<Play />{/if}
{/snippet}

{#snippet dial()}
  <Meter animate={false} class="h-[1.7rem] stroke-zb-accent" percent={progress}>
    {@render playIcon()}
  </Meter>
{/snippet}

{#snippet skip(label: string, onclick: (() => void) | undefined, next: boolean)}
  {@const Icon = next ? SkipForward : SkipBack}
  <button
    class="skip relative flex h-full w-7 items-center justify-center transition hover:text-zb-accent"
    aria-label={label}
    {onclick}
  >
    <Icon />
  </button>
{/snippet}

{#snippet title()}
  <button
    class="group relative flex h-full min-w-0 items-center overflow-hidden transition hover:text-zb-accent"
    aria-label="Toggle"
    onclick={ontoggle}
  >
    <Collapsible {part} when={true} full={() => widest} floor={() => narrowest}>
      <div
        class={[
          "relative flex items-center justify-center px-2",
          layout.ready && "transition-[width] ease-(--ease)"
        ]}
        style:width="{untucked ? width - tuckedRoom : width}px"
      >
        <span
          {@attach reportWidth((next) => (textWidth = next))}
          class="invisible absolute grid whitespace-nowrap"
          aria-hidden="true"
        >
          <span class="[grid-area:1/1]">{session.title}</span>
          <span
            {@attach reportWidth((next) => (timeWidth = next))}
            class="w-max tabular-nums [grid-area:1/1]"
          >
            {secondsToHms(session.endTime)}/{secondsToHms(session.endTime)}
          </span>
        </span>
        <span
          class={[
            "truncate transition group-hover:translate-y-full group-hover:opacity-0",
            peek && "translate-y-full opacity-0"
          ]}
        >
          <p class="truncate">{session.title}</p>
        </span>
        <span
          class={[
            "absolute inset-y-0 right-2 left-2 inline-flex items-center justify-center whitespace-nowrap tabular-nums",
            "transition-all group-hover:translate-y-0 group-hover:opacity-100",
            !peek && "-translate-y-full",
            !peek && session.title && "opacity-0"
          ]}
        >
          {secondsToHms(session.position)}/{secondsToHms(session.endTime)}
        </span>
      </div>
    </Collapsible>
  </button>
{/snippet}

<div
  class="relative mr-3 flex h-full items-center"
  role="group"
  aria-label="Media"
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
>
  {#if style === "pill"}
    <BeadPill>
      <Reveal when={skips}>
        <BeadButton label="Previous" tone="--accent" onclick={onprevious}>
          <SkipBack />
        </BeadButton>
      </Reveal>
      <BeadButton label="Toggle" tone="--accent" onclick={ontoggle}>
        {@render dial()}
      </BeadButton>
      <Reveal when={skips} anchor="end">
        <BeadButton label="Next" tone="--accent" onclick={onnext}>
          <SkipForward />
        </BeadButton>
      </Reveal>
    </BeadPill>
    {@render title()}
  {:else if style === "tucked"}
    <Collapsible when={untucked} fly={false} anchor="end">
      {@render skip("Previous", onprevious, false)}
    </Collapsible>
    <button
      class="flex h-full items-center px-1 transition hover:text-zb-accent"
      aria-label="Toggle"
      onclick={ontoggle}
    >
      {@render dial()}
    </button>
    <Collapsible when={untucked} fly={false}>
      {@render skip("Next", onnext, true)}
    </Collapsible>
    {@render title()}
  {:else if style === "capsule"}
    <div
      class="capsule relative flex h-8 items-center overflow-hidden rounded-full bg-zb-surface-2 pr-3 pl-0.5"
    >
      <span class="fill" style:width="{progress}%"></span>
      <Reveal when={skips}>{@render skip("Previous", onprevious, false)}</Reveal
      >
      <button
        class="relative flex size-7 items-center justify-center transition hover:text-zb-accent"
        aria-label="Toggle"
        onclick={ontoggle}
      >
        {@render playIcon()}
      </button>
      <Reveal when={skips}>{@render skip("Next", onnext, true)}</Reveal>
      {@render title()}
    </div>
  {:else}
    <Reveal when={skips}>{@render skip("Previous", onprevious, false)}</Reveal>
    <button
      class={["bars", session.isPlaying && "playing", peek && "peek"]}
      aria-label="Toggle"
      onclick={ontoggle}
    >
      {#each { length: BARS }, bar}
        <i style:--bar={bar}></i>
      {/each}
      <span class="bars-icon">{@render playIcon()}</span>
    </button>
    {@render title()}
    <Reveal when={skips}>{@render skip("Next", onnext, true)}</Reveal>
  {/if}
</div>

<style>
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 999px;
    background: color-mix(in srgb, hsl(var(--accent)) 30%, hsl(var(--bg)));
    transition: width var(--time-melt) var(--spring-melt);
  }

  .bars {
    position: relative;
    display: flex;
    width: 2.5rem;
    height: 2rem;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: 0.19rem;
  }

  .bars i {
    width: 0.25rem;
    height: 0.3rem;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      hsl(var(--volume-start)) calc(var(--bar) * 25%),
      hsl(var(--volume-end))
    );
    transition:
      height var(--time-soft) var(--spring-soft),
      opacity var(--transition-duration) var(--spring-out);
  }

  .bars.playing i {
    animation: dance calc(620ms + var(--bar) * 110ms) ease-in-out infinite
      alternate;
    animation-delay: calc(var(--bar) * -170ms);
  }

  @keyframes dance {
    from {
      height: 0.3rem;
    }

    to {
      height: 1.25rem;
    }
  }

  .bars-icon {
    position: absolute;
    display: grid;
    opacity: 0;
    transition: opacity var(--transition-duration) var(--spring-out);
  }

  .bars:hover i,
  .bars.peek i {
    opacity: 0.18;
  }

  .bars:hover .bars-icon,
  .bars.peek .bars-icon {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .bars.playing i {
      height: 0.8rem;
      animation: none;
    }
  }
</style>
