import { flyoutViews, type FlyoutId } from "#lib/flyouts.ts";
import { config } from "#lib/state/config.svelte.ts";
import { remToPx } from "#lib/state/layout.svelte.ts";
import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
import { RemoteState } from "#lib/state/remote_state.svelte.ts";
import { currentMonitor } from "@tauri-apps/api/window";
import type { Attachment } from "svelte/attachments";
import { currentWidget, startWidget } from "zebar";

/** Kept free between a flyout and the ends of its monitor, in pixels. */
const EDGE_MARGIN = 8;
/** How much room a floating flyout's window leaves around it, in rem. */
const FLOAT_MARGIN = 0.5;
/** How long a bar gives the flyout window to make itself known, in milliseconds. */
const WINDOW_CHECK_TIME = 1000;

/**
 * How one side of a flyout meets the group of the bar that it grows out of.
 *
 * - `flare`: it ends on top of the group, and curves out into it.
 * - `flush`: it ends level with the group, which squares its corner off to continue it.
 * - `overhang`: it goes past the group, and the group curves out to reach its underside.
 */
export type MeltEdge = "flare" | "flush" | "overhang";

export type FlyoutRequest = {
  id: number;
  view: FlyoutId;
  /** Whether it's above the bar, so its panel belongs at the end of its window. */
  opensUp: boolean;
  /** How it joins the bar on each side. `null` means it floats apart from the bar. */
  left: MeltEdge | null;
  right: MeltEdge | null;
  /** Where its window goes, in physical pixels from the corner of the desktop. */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * The flyout that's open. The flyout window follows this, as a widget can't be
 * started with arguments, and hides when it's empty.
 */
export const openFlyout = new RemoteState<FlyoutRequest | null>("flyout", null);

/** Whether the flyout window is running, hidden or not. */
export const flyoutWindow = new RemoteState("flyout.window", false);

/** The group of this bar that a flyout is growing out of, which changes shape to meet it. */
export const melt = $state<{
  id: number | null;
  group: Element | null;
  left: MeltEdge | null;
  right: MeltEdge | null;
}>({ id: null, group: null, left: null, right: null });

export function closeFlyout() {
  if (openFlyout.value) openFlyout.value = null;
}

/**
 * It takes its real place when it has something to show. A second one closes itself,
 * so nothing needs to stop this from being called twice.
 */
function startFlyoutWindow() {
  return startWidget("flyout", {
    anchor: "top_left",
    offsetX: "0px",
    offsetY: "0px",
    width: "1px",
    height: "1px",
    monitorSelection: { type: "primary" },
    dockToEdge: { enabled: false, edge: null, windowMargin: "0px" }
  });
}

/**
 * Starts the flyout window ahead of time, because a new window takes around a second
 * to show anything. Call once from the bar. A reload brings back a window that was
 * already running, which is what the wait is for.
 *
 * Also lets go of the bar's shape when the flyout it was for has gone.
 */
export function initFlyoutWindow() {
  $effect(() => {
    if (openFlyout.value?.id !== melt.id) melt.group = null;
  });

  $effect(() => {
    const timer = setTimeout(() => {
      if (flyoutWindow.value || !isOnPrimaryMonitor()) return;
      startFlyoutWindow().catch((error: unknown) => {
        console.error("Error starting the flyout window:", error);
      });
    }, WINDOW_CHECK_TIME);

    return () => {
      clearTimeout(timer);
    };
  });
}

function radiusInPixels() {
  const probe = document.createElement("div");
  probe.style.width = "var(--radius)";
  document.body.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();
  return width;
}

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

/**
 * Sets a flyout on a group of the bar, in logical pixels from the monitor's corner.
 *
 * Two curves can't fit in less than two radii, so an edge that would land that close
 * to the end of the group moves to line up with it, and a flyout that's nearly the
 * group's width takes on its width.
 */
function meltOnto(
  center: number,
  width: number,
  group: { left: number; right: number },
  monitorWidth: number,
  radius: number
) {
  const groupWidth = group.right - group.left;
  const snap = radius * 2;

  if (Math.abs(width - groupWidth) < snap) {
    return { left: group.left, width: groupWidth };
  }

  let left = center - width / 2;
  if (Math.abs(left - group.left) < snap) left = group.left;
  else if (Math.abs(left + width - group.right) < snap) {
    left = group.right - width;
  }

  const lowest = Math.min(EDGE_MARGIN, group.left);
  const highest = Math.max(
    monitorWidth - width - EDGE_MARGIN,
    group.right - width
  );
  return { left: clamp(left, lowest, highest), width };
}

/** `gap` is how far inside the end of the group a flyout's side is. */
function meltEdge(gap: number): MeltEdge {
  if (Math.abs(gap) < 0.5) return "flush";
  return gap > 0 ? "flare" : "overhang";
}

/**
 * Tauri reports physical pixels from the corner of the desktop, while sizes in rem
 * come out logical, so the sums happen in logical pixels from the monitor's corner.
 * The height comes off a physical position, so that rounding can't open a gap between
 * the flyout and the bar.
 */
async function showFlyout(view: FlyoutId, opener: Element) {
  const [monitor, position] = await Promise.all([
    currentMonitor(),
    currentWidget().tauriWindow.outerPosition()
  ]);
  if (!monitor) return;

  const scale = monitor.scaleFactor;
  const barLeft = (position.x - monitor.position.x) / scale;
  const barTop = (position.y - monitor.position.y) / scale;
  const barHeight = window.innerHeight;
  const monitorWidth = monitor.size.width / scale;

  const viewWidth = remToPx(flyoutViews[view].width);
  const height = remToPx(flyoutViews[view].height);

  const { left: openerLeft, width: openerWidth } =
    opener.getBoundingClientRect();
  const center = barLeft + openerLeft + openerWidth / 2;

  const opensUp = barTop + barHeight / 2 > monitor.size.height / scale / 2;
  const group = opener.closest("[data-bar-group]");
  const groupBox = group?.getBoundingClientRect();
  const melts =
    groupBox !== undefined &&
    config.bar.direction === (opensUp ? "bottom" : "top");

  let x: number;
  let width: number;
  let edges: Pick<FlyoutRequest, "left" | "right"> = {
    left: null,
    right: null
  };
  let bottom = barTop;
  let top = barTop + barHeight;

  if (melts) {
    const radius = radiusInPixels();
    const box = {
      left: barLeft + groupBox.left,
      right: barLeft + groupBox.right
    };
    const placed = meltOnto(center, viewWidth, box, monitorWidth, radius);
    edges = {
      left: meltEdge(placed.left - box.left),
      right: meltEdge(box.right - placed.left - placed.width)
    };
    const flareLeft = edges.left === "flare" ? radius : 0;
    const flareRight = edges.right === "flare" ? radius : 0;
    x = placed.left - flareLeft;
    width = placed.width + flareLeft + flareRight;
    bottom = barTop + groupBox.top;
    top = barTop + groupBox.bottom;
  } else {
    const margin = remToPx(FLOAT_MARGIN);
    width = viewWidth + margin * 2;
    x = clamp(
      center - width / 2,
      EDGE_MARGIN,
      monitorWidth - width - EDGE_MARGIN
    );
  }

  const physicalHeight = Math.round(height * scale);
  const id = Date.now();

  if (melts) Object.assign(melt, { id, group, ...edges });

  openFlyout.value = {
    id,
    view,
    opensUp,
    ...edges,
    x: Math.round(monitor.position.x + x * scale),
    y: opensUp
      ? Math.round(monitor.position.y + bottom * scale) - physicalHeight
      : Math.round(monitor.position.y + top * scale),
    width: Math.round(width * scale),
    height: physicalHeight
  };

  // If it hasn't started or has been closed, it finds the request when it starts.
  if (!flyoutWindow.value) await startFlyoutWindow();
}

/**
 * Makes an element open a flyout, or close it if it's open.
 *
 * This happens on `pointerdown`, without waiting for the button to be let go. It
 * also arrives before an open flyout loses focus, while it can still be told apart
 * from one that has closed. A click from the keyboard has no press, and a `detail`
 * of 0.
 */
export const opensFlyout =
  (view: FlyoutId): Attachment<HTMLElement> =>
  (element) => {
    const toggle = () => {
      if (openFlyout.value?.view === view) {
        closeFlyout();
        return;
      }
      showFlyout(view, element).catch((error: unknown) => {
        console.error("Error opening a flyout:", error);
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // A press anywhere else on the bar closes flyouts, which would include this one.
      event.stopPropagation();
      toggle();
    };

    const onClick = ({ detail }: MouseEvent) => {
      if (detail === 0) toggle();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("click", onClick);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("click", onClick);
    };
  };
