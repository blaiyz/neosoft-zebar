<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import { PhysicalPosition } from "@tauri-apps/api/dpi";
  import type { Snippet } from "svelte";
  import { currentWidget } from "zebar";

  type Drag = {
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  };

  let { children }: { children: Snippet } = $props();

  let drag: Drag | null = null;

  /**
   * Widgets aren't allowed to start a native window drag, so this moves the window
   * itself. It works from screen coordinates, which don't change as the window moves
   * under the pointer. They're read first, as the event's values can't be relied on
   * after waiting for the window's position.
   */
  const onPointerDown = async (event: PointerEvent) => {
    const onButton =
      event.target instanceof Element && event.target.closest("button");
    if (event.button !== 0 || onButton) return;

    const { pointerId, screenX: startX, screenY: startY } = event;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(pointerId);

    const origin = await currentWidget().tauriWindow.outerPosition();
    if (handle.hasPointerCapture(pointerId)) {
      drag = { startX, startY, originX: origin.x, originY: origin.y };
    }
  };

  const onPointerMove = ({ screenX, screenY }: PointerEvent) => {
    if (!drag) return;

    const scale = window.devicePixelRatio;
    const x = drag.originX + (screenX - drag.startX) * scale;
    const y = drag.originY + (screenY - drag.startY) * scale;
    void currentWidget().tauriWindow.setPosition(
      new PhysicalPosition(Math.round(x), Math.round(y))
    );
  };

  const onPointerEnd = () => {
    drag = null;
  };
</script>

<div
  class="relative flex h-13 flex-none touch-none items-start justify-between pt-1.5 pr-2 pl-5 select-none"
  role="presentation"
  onpointerdown={(event) => void onPointerDown(event)}
  onpointermove={onPointerMove}
  onpointerup={onPointerEnd}
  onpointercancel={onPointerEnd}
>
  <span class="pt-2 text-[1.07rem] font-bold tracking-tight">Neosoft</span>
  <nav class="dock">
    {@render children()}
  </nav>
  <button
    class="flex size-9 items-center justify-center rounded-full text-lg transition hover:bg-zb-surface-2 hover:text-zb-icon"
    aria-label="Close"
    onclick={() => void currentWidget().close()}
  >
    <X />
  </button>
</div>

<style>
  /* Hangs from the top of the window, with the same flared corners as the bar. */
  .dock {
    position: absolute;
    top: 0;
    left: 50%;
    display: flex;
    height: 3.25rem;
    align-items: center;
    gap: 0.2rem;
    padding-inline: 0.5rem;
    border-radius: 0 0 var(--radius) var(--radius);
    background: var(--surface-2);
    translate: -50% 0;
  }

  .dock::before,
  .dock::after {
    content: "";
    position: absolute;
    top: 0;
    width: var(--radius);
    height: var(--radius);
  }

  .dock::before {
    right: 100%;
    background: radial-gradient(
      circle at 0 100%,
      transparent calc(var(--radius) - 0.5px),
      var(--surface-2) var(--radius)
    );
  }

  .dock::after {
    left: 100%;
    background: radial-gradient(
      circle at 100% 100%,
      transparent calc(var(--radius) - 0.5px),
      var(--surface-2) var(--radius)
    );
  }
</style>
