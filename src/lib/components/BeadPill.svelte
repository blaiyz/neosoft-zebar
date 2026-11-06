<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let pill = $state<HTMLElement>();
  let shown = $state(false);
  // Stays where it was after it hides, to fade out in place.
  let x = $state(0);
  let tone = $state<string>();
  // It only travels between buttons. It comes in at the first one it's on.
  let gliding = $state(false);
  let pressed = $state(false);

  /** A button's position changes as its neighbours collapse, so it's read each time. */
  const moveTo = (target: EventTarget | null) => {
    if (!pill || !(target instanceof Element)) return;

    const button = target.closest("button");
    if (!button) return;

    gliding = shown;
    shown = true;
    x = button.getBoundingClientRect().left - pill.getBoundingClientRect().left;
    tone = button.style.getPropertyValue("--tone");
  };

  const leave = () => {
    shown = false;
    pressed = false;
  };
</script>

<div
  bind:this={pill}
  class="relative flex h-8 flex-none items-center rounded-full bg-zb-surface-2 px-[0.15rem]"
  role="group"
  onpointerover={({ target }) => {
    moveTo(target);
  }}
  onpointerdown={() => (pressed = true)}
  onpointerup={() => (pressed = false)}
  onpointerleave={leave}
  onfocusin={({ target }) => {
    moveTo(target);
  }}
  onfocusout={leave}
>
  <span
    class={["bead", shown && "on", gliding && "gliding", pressed && "pressed"]}
    style:--bead-x="{x}px"
    style:--tone={tone}
  ></span>
  {@render children()}
</div>

<style>
  .bead {
    position: absolute;
    top: 0.15rem;
    left: 0;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    background: color-mix(in srgb, hsl(var(--tone)) 28%, hsl(var(--bg)));
    opacity: 0;
    pointer-events: none;
    scale: 0.5;
    translate: var(--bead-x) 0;
    transition:
      scale var(--time-soft) var(--spring-pop),
      opacity var(--transition-duration) var(--spring-out),
      background-color var(--transition-duration) var(--spring-out);
  }

  .bead.on {
    opacity: 1;
    scale: 1;
  }

  .bead.gliding {
    transition:
      translate var(--time-soft) var(--spring-soft),
      scale var(--time-soft) var(--spring-pop),
      opacity var(--transition-duration) var(--spring-out),
      background-color var(--transition-duration) var(--spring-out);
  }

  .bead.on.pressed {
    scale: 0.86;
  }
</style>
