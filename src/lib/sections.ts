import type { FitSide } from "#lib/utils/fit.ts";

/** The buttons that share a pill on the bar, in their order in it. */
export const pillSections = ["settings", "power", "heart"] as const;

export const sectionIds = [
  ...pillSections,
  "cpu",
  "memory",
  "disk",
  "battery",
  "network",
  "media",
  "tray",
  "keyboard",
  "volume",
  "weather",
  "clock"
] as const;
export type SectionId = (typeof sectionIds)[number];

/** Whether `value` is one of `list`, which narrows it to the list's type. */
export const isOneOf = <T extends string>(
  list: readonly T[],
  value: string
): value is T => list.some((item) => item === value);

/**
 * What can be arranged on the bar: the pill of buttons as one, every other section,
 * the workspaces, and the room kept for the taskbar's window icons.
 */
export const barItems = [
  "buttons",
  ...sectionIds.filter(
    (id): id is Exclude<SectionId, (typeof pillSections)[number]> =>
      !isOneOf(pillSections, id)
  ),
  "workspaces",
  "taskbar"
] as const;
export type BarItem = (typeof barItems)[number];

export const barGroups = ["left", "middle", "right"] as const;
export type BarGroup = (typeof barGroups)[number];
export type Arrangement = Record<BarGroup, BarItem[]>;

export const defaultArrangement: Arrangement = {
  left: ["buttons", "cpu", "memory", "disk", "battery", "network"],
  middle: ["workspaces", "taskbar"],
  right: ["media", "volume", "weather", "tray", "keyboard", "clock"]
};

const groupOfItem = (arrangement: Arrangement, item: BarItem) =>
  barGroups.find((group) => arrangement[group].includes(item));

/**
 * Each item once, in the first place it's given. One that's missing goes back to
 * the end of the group it starts in, and the taskbar's room can only be in the
 * middle, which is the only place its icons are.
 */
export function arrange(stored: Arrangement): Arrangement {
  const seen = new Set<BarItem>();
  const arranged = Object.fromEntries(
    barGroups.map((group) => [
      group,
      stored[group].filter((item) => {
        if (seen.has(item) || (item === "taskbar" && group !== "middle")) {
          return false;
        }
        seen.add(item);
        return true;
      })
    ])
  ) as Arrangement;

  for (const item of barItems) {
    if (seen.has(item)) continue;
    const group = groupOfItem(defaultArrangement, item) ?? "right";
    arranged[group].push(item);
  }

  return arranged;
}

/** The pieces of the bar that give way when it runs out of room. */
export const partIds = [
  "power",
  "heart",
  "cpu",
  "memory",
  "disk",
  "battery",
  "network",
  "network.ssid",
  "network.graph",
  "network.rates",
  "media.title",
  "tray",
  "keyboard",
  "volume",
  "weather",
  "clock.date",
  "workspaces.thin",
  "workspaces.icons"
] as const;

export type PartId = (typeof partIds)[number];

/** What the settings show of the bar: its sections, the workspaces and the taskbar. */
export type BarPart = SectionId | "workspaces" | "taskbar";

/** The part that a whole section collapses as. The network's are inside it. */
export const sectionPart = (id: SectionId) =>
  id !== "network" && isOneOf(partIds, id) ? id : undefined;

/** The item a part belongs to, which is the one it moves with. */
export function itemOf(part: BarPart | PartId): BarItem {
  const owner = part.split(".")[0] ?? part;
  if (isOneOf(pillSections, owner)) return "buttons";
  if (isOneOf(barItems, owner)) return owner;
  throw new Error(`No item on the bar holds ${part}`);
}

/**
 * Which side of the bar a part takes its room from. The middle group is centred,
 * so its parts take from both, except around the taskbar's icons, which stay in the
 * centre while what's arranged before and after them reaches into each side.
 */
export function partSide(
  part: PartId,
  arrangement: Arrangement,
  taskbarIntegration: boolean
): FitSide | "center" {
  const item = itemOf(part);
  const group = groupOfItem(arrangement, item) ?? "right";
  if (group !== "middle") return group;
  if (!taskbarIntegration) return "center";

  const { middle } = arrangement;
  return middle.indexOf(item) < middle.indexOf("taskbar") ? "left" : "right";
}

type CollapseStep = {
  part: PartId;
  /** The section whose setting decides whether this step may apply. */
  section?: SectionId;
  /** Stops at the part's narrowest useful width, instead of hiding it. */
  toFloor?: boolean;
  /** Takes only the space it must, instead of going straight to the end. */
  partial?: boolean;
};

/**
 * What gives way first when the bar runs out of room, lowest value first. Each part
 * keeps its place in this order wherever it's arranged.
 */
export const collapseSteps: CollapseStep[] = [
  { part: "heart", section: "heart" },
  { part: "network.graph", section: "network" },
  { part: "clock.date" },
  { part: "network.ssid", section: "network" },
  { part: "workspaces.thin", toFloor: true },
  { part: "power", section: "power" },
  { part: "media.title", section: "media", toFloor: true, partial: true },
  { part: "disk", section: "disk" },
  { part: "memory", section: "memory" },
  { part: "battery", section: "battery" },
  { part: "keyboard", section: "keyboard" },
  { part: "network.rates", section: "network" },
  { part: "cpu", section: "cpu" },
  { part: "weather", section: "weather" },
  { part: "tray", section: "tray" },
  { part: "workspaces.icons", toFloor: true },
  { part: "media.title", section: "media" },
  { part: "network", section: "network" },
  { part: "volume", section: "volume" }
];
