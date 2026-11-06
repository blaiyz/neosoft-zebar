/** The sections of the bar, in the order they appear on each side. */
export const leftSections = [
  "power",
  "heart",
  "cpu",
  "memory",
  "battery",
  "network"
] as const;
export const rightSections = ["media", "volume", "weather", "clock"] as const;

export const sectionIds = [...leftSections, ...rightSections] as const;
export type SectionId = (typeof sectionIds)[number];

/** The pieces of the bar that give way when it runs out of room. */
const partSides = {
  power: "left",
  heart: "left",
  cpu: "left",
  memory: "left",
  battery: "left",
  network: "left",
  "network.ssid": "left",
  "network.rates": "left",
  "media.title": "right",
  "volume.slider": "right",
  "volume.chevron": "right",
  weather: "right",
  "clock.date": "right",
  "workspaces.thin": "center",
  "workspaces.icons": "center"
} as const;

export type PartId = keyof typeof partSides;

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
  { part: "clock.date" },
  { part: "network.ssid", section: "network" },
  { part: "workspaces.thin", toFloor: true },
  { part: "power", section: "power" },
  { part: "media.title", section: "media", toFloor: true, partial: true },
  { part: "memory", section: "memory" },
  { part: "battery", section: "battery" },
  { part: "network.rates", section: "network" },
  { part: "cpu", section: "cpu" },
  { part: "weather", section: "weather" },
  { part: "workspaces.icons", toFloor: true },
  { part: "media.title", section: "media" },
  { part: "network", section: "network" },
  { part: "volume.chevron", section: "volume" },
  { part: "volume.slider" }
];
