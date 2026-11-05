import {
  ContainerType,
  type SplitContainer,
  type Window,
  type Workspace
} from "glazewm";

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
