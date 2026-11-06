/**
 * What identifies a tray icon between sessions. Zebar's ids and hashes change on
 * every update, so this is the tooltip's first line, without the numbers that change
 * with what the icon reports, like "Battery: 72%".
 */
function stableName(tooltip: string) {
  const [firstLine = ""] = tooltip.split("\n");
  return firstLine
    .replace(/[\d%.,:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Gives icons their keys, and sorts them by `order`, with new ones at the end. */
export function arrangeTray<Icon extends { tooltip: string }>(
  icons: Icon[],
  order: string[]
) {
  const counts: Record<string, number> = {};

  const entries = icons.map((icon) => {
    const name = stableName(icon.tooltip);
    const count = (counts[name] ?? 0) + 1;
    counts[name] = count;
    return { key: count > 1 ? `${name} ${count}` : name, icon };
  });

  const rank = (key: string) => {
    const index = order.indexOf(key);
    return index === -1 ? order.length : index;
  };
  return entries.sort((a, b) => rank(a.key) - rank(b.key));
}
