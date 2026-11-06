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
