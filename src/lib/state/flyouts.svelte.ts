import { flyoutViews, type FlyoutId } from "#lib/flyouts.ts";
import { config } from "#lib/state/config.svelte.ts";
import { remToPx } from "#lib/state/layout.svelte.ts";
import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
import { RemoteState } from "#lib/state/remote_state.svelte.ts";
import type { PhysicalPosition } from "@tauri-apps/api/dpi";
import { currentMonitor, type Monitor } from "@tauri-apps/api/window";
import type { Attachment } from "svelte/attachments";
import { currentWidget, startWidget } from "zebar";

/** Kept free between a flyout and the ends of its monitor, in pixels. */
const EDGE_MARGIN = 8;
/** How much room a floating flyout's window leaves around it, in rem. */
const FLOAT_MARGIN = 0.5;
/** How long a bar gives the flyout window to make itself known, in milliseconds. */
const WINDOW_CHECK_TIME = 1000;
/** What a press lands on that has a job of its own, and so doesn't open a flyout. */
const INTERACTIVE =
  "button, a, input, select, textarea, [role='button'], [role='slider']";

/**
 * How one side of a flyout meets the group of the bar that it grows out of.
 *
 * - `flare`: it ends on top of the group, and curves out into it.
 * - `flush`: it ends level with the group, which squares its corner off to continue it.
 * - `overhang`: it goes past the group, and the group curves out to reach its underside.
 */
export type MeltEdge = "flare" | "flush" | "overhang";

export type FlyoutRequest = {
  /** Which opening this is. It stays the same while the flyout follows its opener. */
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
 * Also lets go of the bar's shape, and of the opener it followed, when the flyout
 * they were for has gone.
 */
export function initFlyoutWindow() {
  $effect(() => {
    const current = openFlyout.value?.id;
    if (current !== melt.id) melt.group = null;
    // Nothing to follow once the flyout has gone, or another bar has opened one.
    if (current !== openedHere) stopFollowing?.();
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

/**
 * Places a flyout that's following its opener, keeping the way each side meets the
 * group. A side can only go from one way to another with a jump of up to two radii,
 * so it stays as it is for as long as it can. `null` if it can't, as when the group
 * has become too narrow for it.
 */
function keepEdges(
  center: number,
  width: number,
  group: { left: number; right: number },
  monitorWidth: number,
  radius: number,
  edges: { left: MeltEdge; right: MeltEdge }
) {
  const snap = radius * 2;
  // It only takes on the group's width while that's close to its own.
  if (edges.left === "flush" && edges.right === "flush") {
    const groupWidth = group.right - group.left;
    return Math.abs(width - groupWidth) < snap
      ? { left: group.left, width: groupWidth }
      : null;
  }

  // The range the flyout's left end can be in.
  let low = Math.min(EDGE_MARGIN, group.left);
  let high = Math.max(monitorWidth - width - EDGE_MARGIN, group.right - width);
  const atLeast = (value: number) => {
    low = Math.max(low, value);
  };
  const atMost = (value: number) => {
    high = Math.min(high, value);
  };
  const exactly = (value: number) => {
    atLeast(value);
    atMost(value);
  };

  if (edges.left === "flush") exactly(group.left);
  else if (edges.left === "flare") atLeast(group.left + snap);
  else atMost(group.left - snap);

  const fromRight = group.right - width;
  if (edges.right === "flush") exactly(fromRight);
  else if (edges.right === "flare") atMost(fromRight - snap);
  else atLeast(fromRight + snap);

  if (low > high + 0.5) return null;
  return { left: clamp(center - width / 2, low, high), width };
}

/** `gap` is how far inside the end of the group a flyout's side is. */
function meltEdge(gap: number): MeltEdge {
  if (Math.abs(gap) < 0.5) return "flush";
  return gap > 0 ? "flare" : "overhang";
}

/** Where the bar's window is, which stays put while a flyout is open. */
type BarPlace = { monitor: Monitor; position: PhysicalPosition };

/**
 * Tauri reports physical pixels from the corner of the desktop, while sizes in rem
 * come out logical, so the sums happen in logical pixels from the monitor's corner.
 * The height comes off a physical position, so that rounding can't open a gap between
 * the flyout and the bar.
 */
function placeFlyout(
  view: FlyoutId,
  opener: Element,
  id: number,
  { monitor, position }: BarPlace,
  following?: FlyoutRequest
): FlyoutRequest {
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
    const kept =
      following?.left && following.right
        ? keepEdges(center, viewWidth, box, monitorWidth, radius, {
            left: following.left,
            right: following.right
          })
        : null;
    const placed =
      kept ?? meltOnto(center, viewWidth, box, monitorWidth, radius);
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

  if (melts) Object.assign(melt, { id, group, ...edges });

  return {
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
}

const samePlace = (a: FlyoutRequest, b: FlyoutRequest) =>
  a.x === b.x &&
  a.y === b.y &&
  a.width === b.width &&
  a.height === b.height &&
  a.left === b.left &&
  a.right === b.right;

let stopFollowing: (() => void) | undefined;

/**
 * Moves the open flyout with its opener, whose section can change width while it's
 * open, as when the next track has a longer title. Anything that moves it also
 * resizes the opener or its group. Once a frame at most.
 */
function followOpener(
  view: FlyoutId,
  opener: Element,
  id: number,
  place: BarPlace
) {
  stopFollowing?.();
  let frame = 0;

  const observer = new ResizeObserver(() => {
    if (openFlyout.value?.id !== id) {
      stop();
      return;
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const current = openFlyout.value;
      if (current?.id !== id || !opener.isConnected) {
        stop();
        return;
      }
      const next = placeFlyout(view, opener, id, place, current);
      if (!samePlace(current, next)) openFlyout.value = next;
    });
  });

  const stop = () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    if (stopFollowing === stop) stopFollowing = undefined;
  };

  observer.observe(opener);
  const group = opener.closest("[data-bar-group]");
  if (group) observer.observe(group);
  stopFollowing = stop;
}

/** The request this bar made last, since another monitor's bar can open one too. */
let openedHere: number | undefined;

async function showFlyout(view: FlyoutId, opener: Element) {
  const [monitor, position] = await Promise.all([
    currentMonitor(),
    currentWidget().tauriWindow.outerPosition()
  ]);
  if (!monitor) return;

  const place = { monitor, position };
  const id = Date.now();
  openedHere = id;
  openFlyout.value = placeFlyout(view, opener, id, place);
  followOpener(view, opener, id, place);

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
 *
 * A press above or below it counts too, as long as it lands on nothing else that
 * takes presses, because the group around it pads it and the pointer is often at the
 * edge of the screen.
 */
export const opensFlyout =
  (view: FlyoutId): Attachment<HTMLElement> =>
  (element) => {
    const toggle = () => {
      const current = openFlyout.value;
      if (current?.view === view && current.id === openedHere) {
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

    /** A collapsed section is still there, clipped, so it's asked what's showing. */
    const onPressInColumn = (event: PointerEvent) => {
      const { target, button, clientX } = event;
      if (button !== 0 || !(target instanceof Element)) return;
      if (element.contains(target) || target.closest(INTERACTIVE)) return;

      const { left, right, top, height } = element.getBoundingClientRect();
      if (clientX < left || clientX >= right) return;
      const shown = document.elementFromPoint(clientX, top + height / 2);
      if (!shown || !element.contains(shown)) return;

      event.stopPropagation();
      toggle();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("click", onClick);
    addEventListener("pointerdown", onPressInColumn, { capture: true });

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("click", onClick);
      removeEventListener("pointerdown", onPressInColumn, { capture: true });
    };
  };
