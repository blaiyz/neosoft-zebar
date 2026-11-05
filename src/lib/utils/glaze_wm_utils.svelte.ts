import {
  ContainerType,
  type SplitContainer,
  type Window,
  type Workspace
} from "glazewm";
import { providers } from "../providers.svelte";

const isOnPrimaryMonitorState = $derived.by(() => {
  const glazewm = providers.glazewm;
  const currentMonitor = glazewm?.currentMonitor;

  return !!currentMonitor && currentMonitor.x === 0 && currentMonitor.y === 0;
});

export function isOnPrimaryMonitor(): boolean {
  return isOnPrimaryMonitorState;
}

/**
 * Returns all windows in the given workspace
 */
export function getWindows(workspace: Workspace | SplitContainer): Window[] {
  const allWindows: Window[] = [];
  for (const child of workspace.children) {
    if (child.type === ContainerType.WINDOW) {
      allWindows.push(child);
    } else {
      allWindows.push(...getWindows(child));
    }
  }
  return allWindows;
}
