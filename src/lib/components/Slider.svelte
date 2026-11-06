<script lang="ts">
  import { onDestroy } from "svelte";
  import { Spring } from "svelte/motion";

  type Props = {
    value: number;
    label: string;
    onchange: (value: number) => void;
    /** Beads rising into a wave around the value, or a rail with a swelling knob. */
    variant?: "wave" | "swell";
    /** Greys it out. It keeps its place, and can still be moved. */
    muted?: boolean;
    max?: number;
    /** How far one notch of the mouse wheel moves it. */
    wheelStep?: number;
  };

  let {
    value,
    label,
    onchange,
    variant = "swell",
    muted = false,
    max = 100,
    wheelStep = 5
  }: Props = $props();

  const BEADS = 29;
  /** A bead lights up when the value is within half the space to the next one. */
  const BEAD_REACH = 50 / (BEADS - 1);
  const TICKS = 11;
  /** How wide the wave is, as a percentage of the slider. */
  const WAVE_WIDTH = 16;
  /** How tall a bead is at rest and at the wave's peak, in rem. */
  const BEAD_MIN = 0.45;
  const BEAD_MAX = 2.85;
  /** How long a value stays held after the hand has moved on, in milliseconds. */
  const HOLD_TIME = 500;

  // What a provider reports lags behind the hand, which would pull the thumb back.
  let held = $state<number | null>(null);
  let dragging = $state(false);
  let release: ReturnType<typeof setTimeout> | undefined;

  let shown = $derived(held ?? value);

  // The hand sets where this is going, and it's what gets drawn. That's what lets
  // everything glide to a click and trail behind a drag.
  const glide = Spring.of(() => shown, {
    stiffness: 0.14,
    damping: 0.62,
    // It comes to rest on the value itself, without creeping up on it for a second.
    precision: 0.5
  });

  let percent = $derived(
    Math.max(0, Math.min(100, (glide.current / max) * 100))
  );

  const beads = Array.from({ length: BEADS }, (_, index) => {
    const position = (index / (BEADS - 1)) * 100;
    return {
      position,
      color: `color-mix(in srgb, hsl(var(--volume-end)) ${position.toFixed(0)}%, hsl(var(--volume-start)))`
    };
  });

  const beadHeight = (position: number) => {
    const distance = (position - percent) / WAVE_WIDTH;
    const rise = Math.exp(-distance * distance);
    return BEAD_MIN + rise * (BEAD_MAX - BEAD_MIN);
  };

  const hold = (next: number) => {
    clearTimeout(release);
    const clamped = Math.max(0, Math.min(max, Math.round(next)));
    if (clamped === shown) return;
    held = clamped;
    onchange(clamped);
  };

  const letGo = () => {
    clearTimeout(release);
    release = setTimeout(() => {
      held = null;
    }, HOLD_TIME);
  };

  const fromPointer = ({ clientX, currentTarget }: PointerEvent) => {
    const { left, width } = (
      currentTarget as HTMLElement
    ).getBoundingClientRect();
    hold(((clientX - left) / width) * max);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging = true;
    fromPointer(event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (dragging) fromPointer(event);
  };

  const onPointerEnd = () => {
    dragging = false;
    letGo();
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    hold(shown + (event.deltaY < 0 ? wheelStep : -wheelStep));
    letGo();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const change = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: wheelStep,
      PageDown: -wheelStep
    }[event.key];
    if (change === undefined) return;

    event.preventDefault();
    hold(shown + change);
    letGo();
  };

  onDestroy(() => {
    clearTimeout(release);
  });
</script>

<!-- A drag starts with a press anywhere on it, which only a custom element can glide to. -->
<div
  class={["slider", variant]}
  class:dragging
  class:muted
  role="slider"
  tabindex="0"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuenow={shown}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerEnd}
  onpointercancel={onPointerEnd}
  onwheel={onWheel}
  onkeydown={onKeyDown}
>
  {#if variant === "wave"}
    {#each beads as bead (bead.position)}
      <i
        class:lit={bead.position <= percent + BEAD_REACH}
        style:--lit={bead.color}
        style:height="{beadHeight(bead.position)}rem"
      ></i>
    {/each}
  {:else}
    <span class="rail"></span>
    <span class="fill" style:width="{percent}%"></span>
    <span class="knob" style:left="{percent}%">
      <span>{Math.round(shown)}</span>
    </span>
  {/if}
</div>
{#if variant === "swell"}
  <div class="ticks" class:muted aria-hidden="true">
    {#each { length: TICKS }, tick}
      <i class:lit={tick * (100 / (TICKS - 1)) <= percent + 1}></i>
    {/each}
  </div>
{/if}

<style>
  .slider {
    position: relative;
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }

  .slider,
  .ticks {
    transition: filter var(--transition-duration) var(--spring-out);
  }

  .muted {
    filter: grayscale(1) opacity(0.55);
  }

  .slider:focus-visible {
    border-radius: 0.3rem;
    outline-offset: 0.3rem;
  }

  .wave {
    display: flex;
    height: 3.3rem;
    align-items: center;
    justify-content: space-between;
  }

  .wave i {
    display: block;
    width: 0.28rem;
    border-radius: 999px;
    background: var(--surface-3);
    transition: background-color calc(var(--transition-duration) * 0.5)
      var(--spring-out);
  }

  .wave i.lit {
    background: var(--lit);
  }

  .swell {
    height: 2.15rem;
    margin-inline: 0.4rem;
  }

  .rail,
  .fill {
    position: absolute;
    top: 50%;
    left: 0;
    height: 0.55rem;
    border-radius: 999px;
    translate: 0 -50%;
  }

  .rail {
    right: 0;
    background: var(--surface-3);
  }

  .fill {
    background: linear-gradient(
      to right,
      hsl(var(--volume-start)),
      hsl(var(--volume-end))
    );
  }

  .knob {
    position: absolute;
    top: 50%;
    display: grid;
    width: 0.85rem;
    height: 0.85rem;
    place-items: center;
    overflow: hidden;
    border-radius: 999px;
    background: hsl(var(--volume-end));
    color: hsl(var(--bg));
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    translate: -50% -50%;
    transition:
      width var(--time-soft) var(--spring-soft),
      height var(--time-soft) var(--spring-soft);
  }

  .knob span {
    opacity: 0;
    transition: opacity var(--transition-duration) var(--spring-out);
  }

  .swell:hover .knob,
  .swell:focus-visible .knob,
  .swell.dragging .knob {
    width: 2.7rem;
    height: 1.7rem;
  }

  .swell:hover .knob span,
  .swell:focus-visible .knob span,
  .swell.dragging .knob span {
    opacity: 1;
  }

  .ticks {
    display: flex;
    justify-content: space-between;
    margin-inline: 0.4rem;
  }

  .ticks i {
    width: 0.14rem;
    height: 0.35rem;
    border-radius: 1px;
    background: var(--surface-3);
    transition: background-color var(--transition-duration) var(--spring-out);
  }

  .ticks i.lit {
    background: hsl(var(--volume-end));
  }
</style>
