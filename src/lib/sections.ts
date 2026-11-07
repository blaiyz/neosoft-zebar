/** The sections of the bar, in the order they appear on each side. */
export const pillSections = ["settings", "power", "heart"] as const;
export const meterSections = [
  "cpu",
  "memory",
  "disk",
  "battery",
  "network"
] as const;
export const leftSections = [...pillSections, ...meterSections] as const;
export const rightSections = [
  "media",
  "tray",
  "keyboard",
  "volume",
  "weather",
  "clock"
] as const;

export const sectionIds = [...leftSections, ...rightSections] as const;
export type SectionId = (typeof sectionIds)[number];

/** The pieces of the bar that give way when it runs out of room. */
const partSides = {
  power: "left",
  heart: "left",
  cpu: "left",
  memory: "left",
  disk: "left",
  battery: "left",
  network: "left",
  "network.ssid": "left",
  "network.graph": "left",
  "network.rates": "left",
  "media.title": "right",
  tray: "right",
  keyboard: "right",
  volume: "right",
  weather: "right",
  "clock.date": "right",
  "workspaces.thin": "center",
  "workspaces.icons": "center"
} as const;

export type PartId = keyof typeof partSides;

/** What the settings show of the bar, which is its sections and the workspaces. */
export type BarPart = SectionId | "workspaces";

/** The part that a whole section collapses as. The network's are inside it. */
export const sectionPart = (id: SectionId) =>
  id !== "network" && id in partSides ? (id as PartId) : undefined;

export function partSide(part: PartId, taskbarIntegration: boolean) {
  const side = partSides[part];
  // The workspaces sit at the end of the left side, beside the taskbar icons.
  return side === "center" && taskbarIntegration ? "left" : side;
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

/** What gives way first when the bar runs out of room, lowest value first. */
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
