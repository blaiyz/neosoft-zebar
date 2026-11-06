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

/** A provider's size or rate, like `2.9 MiB`. */
export function formatMeasure(measure: {
  iecValue: number;
  iecUnit: string;
}): string {
  const { iecValue, iecUnit } = measure;
  return `${iecValue.toFixed(iecValue < 100 ? 1 : 0)} ${iecUnit}`;
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const power = Math.floor(Math.log2(Math.max(bytes, 1)) / 10);
  const unit = Math.min(power, units.length - 1);
  return formatMeasure({
    iecValue: bytes / 1024 ** unit,
    iecUnit: units[unit] ?? ""
  });
}

/** A link speed, which Zebar gives in bits per second. */
export function formatBitRate(bits: number): string {
  if (bits >= 1e9) return `${(bits / 1e9).toFixed(1)} Gbps`;
  return `${Math.round(bits / 1e6)} Mbps`;
}

/** A length of time in milliseconds, like `3d 4h` or `25m`. */
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function formatDate(date: Date): string {
  return (DAYS[date.getDay()] ?? "") + " " + date.toLocaleDateString();
}
