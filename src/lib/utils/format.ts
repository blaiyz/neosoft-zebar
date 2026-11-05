const DAYS = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];

/** Keeps a network value about the same width, whatever its size. */
export function formatNetworkValue(value: number): string {
  const expanded = value.toFixed(4);
  return value >= 1000 ? " " + expanded.slice(0, 4) : expanded.slice(0, 5);
}

export function secondsToHms(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor((seconds % 3600) % 60);

  return `${h > 0 ? h + ":" : ""}${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function formatDate(date: Date): string {
  return (DAYS[date.getDay()] ?? "") + " " + date.toLocaleDateString();
}
