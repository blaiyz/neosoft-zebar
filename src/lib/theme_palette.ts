/**
 * The theme's colors that a swatch can stand for, which include every color a
 * section has, so that each one finds its own. A swatch saves a name rather than
 * the value where it can, so it keeps following the theme when the preset changes.
 */
const SOURCES = [
  "accent",
  "ws-1",
  "ws-2",
  "ws-3",
  "ws-4",
  "ws-5",
  "cpu",
  "cpu-high-usage",
  "memory",
  "memory-high-usage",
  "disk",
  "disk-high-usage",
  "battery-good",
  "battery-mid",
  "battery-low",
  "network",
  "weather",
  "keyboard",
  "volume-start",
  "volume-end",
  "volume-inner",
  "tiling-direction",
  "click-through",
  "paused",
  "icon",
  "text"
];

/** One color of a preset, with every name it has there. */
export type Swatch = { value: string; sources: string[] };

/**
 * The distinct colors of a preset as the preset itself has them, without anything
 * the user changed, so that the swatches stay put while colors are picked.
 */
export function readPalette(preset: string): Swatch[] {
  if (typeof document === "undefined") return [];

  // The presets set their colors on any element with `data-theme`, so this one has
  // the preset's own, whatever the root's overrides say.
  const probe = document.createElement("span");
  probe.dataset.theme = preset;
  probe.hidden = true;
  document.body.append(probe);
  const style = getComputedStyle(probe);

  const swatches: Swatch[] = [];
  for (const source of SOURCES) {
    const value = style.getPropertyValue(`--${source}`).trim();
    if (!value) continue;

    const same = swatches.find((swatch) => swatch.value === value);
    if (same) same.sources.push(source);
    else swatches.push({ value, sources: [source] });
  }

  probe.remove();
  return swatches;
}
