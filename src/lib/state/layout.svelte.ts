import {
  arrange,
  collapseSteps,
  partSide,
  type PartId,
  type SectionId
} from "#lib/sections.ts";
import { config, configStatus } from "#lib/state/config.svelte.ts";
import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
import { providers, type ProviderName } from "#lib/state/providers.svelte.ts";
import { fit, type FitInput, type FitSide } from "#lib/utils/fit.ts";
import { untrack } from "svelte";

/** How long there has to be room, in milliseconds, before anything comes back. */
const GROW_DELAY = 1000;
/** Kept free between the groups for the curves where they meet, in rem. */
const GROUP_GAP = 2.5;
/** The room to spare, in rem, before anything comes back. */
const GROW_MARGIN = 1;

export type PartMeasure = {
  /** Its width right now, partway through any animation. */
  rendered: () => number;
  /** Its width at its widest. */
  full: () => number;
  /** Its narrowest useful width, for a part that stops short of hiding. */
  floor?: (() => number) | undefined;
};

type Targets = Partial<Record<PartId, number | undefined>>;
type Column = FitSide | "center";
/**
 * What a group holds. With taskbar integration, the middle group is in two, one
 * before the taskbar's icons and one after.
 */
type Content = Column | "before" | "after";

/** Whether the first fit has painted, so that the bar doesn't animate into shape. */
export const layout = $state({ ready: false });

let targets = $state.raw<Targets>({});
const preferences = $state<Partial<Record<PartId, boolean>>>({});

// Read while fitting, which nothing has to rerun for.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const parts = new Map<PartId, PartMeasure>();
const columns: Partial<Record<Column, HTMLElement>> = {};
const contents: Partial<Record<Content, HTMLElement | undefined>> = {};

const arranged = $derived(arrange(config.arrangement));

/** Where each item is on the bar, with anything missing or repeated sorted out. */
export const barArrangement = () => arranged;

let observer: ResizeObserver | undefined;
let growTimer: ReturnType<typeof setTimeout> | undefined;

export const remToPx = (rem: number) =>
  rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

const widthOf = (element: Element) => element.getBoundingClientRect().width;

/** The width of a group's content, with what surrounds it inside the group. */
function occupiedWidth(content: HTMLElement) {
  const own = getComputedStyle(content);
  const parent = content.parentElement;
  const around = parent ? getComputedStyle(parent) : null;

  return (
    widthOf(content) +
    parseFloat(own.marginLeft) +
    parseFloat(own.marginRight) +
    parseFloat(around?.paddingLeft ?? "0") +
    parseFloat(around?.paddingRight ?? "0")
  );
}

function isPinned(part: PartId, section: SectionId | undefined) {
  if (part === "clock.date") return config.clock.fullDate === true;
  if (part === "network.graph") return config.network.graph === true;
  if (part === "workspaces.thin") {
    return config.workspaces.thinButtons !== "auto";
  }
  return section !== undefined && config.sections[section] !== "auto";
}

/**
 * Reads the bar as it is now, and works out what it would need at its widest. A
 * width that has given way, or is on its way there, is added back on to what its
 * side holds, so the answer doesn't depend on what's currently collapsed.
 */
function readFit(): FitInput<PartId> | null {
  const { left, right } = columns;
  if (!left || !right) return null;

  const taskbar = config.taskbarIntegration.enabled;
  const widths: FitInput<PartId>["widths"] = {};
  const occupied = (content: Content) => {
    const element = contents[content];
    return element ? occupiedWidth(element) : 0;
  };
  const needed = { left: occupied("left"), right: occupied("right") };
  let centerGiven = 0;

  for (const [part, measure] of parts) {
    const full = measure.full();
    const given = full - measure.rendered();
    const side = partSide(part, arranged, taskbar);

    widths[part] = full;
    if (side === "center") centerGiven += given;
    else needed[side] += given;
  }

  // With taskbar integration, what's either side of its icons floats over the
  // inner end of a column.
  const gap = remToPx(GROUP_GAP);
  const capacity = {
    left: widthOf(left) - centerGiven / 2 - gap - occupied("before"),
    right: widthOf(right) - centerGiven / 2 - gap - occupied("after")
  };

  const steps = collapseSteps.flatMap(({ part, section, toFloor, partial }) => {
    const measure = parts.get(part);
    if (!measure || isPinned(part, section)) return [];

    return {
      part,
      side: partSide(part, arranged, taskbar),
      to: toFloor ? (measure.floor?.() ?? 0) : 0,
      partial: partial ?? false,
      last: preferences[part] ?? false
    };
  });

  return { steps, widths, needed, capacity };
}

function widthIn(from: Targets, part: PartId, input: FitInput<PartId>) {
  return from[part] ?? input.widths[part] ?? 0;
}

/** Copies over the parts `isCloser` picks, as `to` has them. */
function adopt(
  from: Targets,
  to: Targets,
  input: FitInput<PartId>,
  isCloser: (toWidth: number, fromWidth: number) => boolean
) {
  const next = { ...from };
  let changed = false;

  for (const part of parts.keys()) {
    if (!isCloser(widthIn(to, part, input), widthIn(from, part, input))) {
      continue;
    }

    changed = true;
    next[part] = to[part];
  }

  return changed ? next : null;
}

const isNarrower = (toWidth: number, fromWidth: number) =>
  toWidth < fromWidth - 0.5;
const isWider = (toWidth: number, fromWidth: number) =>
  toWidth > fromWidth + 0.5;

/** The targets with whatever has room to come back widened, if anything has. */
function readGrowth(input: FitInput<PartId>, current: Targets) {
  const spare = remToPx(GROW_MARGIN);
  const roomy = fit({
    ...input,
    capacity: {
      left: input.capacity.left - spare,
      right: input.capacity.right - spare
    }
  });

  return adopt(current, roomy, input, isWider);
}

/**
 * Giving way is immediate. Coming back waits, and needs some room to spare, so
 * that a changing track title can't make the sections around it bounce. A part
 * that stopped being able to give way comes back at once.
 */
function update() {
  const input = readFit();
  if (!input) return;

  const movable = new Set(input.steps.map(({ part }) => part));
  const held = { ...targets };
  let released = false;
  for (const [part, width] of Object.entries(targets)) {
    if (width === undefined) continue;
    // Something with no width has nothing to come back to, and would skip the wait.
    if (movable.has(part as PartId) && input.widths[part as PartId]) continue;
    held[part as PartId] = undefined;
    released = true;
  }

  const shrunk = adopt(held, fit(input), input, isNarrower);
  if (shrunk || released) {
    clearTimeout(growTimer);
    growTimer = undefined;
    targets = shrunk ?? held;
    return;
  }

  if (!readGrowth(input, held)) {
    clearTimeout(growTimer);
    growTimer = undefined;
    return;
  }

  growTimer ??= setTimeout(() => {
    growTimer = undefined;
    const latest = readFit();
    const grown = latest && readGrowth(latest, targets);
    if (grown) targets = grown;
  }, GROW_DELAY);
}

function observe(elements: HTMLElement[]) {
  observer ??= new ResizeObserver(update);
  for (const element of elements) observer.observe(element);

  return () => {
    for (const element of elements) observer?.unobserve(element);
  };
}

/**
 * Registers a part that can give way, returning what unregisters it. `elements`
 * are the ones whose size changes when its measurements do.
 *
 * Its width has to reach the group without passing through an `AnimatedList`,
 * which would lag behind it and make the part seem wider than it is.
 */
export function trackPart(
  part: PartId,
  measure: PartMeasure,
  elements: HTMLElement[]
) {
  parts.set(part, measure);
  const stop = observe(elements);
  untrack(update);

  return () => {
    stop();
    parts.delete(part);
  };
}

/** Attaches to a column of the bar, which is the room its side has. */
export const trackColumn = (column: Column) => (element: HTMLElement) => {
  columns[column] = element;
  return observe([element]);
};

/** Attaches to what a group holds, which has to keep its natural width. */
export const trackContent = (content: Content) => (element: HTMLElement) => {
  contents[content] = element;
  const stop = observe([element]);

  return () => {
    stop();
    if (contents[content] === element) contents[content] = undefined;
    // What else is going with it hasn't let go of its parts yet.
    queueMicrotask(update);
  };
};

/**
 * Marks a part as asked for. The others give way to it, and it only goes itself if
 * they can't make enough room, in which case they stay as they were.
 */
export function preferPart(part: PartId, preferred: boolean) {
  untrack(() => {
    // Having just been asked for, it doesn't wait to come back like everything else.
    if (preferred && !preferences[part])
      targets = { ...targets, [part]: undefined };
    preferences[part] = preferred;
  });
}

/** How wide a part has to be, or `undefined` if it can be as wide as it likes. */
export function partTarget(part: PartId) {
  return targets[part];
}

/** Call while a component initializes. */
export function initLayout() {
  $effect(() => {
    if (!configStatus.loaded) return;

    // What a fit reads besides sizes, which the observer reports.
    void JSON.stringify([
      arranged,
      config.sections,
      config.clock.fullDate,
      config.workspaces,
      config.taskbarIntegration.enabled,
      isOnPrimaryMonitor(),
      preferences
    ]);
    untrack(update);

    // A transition needs a paint at the old value before it can start.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layout.ready = true;
      });
    });
  });
}

/** The sections with nothing to show before their provider's first output. */
const sectionProviders: Partial<Record<SectionId, ProviderName>> = {
  battery: "battery",
  cpu: "cpu",
  disk: "disk",
  keyboard: "keyboard",
  memory: "memory",
  network: "network",
  tray: "systray",
  volume: "audio",
  weather: "weather"
};

/** A section waits for its provider, so that it opens at its real width. */
export function isSectionShown(id: SectionId) {
  if (config.sections[id] === false) return false;

  const provider = sectionProviders[id];
  if (provider && providers[provider] === null) return false;

  const onPrimary = isOnPrimaryMonitor();
  if (config.bar.primaryMonitorOnly.includes(id) && !onPrimary) return false;

  // The taskbar already shows the time on this monitor.
  if (id === "clock" && onPrimary && config.taskbarIntegration.enabled) {
    return false;
  }

  return true;
}
