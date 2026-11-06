/** Turns a theme color, `H S% L%` with an optional `/ alpha`, into `#rrggbb`. */
export function hslToHex(color: string): string {
  const [h = 0, s = 0, l = 0] = (color.split("/")[0] ?? "")
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part));

  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = saturation * Math.min(lightness, 1 - lightness);

  const channel = (offset: number) => {
    const k = (offset + h / 30) % 12;
    const value = lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** The opposite of `hslToHex`, without an alpha. */
export function hexToHsl(hex: string): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(
    (start) => parseInt(hex.slice(start, start + 2), 16) / 255
  );

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const range = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (range > 0) {
    if (max === r) hue = ((g - b) / range + 6) % 6;
    else if (max === g) hue = (b - r) / range + 2;
    else hue = (r - g) / range + 4;
  }

  const saturation =
    range === 0 ? 0 : range / (1 - Math.abs(2 * lightness - 1));

  return [
    Math.round(hue * 60),
    `${Math.round(saturation * 100)}%`,
    `${Math.round(lightness * 100)}%`
  ].join(" ");
}
