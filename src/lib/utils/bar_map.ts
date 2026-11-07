import {
  barGroups,
  type Arrangement,
  type BarGroup,
  type BarItem
} from "#lib/sections.ts";

/** Sizes in pixels, which the settings window works out from its own rem. */
export type MapSizes = {
  /** The width of one item, at most. The pill of buttons is three. */
  item: number;
  /** Around the items inside a group. */
  pad: number;
  /** The least space between two groups. */
  gap: number;
  /** Between the outer groups and the ends of the map. */
  edge: number;
};

export type PlacedItem = { item: BarItem; left: number; width: number };
export type PlacedGroup = { left: number; width: number; empty: boolean };

export type MapLayout = {
  items: PlacedItem[];
  groups: Record<BarGroup, PlacedGroup>;
  /** The width of one item after shrinking to fit. */
  item: number;
};

const units = (item: BarItem) => (item === "buttons" ? 3 : 1);

/**
 * Where everything goes on a map of the bar `width` wide. The outer groups keep to
 * the ends and the middle one is centred, or its taskbar room is when `taskbar` is
 * on, as on the bar itself. An empty group keeps the room of one item, so that
 * something can be dropped in it. Everything narrows when it can't all fit.
 */
export function placeItems(
  arrangement: Arrangement,
  width: number,
  sizes: MapSizes,
  taskbar: boolean
): MapLayout {
  const { pad, gap, edge } = sizes;
  const count = barGroups.reduce(
    (sum, group) =>
      sum +
      Math.max(
        1,
        arrangement[group].reduce((total, item) => total + units(item), 0)
      ),
    0
  );
  const room = width - 6 * pad - 2 * gap - 2 * edge;
  const item = Math.max(0, Math.min(sizes.item, room / count));

  const contentWidth = (group: BarGroup) =>
    Math.max(
      1,
      arrangement[group].reduce((sum, i) => sum + units(i), 0)
    ) * item;
  const outer = (group: BarGroup) => contentWidth(group) + 2 * pad;

  const left = edge;
  const right = width - edge - outer("right");

  const middleWidth = outer("middle");
  const taskbarAt = taskbar ? arrangement.middle.indexOf("taskbar") : -1;
  const anchor =
    taskbarAt === -1
      ? middleWidth / 2
      : pad +
        arrangement.middle
          .slice(0, taskbarAt)
          .reduce((sum, i) => sum + units(i) * item, 0) +
        item / 2;
  const lowest = left + outer("left") + gap;
  const highest = right - gap - middleWidth;
  const middle =
    lowest > highest
      ? (lowest + highest) / 2
      : Math.min(highest, Math.max(lowest, width / 2 - anchor));

  const starts: Record<BarGroup, number> = { left, middle, right };
  const items: PlacedItem[] = [];
  const groups = {} as Record<BarGroup, PlacedGroup>;

  for (const group of barGroups) {
    let x = starts[group] + pad;
    for (const placed of arrangement[group]) {
      const itemWidth = units(placed) * item;
      items.push({ item: placed, left: x, width: itemWidth });
      x += itemWidth;
    }
    groups[group] = {
      left: starts[group],
      width: outer(group),
      empty: arrangement[group].length === 0
    };
  }

  return { items, groups, item };
}

/** `arrangement` with `item` taken out and put back in at `index` of `group`. */
export function moveItem(
  arrangement: Arrangement,
  item: BarItem,
  group: BarGroup,
  index: number
): Arrangement {
  const without = Object.fromEntries(
    barGroups.map((name) => [
      name,
      arrangement[name].filter((other) => other !== item)
    ])
  ) as Arrangement;
  without[group] = without[group].toSpliced(index, 0, item);
  return without;
}

/** Every place `item` could go, from the start of the left group to the end. */
function placesFor(arrangement: Arrangement, item: BarItem) {
  return barGroups.flatMap((group) => {
    const others = arrangement[group].filter((other) => other !== item);
    return Array.from({ length: others.length + 1 }, (_, index) =>
      moveItem(arrangement, item, group, index)
    );
  });
}

const sameArrangement = (a: Arrangement, b: Arrangement) =>
  barGroups.every(
    (group) =>
      a[group].length === b[group].length &&
      a[group].every((item, index) => b[group][index] === item)
  );

/**
 * The arrangement that would put the middle of `item` closest to `center`. Each
 * place is judged by where the item would really end up there, so the place it's
 * already in stays the closest until it's dragged most of the way to another.
 */
export function nearestArrangement(
  arrangement: Arrangement,
  item: BarItem,
  center: number,
  place: (candidate: Arrangement) => MapLayout
) {
  let best = arrangement;
  let distance = Infinity;

  for (const candidate of placesFor(arrangement, item)) {
    const placed = place(candidate).items.find((other) => other.item === item);
    if (!placed) continue;

    const off = Math.abs(placed.left + placed.width / 2 - center);
    if (off < distance - 0.5) {
      best = candidate;
      distance = off;
    }
  }

  return sameArrangement(best, arrangement) ? arrangement : best;
}
