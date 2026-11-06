import type { SectionId } from "#lib/sections.ts";
import { config } from "#lib/state/config.svelte.ts";
import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";

export function isSectionShown(id: SectionId) {
  if (config.sections[id] === false) return false;

  const onPrimary = isOnPrimaryMonitor();
  if (config.bar.primaryMonitorOnly.includes(id) && !onPrimary) return false;

  // The taskbar already shows the time on this monitor.
  if (id === "clock" && onPrimary && config.taskbarIntegration.enabled) {
    return false;
  }

  return true;
}
