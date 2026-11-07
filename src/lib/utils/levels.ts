import type { Config } from "#lib/config_schema.ts";

/** The theme color for a battery's charge, in percent. */
export function batteryTone(
  charge: number,
  { midCharge, lowCharge }: Config["battery"]
): "--battery-low" | "--battery-mid" | "--battery-good" {
  if (charge <= lowCharge) return "--battery-low";
  return charge <= midCharge ? "--battery-mid" : "--battery-good";
}
